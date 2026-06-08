---
name: create-slide
description: Create presentation slides following Vaimo brand guidelines and export as a PPTX file. Use when creating slide decks, presentations, or pitch materials. Triggers on tasks involving slides, presentations, decks, or pitch materials.
metadata:
  author: vaimo
  version: "4.0.0"
  argument-hint: <slide-topic-or-type>
---

# Vaimo Slide Creation Guidelines (Brand Guidelines 2026)

Follow these rules strictly when creating ANY presentation slide components. Every slide MUST look like it belongs to the same family.

---

## 1. Typography (CRITICAL -- never deviate)

| Element | Font | Weight | Size (pt equiv) | Tailwind |
|---------|------|--------|-----------------|----------|
| Title / Heading | Inter | Semi Bold | 24pt | `font-slide text-2xl font-semibold md:text-3xl` |
| Subtitle / Tagline | Inter | Light | 10pt | `font-slide text-sm font-light` |
| Headline keyword emphasis | Roboto Serif | Italic | same as heading | `font-heading italic` |
| Body / Copy text | Inter | Light / Regular | 7pt | `font-slide text-xs leading-[1.15]` |
| Detail / Secondary | Inter | Light | 7pt min | `text-[0.65rem] font-light` (NEVER smaller) |

### Font Rules
- **NO CAPITAL LETTERS / UPPERCASE** anywhere. Never use `uppercase` class. The brand explicitly forbids this.
- **NEVER change font sizes per slide** to fit content. If content doesn't fit, reduce content, not font size.
- **Inter** is the primary font for ALL text (body, titles, captions, icons, lines, illustrations).
- **Roboto Serif** (italic) is the extra font ONLY for emphasizing single phrases or keywords in headlines.
- Line spacing: 1.15 for body text. Paragraph spacing after: 12px.

### Google Fonts Import
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto+Serif:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" rel="stylesheet" />
```

### CSS Theme Variables
```css
--font-family-sans: 'Inter', -apple-system, sans-serif;
--font-family-slide: 'Inter', -apple-system, sans-serif;
--font-family-heading: 'Roboto Serif', Georgia, serif;
```

---

## 2. Title Pattern (Amber Left Border)

Every slide (except TitleSlide) MUST use the amber left-border title block ("Vaimo line" / "space line"):

```tsx
<div className="mb-6 border-l-[3px] border-accent pl-4">
  <h2 className="font-slide text-2xl font-semibold tracking-tight text-jet md:text-3xl">{title}</h2>
  <div className="mt-1 font-slide text-sm font-light text-jet/50">{subtitle}</div>
</div>
```

- Accent border on the FAR LEFT
- Title: Inter Semi Bold (no uppercase)
- Use `font-heading italic` on a `<span>` inside the title to emphasize a keyword with Roboto Serif
- Subtitle: Inter Light below the title

---

## 3. Slide Layout Structure

### Content Slides: Text Left, Visuals Right
When a slide has both text content and visual elements (diagrams, charts, images):
- **LEFT side**: Title block (with amber border), text, bullets, descriptions
- **RIGHT side**: Diagrams, charts, images, visual representations
- Use `SplitImageSlide` layout (`src/slides/layouts/SplitImageSlide.tsx`) or flex with `flex-1` left + `w-[40%]` right

### Available Slide Layouts
All layouts live in `src/slides/layouts/`:
- `TitleSlide.tsx` — opening/section title slide
- `BulletsSlide.tsx` — titled slide with bullet list
- `CardsSlide.tsx` — grid of cards
- `TableSlide.tsx` — data table
- `StatsSlide.tsx` — KPI numbers / statistics
- `BarChartSlide.tsx` — bar chart visualization
- `DiagramSlide.tsx` — architecture or system diagram
- `SplitImageSlide.tsx` — text left, image/visual right
- `AgendaSlide.tsx` — agenda / table of contents
- `TextBlockSlide.tsx` — full-width text/quote

Slide wrapper: `src/slides/SlideFrame.tsx` — apply to every slide for consistent chrome (logo, bottom bar, accent line).
Vaimo logo component: `src/slides/VaimoLogo.tsx`

### Frame Structure
```
+--------------------------------------------------+
|                              [Vaimo Logo] (abs)   |  <- Logo absolute top-right
|                                                    |
|  |  Title (Inter Semi Bold)                       |  <- Amber left border
|  |  Subtitle (Inter Light)                        |
|                                                    |
|  [Content area - max-w-[80%] centered]            |
|                                                    |
|  Vaimo -- [date]                    [page/total]  |  <- Bottom bar
|  ================================================ |  <- 1.5px accent bar
+--------------------------------------------------+
```

- **Max width**: Content constrained to `max-w-[80%]` centered
- **Vaimo logo**: Absolute positioned, top-right corner
- **Bottom bar**: "Vaimo -- [date]" left, page number right
- **Bottom accent bar**: 1.5px amber (`bg-accent`) at very bottom

---

## 4. Color Palette (Brand Guidelines 2026)

### Primary Colors
| Color | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Light Grey | `#D8D8D8` | `text-light-grey` / `bg-light-grey` | Dividers, backgrounds, soft hierarchy |
| Jet | `#333333` | `text-jet` / `text-text` | All text -- body, titles, captions, icons |
| Vaimo Yellow | `#F5B000` | `text-accent` / `bg-accent` / `border-accent` | Key moments, highlights, CTAs, emphasis |
| Deep Purple | `#4B3F72` | `text-accent-2` / `text-purple` | Secondary accent alongside yellow |
| Space Indigo | `#2E2646` | `text-space-indigo` | Dark backgrounds, dark accents |

