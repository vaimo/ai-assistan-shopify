---
applyTo: "**/*.{css,scss,sass}"
---

# Shopify Theme CSS & Styling Standards

## Architecture

- Use CSS custom properties (variables) for all design tokens — never hardcode colors, spacing, or font sizes
- Define tokens in `assets/base.css` or a dedicated `tokens.css` — import first in theme
- Follow BEM naming convention for component classes: `.block__element--modifier`
- Avoid deep nesting (max 3 levels); prefer flat, composable classes

## Shopify Theme Settings Integration

- Expose merchant-configurable values as CSS custom properties — use `{% style %}` tags for color settings that must live-update in the theme editor; use inline `style` attributes for other dynamic values (e.g. `<div style="--gap: {{ block.settings.gap }}px">`)
- Example in `{% style %}`: `--color-primary: {{ section.settings.color_primary }};`
- Use `color_scheme` setting type for color scheme switching — never roll custom color pickers for this

## Responsive Design

- Mobile-first: base styles for mobile, `@media (min-width: ...)` for larger breakpoints
- Breakpoints: 750px (tablet), 990px (desktop), 1200px (wide) — align with Dawn theme conventions
- Never use `!important` except to override third-party styles (document why)
- Test at 320px minimum viewport width

## Performance

- Avoid `@import` in CSS — use `{{ 'file.css' | asset_url | stylesheet_tag }}` in Liquid
- Critical CSS: inline above-the-fold styles in `<head>`; defer non-critical sheets
- `will-change`: use sparingly and only with a specific property; remove after animation
- Avoid universal selectors (`*`) in production styles

## Accessibility

- Minimum contrast ratio: 4.5:1 for normal text; 3:1 for large text (WCAG 2.1 AA)
- Never use `outline: none` without providing an equivalent `:focus-visible` style
- `:focus-visible` styles must be visible and distinct — not just a color change
- Respect `prefers-reduced-motion`: wrap animations in `@media (prefers-reduced-motion: no-preference)`

## Animations

- Prefer `transform` and `opacity` for animations — avoid properties that trigger layout
- Entrance animations: max 300ms; micro-interactions: max 150ms
- Provide `prefers-reduced-motion` fallback for all animations
