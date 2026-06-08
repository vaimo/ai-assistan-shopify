---
name: security-audit
description: OWASP-focused 3-phase security audit for Shopify themes and apps
---

# /security-audit — Shopify Security Audit

## When to Use

Before any go-live, after any third-party integration, when handling customer PII, or when adding checkout/payment flows.

## Usage

```
/security-audit path/
/security-audit           # audits entire project
```

## 3-Phase Audit Process

### Phase 1 — Pattern Scan (Automated)

Scan for dangerous patterns:

**Liquid**
- `| raw` filter on any dynamic value
- Direct `{{ request.path }}` or `{{ request.origin }}` output without escaping
- `{% javascript %}` tags with `eval(` or `document.write(`
- Inline `<script>` tags with Liquid variable interpolation without `| json`

**JavaScript**
- `innerHTML =` with any variable
- `document.write(`
- `eval(` / `new Function(`
- `localStorage` / `sessionStorage` storing tokens or PII
- Hard-coded API tokens (regex: `shpat_`, `shpca_`, `shppa_`, `shpss_`)

**Backend**
- String-concatenated SQL queries
- Missing HMAC verification on webhook handlers
- Missing `state` parameter validation in OAuth flow
- Unvalidated redirect URLs

### Phase 2 — Access Control Review

- App scopes: are all requested scopes actually used?
- Admin API: is least-privilege applied to all operations?
- Metafields: private namespace used for sensitive data?
- App Proxy: signature validation on every proxied endpoint?
- Storefront API token: stored server-side, not in JS bundle?

### Phase 3 — Data Flow Analysis

Trace data paths for:
- Customer PII (name, email, phone, address)
- Payment-adjacent data (order IDs, checkout tokens)
- Merchant credentials

For each path verify:
- Encrypted in transit (HTTPS enforced)
- Not logged in plaintext
- Not exposed in client-side bundles
- Retention policy defined

## Output Format

```
## Security Audit: {path}

### Risk Summary
Critical: N | High: N | Medium: N | Low: N | Info: N

### Phase 1 — Pattern Scan
{findings table with file:line, pattern, severity, remediation}

### Phase 2 — Access Control
{findings}

### Phase 3 — Data Flow
{findings}

### Remediation Checklist
{prioritised list, critical first}
```