### Extended Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Light Yellow | `#FCE8C6` | Soft yellow tints, hover states |
| Light Purple | `#2E2646` | Dark purple tints |
| White | `#FFFFFF` | Card backgrounds, slide background |

### Status Colors (ONLY for yes/no-type icons)
| Color | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Success Green | `#2EBB5D` | `text-status-green` | Positive indicators, checkmarks |
| Alert Red | `#DC0004` | `text-red` | Negative indicators, warnings |
| Orange | `#ea580c` | `text-orange` | Warning/moderate |

**Important:** Success Green and Alert Red are ONLY for yes/no-type icons and status indicators. Do NOT use them as general-purpose accent colors.

### Transparent Blacks (for tables, overlays, backgrounds)
| Alpha | Tailwind | Usage |
|-------|----------|-------|
| 2% | `bg-black/[0.02]` | Alternating table rows |
| 4% | `bg-black/[0.04]` | Table headers |
| 6% | `border-black/[0.06]` | Table row separators |
| 10% | `bg-jet/10` | Light surface |
| 50% | `text-jet/50` | Muted text |

---

## 5. Component Patterns

### Cards
```tsx
<div className="rounded-xl border border-jet/8 bg-white p-5 shadow-sm">
  {/* content */}
</div>
```
- Always `bg-white shadow-sm`
- NEVER use tinted/colored backgrounds (no `bg-jet/[0.02]` or `bg-{color}04`)
- Border: `border-jet/8` or colored borders for emphasis

### Tables
```tsx
{/* Header */}
<tr className="bg-black/[0.04]">...</tr>
{/* Rows - alternating stripes */}
<tr className={ri % 2 === 1 ? 'bg-black/[0.02]' : ''}>...</tr>
{/* Row separators */}
<tr className="border-t border-black/[0.06]">...</tr>
```
- Wrap in `rounded-xl border border-jet/8`
- Header: `bg-black/[0.04]` transparent black
- Alternating rows: odd rows get `bg-black/[0.02]`

### Bullets
- On light backgrounds: Vaimo Yellow (`bg-accent`) or Dark Grey (`bg-jet/25`)
- On dark backgrounds: White bullets
- Hanging indent at 5 and 25

### Links
- All links use Vaimo Yellow (`text-accent`)

### Service Logos
Always include actual SVG logos when referencing services:
- Import from `src/components/Logos.tsx`
- Available exports: `MedusaLogo`, `SanityLogo`, `AlgoliaLogo`, `AkeneoLogo`, `GoogleCloudLogo`, `NextjsLogo`, `ShopifyLogo`, `ShopwareLogo`, `FastifyLogo`, `ERPLogo`, `AILogo`
- Display logos above or beside the service name in cards/grids

