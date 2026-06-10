# Chat History Persistence — Architecture & Implementation

---

## Context

Admin users need persistent, named conversation threads when navigating back to the
main (chat) page. Multiple conversations can exist per `(shopId, userId)` pair.
Each conversation is isolated with its own Lokte session and message history.

---

## Lokte API — Available Endpoints (relevant)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/chat/create-chat-session` | Create a new conversation session |
| `POST` | `/api/chat/send-message` | Send a message (NDJSON streaming) |
| `POST` | `/api/chat/send-message-simple-with-history` | Stateless — caller passes full history each time |
| `GET`  | `/api/chat/get-chat-session/{session_id}` | Fetch session with full message tree |
| `DELETE` | `/api/chat/delete-chat-session/{session_id}` | Delete a session from Lokte |

Lokte is built on **Onyx** (formerly Danswer) — all API shapes, NDJSON events,
and field names match the Onyx open-source codebase.

---

## Context test results (live, tested 2026-05-19)

| Approach | Endpoint | Context preserved |
|---|---|:---:|
| New session per message (old behaviour) | `send-message` | ❌ |
| Reuse session + `parent_message_id: null` | `send-message` | ❌ |
| Reuse session + correct `parent_message_id` | `send-message` | ✅ |
| Caller passes full history array | `send-message-simple-with-history` | ✅ |

**Key NDJSON discovery:** The `send-message` stream returns `reserved_assistant_message_id`
in its **first line** (before any `message_delta` events). This must be stored and
passed as `parent_message_id` on the next message to thread the conversation.

```
First NDJSON line: {"user_message_id": 127281, "reserved_assistant_message_id": 127282}
```

---

## Chosen approach — `send-message` + persistent session + `parent_message_id`

Each `chat_session` row owns a `lokteSessionId` (created lazily on first message).
The `lastAssistantMsgId` is updated after each reply and passed as `parent_message_id`
on the next message to maintain threading context.

`send-message-simple-with-history` is simpler but stateless; the caller would
resend the full history on every request, growing with each message. The
session-based approach sends only the new message, not the entire thread.

**On "Delete chat":** delete our DB records AND the Lokte session
(`DELETE /api/chat/delete-chat-session/{session_id}`).

---

## Architecture — Multi-chat, history stored entirely in the Backend (NestJS / Postgres)

History and session state belong in NestJS, not in Remix routes. The frontend
only sends questions and displays results.

### Postgres tables

**`chat_sessions`** — one row per individual conversation thread:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `shopId` | string | |
| `userId` | string | Shopify userId (BigInt cast to string) |
| `lokteSessionId` | string nullable | Lokte `chat_session_id` UUID — set lazily on first message |
| `lastAssistantMsgId` | int nullable | `reserved_assistant_message_id` from last reply |
| `title` | varchar(80) | Auto-generated from the first user message |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

Index: `(shopId, userId)`.  No unique constraint — multiple sessions per user are allowed.

**`chat_messages`** — full conversation log:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `shopId` | string | |
| `userId` | string | |
| `chatSessionId` | uuid FK | References `chat_sessions.id` ON DELETE CASCADE |
| `role` | string | `'user'` or `'assistant'` |
| `content` | text | |
| `isError` | boolean | default false |
| `documents` | jsonb nullable | Source document metadata |
| `createdAt` | timestamp | |

Index: `(chatSessionId)`.

### `LokteService` public API

| Method | Signature | Notes |
|---|---|---|
| `listChats` | `(shopId, userId) → ChatSummary[]` | Ordered by `updatedAt DESC` |
| `askQuestion` | `(shopId, userId, question, chatId?) → { answer, docs, chatId }` | Creates session lazily when `chatId` is absent; sets title from first user msg |
| `getHistory` | `(shopId, userId, chatId) → ChatMessage[]` | Scoped to session |
| `deleteChat` | `(shopId, userId, chatId) → void` | Deletes Lokte session + DB rows |
| `clearAllHistory` | `(shopId, userId) → void` | Deletes all sessions for user |

### Backend endpoints

