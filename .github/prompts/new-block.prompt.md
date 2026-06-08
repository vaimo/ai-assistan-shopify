---
name: new-block
description: Scaffold a new Shopify theme block or Hydrogen component — detects project type, auto-detects design system, generates markup with schema and i18n
---

Scaffold a new reusable block based on the user's description.

## Step 1 — Detect project type

Check which project type is active:

| Signal | Type | Scaffold target |
|--------|------|-----------------|
| `*.liquid` files, `layout/theme.liquid` | Theme | Liquid block (`blocks/`) + schema + locale keys |
| `@shopify/hydrogen` in `package.json` | Hydrogen | React component (`app/components/`) |
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

Use the detected framework's component classes in the generated markup.

## Step 3 — Generate scaffold (Theme block)

For **theme** projects, create these files:

### `blocks/{block-name}.liquid`

```liquid
{%- comment -%}
  Block: {Block Name}
  {Brief description from user input}
{%- endcomment -%}

<div class="block-{{ block.id }}" {{ block.shopify_attributes }}>
  {Markup using detected design system classes}
  {All visible text via {{ 'blocks.{block_name}.{key}' | t }}}
  {Settings from block.settings}
</div>

{% schema %}
{
  "name": "t:blocks.{block_name}.name",
  "target": "section",
  "settings": [
    {settings inferred from description}
  ]
}
{% endschema %}
```

**Schema rules:**
- Every setting has `label` using `t:` translation key
- Use `info` for non-obvious settings
- Group related settings with `header` type
- Include `{{ block.shopify_attributes }}` on the outermost element for theme editor targeting

### `locales/en.default.json` (merge)

Add keys under the `blocks.{block_name}` namespace:
```json
{
  "blocks": {
    "{block_name}": {
      "name": "{Block Name}",
      "{key}": "{default text}"
    }
  }
}
```

### `locales/en.default.schema.json` (merge)

Add schema translation keys:
```json
{
  "blocks": {
    "{block_name}": {
      "name": "{Block Name}",
      "settings": {
        "{setting_id}": {
          "label": "{Setting Label}"
        }
      }
    }
  }
}
```

## Step 4 — Generate scaffold (Hydrogen component)

For **Hydrogen** projects, create:

### `app/components/{BlockName}.tsx`

```tsx
import type { FC } from 'react';

interface {BlockName}Props {
  {props inferred from description}
}

export const {BlockName}: FC<{BlockName}Props> = ({destructured props}) => {
  return (
    <div>
      {Markup using detected design system classes}
    </div>
  );
};
```

## Step 5 — Output summary

After generating files, output:

```
## Block Scaffold: {block-name}

### Files created
- `blocks/{block-name}.liquid` — block markup + schema
- `locales/en.default.json` — added {n} translation keys
- `locales/en.default.schema.json` — added schema labels

### Settings
{table of settings: id | type | default}

### Usage
Add this block to any section that accepts `@theme` blocks, or reference it
in a specific section's `blocks` array:
```json
"blocks": [{ "type": "@theme" }]
```

### Next steps
- Add the block to a section in the theme customiser
- Run `/review` to validate the generated code
```
