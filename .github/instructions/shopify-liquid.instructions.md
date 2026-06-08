---
applyTo: "**/*.liquid"
---

# Shopify Liquid — Coding Standards

## Output & Escaping

- Always use `{{ value | escape }}` for any user-supplied or merchant-supplied string rendered in HTML context
- Use `{{ value | escape_once }}` when the value may already be partially escaped
- Use `{{ value | json }}` when embedding values in `<script>` tags
- **Never** use `{% raw %}...{% endraw %}` to wrap user-controlled content output — `raw` is a tag that outputs Liquid code as literal text, not a filter; there is no `| raw` filter in Shopify Liquid
- Metafield values: always pipe through `| escape` unless the metafield type is `rich_text` (use `| metafield_tag` instead)

## Performance

- Lazy-load images with `loading="lazy"` on all `<img>` tags below the fold
- Always use `image_url` filter with explicit `width:` for responsive images
- Use `srcset` with multiple widths: 360, 720, 1080, 1440 minimum
- `for` loops are limited to **50 iterations** — use `{% paginate %}` for arrays with more than 50 items; `paginate` page size can be 1–250
- Never use `all_products` in templates — use `collections` + handles

## Liquid Best Practices

- Use `{% liquid %}` tags for multi-line logic to reduce tag clutter
- Assign computed values to variables (`{% assign %}`) rather than recalculating inline
- Use `{% render %}` (not `{% include %}`) for all snippet inclusion
- Pass explicit variables to `{% render %}` — do not rely on scope inheritance
- Use `{% content_for 'blocks' %}` for dynamic section blocks (Shopify 2.0+) — there is no `{% blocks %}` tag

## Schema & Settings

- Every new section MUST have a `{% schema %}` block with `name` and `settings` — `class` is optional
- Add `"label"` and `"info"` to every setting for merchant clarity
- Group related settings with `"type": "header"` dividers
- Presets: always include at least one `preset` object with default values
- Limit: no more than 25 settings per section (merchant UX)

## Accessibility

- All `<a>` tags must have descriptive text or `aria-label`
- Buttons that only contain icons: add `aria-label` and `title`
- Images: `alt="{{ image.alt | escape }}"` — never leave alt empty unless decorative (`alt=""`)
- Form inputs: always pair with `<label for="...">` or `aria-label`
- Modals / drawers: manage focus trap and `aria-modal="true"`

## Internationalisation

- All user-visible strings must use `{{ 'key' | t }}` translation filters
- Never hardcode English strings in templates
- Currency: always use `{{ price | money }}` — never format manually
- Dates: use `{{ date | date: format }}` with locale-aware formats

## Deprecations

- **`checkout.liquid`** for Information, Shipping, and Payment checkout steps: **sunset August 13, 2024 — do not use**
- `checkout.liquid` for Thank You and Order Status pages: deprecated — migrate to Checkout UI extensions
- **Shopify Scripts**: sunset **August 28, 2025** — migrate to Shopify Functions before this date
- Never create new `checkout.liquid` customisations; use Checkout UI extensions instead
