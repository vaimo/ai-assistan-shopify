---
name: pre-commit-check
description: Validates all changed files before committing — quality gate, security, and Shopify standards
---

Perform a pre-commit check on all staged/changed files.

For each changed file:
1. Identify the file type (Liquid, JS/TS, CSS, GraphQL, JSON config)
2. Apply the relevant standards from `instructions/`
3. Check for any blocking issues:
   - Security: unescaped output, hardcoded secrets, missing HMAC checks
   - Correctness: syntax errors, missing error handling
   - Standards: deprecated Liquid tags, wrong API patterns
   - Tests: are new functions covered?

Output a table:
```
| File | Type | Status | Issues |
|------|------|--------|--------|
| sections/hero.liquid | Liquid | ✅ Ready | — |
| assets/cart.js | JS | ❌ Block | line 42: no error handling on fetch |
| locales/en.default.json | i18n | ⚠️ Warn | missing 3 new keys |
```

End with: READY TO COMMIT or BLOCKED (list blockers).
Do not commit if any file has ❌ status.