```
GET    /lokte/:shopId/chats                  → ChatSummary[]
GET    /lokte/:shopId/chats/:chatId/history  → ChatMessage[]
DELETE /lokte/:shopId/chats/:chatId          → { deleted: true }
DELETE /lokte/:shopId/history               → { cleared: true }   (clear ALL)
POST   /lokte/:shopId/question              → { answer, docs, chatId }
```

### Frontend changes

| File | Change |
|---|---|
| `backend.server.ts` | `ChatSummary` interface; `clearAllChatHistory` |
| `app._index.tsx` loader | Returns only `shopId` (unchanged) |
| `app._index.tsx` action | `loadChats`, `loadHistory(chatId)`, `clearHistory(chatId)`, `clearAllHistory` intents |
| `app._index.tsx` component | Collapsible sidebar, `activeChatId` + `chats[]` state, new-chat/switch/delete handlers |
| `api.chat.tsx` | Forwards optional `chatId`; returns `chatId` in response |

---

## Auth architecture note — why history is loaded client-side

All NestJS endpoints (including GETs) are protected by `ShopifySessionGuard`, which
requires an `Authorization: Bearer <shopify-session-jwt>` header.

The Shopify session JWT is only obtainable client-side via `shopify.idToken()` (App Bridge).

**This means all NestJS calls that require auth must be triggered from the browser.**

The established pattern in this app:
```
Browser → shopify.idToken() → POST /app (Remix action) with { sessionToken }
         → action forwards to NestJS with Authorization: Bearer <sessionToken>
```

---

## UI — Collapsible sidebar

- Toggle button in the persistent top header ("History")
- Badge shows total number of chats
- "New chat" button also available in header
- Sidebar overlays the chat area (absolute positioned, 280px wide)
- Per-chat delete button (trash icon) on each list item
- "Clear all history" button with confirm step in sidebar footer
- Clicking outside the sidebar closes it

---

## Files touched

### Backend
| File | Change |
|---|---|
| `backend/src/lokte/entities/chat-session.entity.ts` | Removed `@Unique`; added `title`, `lokteSessionId` nullable, `OneToMany` |
| `backend/src/lokte/entities/chat-message.entity.ts` | Added `chatSessionId` FK `ManyToOne`; updated index |
| `backend/src/lokte/lokte.service.ts` | New `listChats`, `deleteChat`, `clearAllHistory`; updated `askQuestion`/`getHistory` signatures |
| `backend/src/lokte/lokte.controller.ts` | New `GET /chats`, `GET /chats/:chatId/history`, `DELETE /chats/:chatId`; removed old `GET /history` |
| `backend/src/lokte/dtos/ask-question.dto.ts` | Added optional `chatId` |
| `backend/src/lokte/lokte.service.spec.ts` | Updated mocks and added new test cases |
| `backend/src/database/migrations/1749470000000-AddMultipleChatSupport.ts` | **New** migration |
| `backend/src/app.module.ts` | Registered new migration (also added missing `AddDocumentsToChatMessages`) |

### Frontend
| File | Change |
|---|---|
| `frontend/app/backend.server.ts` | `ChatSummary` interface; `clearAllChatHistory` |
| `frontend/app/routes/app._index.tsx` | New sidebar, updated state/intents/flow |
| `frontend/app/routes/api.chat.tsx` | Forward `chatId`; return `chatId` in response |

---

## Open questions / follow-up

1. **Per-user isolation** — `session.userId` is only populated with online (user-scoped) OAuth tokens.
   With offline tokens it falls back to `"default"`, meaning all admins share conversations.
   Confirm online tokens are configured; until then `"default"` is the safe fallback.

2. **Lokte session expiry** — if Lokte expires an old `lokteSessionId`, `send-message` returns 4xx.
   Current behaviour: `BadGatewayException`. Should add: catch 4xx → create fresh session → retry once.

3. **Chat title rename** — not implemented in v1. Could be added via `PATCH /lokte/:shopId/chats/:chatId`.

4. **Message cap** — `HISTORY_LIMIT = 100` rows per chat session; oldest trimmed automatically.


---

## Context

