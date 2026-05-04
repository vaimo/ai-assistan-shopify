# Lokte AI Integration — Design Spec
**Date:** 2026-05-04  
**Status:** Approved

---

## Problem & Goal

The Shopify AI Assistant app needs to connect to **Lokte** (Vaimo's internal AI with access to company documentation) so merchants can ask questions that are answered from internal knowledge. The MVP scope is:

1. Configuration module — dynamic FE settings page driven by the BE schema
2. Lokte-specific config fields (enabled, api_key encrypted, persona_id)
3. Backend question endpoint (POST /question) ready for future FE chat UI

---

## Architecture

```
Browser (Shopify Admin)
  └→ Remix server :3000  (public)
       ├─ loader/action → GET/POST /config   (existing config-registry endpoints)
       └─ future: loader/action → POST /question
            └→ NestJS :3001  (internal-only)
                 ├─ ConfigController  (existing, enhanced with encryption masking)
                 └─ LokteController   (NEW)  POST /question
                      └→ LokteService
                           ├─ reads decrypted api_key from ConfigRegistryService
                           └→ Lokte API (lokte.vaimo.network)
                                 ├─ POST /api/chat/create-chat-session  → session_id
                                 └─ POST /api/chat/send-message         → NDJSON stream
```

The BE is the only layer that holds the real (decrypted) api_key. The Remix server cannot call Lokte directly because the config GET endpoint masks encrypted values as `"****"`.

---

## Part 1: Encrypted Field Type (Config Registry)

### New `FieldType`

`config-meta.types.ts`: add `'encrypted'` to the `FieldType` union.

### Encryption utility

New file `config-registry/utils/encryption.utils.ts`:
- `encrypt(plaintext: string, key: string): string` — AES-256-CBC, returns `iv:ciphertext` hex string
- `decrypt(ciphertext: string, key: string): string` — inverse
- Key sourced from `ENCRYPTION_KEY` env var (required, validated at startup)

### ConfigRegistryService changes

- `set(shopId, path, value)`: if field meta is `encrypted`, encrypt value before upsert
- `get(shopId, path)`: if field meta is `encrypted`, decrypt value after DB fetch
- Internal helper: `isEncryptedField(namespace, subPath): boolean` — checks meta registry

### ConfigController changes

- All GET responses: before returning, traverse config values and replace any `encrypted`-type field values with `"****"`
- New private helper: `maskEncryptedFields(config, meta): config`

---

## Part 2: Lokte Module (Backend)

### Files

```
backend/src/lokte/
  lokte.module.ts
  lokte.controller.ts      POST /question
  lokte.service.ts
  dtos/
    ask-question.dto.ts    { message: string }
    ask-question-response.dto.ts  { answer: string }
```

### Config Registration (in `LokteModule.onModuleInit`)

```typescript
this.configRegistry.register('lokte', {
  connection: {
    enabled: false,
    api_key: '',
    persona_id: 238,
  }
}, {
  moduleLabel: 'Lokte Connection',
  fields: {
    'connection.enabled':    { groupLabel: 'Connection', keyLabel: 'Enabled',    fieldType: 'toggle' },
    'connection.api_key':    { groupLabel: 'Connection', keyLabel: 'API Key',    fieldType: 'encrypted' },
    'connection.persona_id': { groupLabel: 'Connection', keyLabel: 'Persona ID', fieldType: 'number' },
  },
});
```

### LokteController

- `@Post('question') @UseGuards(ShopifySessionGuard)`
- Extracts shop from session JWT
- Validates `lokte.connection.enabled` → 400 if disabled
- Delegates to `LokteService.ask(shop, message)`

### LokteService

`ask(shop: string, message: string): Promise<{ answer: string }>`

1. Read `lokte.connection.api_key` (decrypted) and `lokte.connection.persona_id` from ConfigRegistryService
2. `POST /api/chat/create-chat-session` with `{ persona_id }` → extract `session_id`
3. `POST /api/chat/send-message` with full payload (see diptyque.sh)
4. Parse NDJSON response: collect all `answer_piece` chunks → join → return `{ answer }`
5. On HTTP error: throw `BadGatewayException` with message from Lokte

---

## Part 3: Dynamic Frontend Settings Page

### New components

`frontend/app/components/ConfigField.tsx`
- Props: `fieldType`, `path`, `label`, `description`, `value`, `onChange`
- Renders:
  - `toggle` → Polaris `SettingToggle` (or checkbox)
  - `text` → Polaris `TextField`
  - `number` → Polaris `TextField` type="number"
  - `encrypted` → Polaris `TextField` type="password" + reveal toggle; shows `"****"` placeholder when value is masked
  - `select` → Polaris `Select`

`frontend/app/components/ConfigModule.tsx`
- Props: namespace key, `ConfigNamespaceMeta`, values object
- Groups fields by `groupLabel`, renders `ConfigField` for each

### Settings page refactor (`app._index.tsx`)

**Loader:**
```
GET /config/schema      → ConfigNamespaceMeta for all namespaces
GET /config/:shopId     → merged values for all namespaces
```

**Action:**
```
POST /config/:shopId    → { path, value }  (one field at a time)
```

**Render:** iterate namespaces in schema → render `<ConfigModule>` for each.

### `backend.server.ts` additions

- `getBackendSchema(): Promise<Record<string, ConfigNamespaceMeta>>` — GET /config/schema (no HMAC; uses ShopifySessionGuard via session token)
- `getAllBackendConfig(shopId, sessionToken)` — GET /config/:shopId
- `askQuestion(shopId, sessionToken, message)` — POST /question (future use)

**Note:** The config schema/value endpoints use `ShopifySessionGuard` (Bearer token), not HMAC. `backend.server.ts` needs to pass the Shopify session token in the `Authorization` header for these calls.

---

## Part 4: Environment & Deployment

### New env var

`ENCRYPTION_KEY` — 32-byte hex string (256-bit AES key). Required in backend.

- `.env.example`: add `ENCRYPTION_KEY=<generate with: openssl rand -hex 32>`
- `docker-compose.yml`: add to backend service env
- `docker-compose.debug.yml`: add to backend service env

### Deployment parity checklist

- [ ] Both Dockerfiles unchanged (no new build steps)
- [ ] Both docker-compose files have `ENCRYPTION_KEY`
- [ ] Both supervisor configs unchanged

---

## Error Handling

| Scenario | Response |
|---|---|
| Lokte disabled for shop | 400 Bad Request |
| api_key not configured | 400 Bad Request |
| Lokte API unreachable | 502 Bad Gateway |
| Lokte returns error response | 502 Bad Gateway with message |
| ENCRYPTION_KEY missing | App fails to start (config validation) |

---

## What's Out of Scope (MVP)

- Frontend chat UI (POST /question endpoint is built but not wired to any FE route yet)
- Rate limiting on /question
- Streaming response to FE (NDJSON parsed and returned as full JSON)
- Multiple personas per shop
