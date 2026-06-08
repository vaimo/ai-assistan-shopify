---
name: detect-context
description: Detect Shopify project type from codebase signals and select the correct Shopify AI Toolkit skills for the session
---

Detect the Shopify project type by inspecting the codebase. Follow these steps exactly:

## Step 1 — Scan for signals

Check for the presence of these files and directories:

| Signal | What to look for |
|--------|-----------------|
| Theme | `*.liquid` files anywhere in the project; `config/settings_schema.json`; `layout/theme.liquid` |
| App | `shopify.app.toml`; `web/` or `app/` directory; `extensions/` with non-theme content |
| Hydrogen | `hydrogen.config.js` or `hydrogen.config.ts`; `remix.config.js` with `@shopify/hydrogen` in `package.json` |
| Functions | `extensions/*/shopify.extension.toml` with `type = "function"` |
| Checkout extensions | `extensions/*/shopify.extension.toml` with a checkout target |
| Monorepo | Multiple signals above present simultaneously |

## Step 2 — Classify the project

Based on signals found, classify as one or more of:

- `theme` — Liquid theme, Online Store 2.0
- `app` — Shopify app (Remix, Express, Rails)
- `hydrogen` — Headless React/Remix storefront
- `functions` — Shopify Functions
- `extensions` — Checkout, admin, or customer account extensions
- `monorepo` — Multiple types in one repo

## Step 3 — Select toolkit skills

Map the detected type(s) to Shopify AI Toolkit skills:

| Detected type | Primary skills | Validation tool |
|---------------|---------------|-----------------|
| `theme` | `shopify-liquid`, `shopify-custom-data` | `validate_theme` |
| `app` | `shopify-admin`, `shopify-polaris-admin-extensions` | `validate_graphql_codeblocks` |
| `hydrogen` | `shopify-hydrogen`, `shopify-storefront-graphql` | `validate_component_codeblocks` |
| `functions` | `shopify-functions` | `validate_graphql_codeblocks` |
| `extensions` (checkout) | `shopify-polaris-checkout-extensions` | `validate_component_codeblocks` |
| `extensions` (admin) | `shopify-polaris-admin-extensions` | `validate_component_codeblocks` |
| `extensions` (customer account) | `shopify-polaris-customer-account-extensions` | `validate_component_codeblocks` |
| `monorepo` | All applicable skills above, selected per task | All applicable tools |

For any type not matched above, fall back to `shopify-dev`.

## Step 4 — Output a context summary

Respond with this block so every agent in the session knows the active context:

```
## Active Project Context

**Type**: {detected type(s)}
**Primary skills**: {skill names}
**Validation tools**: {tool names}
**Key paths**:
  - Theme: {path or "not present"}
  - App: {path or "not present"}
  - Hydrogen: {path or "not present"}
  - Extensions: {path or "not present"}
**Package manager**: {npm | yarn | pnpm} (detected from lockfile)
**Node version**: {from .nvmrc or package.json engines field, or "not specified"}
```

This context applies for the rest of the session. All agents should use the primary skills listed above without needing to re-detect.