Admin users need to see the last AI assistant conversation when navigating back to
the main (chat) page, with the ability to clear it. Multiple admin users per shop
need isolated conversations.

---

## Lokte API — Available Endpoints (relevant)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/chat/create-chat-session` | Create a new conversation session |
| `POST` | `/api/chat/send-message` | Send a message (NDJSON streaming) |
| `POST` | `/api/chat/send-message-simple-with-history` | Stateless — caller passes full history each time |
| `GET`  | `/api/chat/get-chat-session/{session_id}` | Fetch session with full message tree |
| `DELETE` | `/api/chat/delete-chat-session/{session_id}` | Delete a session from Lokte |

Lokte is built on **Onyx** (formerly Danswer) — all API shapes, NDJSON events,
and field names match the Onyx open-source codebase.

---

## Context test results (live, tested 2026-05-19)

| Approach | Endpoint | Context preserved |
|---|---|:---:|
| New session per message (old behaviour) | `send-message` | ❌ |
| Reuse session + `parent_message_id: null` | `send-message` | ❌ |
| Reuse session + correct `parent_message_id` | `send-message` | ✅ |
| Caller passes full history array | `send-message-simple-with-history` | ✅ |

**Key NDJSON discovery:** The `send-message` stream returns `reserved_assistant_message_id`
in its **first line** (before any `message_delta` events). This must be stored and
passed as `parent_message_id` on the next message to thread the conversation.

```
First NDJSON line: {"user_message_id": 127281, "reserved_assistant_message_id": 127282}
```

---

## Chosen approach — `send-message` + persistent session + `parent_message_id`

`send-message-simple-with-history` is simpler but stateless: the caller resends
the full history on every request, growing in size with each message.

The session-based approach is the proper pattern:
- Lokte maintains context server-side
- Each request only sends the new message, not the entire thread
- Supports streaming responses
- Aligns with how Lokte's own UI works

**On "Clear conversation":** delete our DB records AND the Lokte session
(`DELETE /api/chat/delete-chat-session/{session_id}`). Next message starts a
fresh session with clean context on both sides.

---

## Architecture — History owns entirely in the Backend (NestJS / Postgres)

History and session state belong in NestJS, not in Remix routes. The frontend
only sends questions and displays results.

### New Postgres tables

**`chat_sessions`** — one row per `(shopId, userId)`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `shopId` | string | |
| `userId` | string | Shopify userId (BigInt cast to string) |
| `lokteSessionId` | string | Lokte `chat_session_id` UUID |
| `lastAssistantMsgId` | int nullable | `reserved_assistant_message_id` from last reply |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

Unique constraint: `(shopId, userId)`.

**`chat_messages`** — full conversation log:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `shopId` | string | |
| `userId` | string | |
| `role` | string | `'user'` or `'assistant'` |
| `content` | text | |
| `isError` | boolean | default false |
| `createdAt` | timestamp | |

Index: `(shopId, userId, createdAt)`.

### `LokteService.askQuestion(shopId, userId, question)` flow

```
1. Load ChatSession for (shopId, userId)
   ├─ exists  → use lokteSessionId + lastAssistantMsgId
   └─ missing → call create-chat-session → create ChatSession row

2. Call POST /api/chat/send-message
   { chat_session_id, parent_message_id: lastAssistantMsgId, message: question }

3. Parse NDJSON stream
   ├─ First line → extract reserved_assistant_message_id
   ├─ message_delta lines → accumulate answer
   └─ top_documents → collect source docs

4. Update ChatSession.lastAssistantMsgId = reserved_assistant_message_id

5. Save user + assistant ChatMessage rows

6. Return { answer, documents }
```

### `LokteService.clearHistory(shopId, userId)` flow

```
1. Load ChatSession for (shopId, userId)
2. If exists → DELETE /api/chat/delete-chat-session/{lokteSessionId} on Lokte
3. Delete ChatSession row
4. Delete all ChatMessage rows for (shopId, userId)
```

### New BE endpoints

