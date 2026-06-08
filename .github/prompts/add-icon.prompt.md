---
name: add-icon
description: Download an icon from a configurable icon library (Lucide, Heroicons, Phosphor), clean the SVG, and save it to the project assets
---

Download, clean, and save an SVG icon to the project.

The user provides: `/add-icon {icon-name}` or `/add-icon {icon-name} --library={library}`

## Step 1 — Detect icon library

Determine which icon library to use:

1. **Explicit flag** — if the user passes `--library=lucide|heroicons|phosphor`, use that
2. **Project detection** — check `package.json` dependencies:
   | Dependency | Library |
   |-----------|---------|
   | `lucide`, `lucide-react`, `lucide-static` | Lucide |
   | `@heroicons/react`, `heroicons` | Heroicons |
   | `@phosphor-icons/react`, `phosphor-react` | Phosphor |
3. **Default** — if no library detected and no flag, use **Lucide** (most common in Shopify themes)

## Step 2 — Determine asset path

Check the project type:

| Project type | Icon path |
|-------------|-----------|
| Theme | `assets/icon-{icon-name}.svg` |
| Hydrogen | `public/icons/{icon-name}.svg` or `app/assets/icons/{icon-name}.svg` (check which exists) |
| App | `public/icons/{icon-name}.svg` |

If the project already has icons, match the existing naming convention and directory.

## Step 3 — Fetch the SVG

Download the raw SVG from the icon library's CDN or GitHub:

| Library | Source URL pattern |
|---------|-------------------|
| Lucide | `https://unpkg.com/lucide-static@latest/icons/{icon-name}.svg` |
| Heroicons | `https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/24/outline/{icon-name}.svg` |
| Phosphor | `https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/{icon-name}.svg` |

If the icon name is not found, suggest similar names from the library and ask the user to pick one.

## Step 4 — Clean the SVG

Apply these cleaning rules:

1. **Remove hardcoded colors** — strip `fill="..."` and `stroke="..."` color attributes (keep `fill="none"` and `stroke="currentColor"`)
2. **Set `currentColor`** — ensure `stroke="currentColor"` (outline icons) or `fill="currentColor"` (solid icons) so the icon inherits text color
3. **Responsive dimensions** — remove fixed `width` and `height` attributes; keep only `viewBox`
4. **Remove metadata** — strip `<!-- comments -->`, `<title>`, `<desc>`, `xmlns:xlink`, `data-*` attributes, and any `id` attributes
5. **Remove XML declaration** — strip `<?xml ...?>` header
6. **Minify** — collapse whitespace, remove empty attributes

Example cleaned output:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="..." />
</svg>
```

## Step 5 — Save and confirm

Save the cleaned SVG to the determined path.

If the project is a **theme** and uses an `icon` snippet (e.g., `snippets/icon.liquid`), show how to use it:

```liquid
{% render 'icon', name: '{icon-name}' %}
```

If no icon snippet exists, show inline usage:

```liquid
<span class="icon" aria-hidden="true">
  {{- 'icon-{icon-name}.svg' | inline_asset_content -}}
</span>
```

## Step 6 — Output summary

```
## Icon Added: {icon-name}

- **Library**: {Lucide|Heroicons|Phosphor}
- **File**: `{path/to/icon.svg}`
- **Size**: {n} bytes (cleaned)

### Usage
{usage snippet appropriate to the project type}

### Accessibility
- Use `aria-hidden="true"` on decorative icons
- For meaningful icons, add `aria-label="{description}"` or adjacent visually-hidden text
```
