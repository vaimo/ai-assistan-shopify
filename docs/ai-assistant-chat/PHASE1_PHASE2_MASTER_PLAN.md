# Chat Assistant — Master Plan and Delivery Record

## Purpose
Track what was planned, what changed during implementation, and why decisions were made.

## Platform Constraint (Key)
Shopify does not allow third-party apps to inject a persistent floating button across all native admin pages.

Impact:
- Floating assistant is possible inside embedded app routes.
- Native admin pages require extension surfaces (actions/blocks), not global overlays.

## Current Architecture

```
Shopify Admin
├── Embedded app routes (/app/*)
│   └── Floating chat widget (FAB + sidebar)
│
├── Admin Action extension
│   └── Product details "More actions" entry
│
└── Admin Block extensions
        ├── Product details visible block
        ├── Order details visible block
        └── Customer details visible block

Shared mock endpoint
└── POST /api/chat (Remix resource route)
```

## Phase Status

### Phase 0 — Mock Chat API
Status: Completed.

What changed:
- Added `frontend/app/routes/api.chat.tsx`.

Why:
- Needed stable frontend contract before backend AI orchestration was ready.

### Phase 1 — Embedded App Floating Assistant
Status: Completed.

What changed:
- Added `frontend/app/components/ChatWidget/` components.
- Wired widget in `frontend/app/routes/app.tsx`.

Why:
- Fastest path to validate UX and chat interaction inside controlled iframe context.

### Phase 2 — Admin Extensions in Shopify Native UI
Status: In progress, delivered in increments.

What changed:
- Added admin action extension in `frontend/extensions/ai-assistant/` for product details.
- Added visible admin block extensions:
    - `frontend/extensions/ai-assistant-product-block/`
    - `frontend/extensions/ai-assistant-order-block/`
    - `frontend/extensions/ai-assistant-customer-block/`

Why changed from initial plan:
- Original approach expected multi-target action in one extension and React wrapper implementation.
- Real CLI/runtime behavior required:
    - One target per admin action/block extension in generated model.
    - Preact scaffold compatibility for stable CLI/build workflow.
- Merchant UX requirement demanded visible button-like entry outside "More actions", which is best served by admin blocks.

## Decisions Log

1. Keep embedded floating assistant.
Reason: best UX inside app surface and no platform restrictions.

2. Keep admin action extension for product details.
Reason: standard native flow and modal interaction entry.

3. Add 3 admin blocks (product/order/customer).
Reason: visible assistant entry on key pages without relying on "More actions".

4. Use mock endpoint for all surfaces.
Reason: consistent UI testing while backend AI is pending.

## Remaining Work

- Replace mock `/api/chat` with backend AI endpoint.
- Add robust auth verification path for extension-origin calls.
- Add per-surface context prompts and richer assistant actions.
- Add persistence/history and streaming responses.

## How To Extend Coverage

For each new page surface:
1. Generate a new admin action or admin block extension.
2. Set the target in `shopify.extension.toml`.
3. Reuse the same chat call contract to `/api/chat`.
