# Database Schema

The app uses two databases:

| Database | Engine | Managed by | Purpose |
|---|---|---|---|
| Postgres | PostgreSQL 16 | TypeORM + migrations | Backend business data |
| SQLite | SQLite | Prisma | Frontend Shopify session storage |

---

## Postgres tables

These tables are created and updated by TypeORM migrations that run automatically on startup.

### `shops`

Stores a record for each Shopify store that has installed the app.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Auto-generated |
| `shop_id` | `varchar` | UNIQUE, NOT NULL | Shopify shop domain, e.g. `mystore.myshopify.com` |
| `created_at` | `timestamp` | NOT NULL | Auto-set on insert |
| `updated_at` | `timestamp` | NOT NULL | Auto-updated on every change |

---

### `core_config`

Stores per-shop configuration values. Each row is one setting for one shop.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Auto-generated |
| `shop_id` | `varchar` | NOT NULL, INDEXED | Shopify shop domain |
| `path` | `varchar` | NOT NULL, INDEXED | Dot-notation path, e.g. `lokte.general.api_key` |
| `value` | `jsonb` | NOT NULL | Stored as JSON — can be boolean, number, string, or object. Secret fields are stored as an encrypted string with `enc:` prefix. |
| `created_at` | `timestamp` | NOT NULL | Auto-set on insert |
| `updated_at` | `timestamp` | NOT NULL | Auto-updated on upsert |

**Unique constraint:** `(shop_id, path)`

**Path format:** `namespace.group.key` — e.g., `lokte.general.enable`, `ai_assistant.general.enable`.

Migration: `src/database/migrations/1745798400000-AddCoreConfig.ts`

---

### `chat_sessions`

Stores the active Lokte chat session for each `(shop, user)` pair.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | |
| `shop_id` | `varchar` | NOT NULL | Shopify shop domain |
| `user_id` | `varchar` | NOT NULL | Shopify user ID (string form of BigInt). Falls back to `"default"` with offline tokens. |
| `lokte_session_id` | `varchar` | NOT NULL | Lokte `chat_session_id` UUID |
| `last_assistant_msg_id` | `int` | NULLABLE | `reserved_assistant_message_id` from the last Lokte reply. Used as `parent_message_id` for the next request to maintain context. |
| `created_at` | `timestamp` | NOT NULL | |
| `updated_at` | `timestamp` | NOT NULL | |

**Unique constraint:** `(shop_id, user_id)`

Migration: `src/database/migrations/1747650000000-AddChatTables.ts`

---

### `chat_messages`

Stores the full conversation log per `(shop, user)`. Capped at 100 rows per user — oldest are trimmed automatically.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | |
| `shop_id` | `varchar` | NOT NULL | |
| `user_id` | `varchar` | NOT NULL | |
| `role` | `varchar` | NOT NULL | `'user'` or `'assistant'` |
| `content` | `text` | NOT NULL | Message text |
| `is_error` | `boolean` | NOT NULL, DEFAULT `false` | `true` if this is an error message displayed to the user |
| `created_at` | `timestamp` | NOT NULL | |

**Index:** `(shop_id, user_id, created_at)`

Migration: `src/database/migrations/1747650000000-AddChatTables.ts`

---

## SQLite (Shopify session storage)

The frontend uses Prisma with SQLite to store Shopify OAuth session tokens. This is a standard `@shopify/shopify-app-prisma-session-storage` implementation.

**File location:** `/app/frontend/data/app.db` (inside container) — mounted as a Docker volume `fe_data` so it persists across container restarts.

The schema is managed by Prisma and is not manually maintained. It contains a single `Session` table tracking Shopify OAuth sessions.

---

## Running migrations manually

Migrations run automatically on startup. If you need to run them manually:

```bash
# Backend TypeORM migrations
docker-compose exec app sh -c "cd /app/backend && node dist/run-migrations.js"

# Frontend Prisma migrations
docker-compose exec app sh -c "cd /app/frontend && ./node_modules/.bin/prisma migrate deploy"
```

---

## Generating a new backend migration

```bash
cd backend
npm run migration:generate -- src/migrations/DescriptiveName
```

Then register the new migration class in `src/app.module.ts` under the TypeORM migrations array.

---

## Related

- [Architecture Overview](01-architecture-overview.md)
- [ConfigRegistry Module Reference](../../../backend/src/config-registry/README.md)
- [Chat History Architecture](../../Features/chat_history.md)
