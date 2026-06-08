---
name: architecture-diagram
description: Create professional solution architecture diagrams as both React/TSX components and standalone SVG files. Top-to-bottom layered flow with colored clusters, orthogonal arrows, inline logos, and integration rows. Designed for consulting presentations — NOT for developers.
---

# Solution Architecture Diagram Skill

Create clean, professional architecture diagrams as inline SVG inside React/TSX components **and** as standalone `.svg` files. Designed for client-facing consulting presentations — non-technical audience.

## When to use

Trigger when the user asks to create an architecture diagram, system diagram, solution overview, platform diagram, or technical proposal visualization.

## Core design principles

1. **Consulting audience first** — assume non-technical stakeholders. No jargon. Use business value language.
2. **Top-to-bottom flow** — layers stack vertically: Channels → App Layer → Capabilities → Services → Systems of Record
3. **No duplicate boxes** — show each service once, use arrows to connect
4. **Every box needs a logo** — use inline SVG logos for every platform/service. No text-only boxes.
5. **Color-coded layers** — each architectural layer gets a distinct color
6. **Systems of Record OUTSIDE** the hosting wrapper — external integrations are separate from your platform

## Layout pattern (follow the Saka RFP reference)

```
┌───────────── ENGAGEMENT CHANNELS (gray) ─────────────────────────┐
│  [Logo] B2B Portal     [Logo] B2C Store     Mobile    Future     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌─── HOSTING WRAPPER (green border, e.g. "Vaimo Cloud / GCP") ────┐
│                                                                   │
│  ┌─── APPLICATION LAYER (green bar) ────────────────────────────┐│
│  │ [Logo] Next.js — Server Components Layer         NEW         ││
│  └──────────────────────────────────────────────────────────────┘│
│                      ↓ dotted lines                               │
│  ┌─── BUSINESS CAPABILITIES (white boxes with colored headers) ─┐│
│  │ B2B Ordering │ B2C Shopping │ Content │ Payments │ Auth      ││
│  │ ▸ item       │ ▸ item       │ ▸ item  │ ▸ item   │ ▸ item   ││
│  └──────────────────────────────────────────────────────────────┘│
│                      ↓ dotted lines                               │
│  ┌─── MIDDLEWARE / BFF (purple bar) ────────────────────────────┐│
│  │ [Logo] BFF Name · Hooks + Interceptors · Backend-agnostic   ││
│  │ "Customize business logic without changing the backend"  NEW ││
│  └──────────────────────────────────────────────────────────────┘│
│                      ↓ labeled arrows (REST, API)                 │
│  ┌─── SERVICES (side by side boxes) ────────────────────────────┐│
│  │ [Logo] Commerce  │ [Logo] CMS ?  │ [Logo] Search │ Scripts  ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
                              ↓ single arrow (APIs)
┌─── SYSTEMS OF RECORD (blue, OUTSIDE hosting wrapper) ────────────┐
│ [icon] ERP │ [icon] PIM │ [icon] Pay │ [icon] Ship │ [icon] CRM │
└──────────────────────────────────────────────────────────────────┘
```

## Key layout rules

- **Engagement Channels**: Split into separate boxes per channel (B2B, B2C, Mobile, Future)
- **Business Capabilities**: Use colored header bars on each box. List 3-5 bullet items per capability using ▸ prefix
- **Platform bars** (Next.js, BFF): Full-width colored rectangles with logo, title, description, and NEW badge
- **Services row**: Side-by-side boxes for Commerce, CMS, Search, Scripts
- **Systems of Record**: OUTSIDE the hosting wrapper. One cluster box with all external integrations as individual boxes with icons
- **Arrows**: Commerce service → Systems of Record (single arrow labeled "APIs"). BFF → Services (labeled REST/API). Use dotted lines between layers, solid arrows for data flow.

## Color palette

