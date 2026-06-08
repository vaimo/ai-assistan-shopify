---
name: liquid-review
description: Deep Liquid template review — schema, escaping, performance, and Dawn conventions
---

# /liquid-review — Shopify Liquid Deep Review

## When to Use

For thorough review of sections, snippets, or templates before deploying to a live store.

## Usage

```
/liquid-review sections/my-section.liquid
/liquid-review templates/
```

## Review Dimensions

### Schema Quality
- `name` is merchant-friendly (not developer jargon)
- All settings have `label` and `info` where helpful
- Settings grouped logically with `"type": "header"` dividers
- At least one `preset` with sensible defaults
- `max_blocks` set where unlimited blocks would break layout
- Block types have clear `name` values

### Output Safety
- Every `{{ variable }}` in HTML context has appropriate filter
- `{{ variable | json }}` used inside `<script>` tags
- No `| raw` on untrusted sources
- Form fields: `{{ form.errors | default_errors }}` present

### Snippet Architecture
- `{% render %}` used (not `{% include %}`)
- All variables explicitly passed — no implicit scope reliance
- Snippet has a comment header describing its purpose and expected variables

### Internationalisation
- All visible strings use `{{ 'key' | t }}`
- Translation keys follow `sections.{section_name}.{key}` convention
- Plural forms handled with `| t: count: n`

### Accessibility
- Images: `alt="{{ image.alt | escape }}"` — never empty unless intentionally decorative
- Links: descriptive text or `aria-label`
- `<button>` not `<div>` for interactive elements
- Focus styles present on all interactive elements

### Dawn / OS 2.0 Conventions
- `content_for_header` placed in `<head>` (theme.liquid)
- `content_for_layout` placed in `<main>` (theme.liquid)
- Color scheme classes applied via `section.settings.color_scheme`
- Animation attributes (`data-cascade`, etc.) follow Dawn patterns if using Dawn base

## Output Format

```
## Liquid Review: {filename}

### Schema: {PASS|WARN|FAIL}
{findings}

### Output Safety: {PASS|WARN|FAIL}
{findings}

### Snippet Architecture: {PASS|WARN|FAIL}
{findings}

### i18n: {PASS|WARN|FAIL}
{findings}

### Accessibility: {PASS|WARN|FAIL}
{findings}

### Fixed Code
{corrected version of any FAIL sections}
```
