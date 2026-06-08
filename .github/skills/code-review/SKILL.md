---
name: code-review
description: Comprehensive Shopify code review — Liquid, JS/TS, CSS, GraphQL, and app backend
---

# /code-review — Comprehensive Shopify Code Review

## When to Use

Invoke for any Shopify file or PR that needs a thorough pre-merge review: themes, apps, extensions, or backend services.

## Usage

```
/code-review path/to/file-or-directory
/code-review            # reviews all files changed in the current branch
```

## 10-Point Review Checklist

Run all 10 gates. Report each as PASS / WARN / FAIL with line references.

### 1. Liquid Standards
- `| escape` on all dynamic output in HTML context
- No `| raw` on user content
- `{% render %}` not `{% include %}`; explicit variable passing
- Schema present with labels and presets

### 2. JavaScript / TypeScript Quality
- `strict` TypeScript; no `any`
- No blocking synchronous operations
- Proper async/await with error handling
- No `eval()` or `new Function()`

### 3. Security (OWASP + Shopify)
- XSS vectors: escaped output, no innerHTML with dynamic data
- CSRF: App Bridge session tokens; HMAC webhook verification
- Secrets: no hardcoded tokens or keys
- Dependencies: no known-vulnerable packages

### 4. Performance
- Images: `image_url` with explicit widths; `loading="lazy"` below fold
- No `forloop` over large collections without pagination
- No synchronous blocking in JS critical path
- Bundle size within limits

### 5. Shopify Platform Conventions
- Correct API version pinned
- Metafields use explicit namespace/key
- Settings schema complete and merchant-friendly
- App Bridge used correctly in embedded context

### 6. Accessibility (WCAG 2.1 AA)
- All images have `alt` attributes
- Interactive elements have labels
- Focus management correct
- Colour contrast sufficient

### 7. Error Handling
- No silent `catch` blocks
- API errors surfaced to user
- Graceful degradation when optional data is absent

### 8. Internationalisation
- All strings use `| t` filter (Liquid) or i18n library (app)
- No hardcoded English strings
- Currency / date / number formatting uses platform helpers

### 9. Code Completeness
- No TODO / FIXME / placeholder code
- No commented-out dead code
- No console.log left in production code

### 10. Documentation & Naming
- Public functions have JSDoc comments
- Complex Liquid logic has inline comments
- Variable and function names are descriptive

## Output Format

```
## Code Review: {path}

### Summary
{one-paragraph overview}

### Gate Results
| Gate | Status | Notes |
|------|--------|-------|
| Liquid Standards | ✅ PASS | |
| JS/TS Quality | ⚠️ WARN | line 42: missing error handling |
| Security | ❌ FAIL | line 17: unescaped metafield output |
...

### Critical Issues (must fix)
{numbered list}

### Recommendations (should fix)
{numbered list}

### Suggestions (consider)
{numbered list}
```
