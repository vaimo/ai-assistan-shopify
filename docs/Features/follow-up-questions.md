# Follow-Up Questions

## Feature Summary

Assistant replies can end with ChatGPT-like follow-up questions. The UI parses those questions from a marked block, removes the block from the visible answer, and renders the questions as buttons that continue the current chat.

This feature is separate from FAQ Suggestions:

- Follow-up questions are generated per assistant reply.
- FAQ Suggestions are generated from historical questions and shown on the empty chat screen.

## Configuration

The feature uses its own `follow_up_questions` config namespace. In Configuration it appears as a separate section after FAQ Suggestions.

| Path | Type | Default | Description |
|---|---|---|---|
| `follow_up_questions.general.count` | number | `3` | Number of follow-up buttons to request and render, from `0` to `5` |

Set the value to `0` to disable prompt decoration and hide follow-up buttons.

## Prompt Contract

When the count is greater than `0`, the backend decorates the outgoing Lokte message with instructions to end the response with a marker block:

```text
<FOLLOW_UP_QUESTIONS>
</FOLLOW_UP_QUESTIONS>
```

The original user message is still saved to chat history. Only the outbound Lokte request is decorated.
Follow-up items must be standalone next requests, not yes/no offer prompts such as "Do you want..." or "Would you like...". The assistant may include fewer than the configured count, or an empty block, when there are no useful related next steps.

## Frontend Parsing

The chat UI:

- Removes all `<FOLLOW_UP_QUESTIONS>` marker blocks before rendering markdown.
- Parses the final marker block into button labels.
- Supports bulleted and numbered lines.
- Deduplicates questions and limits them to the configured count.
- Renders no buttons when the configured count is `0`.

Clicking a follow-up button sends that question through the same chat flow as typing it manually.

## Testing Notes

Backend tests assert that the Lokte payload is decorated only when enabled and that stored user messages remain undecorated.

Frontend tests cover marker stripping, parsing, deduplication, limits, disabled state, and normal answers with no marker block.
