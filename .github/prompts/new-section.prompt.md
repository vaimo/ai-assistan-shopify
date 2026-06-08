---
name: new-section
description: Scaffold a new Shopify section — detects project type, auto-detects design system, generates Liquid or React component with schema, i18n, and template entry
---

Scaffold a new section based on the user's description.

## Step 1 — Detect project type

Check which project type is active:

| Signal | Type | Scaffold target |
|--------|------|-----------------|
| `*.liquid` files, `layout/theme.liquid` | Theme | Liquid section + JSON schema + locale keys |
| `@shopify/hydrogen` in `package.json` | Hydrogen | React component + loader + route entry |
| Both present | Monorepo | Ask which target |

If ambiguous, ask the user before proceeding.

## Step 2 — Detect design system

Check the project for a CSS framework:

| Detection method | Framework |
|-----------------|-----------|
| `tailwindcss` in `package.json` dependencies | Tailwind CSS |
| `daisyui` in `package.json` dependencies or `@plugin "daisyui"` in CSS | DaisyUI (on Tailwind) |
| `bootstrap` in `package.json` dependencies | Bootstrap |
| `@shopify/polaris` in `package.json` dependencies | Polaris |
| None of the above | Plain semantic HTML + CSS custom properties |

Use the detected framework's component classes in the generated markup. If no framework is detected, use plain semantic HTML with CSS custom properties.

## Step 3 — Generate scaffold (Theme)

For **theme** projects, create these files:

### `sections/{section-name}.liquid`

```liquid
{%- comment -%}
  Section: {Section Name}
  {Brief description from user input}
{%- endcomment -%}

<div class="section-{{ section.id }}">
  {Markup using detected design system classes}
  {All visible text via {{ 'sections.{section_name}.{key}' | t }}}
  {Settings from section.settings}
  {Blocks via {% for block in section.blocks %}...{% endfor %} if applicable}
</div>

{% schema %}
{
  "name": "t:sections.{section_name}.name",
  "tag": "section",
  "class": "section-{section-name}",
  "settings": [
    {merchant-configurable settings inferred from description}
  ],
  "blocks": [
    {block types if user described repeatable items}
  ],
  "presets": [
    {
      "name": "t:sections.{section_name}.name"
    }
  ]
}
{% endschema %}
```

**Schema rules:**
- Every setting has `label` using `t:` translation key
- Use `info` for non-obvious settings
- Group related settings with `header` type
- Add `presets` so the section is available in the theme editor
- Set `max_blocks` when the design has a natural limit

### `locales/en.default.json` (merge)

Add keys under the `sections.{section_name}` namespace:
```json
{
  "sections": {
    "{section_name}": {
      "name": "{Section Name}",
      "{key}": "{default text}"
    }
  }
}
```

### `locales/en.default.schema.json` (merge)

Add schema translation keys:
```json
{
  "sections": {
    "{section_name}": {
      "name": "{Section Name}",
      "settings": {
        "{setting_id}": {
          "label": "{Setting Label}"
        }
      }
    }
  }
}
```

### `templates/*.json` (merge — if user specifies which template)

Add the section to the relevant JSON template's `sections` object.

## Step 4 — Generate scaffold (Hydrogen)

For **Hydrogen** projects, create:

### `app/components/{SectionName}.tsx`

```tsx
import type { FC } from 'react';

interface {SectionName}Props {
  {props inferred from description}
}

export const {SectionName}: FC<{SectionName}Props> = ({destructured props}) => {
  return (
    <section>
      {Markup using detected design system classes}
    </section>
  );
};
```

### Route loader update (if user specifies a page)

Add the component import and any required Storefront API query to the relevant route loader.

## Step 5 — Output summary

After generating files, output:

```
## Section Scaffold: {section-name}

### Files created
- `sections/{section-name}.liquid` — section markup + schema
- `locales/en.default.json` — added {n} translation keys
- `locales/en.default.schema.json` — added schema labels

### Settings
{table of settings: id | type | default}

### Blocks
{table of block types: type | settings}

### Next steps
- Preview in theme editor: the section appears under "{Section Name}" in the theme customiser
- Add content and adjust settings
- Run `/review` to validate the generated code
```
