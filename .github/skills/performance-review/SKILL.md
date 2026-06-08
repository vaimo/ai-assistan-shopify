---
name: performance-review
description: Shopify storefront and app performance audit — Core Web Vitals, Liquid rendering, API efficiency
---

# /performance-review — Shopify Performance Audit

## When to Use

When a theme or app page feels slow, before a major release, or when Core Web Vitals scores are below target.

## Usage

```
/performance-review path/to/template-or-section
/performance-review     # reviews all templates
```

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| LCP | < 2.5s | > 4.0s |
| CLS | < 0.1 | > 0.25 |
| INP | < 200ms | > 500ms |
| TTFB | < 800ms | > 1800ms |
| Theme score (Lighthouse) | > 80 | < 50 |

## Audit Checklist

### Liquid Rendering

- [ ] No `all_products` access — use `collections` with handles
- [ ] Collections paginated with `paginate` tag (≤ 48 per page)
- [ ] No nested `{% for %}` loops over large datasets
- [ ] `{% render %}` snippets don't execute heavy logic in loops
- [ ] `{% cache %}` used for expensive computed sections (if available)

### Images & Media

- [ ] All images use `image_url` filter with explicit `width:` parameter
- [ ] `srcset` provided with at least 3 breakpoint sizes
- [ ] `loading="lazy"` on all below-fold images
- [ ] `width` and `height` attributes set to prevent CLS
- [ ] No uncompressed images > 200kb

### JavaScript

- [ ] Third-party scripts loaded with `defer` or `async`
- [ ] No render-blocking scripts in `<head>`
- [ ] Main thread not blocked during scroll / user interaction
- [ ] Web Workers used for heavy computation
- [ ] No unused JS bundles loaded on every page

### CSS

- [ ] No `@import` in stylesheets
- [ ] Critical CSS inlined for above-fold content
- [ ] No layout-triggering CSS animations

### API Efficiency

- [ ] GraphQL queries fetch only required fields
- [ ] Storefront API: `first:` limited to actual displayed count
- [ ] No N+1 patterns (loop with API call per iteration)
- [ ] Cart API: Section Rendering used instead of page reload
- [ ] Bulk operations used for large data sets

### Caching

- [ ] Static assets have far-future cache headers (CDN handles this for Shopify-hosted)
- [ ] Section data cached where appropriate
- [ ] App backend: response caching for non-personalised data

## Output Format

```
## Performance Review: {path}

### Estimated Impact
{summary of most impactful issues}

### Critical Issues
{issues likely causing > 500ms degradation}

### Recommendations
{issues with medium impact, prioritised}

### Quick Wins
{< 1 hour fixes with meaningful gain}
```
