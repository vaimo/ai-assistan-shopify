---
applyTo: "extensions/**/*.{tsx,jsx,ts,js}"
---

# Shopify Extensions — Coding Standards

## Checkout UI Extensions

### Runtime & Rendering

- Extensions run in an **isolated sandbox** via Remote DOM — they do NOT have access to the real checkout page DOM
- UI is declared with **Shopify web components**: `<s-banner>`, `<s-text>`, `<s-button>`, `<s-stack>`, `<s-image>`, `<s-heading>`, `<s-badge>`, etc.
- Extensions **cannot** render arbitrary HTML — no `<div>`, `<script>`, `<iframe>`, `<style>`, or any non-Shopify element
- No access to sensitive payment information or the checkout page assets (HTML, CSS, JS)
- CSS **cannot** be overridden — all web components automatically inherit the merchant's branding

### Framework

- **Preact is the default** — do NOT use React in checkout extensions; use Preact imports only
- Use Preact hooks from `preact/hooks`: `useState`, `useEffect`, `useRef`, `useMemo`
- Use **Preact Signals** for reactive state — APIs that return a `value` property are Signals; Preact auto-rerenders when they change
- Access checkout state via the global `shopify` object: `shopify.shippingAddress.value`, `shopify.lines.value`, `shopify.cost.totalAmount.value`

### Bundle Size

- Compiled extension bundle: **64 KB maximum** — enforced at deploy time; build will fail if exceeded
- Never import large third-party libraries — use only what Shopify exposes via the `shopify` global and `@shopify/ui-extensions`
- Use named imports, not barrel imports: `import {Banner} from '@shopify/ui-extensions/checkout'` not `import * as ext from ...`
- Analyse bundle size with `shopify app build` before deploying

### Extension APIs

- Access cart costs: `shopify.cost.totalAmount.value`, `shopify.cost.subtotalAmount.value`
- Access cart lines: `shopify.lines.value` (array of cart line items)
- Mutations require explicit API permissions declared in `shopify.extension.toml` under `capabilities`
- Extensions with access to protected customer data must submit a Shopify application and pass security review

### Plan Requirements

| Extension surface | Minimum plan |
|-------------------|-------------|
| Information, Shipping, Payment step extensions | Shopify Plus |
| Thank You and Order Status extensions | All plans |
| Block targets (`purchase.checkout.block.render`) | All plans |

### Configuration (`shopify.extension.toml`)

- Pin `api_version = "2026-01"` — always use the latest API version
- Declare targets in `[[extensions.targeting]]` with `target` and `module`
- Block targets render unconditionally; static targets are tied to specific checkout features (contact info, shipping, payment)
- Add `[extensions.capabilities]` to declare any special permissions (network access, protected customer data)

## Deprecations — Action Required

| Deprecated feature | Status | Migration |
|-------------------|--------|-----------|
| `checkout.liquid` (Information, Shipping, Payment) | **Sunset — August 13, 2024** | Migrate to Checkout UI extensions immediately |
| `checkout.liquid` (Thank You, Order Status) | Deprecated | Migrate to Checkout UI extensions |
| Additional scripts & script tags (Thank You/Order Status) | **Sunset — August 28, 2025** | Migrate to Checkout UI extensions |
| Shopify Scripts | **Sunset — August 28, 2025** | Migrate to Shopify Functions |

- **Never create new `checkout.liquid` customisations** — the feature is fully sunset for primary checkout steps
- Shopify Scripts have been sunset — migrate all remaining scripts to Shopify Functions immediately

## Theme App Extensions

- Render targets: keep minimal — one component per extension target
- Extensions inject into defined theme block targets only — cannot modify the base theme's markup or styles
- Do not rely on theme CSS — bundle your own styles within the extension
- Each extension should serve a single, focused purpose — do not combine unrelated features

## Admin UI Extensions

- Use Polaris web components for Admin UI extensions: `<s-page>`, `<s-section>`, `<s-text>`, `<s-button>`, `<s-select>`, etc. — the `@shopify/ui-extensions-react/admin` React import path is outdated
- Follow Polaris accessibility guidelines — all interactive elements require keyboard support and ARIA labels
- Admin extensions have access to Admin API data via the `shopify.data` APIs provided by the platform
- Extension targets in the admin are read-only by default — mutations require explicit capability declarations
