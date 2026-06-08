---
applyTo: "**/shopify.app.toml"
---

# Shopify App Configuration — `shopify.app.toml` Standards

## API Version

- Always pin `api_version` explicitly — never omit it
- Use the current stable version (`2026-04`) — update quarterly when Shopify releases new versions
- Test API version upgrades in a development store before changing in production
- The same `api_version` should be used consistently across `shopify.app.toml`, webhook registrations, and GraphQL client configuration

```toml
api_version = "2026-04"
```

## Scopes

- Declare only the **minimum required scopes** — request additional scopes only when a feature genuinely needs them
- Document the justification for each scope in a comment above it
- Never request `write_*` scopes when `read_*` is sufficient
- Common scope pairs: `read_products` / `write_products`, `read_orders` / `write_orders`, `read_customers` / `write_customers`

```toml
[access.scopes]
# Required to read order data for loyalty points calculation
# Required to update customer metafields with points balance
scopes = "read_orders,read_customers,write_customers"
```

- If scopes change after app installation, Shopify will prompt merchants to re-authorise — minimise scope changes post-launch

## Auth & Redirect URLs

- Always include `localhost` redirect URLs for local development — remove before submitting to the App Store
- Production redirect URLs must be HTTPS
- The `application_url` must be the root of your embedded app — Shopify loads this in the admin iframe

```toml
application_url = "https://your-app.fly.dev"

[auth]
redirect_urls = [
  "https://your-app.fly.dev/auth/callback",
  "https://your-app.fly.dev/auth/shopify/callback",
  "http://localhost:3000/auth/callback",
]
```

## Webhooks

- Register mandatory GDPR webhooks under `[webhooks.privacy_compliance]` — required for App Store approval
- Pin `api_version` on each webhook topic separately — must match the app's API version

```toml
[webhooks]
api_version = "2026-04"

  [webhooks.privacy_compliance]
  customer_data_request_url = "https://your-app.fly.dev/webhooks/gdpr/customer-data-request"
  customer_deletion_url = "https://your-app.fly.dev/webhooks/gdpr/customer-redact"
  shop_deletion_url = "https://your-app.fly.dev/webhooks/gdpr/shop-redact"
```

## Metafield Definitions

- Declare all app-owned metafield definitions here — do not create them via Admin API mutations
- Pin `namespace = "app"` — Shopify resolves this to the app-reserved namespace on deploy

```toml
[[customer.metafields]]
namespace = "app"
key = "loyalty_points_balance"
type = "number_integer"
name = "Loyalty Points Balance"
```

## Extensions

- Each extension is registered under `[[extensions]]` — one block per extension
- `handle` must be unique, kebab-case, and stable — changing it after deploy creates a new extension
- `type` must match the Shopify-defined extension type exactly
- Always include a `name` — it is merchant-visible in the Shopify admin

```toml
[[extensions]]
type = "ui_extension"
name = "Loyalty Points Redemption"
handle = "loyalty-points-redemption"
```

## Protected Customer Data

- If your app accesses protected customer fields (name, email, phone, address), declare it explicitly
- Undeclared access to protected fields will be rejected by the Shopify security review

```toml
[access]
customer_data_collected = false  # set true only if app stores customer PII

[access.customer]
direct_api_mode = "offline"
```

## Distribution

- `distribution = "app_store"` for public apps submitted to the Shopify App Store
- `distribution = "custom"` for private/custom apps installed on specific stores
- Never commit `client_secret` — it is managed by Shopify CLI and stored in environment variables only

## Development Workflow

- Run `shopify app deploy` to push config changes (scopes, metafield definitions, extension registration) to Shopify
- Run `shopify app dev` for local development — it handles auth, tunnelling, and hot reload
- After changing scopes, re-install the app on your development store to trigger re-authorisation
- Use `shopify app env pull` to sync environment variables from Shopify to your local `.env`
