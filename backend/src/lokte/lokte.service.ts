import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConfigRegistryService } from '../config-registry/config-registry.service';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatSession } from './entities/chat-session.entity';
import { FaqQuestionPool } from '../faq-suggestions/entities/faq-question-pool.entity';

const LOKTE_BASE_URL = 'https://lokte.vaimo.network';
const HISTORY_LIMIT = 100; // rows kept in DB per chat session
const TITLE_MAX_LENGTH = 80;

interface CreateSessionResponse {
  id?: string;
  chat_session_id?: string;
}

export interface SourceDocument {
  title: string;
  link: string;
  source_type: string;
  blurb: string;
  updated_at: string | null;
}

export interface AskQuestionResult {
  answer: string;
  documents: SourceDocument[];
  chatId: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LokteService {
  private readonly logger = new Logger(LokteService.name);

  constructor(
    private readonly configRegistry: ConfigRegistryService,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(FaqQuestionPool)
    private readonly faqPoolRepo: Repository<FaqQuestionPool>,
  ) {}

  /** List all chat sessions for a user, newest first. No message bodies. */
  async listChats(shopId: string, userId: string): Promise<ChatSummary[]> {
    const sessions = await this.sessionRepo.find({
      where: { shopId, userId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'title', 'createdAt', 'updatedAt'],
    });
    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  /** Send a question. If chatId is absent a new session is created lazily. Returns chatId. */
  async askQuestion(
    shopId: string,
    userId: string,
    question: string,
    chatId?: string,
  ): Promise<AskQuestionResult> {
    await this.assertConfigured(shopId);

    const token = await this.configRegistry.getDecrypted(shopId, 'lokte.general.api_key');
    const personaId = String(await this.configRegistry.get(shopId, 'lokte.general.user_id') ?? '');

    const session = chatId
      ? await this.loadSession(shopId, userId, chatId)
      : await this.createSession(shopId, userId, token, personaId);

    const result = await this.sendMessage(token, session, personaId, question);

    // Persist the updated lastAssistantMsgId
    await this.sessionRepo.update(session.id, { lastAssistantMsgId: result.reservedAssistantMsgId });

    // Auto-title from first user message
    if (!session.title) {
      const title = question.trim().slice(0, TITLE_MAX_LENGTH);
      await this.sessionRepo.update(session.id, { title });
    }

    await this.persistMessages(shopId, userId, session.id, question, result.answer, result.documents);

    return { answer: result.answer, documents: result.documents, chatId: session.id };
  }

  /** Return messages for a specific chat session, oldest first. */
  async getHistory(shopId: string, userId: string, chatId: string): Promise<ChatMessage[]> {
    await this.loadSession(shopId, userId, chatId); // ownership check
    return this.messageRepo.find({
      where: { chatSessionId: chatId },
      order: { createdAt: 'ASC' },
      take: HISTORY_LIMIT,
    });
  }

  /** Delete a single chat session and all its messages. */
  async deleteChat(shopId: string, userId: string, chatId: string): Promise<void> {
    const session = await this.loadSession(shopId, userId, chatId);

    if (session.lokteSessionId) {
      const token = await this.configRegistry.getDecrypted(shopId, 'lokte.general.api_key');
      await this.deleteLokteSession(token, session.lokteSessionId);
    }

    // FK ON DELETE CASCADE removes chat_messages automatically
    await this.sessionRepo.delete(session.id);
  }

  /** Delete ALL chat sessions (and their messages) for a user — "Clear all history". */
  async clearAllHistory(shopId: string, userId: string): Promise<void> {
    const sessions = await this.sessionRepo.find({ where: { shopId, userId } });

    const token = sessions.some((s) => s.lokteSessionId)
      ? await this.configRegistry.getDecrypted(shopId, 'lokte.general.api_key').catch(() => null)
      : null;

    await Promise.all(
      sessions.map(async (s) => {
        if (token && s.lokteSessionId) {
          await this.deleteLokteSession(token, s.lokteSessionId);
        }
        await this.sessionRepo.delete(s.id);
      }),
    );
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private async assertConfigured(shopId: string): Promise<void> {
    const enabled = await this.configRegistry.get(shopId, 'lokte.general.enable');
    if (!enabled) throw new ServiceUnavailableException('wrong lokte connection');

    const apiKey = await this.configRegistry.getDecrypted(shopId, 'lokte.general.api_key');
    if (!apiKey) throw new ServiceUnavailableException('wrong lokte connection');

    const userId = await this.configRegistry.get(shopId, 'lokte.general.user_id');
    if (!userId) throw new ServiceUnavailableException('wrong lokte connection');
  }

  private async loadSession(shopId: string, userId: string, chatId: string): Promise<ChatSession> {
    const session = await this.sessionRepo.findOne({ where: { id: chatId, shopId, userId } });
    if (!session) throw new NotFoundException(`Chat session not found: ${chatId}`);
    return session;
  }

  /** Create a brand-new DB session row (Lokte session created lazily on first sendMessage). */
  private async createSession(
    shopId: string,
    userId: string,
    _token: string,
    _personaId: string,
  ): Promise<ChatSession> {
    return this.sessionRepo.save(
      this.sessionRepo.create({ shopId, userId, lokteSessionId: null, lastAssistantMsgId: null, title: '' }),
    );
  }

  private async ensureLokteSession(token: string, personaId: string, session: ChatSession): Promise<ChatSession> {
    if (session.lokteSessionId) return session;

    const lokteSessionId = await this.createLokteSession(token, personaId);
    const updateResult = await this.sessionRepo.update(
      { id: session.id, lokteSessionId: IsNull() },
      { lokteSessionId },
    );

    if (updateResult.affected && updateResult.affected > 0) {
      return { ...session, lokteSessionId };
    }

    await this.deleteLokteSession(token, lokteSessionId);

    const currentSession = await this.sessionRepo.findOne({ where: { id: session.id } });
    if (currentSession?.lokteSessionId) return currentSession;

    throw new NotFoundException(`Chat session not found: ${session.id}`);
  }

  private async createLokteSession(token: string, personaId: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${LOKTE_BASE_URL}/api/chat/create-chat-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ persona_id: personaId }),
      });
    } catch (err) {
      this.logger.error('Lokte create-chat-session network error', err);
      throw new BadGatewayException('Failed to reach Lokte API');
    }

    if (!response.ok) {
      this.logger.error(`Lokte create-chat-session failed: ${response.status}`);
      throw new BadGatewayException(`Lokte API error: ${response.status}`);
    }

    const data = (await response.json()) as CreateSessionResponse;
    const sessionId = data.id ?? data.chat_session_id;
    if (!sessionId) throw new BadGatewayException('Lokte API did not return a session id');
    return String(sessionId);
  }

  private async sendMessage(
    token: string,
    session: ChatSession,
    personaId: string,
    question: string,
  ): Promise<AskQuestionResult & { reservedAssistantMsgId: number | null }> {
    // Ensure Lokte session exists (lazy init)
    const hydratedSession = await this.ensureLokteSession(token, personaId, session);

    let response: Response;
    try {
      response = await fetch(`${LOKTE_BASE_URL}/api/chat/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          chat_session_id: hydratedSession.lokteSessionId,
          parent_message_id: hydratedSession.lastAssistantMsgId,
          message: question,
          file_descriptors: [],
          prompt_id: 0,
          search_doc_ids: null,
          retrieval_options: {
            run_search: 'auto',
            real_time: true,
            filters: { source_type: null, document_set: null, time_cutoff: null, tags: [] },
          },
          query_override: null,
        }),
      });
    } catch (err) {
      this.logger.error('Lokte send-message network error', err);
      throw new BadGatewayException('Failed to reach Lokte API');
    }

    if (!response.ok) {
      // Session may have expired — caller can retry with a fresh session
      this.logger.error(`Lokte send-message failed: ${response.status}`);
      throw new BadGatewayException(`Lokte API error: ${response.status}`);
    }

    const text = await response.text();
    const pieces: string[] = [];
    const documents: SourceDocument[] = [];
    let reservedAssistantMsgId: number | null = null;

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(trimmed) as Record<string, unknown>; } catch { continue; }

      // First NDJSON line carries message IDs
      if (typeof parsed.reserved_assistant_message_id === 'number') {
        reservedAssistantMsgId = parsed.reserved_assistant_message_id;
        continue;
      }

      const obj = parsed.obj as Record<string, unknown> | undefined;

      // Answer text
      if (obj?.type === 'message_delta' && typeof obj.content === 'string') {
        pieces.push(obj.content);
        continue;
      }
      if (typeof parsed.answer_piece === 'string') {
        pieces.push(parsed.answer_piece);
        continue;
      }

      // Source documents
      const rawDocs: unknown =
        (Array.isArray(obj?.top_documents) ? obj!.top_documents : undefined) ??
        (Array.isArray(parsed.top_documents) ? parsed.top_documents : undefined) ??
        (Array.isArray(obj?.documents) ? obj!.documents : undefined) ??
        (Array.isArray(parsed.documents) ? parsed.documents : undefined);

      if (Array.isArray(rawDocs) && rawDocs.length > 0) {
        for (const doc of rawDocs as Record<string, unknown>[]) {
          if (typeof doc.link === 'string' && doc.link) {
            documents.push({
              title: typeof doc.semantic_identifier === 'string' ? doc.semantic_identifier
                : typeof doc.title === 'string' ? doc.title : '',
              link: doc.link,
              source_type: typeof doc.source_type === 'string' ? doc.source_type : '',
              blurb: typeof doc.blurb === 'string' ? doc.blurb : '',
              updated_at: typeof doc.updated_at === 'string' ? doc.updated_at
                : typeof doc.updated_at === 'number' ? String(doc.updated_at) : null,
            });
          }
        }
      }
    }

    const answer = pieces.join('');
    if (!answer) this.logger.warn('Lokte send-message returned no answer content');
    return { answer, documents, chatId: session.id, reservedAssistantMsgId };
  }

  private async deleteLokteSession(token: string, lokteSessionId: string): Promise<void> {
    try {
      await fetch(`${LOKTE_BASE_URL}/api/chat/delete-chat-session/${encodeURIComponent(lokteSessionId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // Non-fatal — local records are cleared regardless
      this.logger.warn(`Failed to delete Lokte session ${lokteSessionId}`, err);
    }
  }

  private async persistMessages(
    shopId: string,
    userId: string,
    chatSessionId: string,
    question: string,
    answer: string,
    documents: SourceDocument[],
  ): Promise<void> {
    try {
      // Save sequentially so user message always has a strictly earlier createdAt than assistant
      await this.messageRepo.save(
        this.messageRepo.create({ shopId, userId, chatSessionId, role: 'user', content: question, documents: null }),
      );
      await this.messageRepo.save(
        this.messageRepo.create({ shopId, userId, chatSessionId, role: 'assistant', content: answer, documents }),
      );

      // Log question to FAQ pool — persists across chat clears
      await this.faqPoolRepo.save(this.faqPoolRepo.create({ shopId, question })).catch((e) =>
        this.logger.warn('Failed to append question to faq_question_pool', e),
      );

      // Trim to HISTORY_LIMIT per session
      const count = await this.messageRepo.count({ where: { chatSessionId } });
      if (count > HISTORY_LIMIT) {
        const oldest = await this.messageRepo.find({
          where: { chatSessionId },
          order: { createdAt: 'ASC' },
          take: count - HISTORY_LIMIT,
          select: ['id'],
        });
        await this.messageRepo.delete(oldest.map((m) => m.id));
      }
    } catch (err) {
      this.logger.error('Failed to persist chat messages', err);
    }
  }
}
