# Security Model

This page describes how the app is secured: how backend requests are authenticated, how secrets are stored, what ports are exposed, and how the Shopify OAuth flow works.

---

## Port exposure

| Port | Service | Exposed externally? |
|---|---|---|
| `3000` | Remix frontend | ✅ Yes — this is the public-facing port |
| `3004` | NestJS backend | ❌ No — internal only (`localhost` inside the container) |

The backend port is intentionally never mapped to the host in `docker-compose.yml`. Any request to the backend must originate from within the same container — there is no external path to reach port 3004 directly.

> **⚠️ Warning:** Do not expose port 3004 externally. The backend has no rate limiting or IP filtering beyond the HMAC guard — its security boundary is network isolation.

---

## Shopify OAuth

The app uses Shopify's standard OAuth flow managed by `@shopify/shopify-app-remix`.

1. When a store installs the app, Shopify redirects to `/auth` with an authorization code.
2. The frontend exchanges the code for an access token and stores it in SQLite via Prisma.
3. Subsequent admin page loads are validated server-side using `authenticate.admin(request)`.

The Shopify session JWT (`idToken`) is only obtainable client-side via the App Bridge `shopify.idToken()` method. Server-side loaders cannot produce this token and therefore cannot call NestJS endpoints that require it — all NestJS calls requiring authentication are triggered from the browser.

---

## Backend request authentication

### For browser-to-backend calls (via Remix actions)

Every request from the Remix server to the NestJS backend carries an `Authorization: Bearer <shopify-session-jwt>` header. The JWT is the App Bridge `idToken()` value passed from the browser to the Remix action, then forwarded to the backend.

The `ShopifySessionGuard` (`backend/src/auth/guards/shopify-hmac.guard.ts`) validates this JWT on every protected endpoint by verifying it against the `SHOPIFY_API_SECRET`.

**All NestJS routes are protected by this guard** — including `GET` endpoints.

### Flow

```
Browser
  ↓  shopify.idToken() → Shopify App Bridge JWT
Remix action (server-side)
  ↓  Authorization: Bearer <JWT>
NestJS (ShopifySessionGuard)
  ↓  Verifies JWT signature with SHOPIFY_API_SECRET
  ↓  Extracts shopId from token
Protected route handler
```

---

## Secret field encryption

Configuration values marked as `fieldType: 'secret'` (e.g., the Lokte API key) are encrypted before being written to the `core_config` table.

- **Algorithm:** AES-256-GCM
- **Key:** `CONFIG_ENCRYPTION_KEY` environment variable (32-byte hex string)
- **Storage format:** Encrypted values are stored with an `enc:` prefix so the system can distinguish them from plaintext values
- **API responses:** Secret fields are always masked as `"****"` in any HTTP response. Internal services use `configRegistry.getDecrypted()` to access the real value.

> **⚠️ Warning:** If `CONFIG_ENCRYPTION_KEY` is not set, secret fields are stored in plaintext and a warning is written to the backend log. Set this variable in production.

To generate a key:

```bash
openssl rand -hex 32
```

---

## SHOPIFY_API_SECRET

`SHOPIFY_API_SECRET` serves two roles in this app:

1. **Shopify OAuth** — used by the frontend to verify Shopify webhooks and validate session tokens
2. **Backend JWT verification** — used by `ShopifySessionGuard` to verify the App Bridge JWT forwarded from the frontend

Both services must have the same value for this variable. If they differ, all backend requests will fail with 401.

---

## Shopify API scopes

The app requests the following OAuth scopes:

| Scope | Purpose |
|---|---|
| `write_products` | Product data access |
| `read_orders` | Order data access |

These are configured in the `shopify.app.*.toml` file and the Shopify Partner Dashboard. Only request scopes that are actually used — unnecessary scopes increase the attack surface and may trigger App Store review issues.

---

## Data at rest

| Data | Storage | Encrypted? |
|---|---|---|
| Shopify session tokens | SQLite (`app.db`) | No (file is on a Docker volume; disk encryption at OS level recommended) |
| Config values (non-secret) | Postgres `core_config` | No |
| Config values (secret, e.g. API keys) | Postgres `core_config` | ✅ AES-256-GCM |
| Chat messages | Postgres `chat_messages` | No |
| Lokte session IDs | Postgres `chat_sessions` | No |

---

## Security checklist for production

- [ ] `CONFIG_ENCRYPTION_KEY` is set and stored in a secrets manager
- [ ] `DB_PASSWORD` is strong and randomly generated (not the default `postgres`)
- [ ] `SHOPIFY_API_SECRET` is not committed to version control
- [ ] Port `3004` is not exposed in `docker-compose.yml` (it is not by default — verify it stays that way)
- [ ] HTTPS is enforced on the public domain (port 3000)
- [ ] Docker volumes for `fe_data` and `pgdata` are on encrypted storage
- [ ] Container images are rebuilt regularly to pick up OS security patches

---

## Related

- [Environment Variables](02-environment-variables.md)
- [Architecture Overview](01-architecture-overview.md)
- [Production Deployment Guide](../../PROD_DEPLOY.md)
