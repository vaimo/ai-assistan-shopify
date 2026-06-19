# Using the Chat Assistant

This page walks through the chat interface — what you see, how to interact with it, and what to expect from the assistant's responses.

---

## The chat page layout

When you open AI Assistant in your Shopify admin, you land directly on the chat page.

> **📸 Screenshot:** Full chat page layout — empty state with three suggested question cards and the input box at the bottom.

The page has three areas:

- **Message thread** — the conversation history, with your messages on the right and the assistant's on the left
- **Suggested questions** — three cards shown when the conversation is empty, to help you get started
- **Input box** — where you type your message, with a Send button and a keyboard shortcut hint

---

## Asking a question

Type your question in the input box at the bottom of the page. Press **Enter** to send, or use **Shift + Enter** to add a new line.

The input box grows automatically as you type.

> **📸 Screenshot:** Input box with a question being typed.

While the assistant is thinking, you will see a "Thinking…" animation in the message thread. The input is disabled during this time.

> **📸 Screenshot:** Chat thread showing the user message and the "Thinking…" indicator below it.

---

## Suggested questions

When the conversation is empty, three suggested question cards appear:

- **Product insights** — "What the ingegrations are available for current project?"
- **Order management** — "Provide a summary of the current project."
- **Store optimization** — "How can I improve my store's conversion rate?"

Clicking a card sends that question immediately. You can also type any question you like — the suggestions are just a starting point.

## Follow-up question buttons

After an assistant reply, you may see related follow-up questions below the message. These are generated for that specific reply and are meant to help you continue the conversation.

Clicking a follow-up button sends that question immediately in the current chat. If an admin sets the follow-up question count to `0`, these buttons are hidden.

---

## Reading the assistant's reply

The assistant replies in formatted text. Replies can include:

- Paragraphs, bullet points, and numbered lists
- Bold and italic text
- Code blocks (for technical output)
- Tables
- Headings for longer structured answers

### Source document badges

When the assistant uses specific documents to generate an answer, those sources appear as inline badges next to the relevant text — for example, a **Confluence** or **Google Drive** badge.

> **📸 Screenshot:** An assistant reply with a "Confluence" source badge visible inline.

Hovering over a badge shows a small popup with:
- The document title
- A short excerpt from the document
- The date the document was last updated

Clicking the badge opens the source document in a new tab.

> **📸 Screenshot:** Source badge hover popup showing title, excerpt, and last updated date.

---

## Conversation history

Your conversation is saved automatically. When you close and reopen the app, the previous messages will reload.

Each user on a store has their own isolated history — your conversation is not visible to other admins on the same store.

History is kept for up to 100 messages per user. Older messages are automatically trimmed once the limit is reached.

---

## Clearing the conversation

To start a fresh conversation:

1. Scroll to the top of the chat page.
2. Click the **Clear conversation** button.
3. You will be asked to confirm — click **Clear** again to proceed.

> **📸 Screenshot:** Clear conversation button and confirmation state.

Clearing history deletes your messages from the database and resets the Lokte session. This cannot be undone.

See also: [How to Clear Conversation History](../how-to/03-clear-conversation-history.md)

---

## When the assistant is not available

If the assistant is not configured or has been disabled, the input box will be grayed out and show one of these messages:

| Message | What it means |
|---|---|
| "AI Assistant is disabled. Enable it in Configuration…" | An admin has turned off the AI Assistant toggle |
| "Configure Lokte integration to start chatting…" | The Lokte API key or User ID is missing |

Contact your administrator if you see either of these.

---

## Tips

- Be specific. The assistant searches your team's indexed documents — vague questions may return generic answers.
- If you get an unhelpful response, try rephrasing the question with more context.
- Use follow-up buttons when they match what you want to ask next.
- The assistant does not have access to live Shopify data unless that data is indexed in Lokte.
