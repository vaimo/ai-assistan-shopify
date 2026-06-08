---
applyTo: "**/*.{liquid,js,ts,jsx,tsx}"
---

# Shopify Security Standards — OWASP + Platform-Specific

## Injection Prevention

- **XSS**: Never render unescaped user content — always `| escape` in Liquid; `encodeURIComponent()` in JS
- **Script injection**: Never construct `<script>` content from dynamic values; use `| json` filter for data islands
- **SQL / SOQL**: Not applicable in Liquid; in app backend, always use parameterized queries (Prisma, Knex, etc.)
- **SSRF**: Never fetch URLs constructed from user input without an allowlist

## Shopify API Security

- **Webhook verification**: Always verify `X-Shopify-Hmac-Sha256` header — reject unverified webhooks with 401
- **OAuth**: Never expose `client_secret`; validate `state` parameter to prevent CSRF
- **App Proxy**: Validate `signature` query param on every proxied request
- **Session tokens**: Embedded apps must use token exchange to acquire access tokens — App Bridge automatically handles session tokens; never roll your own auth or use authorization code grant for embedded apps
- **Scopes**: Request only minimum required API scopes — document justification for each

## Data Handling

- **PII**: Never log customer email, phone, or address — mask or omit in all logs
- **Payment data**: Never handle raw card data — Shopify Payments / Checkout handles this
- **Metafields**: Use the app-reserved namespace (`$app` in queries, or omit namespace to default to it) for sensitive app data — the legacy `app--*` prefix convention is deprecated; public metafields only for display data
- **Theme files**: `config/settings_data.json` may contain merchant config — never expose via API response

## Secrets Management

- No hardcoded tokens, API keys, or passwords in any committed file
- `.env` file must be in `.gitignore` — verify before first commit
- Rotate tokens immediately if accidentally committed
- Never log `process.env` objects wholesale

## Content Security

- Set `Content-Security-Policy` headers in app server responses
- **`frame-ancestors` (required for App Store submission)**:
  - Embedded apps: set dynamically per shop — `Content-Security-Policy: frame-ancestors https://{shop}.myshopify.com https://admin.shopify.com;`
  - Non-embedded apps: `Content-Security-Policy: frame-ancestors 'none';`
  - Never use a static `X-Frame-Options: DENY` on embedded routes — it blocks the Shopify admin iframe
- `X-Content-Type-Options: nosniff` on all responses
- Avoid `eval()` and `new Function()` in any JavaScript

## Dependency Security

- Run `npm audit` / `yarn audit` before shipping
- Pin major versions in `package.json`; never use `*` or `latest`
- Review any package with access to `document.cookie` or `localStorage`
