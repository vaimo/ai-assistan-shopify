---
name: accessibility
description: WCAG 2.1 AA audit and auto-remediation for Shopify themes and app UI
---

# /accessibility — WCAG 2.1 AA Audit & Remediation

## When to Use

Before any public launch, when a screen-reader bug is reported, or when Lighthouse accessibility score is below 90.

## Usage

```
/accessibility path/to/template-or-component
/accessibility          # audits all templates and sections
```

## Audit Checklist (WCAG 2.1 AA)

### Perceivable
- [ ] All non-text content has a text alternative (`alt`, `aria-label`, `aria-labelledby`)
- [ ] Decorative images: `alt=""` and `role="presentation"`
- [ ] Videos have captions; audio has transcripts
- [ ] Color is not the only means of conveying information
- [ ] Text contrast ≥ 4.5:1 (normal), ≥ 3:1 (large / UI components)
- [ ] Content reflows at 400% zoom without horizontal scroll

### Operable
- [ ] All functionality reachable via keyboard
- [ ] No keyboard traps (except intentional modal focus traps)
- [ ] Skip navigation link present (`<a href="#main-content">`)
- [ ] Focus order is logical and matches visual order
- [ ] Focus indicator is visible (`:focus-visible` styles)
- [ ] No content flashes more than 3 times per second
- [ ] Moving / auto-updating content can be paused

### Understandable
- [ ] `lang` attribute set on `<html>` element
- [ ] `<title>` is unique and descriptive per page
- [ ] Error messages identify the field and describe how to fix it
- [ ] Labels associated with every input (`<label for>` or `aria-label`)

### Robust
- [ ] Valid HTML — no duplicate IDs, properly nested elements
- [ ] ARIA roles used correctly (no `role="button"` on `<a>`)
- [ ] Live regions (`aria-live`) for dynamic content updates
- [ ] Custom components implement full ARIA pattern (e.g. modal, tabs, accordion)

## Shopify-Specific Patterns

### Cart / Drawer
- `aria-modal="true"` on drawer `<dialog>` or wrapper
- Focus moves to drawer on open; returns to trigger on close
- `aria-live="polite"` region for cart count updates

### Product Form
- `aria-required="true"` on required variant selectors
- Error state: `aria-invalid="true"` + `aria-describedby` pointing to error message
- Quantity input: `aria-label="Quantity"` or associated `<label>`

### Search
- `role="combobox"` + `aria-expanded` on search input
- Results list: `role="listbox"` with `role="option"` items
- Announce result count to screen readers via `aria-live`

## Auto-Fix

For common, safe-to-fix issues, output corrected code:
- Missing `alt` attributes (with suggested text from filename/context)
- Missing `<label>` associations
- `<div>` buttons replaced with `<button>`
- `outline: none` replaced with `:focus-visible` equivalent

## Output Format

```
## Accessibility Audit: {path}

Lighthouse Accessibility Score (estimated): {N}/100

### Critical (must fix — blocks compliance)
{findings with line references and fix}

### Major (should fix — impacts screen reader users)
{findings}

### Minor (consider — best practice)
{findings}

### Auto-Fixed Code
{corrected snippets}
```