---

## 6. Text Size Hierarchy (NEVER deviate)

| Level | Size | Usage |
|-------|------|-------|
| Title | `text-2xl md:text-3xl` | Slide title (Inter Semi Bold) |
| Subtitle | `text-sm` | Below title (Inter Light) |
| Body | `text-sm` / `text-xs` | Main content text |
| Detail | `text-[0.65rem]` | Secondary info, captions |
| Stat values | `text-2xl` to `text-3xl` | KPI numbers |

**MINIMUM readable size**: `text-[0.65rem]` -- NEVER go smaller than this.

---

## 7. Image & Visual Guidelines

- **Crop images** to fit within containers -- use `object-cover` with rounded corners
- **Shaped cropping**: Use `rounded-full` for portrait/avatar circles
- For split layouts: image takes `w-[40%]` on the right, `rounded-l-2xl overflow-hidden`
- Use high-quality images (unsplash.com for photos, flaticon.com for icons)
- Use CSS filters for B&W or darken effects when needed

---

## 8. Architecture / Diagram Slides

When building architecture or system diagrams:
- Wrap hosted services in a container showing the hosting layer (e.g., "Vaimo Cloud -- Google Cloud Platform")
- Use arrows (`w-px bg-jet/15`) between layers
- Include logos for all services
- Color-code layers: Deep Purple for UI, Success Green for orchestration, Vaimo Yellow for connectors
- Cross-cutting concerns go in a footer row with `border-t border-jet/6`

---

## 9. Key Rules (NEVER break these)

1. **NEVER change font sizes per slide** to fit content. Every slide must look like the same family.
2. **NEVER mix themes** from different presentations. When copying slides, always match the current theme.
3. **NEVER use uppercase/capital letters** in any text content.
4. **Keep font size hierarchy consistent**: title > subtitle > body > detail.
5. **Text left, visuals right** for content+image slides.
6. **Use theme colors ONLY** -- never introduce arbitrary colors.
7. **Use the amber left-border** (Vaimo line/space line) for all slide titles.
8. **Vaimo logo always top-right**, absolute positioned.
9. **Bottom accent bar** (1.5px amber) on every slide.
10. **Max-width 80%** for slide content, centered.
11. **Inter for everything**, Roboto Serif italic only for keyword emphasis in headlines.

---

## 10. Output: PPTX file via pptxgenjs

All slide decks generated by this skill are written as a `.pptx` file produced by a generator script. **Do not create or modify any files outside `rfp/`.**

### Files produced

```
rfp/{client}/poc/generate-pptx.mjs   ← ESM script that builds the deck
rfp/{client}/poc/poc-slides.pptx     ← generated output (created by running the script)
```

### How to generate

1. Install the library (once per project):
   ```bash
   npm install pptxgenjs
   ```
2. Write `rfp/{client}/poc/generate-pptx.mjs` (see template below).
3. Run it:
   ```bash
   node rfp/{client}/poc/generate-pptx.mjs
   ```
   This writes `poc-slides.pptx` next to the script.

### Script template

