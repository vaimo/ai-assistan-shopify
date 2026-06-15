# How to Use the Chat History Selector

The chat history selector lets you return to previous AI Assistant conversations, start a fresh chat, and delete old chats when you no longer need them.

This guide explains where to find the selector, how conversations are saved, and what happens when you switch or delete chats.

---

## What the chat history selector does

Each conversation is saved as a separate chat thread. A thread keeps its own message history and its own Lokte session context, so follow-up questions stay connected to the conversation where they were asked.

The chat page header includes:

- **History** — opens the chat history selector
- **History count badge** — shows how many saved chats you have
- **New chat** — starts a fresh empty conversation

> **📸 Screenshot:** Chat page header showing the History button, count badge, and New chat button.

The **History** button is disabled when there are no saved chats.

---

## What you need

- AI Assistant installed and available in Shopify admin
- Lokte configured and reachable
- AI Assistant enabled in Configuration
- At least one message sent in chat

A new chat is created after you send the first message in an empty conversation.

---

## Step 1: Open chat history

1. Open AI Assistant in your Shopify admin.
2. Look at the top of the chat page.
3. Click **History**.

> **📸 Screenshot:** Chat page with the History button highlighted.

The chat history selector opens as a dialog over the chat page.

You can close it by:

- Clicking the close button
- Clicking outside the dialog
- Pressing **Escape**

---

## Step 2: Choose a previous chat

The selector lists your saved chats from newest to oldest.

> **📸 Screenshot:** Chat History dialog showing several saved conversations.

Each chat is labeled with a title generated from the first message in that conversation. Long titles are shortened in the list.

To open a previous conversation:

1. Click the chat title in the list.
2. The dialog closes.
3. The message thread reloads with that conversation's history.

The active chat is highlighted in the list when the selector is open.

---

## Step 3: Start a new chat

Use **New chat** when you want a clean conversation with no previous context.

You can start a new chat from:

- The main chat page header
- The Chat History dialog header

> **📸 Screenshot:** Chat History dialog with the New chat button highlighted.

When you click **New chat**:

1. The current message thread is cleared from the screen.
2. No new saved chat is created immediately.
3. The first message you send creates a new chat thread.

The **New chat** button is disabled when the current chat is already empty.

---

## Step 4: Delete one chat

Each chat in the selector has a delete button.

> **📸 Screenshot:** Chat History dialog showing the delete button beside a chat.

To delete one conversation:

1. Open **History**.
2. Find the chat you want to remove.
3. Click the delete button beside that chat.

Deleting a chat removes:

- The chat thread from the app database
- All messages in that chat
- The associated Lokte session, if one exists

If you delete the currently open chat, the app automatically switches to the next available chat. If there are no chats left, the screen returns to an empty chat.

> **⚠️ Warning:** Deleting a chat cannot be undone.

---

## Step 5: Clear all chat history

Use **Clear all history** when you want to remove every saved chat for your user.

1. Open **History**.
2. Click **Clear all history** at the bottom of the dialog.
3. Click **Confirm? Clear all** to confirm.

> **📸 Screenshot:** Chat History dialog footer showing the Clear all history confirmation state.

Clearing all history deletes all saved chat sessions and messages for your user in this store. It also asks Lokte to delete the associated Lokte sessions.

This action cannot be undone.

---

## How chat history is saved

When you send a message:

1. The app creates or reuses a chat thread.
2. The message is sent to Lokte.
3. The user message and assistant reply are saved in the app database.
4. The chat moves to the top of the history list.

The app keeps up to **100 messages per chat thread**. Older messages in that thread are automatically trimmed after the limit is reached.

---

## History is per user

Chat history is scoped to your Shopify user and store. Other admins on the same store have their own saved chats.

> **ℹ️ Note:** In configurations where Shopify online user tokens are not enabled, admins may share a fallback user identity. In that setup, multiple admins can see the same chat history.

---

## Troubleshooting

**The History button is disabled**
- You do not have any saved chats yet.
- Send a message first, then check the header again.

**A previous chat does not load**
- Refresh the page and open **History** again.
- Log out of Shopify admin and log back in if your session token expired.
- Contact your administrator if the problem continues.

**A chat disappeared after deleting it**
- This is expected. Delete removes that conversation permanently.
- If it was the active chat, the app switches to the next available chat or returns to an empty chat.

**The chat title is not what you expected**
- Chat titles are generated from the first user message in the conversation.
- Renaming chats is not available in the current version.

See [Troubleshoot Common Issues](04-troubleshoot-common-issues.md) for more general history loading checks.
