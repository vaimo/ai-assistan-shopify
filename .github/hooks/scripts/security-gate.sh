#!/usr/bin/env bash
# Shopify Security Gate — PreToolUse hook
# Blocks writes containing known-dangerous patterns
# Exit 0 = allow, Exit 1 = block

set -euo pipefail

CONTENT="${TOOL_INPUT_CONTENT:-}"
FILE="${TOOL_INPUT_PATH:-}"

RED='\033[0;31m'
NC='\033[0m'

block() {
  echo -e "${RED}[SECURITY GATE BLOCKED]${NC} $1"
  echo "File: ${FILE}"
  echo "Fix the issue and retry."
  exit 1
}

# ── Liquid patterns ──────────────────────────────────────────────────────────

# | raw filter on dynamic content (allow literal strings only)
if echo "$CONTENT" | grep -qP '\{\{[^}]*\|\s*raw\s*\}\}'; then
  block "Dangerous: '| raw' filter on dynamic Liquid output. Use '| escape' instead."
fi

# Unescaped metafield output
if echo "$CONTENT" | grep -qP '\{\{\s*\w+\.metafields\.[^}]+\}\}(?!.*\|\s*escape)'; then
  block "Metafield output missing '| escape' filter. Always escape metafield values in HTML context."
fi

# ── JavaScript patterns ──────────────────────────────────────────────────────

# eval() usage
if echo "$CONTENT" | grep -qP '\beval\s*\('; then
  block "Dangerous: eval() detected. Never use eval() in Shopify theme or app code."
fi

# innerHTML with variable
if echo "$CONTENT" | grep -qP '\.innerHTML\s*=\s*[^'"'"'"]'; then
  block "Potential XSS: innerHTML assigned from variable. Use textContent or sanitise input."
fi

# Hardcoded Shopify tokens
if echo "$CONTENT" | grep -qP '(shpat_|shpca_|shppa_|shpss_)[a-zA-Z0-9]{32,}'; then
  block "CRITICAL: Hardcoded Shopify API token detected. Move to .env immediately."
fi

# Generic API key / secret patterns
if echo "$CONTENT" | grep -qiP '(api_key|api_secret|access_token|client_secret)\s*[=:]\s*["'"'"'][a-zA-Z0-9_\-]{16,}'; then
  block "CRITICAL: Hardcoded credential detected. Store secrets in .env, never in source files."
fi

# ── Node.js / backend patterns ───────────────────────────────────────────────

# Missing HMAC check in webhook handler
if echo "$FILE" | grep -qiP 'webhook'; then
  if ! echo "$CONTENT" | grep -qP '(hmac|authenticate\.webhook|verifyWebhook)'; then
    block "Webhook handler missing HMAC verification. All webhook endpoints must verify the X-Shopify-Hmac-Sha256 header."
  fi
fi

# ── Settings data protection ─────────────────────────────────────────────────

if echo "$FILE" | grep -qP 'settings_data\.json'; then
  block "Blocked: Direct modification of settings_data.json is not allowed via AI. Edit this file manually in the Shopify theme editor."
fi

exit 0
