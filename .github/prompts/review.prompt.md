---
name: review
description: Quick code review — security, correctness, Shopify standards, performance
---

Review the current file or selection for:

1. **Security** — any XSS, injection, or credential exposure risks
2. **Correctness** — logic errors, missing error handling, edge cases
3. **Shopify Standards** — platform conventions, deprecated usage, API best practices
4. **Performance** — obvious bottlenecks, missing lazy loading, N+1 patterns
5. **Accessibility** — missing labels, keyboard nav, ARIA issues

Format: short bullet list per category. Mark each as ✅ OK / ⚠️ Warn / ❌ Fail.
Only list categories with findings — skip clean ones.
End with a one-line "ship it" or "needs work" verdict.
