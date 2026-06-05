# Getting Started with AI Assistant

AI Assistant is a Shopify embedded app that puts an AI-powered chat assistant directly inside your Shopify admin. You can ask it questions about your store, products, orders, and operations — and it will answer using your connected knowledge sources through Lokte.

This page explains what you need before you can start chatting, and walks you through your first login.

---

## What is Lokte?

Lokte is the AI backend that powers the assistant. It is a RAG (Retrieval-Augmented Generation) system — meaning it answers questions by searching through indexed documents (Confluence pages, Google Drive files, internal wikis, etc.) and generating a response based on what it finds.

The app connects to Lokte using an API key and a persona (user ID). Your administrator configures these credentials in the Configuration page.

> **ℹ️ Note:** Lokte is operated externally. Your Shopify store data is not automatically indexed — only the document sources your team has connected to Lokte will be available to the assistant.

---

## Prerequisites

Before using the AI Assistant, make sure the following are in place:

- [ ] The AI Assistant app is installed on your Shopify store
- [ ] A Lokte API key has been obtained and configured in the app
- [ ] A Lokte User ID (persona) has been configured in the app
- [ ] The AI Assistant is enabled in the Configuration page

If any of these are missing, the chat input will be disabled and you will see a setup prompt. Contact your administrator to complete the setup.

---

## First Login

1. Log in to your Shopify admin as usual.
2. In the left sidebar, locate **AI Assistant** under your installed apps.
3. Click it to open the app.

> **📸 Screenshot:** Shopify admin left sidebar showing the AI Assistant app entry.

4. The app loads the AI Assistant chat page.
   - If it is **ready to use**, you will see a text input and a set of suggested questions.
   - If it is **not yet configured**, you will see a message explaining what is missing (e.g., "Configure Lokte integration to start chatting…").

> **📸 Screenshot:** AI Assistant chat page in configured state showing the input box and three suggested question cards.

---

## What happens on your first message

When you send your first message:

1. The app creates a new chat session with Lokte on your behalf.
2. Your message is sent to Lokte, which searches its indexed documents and generates a reply.
3. The reply is returned and displayed in the chat — along with any source documents the assistant used, shown as labeled badges inline.
4. Your conversation is saved so it reappears the next time you open the app.

Each admin user on a store gets their own isolated conversation history.

---

## Next steps

- [Using the Chat Assistant](02-using-the-chat-assistant.md) — learn what you can ask and how the UI works
- [Managing Configuration](03-managing-configuration.md) — if you are the admin responsible for setup