```
GET    /lokte/:shopId/history?userId=xxx  → ChatMessage[]  (last 100, asc)
DELETE /lokte/:shopId/history?userId=xxx  → { cleared: true }
POST   /lokte/:shopId/question            → { answer, documents }  (userId added to body)
```

### Frontend changes

| File | Change |
|---|---|
| `backend.server.ts` | `getChatHistory(shopId, userId)` — GET with Bearer token; `clearChatHistory(shopId, userId, sessionToken)` — DELETE with Bearer token |
| `app._index.tsx` loader | Returns only `shopId` + `userId` — **no direct backend call** (see auth note below) |
| `app._index.tsx` action | `intent: "loadHistory"` fetches history server-side with `sessionToken`; `intent: "clearHistory"` deletes history |
| `app._index.tsx` component | Fires `loadHistory` + `loadLokte` in parallel on mount; hydrates `messages` state from `historyFetcher.data` |
| `api.chat.tsx` | Passes `userId` in the request body to the backend |

---

## Auth architecture note — why history is loaded client-side

All NestJS endpoints (including GETs) are protected by `ShopifySessionGuard`, which
requires an `Authorization: Bearer <shopify-session-jwt>` header.

The Shopify session JWT is only obtainable client-side via `shopify.idToken()` (App Bridge).
The Remix server-side loader can authenticate the *request* (via `authenticate.admin(request)`)
but cannot produce a JWT to forward to NestJS — it has no way to call `idToken()`.

**This means all NestJS calls that require auth must be triggered from the browser.**

The established pattern in this app (see `loadLokte` intent):
```
Browser → shopify.idToken() → POST /app (Remix action) with { sessionToken }
         → action forwards to NestJS with Authorization: Bearer <sessionToken>
```

This is why history loads via a `loadHistory` action intent fired on mount,
not in the loader. The loader only returns public data derivable from the
Shopify session object itself (`shopId`, `userId`).

---

## Files touched

### Backend
| File | Change |
|---|---|
| `backend/src/lokte/entities/chat-message.entity.ts` | **New** — TypeORM entity |
| `backend/src/lokte/entities/chat-session.entity.ts` | **New** — TypeORM entity |
| `backend/src/lokte/lokte.service.ts` | Full rewrite: session-aware `askQuestion(shopId, userId, question)`, `getHistory`, `clearHistory` |
| `backend/src/lokte/lokte.controller.ts` | Added `GET /:shopId/history`, `DELETE /:shopId/history`; `userId` optional with `"default"` fallback |
| `backend/src/lokte/dtos/ask-question.dto.ts` | `userId` is `@IsOptional()` — safe when offline tokens are used |
| `backend/src/lokte/lokte.module.ts` | Registered new entities via `TypeOrmModule.forFeature` |
| `backend/src/database/migrations/1747650000000-AddChatTables.ts` | **New** migration — creates `chat_messages` + `chat_sessions` |
| `backend/src/app.module.ts` | Registered new migration |

### Frontend
| File | Change |
|---|---|
| `frontend/app/backend.server.ts` | `getChatHistory` + `clearChatHistory` (direct fetch with Bearer token, not `makeBackendRequest`) |
| `frontend/app/routes/app._index.tsx` | Loader stripped to public data only; `loadHistory` + `clearHistory` action intents; client-side history hydration on mount |
| `frontend/app/routes/api.chat.tsx` | `userId` extracted from body and forwarded to backend |

---

## Open questions / follow-up

1. **Per-user isolation** — `session.userId` is only populated with online (user-scoped) OAuth tokens.
   With offline tokens it falls back to `"default"`, meaning all admins share one conversation.
   Confirm online tokens are configured; until then `"default"` is the safe fallback.

2. **Lokte session expiry** — if Lokte expires an old `chat_session_id`, `send-message` returns 4xx.
   Current behaviour: `BadGatewayException`. Should add: catch 4xx → create fresh session → retry once.

3. **Clear semantics** — currently hard delete. Add soft-delete (`deletedAt`) if audit trail needed later.

4. **Message cap** — `HISTORY_LIMIT = 100` rows kept in DB per user; oldest trimmed automatically.
   Adjust if needed.
