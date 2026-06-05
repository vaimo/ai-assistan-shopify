# How to Clear Conversation History

Each user's conversation with the AI Assistant is saved and reloaded the next time they open the app. This guide explains how to clear that history and what happens when you do.

---

## When to clear history

You might want to clear history when:

- The conversation has gone off-topic and you want a clean start
- You are troubleshooting an issue and want to rule out context problems
- You are handing off the store admin account to someone else

---

## Steps

1. Open the AI Assistant app in your Shopify admin.
2. At the top of the chat page, find the **Clear conversation** button.

> **📸 Screenshot:** Chat page header showing the Clear conversation button.

3. Click **Clear conversation**.
4. A confirmation prompt appears — click **Clear** again to confirm.

> **📸 Screenshot:** Confirmation state with a second Clear button visible.

The conversation disappears immediately. The input box remains active and you can start a new conversation right away.

---

## What actually happens

Clearing history does two things:

1. **Deletes your messages** from the app's database. All stored `chat_messages` rows for your user and shop are removed.
2. **Resets your Lokte session.** The Lokte chat session tied to your conversation is deleted from Lokte's side. This means Lokte also loses the context of your previous conversation.

The next message you send starts a brand-new session with no prior context.

> **⚠️ Warning:** This action cannot be undone. There is no way to recover deleted messages.

---

## History is per-user

Your conversation history is isolated to your Shopify user account. Other admins on the same store have their own separate histories. Clearing yours does not affect anyone else.

> **ℹ️ Note:** In some configurations where online token scopes are not enabled, all admins on a store may share a single conversation. Ask your administrator if you are unsure which mode applies to your store.

---

## History limits

The app keeps a maximum of 100 messages per user. Once you reach this limit, older messages are automatically trimmed as new ones arrive. Clearing history resets this counter.