```js
// rfp/{client}/poc/generate-pptx.mjs
import PptxGenJS from 'pptxgenjs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pptx = new PptxGenJS()

// ── Brand constants ────────────────────────────────────────────────────────
const C = {
  jet:       '333333',
  accent:    'F5B000',   // Vaimo Yellow
  purple:    '4B3F72',   // Deep Purple
  indigo:    '2E2646',   // Space Indigo
  grey:      'D8D8D8',
  white:     'FFFFFF',
  green:     '2EBB5D',
  red:       'DC0004',
}

// Slide dimensions: 16:9 widescreen (default in pptxgenjs)
pptx.layout = 'LAYOUT_WIDE'   // 33.87 cm × 19.05 cm  (13.33" × 7.5")

// ── Master / theme defaults ────────────────────────────────────────────────
pptx.defineSlideMaster({
  title: 'VAIMO',
  background: { color: C.white },
  objects: [
    // Vaimo logo placeholder — top-right
    { text: { text: 'vaimo', options: { x: 11.5, y: 0.15, w: 1.7, h: 0.4,
        fontFace: 'Inter', fontSize: 14, bold: true, color: C.jet, align: 'right' } } },
    // Bottom accent bar (amber, 1.5 pt)
    { line: { x: 0, y: 7.38, w: 13.33, line: { color: C.accent, width: 2 } } },
    // Bottom bar text — left
    { text: { text: 'vaimo', options: { x: 0.3, y: 7.15, w: 3, h: 0.25,
        fontFace: 'Inter', fontSize: 8, color: C.jet + '80' } } },
  ],
  slideNumber: { x: 12.5, y: 7.15, color: C.jet + '80', fontFace: 'Inter', fontSize: 8 },
})

// ── Helper: amber left-border title block ─────────────────────────────────
// x, y in inches. Returns array of objects to spread into slide.addSlide().
function titleBlock(title, subtitle, x = 0.4, y = 0.4) {
  return [
    // Amber vertical rule
    { line: { x, y, w: 0, h: 0.55, line: { color: C.accent, width: 3 } } },
    // Title
    { text: { text: title, options: { x: x + 0.15, y, w: 9, h: 0.38,
        fontFace: 'Inter', fontSize: 24, bold: true, color: C.jet } } },
    // Subtitle
    { text: { text: subtitle, options: { x: x + 0.15, y: y + 0.36, w: 9, h: 0.22,
        fontFace: 'Inter', fontSize: 10, color: C.jet + '80' } } },
  ]
}

// ── Slides ─────────────────────────────────────────────────────────────────

// Slide 1 — Title slide
const s1 = pptx.addSlide({ masterName: 'VAIMO' })
s1.background = { color: C.indigo }
s1.addText('your headline here', {
  x: 1, y: 2.5, w: 11, h: 1.2,
  fontFace: 'Inter', fontSize: 36, bold: true, color: C.white,
})
s1.addText('subtitle or tagline', {
  x: 1, y: 3.7, w: 8, h: 0.5,
  fontFace: 'Inter', fontSize: 14, color: C.white + 'B3',
})

// Slide 2 — Content slide (amber title + bullets)
const s2 = pptx.addSlide({ masterName: 'VAIMO' })
titleBlock('slide title', 'optional subtitle').forEach(o => {
  if (o.line) s2.addShape(pptx.ShapeType.line, o.line)
  if (o.text) s2.addText(o.text.text, o.text.options)
})
s2.addText(
  [
    { text: 'First bullet point', options: { bullet: { code: '2022' }, paraSpaceAfter: 6 } },
    { text: 'Second bullet point', options: { bullet: { code: '2022' }, paraSpaceAfter: 6 } },
  ],
  { x: 0.6, y: 1.2, w: 11, h: 4, fontFace: 'Inter', fontSize: 12, color: C.jet },
)

// … add more slides following the same pattern …

// ── Save ──────────────────────────────────────────────────────────────────
await pptx.writeFile({ fileName: path.join(__dirname, 'poc-slides.pptx') })
console.log('✓ poc-slides.pptx written')
```

### Brand mappings for pptxgenjs

| Brand rule | pptxgenjs property |
|------------|--------------------|
| Inter Semi Bold title | `fontFace: 'Inter', bold: true, fontSize: 24` |
| Inter Light body | `fontFace: 'Inter', fontSize: 12` (no `bold`) |
| Roboto Serif italic keyword | `fontFace: 'Roboto Serif', italic: true` |
| Vaimo Yellow accent | `color: 'F5B000'` |
| Jet text | `color: '333333'` |
| Amber left border | `addShape(pptx.ShapeType.line, ...)` with `color: 'F5B000', width: 3` |
| Card background | `fill: { color: 'FFFFFF' }` + `line: { color: '33333314' }` |
| Alternating table row | `fill: { color: 'FFFFFF' }` / `fill: { color: 'F5F5F5' }` |
| No uppercase | Never use `.toUpperCase()` or `allCaps: true` |

### What NOT to do
- Never create files outside `rfp/{client}/poc/`
- Never modify `src/main.tsx` or any other `src/` file
- Never produce `.tsx` slide components — PPTX is the required output
- Never use `allCaps: true` in any text object
- Never hardcode absolute paths — always resolve relative to `__dirname`
