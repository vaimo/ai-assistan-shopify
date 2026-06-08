---
name: jira-context
description: Fetch Jira ticket details and return structured context for development
---

Fetch details for ticket: $ARGUMENTS

Using the Jira REST API (base URL from `JIRA_DC_URL` in `.env`):
```
GET {JIRA_DC_URL}/rest/api/2/issue/{TICKET_ID}
Authorization: Bearer {JIRA_ACCESS_TOKEN}
```

Return structured context:
```markdown
## Ticket: {ID} — {Summary}

**Type**: {Bug|Story|Task|Epic}  
**Status**: {status}  
**Priority**: {priority}  
**Story Points**: {n}  
**Labels**: {labels}

### Description
{description — condensed to key points}

### Acceptance Criteria
{extracted from description or custom field — bullet list}

### Shopify Context
{infer from labels: theme/app/checkout-extension/storefront-api}

### Linked Tickets
{blockers and dependencies}

### Implementation Notes
{any technical notes from comments or fields}
```

If the ticket cannot be fetched, ask the developer to describe the requirement manually.
