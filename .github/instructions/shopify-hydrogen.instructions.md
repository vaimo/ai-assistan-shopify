---
applyTo: "**/*.{tsx,jsx,ts,js}"
---

# Shopify Hydrogen — Coding Standards

## Architecture

- Hydrogen is built on **React Router** (not Remix — migrated in 2024); use React Router v2+ patterns and APIs
- Three-layer stack: **Hydrogen** (Shopify components/utils) + **React Router** (routing, SSR, data loading) + **Oxygen** (hosting)
- Default project structure: `app/routes/` (routes), `app/components/` (UI), `app/lib/` (utilities), `app/graphql/` (queries)
- Fetch all Shopify API data in **loader functions** — never fetch Shopify APIs inside component bodies

## Data Fetching

- Use `context.storefront.query()` for Storefront API requests
- Use `context.customerAccount.query()` for Customer Account API — never cache this data
- Always use `useLoaderData()` in components — never call APIs client-side with `useEffect`
- Name all GraphQL operations: `query GetProduct($handle: String!) { ... }`
- Tag query strings with `#graphql` for type generation and syntax highlighting: `` const QUERY = `#graphql query...` ``
- Always check for errors from Customer Account API: `if (errors?.length || !data) throw new Error(...)`

## Caching

- Storefront API responses are cached by default — always be explicit about the strategy per query
- `storefront.CacheLong()` — infrequently changing data (products, collections, pages, navigation)
- `storefront.CacheShort()` — frequently changing data (inventory, availability, pricing)
- `storefront.CacheNone()` — mandatory for any customer-specific data (account pages, orders, wishlists)
- **NEVER** use a `public` Cache-Control header on routes that return customer-specific data — this exposes PII to other users via shared caches
- Customer Account API is never cached by default — do not add caching manually

| Strategy | Cache-Control | Effective Duration |
|----------|--------------|-------------------|
| `CacheLong()` | `public, max-age=3600, stale-while-revalidate=82800` | ~1 day _(values subject to change — verify in Shopify docs)_ |
| `CacheShort()` | `public, max-age=1, stale-while-revalidate=9` | ~10 seconds |
| `CacheNone()` | `no-store` | No cache |
| `CacheCustom()` | Custom | Custom |

## Oxygen Runtime Constraints

- Worker bundle: **10 MB** max compiled size _(verify against current Oxygen docs — subject to change)_
- Startup time: **400 ms** max _(subject to change)_
- CPU per request: **30 seconds** max
- Memory per request: **128 MB** max
- Outbound API requests must complete within **2 minutes**
- Only Web Standard APIs are available — no Node.js-specific modules (`fs`, `path`, etc.)
- Use `fetch`, `Cache`, `Streams`, `WebCrypto` — check the Oxygen runtime docs for the full supported list

## Shopify Hydrogen Components

- Use `@shopify/hydrogen` primitives — never build custom alternatives for standard patterns:
  - `Image` — always set explicit `width` and `height` to prevent Cumulative Layout Shift (CLS)
  - `Money` — always use for price display; never format currency amounts manually
  - `CartForm` — use for all cart mutations; wraps the React Router form pattern
  - `Analytics` — include on every page; required for Shopify analytics to function correctly
  - `getSeoMeta` — use to generate SEO meta tags consistently

## Routing

- Standard product URL format: `/products/:handle` — always provide a server-side 3XX redirect if using a custom structure
- Support Shopify cart permalinks (`/cart/*`) — required for Shopify-managed checkout integration
- Use loader + `useLoaderData()` for initial page data — never `useEffect` + fetch
- Actions (`action` function) handle form submissions and mutations server-side

## Environment Variables

- Pull env vars after linking: `npx shopify hydrogen env pull` (requires `npx shopify hydrogen link` first)
- Required variables: `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, `SESSION_SECRET`
- `PRIVATE_STOREFRONT_API_TOKEN` — server-only token for queries that must not be exposed to the client
- `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` + `PUBLIC_CUSTOMER_ACCOUNT_API_URL` — required for Customer Account API
- Never commit `.env` — verify it is in `.gitignore` before the first push

## Deployment

- Deploy to Oxygen: `npx shopify hydrogen deploy`
- Always deploy to the **Preview** environment first — never promote directly to Production without review
- Oxygen is available on Basic plan and above — not available on Starter plans; verify current development store availability in Shopify docs
- Do not use proxies in front of Oxygen deployments — they conflict with bot mitigation and cause SEO issues
