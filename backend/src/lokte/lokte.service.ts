import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigRegistryService } from '../config-registry/config-registry.service';

const LOKTE_BASE_URL = 'https://lokte.vaimo.network';

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
}

@Injectable()
export class LokteService {
  private readonly logger = new Logger(LokteService.name);

  constructor(private readonly configRegistry: ConfigRegistryService) {}

  async askQuestion(shopId: string, question: string): Promise<AskQuestionResult> {
    await this.assertConfigured(shopId);

    const token = await this.configRegistry.getDecrypted(shopId, 'lokte.general.api_key');
    const personaId = String(await this.configRegistry.get(shopId, 'lokte.general.user_id') ?? '');

    const sessionId = await this.createChatSession(token, personaId);
    return this.sendMessage(token, sessionId, question);
  }

  private async assertConfigured(shopId: string): Promise<void> {
    const enabled = await this.configRegistry.get(shopId, 'lokte.general.enable');
    if (!enabled) {
      throw new ServiceUnavailableException('wrong lokte connection');
    }

    const apiKey = await this.configRegistry.getDecrypted(shopId, 'lokte.general.api_key');
    if (!apiKey) {
      throw new ServiceUnavailableException('wrong lokte connection');
    }

    const userId = await this.configRegistry.get(shopId, 'lokte.general.user_id');
    if (!userId) {
      throw new ServiceUnavailableException('wrong lokte connection');
    }
  }

  private async createChatSession(token: string, personaId: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${LOKTE_BASE_URL}/api/chat/create-chat-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

    if (!sessionId) {
      this.logger.error('Lokte create-chat-session returned no session id', data);
      throw new BadGatewayException('Lokte API did not return a session id');
    }

    return String(sessionId);
  }

  private async sendMessage(token: string, sessionId: string, question: string): Promise<AskQuestionResult> {
    const payload = {
      chat_session_id: sessionId,
      parent_message_id: null,
      message: question,
      file_descriptors: [],
      prompt_id: 0,
      search_doc_ids: null,
      retrieval_options: {
        run_search: 'auto',
        real_time: true,
        filters: {
          source_type: null,
          document_set: null,
          time_cutoff: null,
          tags: [],
        },
      },
      query_override: null,
    };

    let response: Response;
    try {
      response = await fetch(`${LOKTE_BASE_URL}/api/chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      this.logger.error('Lokte send-message network error', err);
      throw new BadGatewayException('Failed to reach Lokte API');
    }

    if (!response.ok) {
      this.logger.error(`Lokte send-message failed: ${response.status}`);
      throw new BadGatewayException(`Lokte API error: ${response.status}`);
    }

    // API streams NDJSON: one JSON object per line
    const text = await response.text();
    const pieces: string[] = [];
    const documents: SourceDocument[] = [];

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        continue;
      }

      // Support both wrapped { obj: { type, ... } } and flat top-level formats
      const obj = parsed.obj as Record<string, unknown> | undefined;

      // ── Answer text ──────────────────────────────────────────────────────────
      // Wrapped:  { obj: { type: "message_delta", content: "..." } }
      if (obj?.type === 'message_delta' && typeof obj.content === 'string') {
        pieces.push(obj.content);
        continue;
      }
      // Flat Danswer/Onyx:  { answer_piece: "..." }
      if (typeof parsed.answer_piece === 'string') {
        pieces.push(parsed.answer_piece);
        continue;
      }

      // ── Source documents ─────────────────────────────────────────────────────
      // Resolve the document array from any of the known locations.
      // Priority order covers all observed Danswer/Onyx/Lokte variants:
      //   1. { obj: { top_documents: [...] } }          — wrapped, any type
      //   2. { top_documents: [...] }                   — flat Danswer standard
      //   3. { obj: { documents: [...] } }              — alternate key
      //   4. { documents: [...] }                       — alternate key flat
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
        continue;
      }

      // Skip unrecognised events silently
    }

    const answer = pieces.join('');
    if (!answer) {
      this.logger.warn('Lokte send-message returned no message_delta content', text.slice(0, 500));
    }
    return { answer, documents };
  }
}