| Layer | Border | Background | Node fill | Node border |
|-------|--------|------------|-----------|-------------|
| Channels | `#6b7280` | `#f9fafb` | white | varies |
| Hosting wrapper | `#22c55e` @0.3 | white | — | — |
| App layer (Next.js) | `#86efac` | `#dcfce7` | — | — |
| Capabilities | varies per cap | white | white | per-cap color |
| BFF/Middleware | `#a78bfa` | `#ede9fe` | — | — |
| Backend (keep) | `#fca5a5` | `#fee2e2` | `#fee2e2` | `#fca5a5` |
| Backend (new) | `#a78bfa` | `#ede9fe` | `#ede9fe` | `#a78bfa` |
| CMS (decision) | `#fcd34d` | `#fffbeb` | white | `#fcd34d` |
| Systems of Record | `#2563eb` | `#eff6ff` | white | `#93c5fd` |

### Capability box colors (header tints)
- B2B: `#fca5a5` (red)
- B2C: `#86efac` (green)
- Content: `#fcd34d` (amber)
- Payments: `#93c5fd` (blue)
- Auth: `#c4b5fd` (purple)

## Badges

- `NEW` — green, right-aligned in platform bars
- `KEEP` — gray, for retained components
- `?` — amber, for pending decisions (e.g., CMS choice)

## Arrow rules

- **Between layers**: Use dotted lines (strokeDasharray="3,3") — these are structural, not data flow
- **Data flow arrows**: Use VArrow with labels (REST, API, APIs) — solid or dashed
- **Commerce → CMS**: Horizontal dashed arrow (content feeds into commerce)
- **Commerce → Systems of Record**: Single arrow to the whole cluster (not individual boxes)
- **Render arrows LAST** in SVG so they appear on top of everything
- Logos must also render AFTER their parent Node box to appear on top

## SVG primitives

Reuse `src/components/DiagramPrimitives.tsx` with:

```tsx
// Layout
Cluster({ x, y, w, h, label, color, bg, dashed? })
Node({ x, y, w, h, title, sub?, fill, border, text, badge? })

// Arrows
ArrowDef()  // <defs> with marker + filter
VArrow({ x, y1, y2, label?, dashed? })
HArrow({ x1, x2, y, label?, dashed? })
OrthoArrow({ x1, y1, x2, y2, label?, dashed?, midX? })
Arrow({ x1, y1, x2, y2, label?, dashed? })  // diagonal/freeform

// Brand logos (SVG inline, from DiagramPrimitives.tsx)
AdobeLogo, MagentoLogo, NextLogo, MedusaIcon, ShopifyIcon,
FastifyIcon, SanityIcon, ContentfulIcon, PayloadIcon,
AkeneoIcon, AlgoliaIcon, VaimoLogo, StoeckliLogo

// Generic category icons
ERPIcon, PaymentIcon, ShippingIcon, CRMIcon, SearchIcon

// Special
CMSDecisionBox  // pre-built amber CMS decision box
```

## How to find logos

1. **Simple Icons CDN** (first choice):
   ```
   https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/{name}.svg
   ```
   Use WebFetch to get the `d=""` path. Names: `magento`, `nextdotjs`, `shopify`, `algolia`, `sanity`, `contentful`, `payloadcms`, `fastify`, `adobe`.

2. **Client websites**: Fetch logo SVG directly (e.g., `https://example.com/.../logo.svg`).

3. **Generic icons**: PaymentIcon (credit card), ShippingIcon (truck), ERPIcon (grid), CRMIcon (person), SearchIcon (magnifying glass).

### Logo render pattern
```tsx
// Render logos AFTER their parent Node so they appear on top
<Node x={22} y={50} w={200} h={38} title="Next.js" ... />
<NextLogo x={26} y={54} s={14} />  {/* ON TOP of the node */}
```

## Text rules

