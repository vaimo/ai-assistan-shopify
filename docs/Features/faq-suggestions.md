# FAQ Suggestions — Architecture & Implementation

---

## Feature Summary

The AI Assistant automatically surfaces 3 **dynamically generated suggested questions** on the empty chat screen. Questions are derived from real chat history and rephrased by Lokte (the internal AI/RAG platform) to be clear and useful.

Admins can configure the generation frequency, force an immediate regeneration, disable the AI-generated suggestions entirely, and define 3 manual fallback questions that are shown instead.

---

## User Story

> As a User / Engineer / Product Owner  
> I want to see suggestions of frequently asked questions for the Admin page I'm currently viewing  
> So that I can save time from typing the most common questions and understand what people commonly struggle with.

**Acceptance Criteria:**
- User sees 3 most frequently asked / relevant questions in the empty chat state
- Suggestions are shop-specific and reflect real question patterns
- Design is adapted to the chat screen (clickable chips)

---

## Architecture

### Data flow

```
[User sends message]
  → question saved to chat_messages (existing)
  → question ALSO appended to faq_question_pool (separate log, never cleared by user)

[Hourly cron job]
  → for each active shop:
      - check: FAQ enabled? enough time elapsed since last run?
      - if faq_question_pool is empty → skip (keep showing previous FAQ)
      - read questions from faq_question_pool
      - create temporary isolated Lokte session (not the user's chat session)
      - send guardrail prompt → parse JSON response
      - delete the temporary session (cleanup)
      - upsert suggested_faqs row
      - clear faq_question_pool rows for this shop

[User opens chat]
  → frontend fetches GET /faq/:shopId
  → shows dynamic suggestions OR fallback
```

---

## Database Tables

### `faq_question_pool`
Append-only log of user questions between FAQ generation runs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `shopId` | varchar | Shop domain |
| `question` | text | The raw user question |
| `createdAt` | timestamp | Auto-set on insert |

- Populated by `LokteService.persistMessages()` on every successful user message
- Cleared per-shop after each successful FAQ generation run
- Never affected by "Clear chat history" (user-facing action)

### `suggested_faqs`
One row per shop — updated after each successful generation.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `shopId` | varchar | Unique per shop |
| `questions` | jsonb | Array of 3 strings |
| `generatedAt` | timestamp | Auto-updated on upsert |

---

## Config Namespace: `faq_suggestions`

Registered in `FaqSuggestionsModule.onModuleInit()`. Fields auto-render in the Configuration page.

| Path | Type | Default | Description |
|---|---|---|---|
| `general.enable` | toggle | 1 (enabled) | Enable AI-generated FAQ generation |
| `general.cron_interval_hours` | number | 24 | Hours between regeneration runs |
| `general.fallback_q1` | text | "What are my top-selling products this month?" | Shown when disabled or no FAQ generated |
| `general.fallback_q2` | text | "Show me recent orders that need attention." | |
| `general.fallback_q3` | text | "How can I improve my store's conversion rate?" | |

---

## Cron Job

- Runs every hour (`0 * * * *`) via `@nestjs/schedule`
- Iterates all active shops from `ShopsService.findAllActive()`
- Per-shop skip conditions:
  1. `faq_suggestions.general.enable` is `0`
  2. `now - lastGeneratedAt < cron_interval_hours` (not enough time elapsed)
  3. `faq_question_pool` is empty (no new questions since last run)
- One shop's failure does not block the others (try/catch per shop)

---

## Isolated Lokte Session for FAQ Generation

The FAQ cron creates a **brand-new temporary Lokte session** exclusively for the batch prompt. This session is completely separate from the user's chat session managed by `LokteService`.

1. `createTempLokteSession(token, personaId)` — creates a new session on Lokte
2. `runFaqPrompt(token, sessionId, questions)` — sends one message with the guardrail prompt, parses the JSON array response
3. `deleteTempLokteSession(token, sessionId)` — **always** called in `finally` block to clean up orphaned sessions

The user's chat session (`chat_sessions` table) is **never touched** by the FAQ cron.

---

## Lokte Guardrail Prompt

