# Architecture Overview

This page describes how the AI Assistant Shopify app is structured, how its components communicate, and how requests flow through the system.

---

## High-level layout

The app runs as a **single Docker container** that hosts two services managed by **supervisord**:

| Service | Technology | Port | Access |
|---|---|---|---|
| Frontend | Remix + React | `3000` | Public (browser) |
| Backend | NestJS | `3004` | Internal only (localhost) |

A separate **Postgres** container stores per-shop configuration and chat history. A **SQLite** file (managed by Prisma) is used by the frontend for Shopify session storage.

```
┌───────────────────────────────────────────────────┐
│  Docker Container                                  │
│                                                    │
│  ┌──────────────────────┐  ┌─────────────────────┐│
│  │  Frontend (Remix)    │  │  Backend (NestJS)   ││
│  │  Port 3000           │→ │  Port 3004          ││
│  │  Shopify OAuth       │  │  Config Registry    ││
│  │  Chat UI             │  │  Chat sessions      ││
│  │  Config UI           │  │  Lokte integration  ││
│  └──────────────────────┘  └─────────────────────┘│
│            ↓                        ↓              │
│       SQLite (sessions)        PostgreSQL          │
│       /app/frontend/data       (separate container)│
└───────────────────────────────────────────────────┘
         ↑
    Browser / Shopify Admin
```

> **⚠️ Warning:** Port `3004` must never be exposed to the public internet. It has no external authentication layer — all security relies on it being reachable only from within the container.

---

## Request flow

### Chat request

```
Browser (Shopify Admin)
  │
  │  1. User types a message
  │  2. App Bridge: shopify.idToken() → session JWT
  │
  ▼
Remix route: POST /api/chat
  │
  │  3. Authenticates Shopify session server-side
  │  4. Forwards request to backend
  │
  ▼
NestJS: POST /lokte/:shopId/question
  │
  │  5. ShopifySessionGuard validates Bearer JWT
  │  6. Checks Lokte is enabled + configured
  │  7. Gets/creates Lokte chat session (Postgres)
  │  8. Sends message to Lokte API (NDJSON stream)
  │  9. Parses response + source documents
  │  10. Persists messages to Postgres
  │
  ▼
Lokte API (external): POST /api/chat/send-message
  │
  └→ Returns NDJSON stream → NestJS parses → JSON → Remix → Browser
```

### Configuration save

```
Browser
  │  1. Admin edits a field in Configuration UI
  │  2. Clicks Save
  │  3. App Bridge: idToken() → session JWT
  │
  ▼
Remix action: POST /app/configuration
  │  4. Authenticates Shopify session
  │  5. For each changed field: POST /config/:shopId { path, value }
  │
  ▼
NestJS: POST /config/:shopId
  │  6. ShopifySessionGuard validates JWT
  │  7. ConfigRegistryService upserts row in core_config (Postgres)
  │  8. If field is type "secret": encrypts value with AES-256-GCM before storing
```

---

## Frontend (Remix)

The frontend is a Shopify embedded app built with Remix and Polaris. It handles:

- **OAuth flow** — Shopify app installation and session management via `@shopify/shopify-app-remix`
- **Chat UI** — the main page (`app._index.tsx`) where merchants interact with the assistant
- **Configuration UI** — the settings page (`app.configuration.tsx`) which renders dynamically from the backend's config schema
- **API proxying** — all backend calls go through Remix server-side routes, never directly from the browser

### Key routes

| Route file | Path | Purpose |
|---|---|---|
| `app._index.tsx` | `/app` | Chat page and history |
| `app.configuration.tsx` | `/app/configuration` | Settings page |
| `api.chat.tsx` | `/api/chat` | Chat API proxy (POST only) |
| `auth.$.tsx` | `/auth/*` | Shopify OAuth callback handling |

### Session storage

Shopify session tokens are stored in a **SQLite database** (`/app/frontend/data/app.db`) managed by Prisma. This database is mounted as a Docker volume so it persists across container restarts.

---

## Backend (NestJS)

The backend is a NestJS API that handles business logic, configuration persistence, and Lokte integration. It is never accessed directly from the browser.

### Modules

| Module | Responsibility |
|---|---|
| `ConfigRegistryModule` | Per-shop configuration store — registration, get, set, schema API |
| `LokteModule` | Lokte API integration — chat sessions, message sending, history |
| `ShopsModule` | Shop record management |
| `AuthModule` | `ShopifySessionGuard` — validates App Bridge JWT on every request |
| `HealthModule` | `GET /health` endpoint |
| `DevToolsModule` | QA toggles (non-production only) |

### Database (Postgres)

The backend uses **TypeORM** with Postgres. Migrations run automatically at startup via `run-migrations.ts` executed by supervisord before launching the NestJS process.

---

## supervisord

Both services are managed by **supervisord** within the container. The startup sequence is:

1. Run Prisma migrations (frontend SQLite)
2. Run TypeORM migrations (backend Postgres)
3. Start NestJS backend
4. Start Remix frontend

This sequencing ensures the database schema is always up to date before either service accepts traffic.

The prod and debug configurations differ only in the presence of `--inspect` flags for the Node.js inspector on ports `9229` (frontend) and `9230` (backend) in debug mode.

---

## External dependencies

| Dependency | Purpose | Notes |
|---|---|---|
| Shopify Partner Platform | OAuth, app embedding, App Bridge | Required for all app functionality |
| Lokte API (`lokte.vaimo.network`) | AI answer generation | External; requires API key |

---

## Related

- [Local Development Setup](../../LOCAL_DEVELOPMENT.md)
- [Production Deployment Guide](../../PROD_DEPLOY.md)
- [Security Model](04-security-model.md)