- Font: `Inter, system-ui, sans-serif` everywhere
- Platform bar titles: 9.5px bold
- Capability titles: 8px bold, centered in colored header
- Capability items: 7px, `▸` prefix, `#6b7280`
- Subtitles/descriptions: 7-7.5px, `#9ca3af`
- Cluster labels: 7-8px, uppercase, letter-spacing 0.04-0.06em
- **One-line explanations** below technical boxes in plain English
- Business value language: "cut costs", "zero migration", "no vendor lock-in"

## ViewBox sizing

- Width: 820-860px
- Height: 500-540px for full diagram
- Channels: ~56px
- Hosting wrapper: ~310px (contains app layer + capabilities + BFF + services)
- Systems of Record: ~110px
- Spacing between sections: 10px

## Bottom summary bar

Always add below the SVG:
```tsx
<div className="mt-4 grid grid-cols-5 gap-3 rounded-xl border border-border bg-surface p-3 text-center">
```
With 4-5 key business takeaways (label + 2 short lines each).

## Reference implementation

See these files for the canonical pattern:
- `src/components/NexusDiagram.tsx` — Option 1 (Adobe Commerce OS + Nexus)
- `src/components/MedusaDiagram.tsx` — Option 2 (Progressive Medusa)
- `src/components/ShopifyDiagram.tsx` — Option 3 (Shopify Plus)
- `src/components/DiagramPrimitives.tsx` — All shared SVG primitives and logos
- `rfp/litetronics_3/poc/architecture-diagram.svg` — Standalone SVG reference (Litetronics)

## Standalone SVG output (MANDATORY)

After creating the React/TSX diagram component, you **MUST** also produce a standalone `.svg` file and place it in the POC folder at:

```
rfp/{client-name}/poc/architecture-diagram.svg
```

### SVG conversion rules

1. **Inline everything** — the `.svg` file must be self-contained with zero external dependencies. No React, no JSX, no imports.
2. **Expand all primitives** — replace `Cluster`, `Node`, `VArrow`, `HArrow`, `ArrowDef`, and all icon components with their raw SVG equivalents (`<rect>`, `<line>`, `<text>`, `<g>`, `<path>`, etc.).
3. **JSX → SVG attribute mapping** — convert all camelCase JSX attributes to kebab-case SVG attributes:
   - `strokeWidth` → `stroke-width`
   - `strokeDasharray` → `stroke-dasharray`
   - `fillOpacity` → `fill-opacity`
   - `strokeOpacity` → `stroke-opacity`
   - `strokeLinecap` → `stroke-linecap`
   - `textAnchor` → `text-anchor`
   - `fontSize` → `font-size`
   - `fontWeight` → `font-weight`
   - `fontFamily` → `font-family`
   - `letterSpacing` → `letter-spacing`
   - `markerEnd` → `marker-end`
4. **XML declaration** — start the file with `<?xml version="1.0" encoding="UTF-8"?>`.
5. **Font declaration** — add `style="font-family:Inter,system-ui,sans-serif"` on the root `<svg>` element.
6. **Keep the same viewBox** — use the identical `viewBox` as the TSX version.
7. **Inline `<defs>`** — copy the `ArrowDef` marker and filter definitions directly into a `<defs>` block.
8. **Inline all logos** — expand every icon component (`ShopifyIcon`, `AlgoliaIcon`, `Auth0Icon`, `CeligoIcon`, etc.) into their `<g transform="...">` + `<path>` equivalents. Use the same scale transforms.
9. **No wrapper HTML** — the SVG file contains ONLY the `<svg>` element and its children. No `<div>`, no `Section`, no `DiagramExport`, no summary bar (those are React-only).
10. **Verify the output** — the SVG should render identically to the TSX version when opened in a browser.

### Workflow

```
1. Build the React/TSX diagram first (architecture-diagram.tsx)
2. Create the standalone SVG by expanding all React components into raw SVG
3. Place at rfp/{client-name}/poc/architecture-diagram.svg
4. Verify both files exist
```
