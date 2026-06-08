---
applyTo: "**/*.{js,ts,jsx,tsx,mjs}"
---

# Shopify JavaScript & TypeScript Standards

## Module System

- Use ES modules (`import`/`export`) only — no CommonJS `require()` in frontend code
- Lazy-load heavy dependencies: `const { x } = await import('./module')`
- Tree-shake: import only what you use from libraries

## Shopify App Bridge (Embedded Apps)

- Always embed apps using the latest App Bridge — use the Shopify CLI scaffold which includes auth boilerplate
- **Token exchange is the recommended auth pattern**: session tokens authenticate incoming requests; exchange them for API access tokens via `@shopify/shopify-api` token exchange flow
- Use `shopify.idToken()` (ID Token API) to retrieve session tokens — `getSessionToken()` from `@shopify/app-bridge` is the App Bridge v2/v3 legacy approach; do not use in new apps
- Use Shopify managed installation (configured via `shopify.app.toml`) to avoid manual OAuth redirect handling
- Never use `window.location` redirects in embedded apps — use App Bridge navigation
- For in-app navigation use `<NavMenu>` and `<TitleBar>` from `@shopify/app-bridge-react`; for Admin navigation use the `open()` API — `Redirect.Action.APP` / `Redirect.Action.ADMIN_PATH` are App Bridge v2/v3 patterns and no longer exist
- Checkout UI extensions use **Preact** (not React) — do not import React packages in extension code

## Shopify Storefront API / AJAX API

- Use `fetch('/cart.json')` and AJAX Cart API for cart operations — never reload page
- Always handle rate limits: back off on 429 responses with exponential retry
- Section Rendering API: prefer over full page reloads for partial updates
- Storefront API: use typed GraphQL with `@shopify/storefront-api-client`

## React / Polaris (App UI)

- Use Shopify Polaris components — never build custom alternatives for standard patterns
- Polaris is now delivered as **web components** (`<s-page>`, `<s-section>`, `<s-text-field>`, `<s-form>`, `<s-button>`, etc.) — use these in Admin UI extensions and App Home; React Polaris components remain available for embedded app pages
- Follow Polaris accessibility guidelines — every interactive element needs keyboard support
- App state: use React Context or Zustand — avoid Redux unless already in project; React Router loader/action patterns handle most data needs without extra state management

## Performance

- Bundle size: warn if any single chunk exceeds 250kb gzipped
- Images: use `@shopify/hydrogen-react` image components or `<img>` with explicit dimensions
- Web Vitals: target LCP < 2.5s, CLS < 0.1, INP < 200ms
- Avoid blocking the main thread: heavy computations in Web Workers

## Error Handling

- All `async` functions must have `try/catch` with meaningful error messages
- API errors: log sanitized error (no PII) to console; surface user-friendly message in UI
- Never swallow errors silently (`catch (e) {}` is forbidden)
- Unhandled promise rejections must be caught at the top level

## TypeScript

- `strict: true` in `tsconfig.json` — no `any` without explicit comment justification
- Define types for all Shopify API response shapes
- Use `satisfies` operator for config objects to retain literal types
