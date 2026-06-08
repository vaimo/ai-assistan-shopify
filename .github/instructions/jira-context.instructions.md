---
applyTo: "**"
---

# Jira Ticket Auto-Detection

## Detection Patterns

Automatically detect Jira ticket IDs in the following formats:
- `PROJ-123` — standard project key + number
- `SHOP-456`, `THEME-789`, `APP-012` — common Shopify project prefixes
- Any uppercase 2-10 letter prefix followed by `-` and digits

## On Detection

When a Jira ticket ID is mentioned in chat:
1. Check if `.env` contains `JIRA_DC_URL` and `JIRA_ACCESS_TOKEN`
2. If configured: fetch ticket details via REST API and inject as context
3. If not configured: acknowledge the ticket ID and ask the developer what the ticket covers

## Context to Extract

From each detected ticket, surface:
- **Summary**: one-line description
- **Acceptance criteria**: from description or custom field
- **Story points / estimate**
- **Labels**: `bug`, `feature`, `tech-debt`, `security`, etc.
- **Linked tickets**: blockers and dependencies
- **Shopify-specific labels**: `theme`, `app`, `checkout-extension`, `storefront-api`