```
You are a FAQ curator for a merchant assistant powered by Lokte — an internal AI/RAG platform 
that connects to company knowledge bases and data sources.

Analyze the following list of questions asked by merchants and return exactly 3 of the most 
useful, commonly-asked questions. Rules:
- Rewrite them clearly and concisely (max ~12 words each)
- Filter out: test/nonsensical messages, very specific one-off requests, incomplete sentences, profanity
- Return ONLY a valid JSON array of exactly 3 strings, nothing else — no explanation, no markdown
- If fewer than 3 good questions exist, fill the remaining slots with plausible Lokte-related 
  questions (e.g. about products, orders, inventory, or company procedures)

Example output: ["How do I process a refund?","What are the top products this month?","How do I update inventory levels?"]

Questions to analyze:
1. <question 1>
2. <question 2>
...
```

The prompt uses `run_search: 'never'` so Lokte skips document retrieval for this internal curation task.

---

## Fallback Priority

The frontend applies the following priority when deciding what to show:

| Priority | Condition | Questions shown |
|---|---|---|
| 1 | `suggested_faqs` row exists | Dynamic AI-generated questions |
| 2 | No DB row yet | Backend returns `null`, frontend uses `DEFAULT_FAQ_QUESTIONS` (hardcoded) |
| 3 | FAQ disabled by admin | Backend returns `null`, frontend uses `DEFAULT_FAQ_QUESTIONS` |

> **Note:** When FAQ is disabled, the 3 configurable `fallback_q*` fields in the config are intended for future direct serving. Currently the frontend uses the hardcoded defaults as ultimate fallback. A future iteration can wire the fallback questions through the `GET /faq/:shopId` response when `enable = 0`.

---

## API Endpoints

### `GET /faq/:shopId`
Returns current suggested FAQ questions and the last generation timestamp.

**Auth:** `ShopifySessionGuard` + `ShopParamGuard` (Bearer session token)

**Response:**
```json
{
  "questions": ["question 1", "question 2", "question 3"],
  "lastGeneratedAt": "2026-06-05T10:00:00.000Z"
}
```
Returns `{ "questions": null, "lastGeneratedAt": null }` when no FAQ has been generated yet.

---

### `POST /faq/:shopId/generate`
Triggers an immediate FAQ generation run for the shop (force-run).

**Auth:** `ShopifySessionGuard` + `ShopParamGuard`

**Response:** Same shape as GET. Returns `{ "questions": null, ... }` if generation was skipped (e.g. empty pool).

---

## Backend Module Structure

```
backend/src/faq-suggestions/
├── entities/
│   ├── suggested-faq.entity.ts        TypeORM entity for suggested_faqs table
│   └── faq-question-pool.entity.ts    TypeORM entity for faq_question_pool table
├── faq-suggestions.module.ts          NestJS module + config registration
├── faq-suggestions.service.ts         Generation logic, cron job
└── faq-suggestions.controller.ts      REST endpoints (GET, POST /generate)
```

---

## Frontend Changes

### `app._index.tsx`
- Removed hardcoded `SUGGESTED_QUESTIONS` constant
- Added `DEFAULT_FAQ_QUESTIONS` as the ultimate fallback (same 3 questions)
- Added `loadFaq` action intent: fetches `GET /faq/:shopId`
- On mount: fires `loadFaq` in parallel with `loadLokte` and `loadHistory`
- Suggestion chips now render from `suggestedQuestions` state (initially `DEFAULT_FAQ_QUESTIONS`, replaced when backend responds)
- Label sub-line removed (dynamic questions have no category labels)

### `app.configuration.tsx`
- Added `forceRunFaq` and `loadFaqStatus` action intents
- Added dedicated **FAQ Management card** at the bottom of the Configuration page:
  - Last generated timestamp
  - Preview of current generated questions
  - "Force Regenerate FAQ Now" button with loading state

---

## Minimum Questions Threshold

FAQ generation is skipped if the `faq_question_pool` contains fewer than **5 distinct questions** for the shop. This prevents low-quality single-question pools from producing poor suggestions.

---

## Security Considerations

- `faq_question_pool` contains raw user question text. It is scoped per-shop (`shopId` required on all queries) and cleared after each successful FAQ run, limiting retention.
- The temporary Lokte session created for FAQ generation uses the shop's existing API key and persona ID (same credentials as chat), so no additional secrets are introduced.
- The `POST /faq/:shopId/generate` endpoint is guarded by `ShopifySessionGuard` — only authenticated users of that shop can trigger a force-run.
