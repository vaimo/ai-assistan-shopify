---
name: jira-comment
description: Post a comment or auto-generated implementation summary to a Jira ticket
---

Post a comment to ticket: $ARGUMENTS

If only a ticket ID is provided (no message), auto-generate a development summary:
```markdown
## Implementation Summary

**Branch**: {current git branch}
**Changed files**: {count and list}
**Key changes**:
- {summary of what was built/fixed}

**Testing**:
- Tested in development store: {yes/no}
- Test cases added: {yes/no, count}
- Quality gates: {pass/fail summary}

**Ready for review**: {yes/no}
**Notes**: {anything QA or reviewer should know}
```

Then post via:
```
POST {JIRA_DC_URL}/rest/api/2/issue/{TICKET_ID}/comment
Authorization: Bearer {JIRA_ACCESS_TOKEN}
Content-Type: application/json
{"body": "{comment}"}
```

Confirm with: "Comment posted to {TICKET_ID}" or report the error.
