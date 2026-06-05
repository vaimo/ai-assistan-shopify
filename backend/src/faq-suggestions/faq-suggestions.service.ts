import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigRegistryService } from '../config-registry/config-registry.service';
import { ShopsService } from '../shops/shops.service';
import { FaqQuestionPool } from './entities/faq-question-pool.entity';
import { SuggestedFaq } from './entities/suggested-faq.entity';

const LOKTE_BASE_URL = 'https://lokte.vaimo.network';

/** Minimum distinct questions required before attempting FAQ generation. */
const MIN_QUESTIONS_THRESHOLD = 5;

/** Maximum questions read from pool in one generation run (caps DB query size). */
const POOL_READ_LIMIT = 500;

/** Maximum character length for a single question in the Lokte prompt (guards against prompt injection). */
const MAX_QUESTION_LENGTH = 200;

/**
 * System prompt sent to Lokte for FAQ generation.
 * Lokte is an internal AI/RAG platform that answers from the company knowledge base.
 */
const FAQ_GENERATION_PROMPT = (questions: string[]) =>
  `You are a FAQ curator for a merchant assistant powered by Lokte — an internal AI/RAG platform that connects to company knowledge bases and data sources.

Analyze the following list of questions asked by merchants and return exactly 3 of the most useful, commonly-asked questions. Rules:
- Rewrite them clearly and concisely (max ~12 words each)
- Filter out: test/nonsensical messages, very specific one-off requests, incomplete sentences, profanity
- Return ONLY a valid JSON array of exactly 3 strings, nothing else — no explanation, no markdown
- If fewer than 3 good questions exist, fill the remaining slots with plausible Lokte-related questions (e.g. about products, orders, inventory, or company procedures)

Example output: ["How do I process a refund?","What are the top products this month?","How do I update inventory levels?"]

Questions to analyze:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;

@Injectable()
export class FaqSuggestionsService {
  private readonly logger = new Logger(FaqSuggestionsService.name);

  constructor(
    private readonly configRegistry: ConfigRegistryService,
    private readonly shopsService: ShopsService,
    @InjectRepository(FaqQuestionPool)
    private readonly poolRepo: Repository<FaqQuestionPool>,
    @InjectRepository(SuggestedFaq)
    private readonly suggestedFaqRepo: Repository<SuggestedFaq>,
  ) {}

  /**
   * Global hourly cron — checks each active shop and generates FAQ if:
   * - FAQ is enabled for the shop
   * - Enough time has elapsed since the last run (based on cron_interval_hours config)
   * - The question pool is not empty (new questions exist since the last run)
   */
  @Cron('0 * * * *', { name: 'faq-suggestions-cron' })
  async runFaqCron(): Promise<void> {
    const shops = await this.shopsService.findAllActive();
    this.logger.log(`FAQ cron: checking ${shops.length} active shop(s)`);

    for (const shop of shops) {
      try {
        await this.maybeGenerateFaqForShop(shop.shopDomain);
      } catch (err) {
        // One shop's failure must not block the others
        this.logger.error(`FAQ cron failed for shop ${shop.shopDomain}`, err);
      }
    }
  }

  /**
   * Checks cron conditions for a single shop and generates FAQ if all are met.
   */
  private async maybeGenerateFaqForShop(shopId: string): Promise<void> {
    const enabled = await this.configRegistry.get(shopId, 'faq_suggestions.general.enable');
    if (!Number(enabled)) return;

    const intervalHours = Number(
      (await this.configRegistry.get(shopId, 'faq_suggestions.general.cron_interval_hours')) ?? 24,
    );
    const lastGeneratedAt = await this.getLastGeneratedAt(shopId);
    const elapsedMs = lastGeneratedAt ? Date.now() - lastGeneratedAt.getTime() : Infinity;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    if (elapsedMs < intervalMs) {
      return; // Not enough time has passed
    }

    await this.generateFaqForShop(shopId);
  }

  /**
   * Returns the current suggested FAQs for a shop.
   * Returns null if no generation has been done yet.
   */
  async getSuggestedFaqs(shopId: string): Promise<string[] | null> {
    const row = await this.suggestedFaqRepo.findOne({ where: { shopId } });
    return row?.questions ?? null;
  }

  /**
   * Returns the timestamp of the last successful FAQ generation, or null.
   */
  async getLastGeneratedAt(shopId: string): Promise<Date | null> {
    const row = await this.suggestedFaqRepo.findOne({ where: { shopId } });
    return row?.generatedAt ?? null;
  }

  /**
   * Generates FAQ suggestions for a shop using an isolated single-use Lokte session.
   *
   * Flow:
   * 1. Read up to POOL_READ_LIMIT questions from faq_question_pool for this shop.
   * 2. If pool is empty or below threshold, skip.
   * 3. Create a temporary Lokte session (separate from user chat sessions).
   * 4. Send guardrail prompt → parse JSON response.
   * 5. Delete the temporary session (cleanup, prevents zombie sessions).
   * 6. Upsert the result in suggested_faqs.
   * 7. Clear only the specific pool rows that were read (not rows written during generation).
   *
   * @returns The generated questions array, or null if skipped.
   */
  async generateFaqForShop(shopId: string): Promise<string[] | null> {
    // Cap the read to POOL_READ_LIMIT to prevent unbounded queries on shops with broken Lokte configs
    const poolRows = await this.poolRepo.find({
      where: { shopId },
      order: { createdAt: 'ASC' },
      take: POOL_READ_LIMIT,
    });

    // Capture IDs before any async work so we only delete what we actually read.
    // Rows written DURING the Lokte API calls survive and accumulate for the next cycle.
    const poolRowIds = poolRows.map((r) => r.id);
    const questions = poolRows.map((r) => r.question);

    const distinct = [...new Set(questions)];
    if (distinct.length < MIN_QUESTIONS_THRESHOLD) {
      this.logger.log(
        `FAQ generation skipped for ${shopId}: only ${distinct.length} distinct questions (threshold: ${MIN_QUESTIONS_THRESHOLD})`,
      );
      return null;
    }

    const token = await this.configRegistry.getDecrypted(shopId, 'lokte.general.api_key');
    const personaId = String(
      (await this.configRegistry.get(shopId, 'lokte.general.user_id')) ?? '',
    );

    // Truncate questions to prevent prompt injection via unusually long inputs
    const sanitizedQuestions = distinct.map((q) =>
      q.length > MAX_QUESTION_LENGTH ? q.slice(0, MAX_QUESTION_LENGTH) : q,
    );

    let tempSessionId: string | null = null;
    try {
      tempSessionId = await this.createTempLokteSession(token, personaId);
      const generated = await this.runFaqPrompt(token, tempSessionId, sanitizedQuestions);

      await this.suggestedFaqRepo.upsert(
        { shopId, questions: generated },
        ['shopId'],
      );
      // Delete only the rows we originally read — questions added during generation are preserved
      if (poolRowIds.length > 0) {
        await this.poolRepo.delete(poolRowIds);
      }

      this.logger.log(`FAQ generated for ${shopId}: [${generated.join(' | ')}]`);
      return generated;
    } finally {
      // Always clean up the temporary session, even if generation failed.
      if (tempSessionId) {
        await this.deleteTempLokteSession(token, tempSessionId);
      }
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private async createTempLokteSession(token: string, personaId: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${LOKTE_BASE_URL}/api/chat/create-chat-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ persona_id: personaId }),
      });
    } catch (err) {
      this.logger.error('Lokte create-chat-session (FAQ) network error', err);
      throw new BadGatewayException('Failed to reach Lokte API for FAQ generation');
    }

    if (!response.ok) {
      this.logger.error(`Lokte create-chat-session (FAQ) failed: ${response.status}`);
      throw new BadGatewayException(`Lokte API error: ${response.status}`);
    }

    const data = (await response.json()) as { id?: string; chat_session_id?: string };
    const sessionId = data.id ?? data.chat_session_id;
    if (!sessionId) throw new BadGatewayException('Lokte API did not return a session id');
    return String(sessionId);
  }

  private async deleteTempLokteSession(token: string, sessionId: string): Promise<void> {
    try {
      await fetch(`${LOKTE_BASE_URL}/api/chat/delete-chat-session/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      this.logger.warn(`Failed to delete temporary FAQ Lokte session ${sessionId}`, err);
    }
  }

  /**
   * Sends the FAQ guardrail prompt to Lokte and parses the JSON array response.
   * Returns exactly 3 questions; falls back to the original hardcoded questions on parse failure.
   */
  private async runFaqPrompt(
    token: string,
    sessionId: string,
    questions: string[],
  ): Promise<[string, string, string]> {
    const prompt = FAQ_GENERATION_PROMPT(questions);

    let response: Response;
    try {
      response = await fetch(`${LOKTE_BASE_URL}/api/chat/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          chat_session_id: sessionId,
          parent_message_id: null,
          message: prompt,
          file_descriptors: [],
          prompt_id: 0,
          search_doc_ids: null,
          retrieval_options: {
            run_search: 'never',
            real_time: true,
            filters: { source_type: null, document_set: null, time_cutoff: null, tags: [] },
          },
          query_override: null,
        }),
      });
    } catch (err) {
      this.logger.error('Lokte send-message (FAQ prompt) network error', err);
      throw new BadGatewayException('Failed to reach Lokte API during FAQ prompt');
    }

    if (!response.ok) {
      this.logger.error(`Lokte send-message (FAQ prompt) failed: ${response.status}`);
      throw new BadGatewayException(`Lokte API error: ${response.status}`);
    }

    const text = await response.text();
    const pieces: string[] = [];

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(trimmed) as Record<string, unknown>; } catch { continue; }

      const obj = parsed.obj as Record<string, unknown> | undefined;
      if (obj?.type === 'message_delta' && typeof obj.content === 'string') {
        pieces.push(obj.content);
        continue;
      }
      if (typeof parsed.answer_piece === 'string') {
        pieces.push(parsed.answer_piece);
      }
    }

    const rawAnswer = pieces.join('').trim();
    return this.parseGeneratedQuestions(rawAnswer);
  }

  /**
   * Parses the JSON array from Lokte's response.
   * Returns a tuple of exactly 3 strings; falls back to defaults on any parse error.
   */
  private parseGeneratedQuestions(raw: string): [string, string, string] {
    const FALLBACK: [string, string, string] = [
      'What are my top-selling products this month?',
      'Show me recent orders that need attention.',
      'How can I improve my store\'s conversion rate?',
    ];

    try {
      // Strip potential markdown code fences
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed: unknown = JSON.parse(cleaned);

      if (
        Array.isArray(parsed) &&
        parsed.length >= 3 &&
        parsed.slice(0, 3).every((q) => typeof q === 'string' && q.trim().length > 0)
      ) {
        return [parsed[0] as string, parsed[1] as string, parsed[2] as string];
      }
    } catch {
      // fall through to fallback
    }

    this.logger.warn(`Could not parse FAQ response from Lokte, using fallback. Raw: "${raw.slice(0, 200)}"`);
    return FALLBACK;
  }
}
