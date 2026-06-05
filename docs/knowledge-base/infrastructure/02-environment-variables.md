# Environment Variables

Complete reference for all environment variables used by the AI Assistant app. These are set in your `.env` file (local) or docker-compose environment block (deployed).

> **ℹ️ Note:** Both the frontend and backend share the same container and the same `.env` file. `SHOPIFY_API_SECRET` must be identical in both — the frontend uses it to sign backend requests, and the backend uses it to verify them.

---

## Frontend variables

These are consumed by the Remix process (port 3000).

| Variable | Required | Description | Example |
|---|---|---|---|
| `SHOPIFY_API_KEY` | ✅ | Shopify app Client ID from the Partner Dashboard | `abc123def456` |
| `SHOPIFY_API_SECRET` | ✅ | Shopify app Client Secret. Also used to sign backend requests. | `shpss_abc...` |
| `APP_URL` | ✅ | Public HTTPS URL of the app. Must match the App URL in Partner Dashboard. | `https://myapp.example.com` |
| `SCOPES` | ✅ | Comma-separated list of Shopify API scopes | `write_products,read_orders` |
| `DATABASE_URL` | ✅ | Prisma connection string for SQLite session storage | `file:/app/frontend/data/app.db` |
| `BACKEND_URL` | ✅ | Internal URL of the NestJS backend. Always `http://localhost:3004` inside the container. | `http://localhost:3004` |

---

## Backend variables

These are consumed by the NestJS process (port 3004).

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | ✅ | Runtime environment. Set to `production` in prod — controls whether DevToolsModule loads. | `production` |
| `PORT` | Optional | Port the backend listens on. Defaults to `3004`. | `3004` |
| `SHOPIFY_API_SECRET` | ✅ | Must match the frontend value. Used to verify HMAC signatures on incoming requests. | `shpss_abc...` |
| `ALLOWED_ORIGINS` | ✅ | CORS allowed origins for the backend. Set to the frontend's origin. | `https://myapp.example.com` |
| `DB_HOST` | ✅ | Postgres hostname. Inside Docker, this is the service name `postgres`. | `postgres` |
| `DB_PORT` | Optional | Postgres port. Defaults to `5432`. | `5432` |
| `DB_USERNAME` | ✅ | Postgres username | `postgres` |
| `DB_PASSWORD` | ✅ | Postgres password | `a-strong-password` |
| `DB_NAME` | ✅ | Postgres database name | `ai_assistant_db` |
| `CONFIG_ENCRYPTION_KEY` | Recommended | 32-byte hex key for AES-256-GCM encryption of `secret` config fields. If not set, secrets are stored in plaintext and a warning is logged. | `000102...1e1f` |

---

## Generating `CONFIG_ENCRYPTION_KEY`

```bash
# Generate a random 32-byte hex key
openssl rand -hex 32
```

Store the output in your secrets manager or `.env`. Never commit it to git.

---

## Example `.env`

```env
# Shopify
SHOPIFY_API_KEY=abc123def456
SHOPIFY_API_SECRET=shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APP_URL=https://myapp.example.com
SCOPES=write_products,read_orders

# Frontend — SQLite session storage
DATABASE_URL=file:/app/frontend/data/app.db

# Backend — internal URL (do not change inside Docker)
BACKEND_URL=http://localhost:3004

# Backend — runtime
NODE_ENV=production
ALLOWED_ORIGINS=https://myapp.example.com

# Backend — Postgres
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=a-strong-password
DB_NAME=ai_assistant_db

# Backend — secret field encryption (strongly recommended)
CONFIG_ENCRYPTION_KEY=<output of: openssl rand -hex 32>
```

---

## Security notes

- Never commit `.env` to version control. Add it to `.gitignore`.
- In production, prefer a secrets manager (AWS Secrets Manager, HashiCorp Vault) over a plaintext `.env` file.
- Rotate `SHOPIFY_API_SECRET` if you suspect it has been compromised. Both services must be updated simultaneously, then restarted.
- Use a strong, randomly generated `DB_PASSWORD`. Default values (`postgres`) are only acceptable for local development.

---

## Related

- [Security Model](04-security-model.md)
- [Local Development Setup](../../LOCAL_DEVELOPMENT.md)
- [Production Deployment Guide](../../PROD_DEPLOY.md)
