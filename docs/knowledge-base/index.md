# AI Assistant for Shopify — Knowledge Base

This Knowledge Base is the central reference for the AI Assistant Shopify app. It covers everything from first-time setup for merchants to infrastructure details for the team running the service.

> **ℹ️ Note:** This KB does not replace the developer-facing docs in this repository. For local development setup see [`docs/LOCAL_DEVELOPMENT.md`](../LOCAL_DEVELOPMENT.md). For production deployment see [`docs/PROD_DEPLOY.md`](../PROD_DEPLOY.md).

---

## Who should read what

| I am… | Start here |
|---|---|
| A merchant who just installed the app | [Getting Started](user-guide/01-getting-started.md) |
| A merchant learning to use the chat | [Using the Chat Assistant](user-guide/02-using-the-chat-assistant.md) |
| An admin setting up Lokte | [Configure Lokte Integration](how-to/02-configure-lokte-integration.md) |
| A developer or DevOps engineer | [Architecture Overview](infrastructure/01-architecture-overview.md) |
| Someone troubleshooting an issue | [Troubleshoot Common Issues](how-to/04-troubleshoot-common-issues.md) |
| Looking for a quick answer | [FAQ](faq/01-faq.md) |

---

## User Guide

Step-by-step documentation for merchants and store admins.

| Page | Description |
|---|---|
| [Getting Started](user-guide/01-getting-started.md) | What the app is, what Lokte is, prerequisites, first login |
| [Using the Chat Assistant](user-guide/02-using-the-chat-assistant.md) | Chat UI, asking questions, source badges, clearing history |
| [Managing Configuration](user-guide/03-managing-configuration.md) | Enable/disable AI Assistant, set Lokte credentials, save settings |

---

## How-To Guides

Task-oriented guides for specific goals.

| Page | Description |
|---|---|
| [Install the App](how-to/01-install-the-app.md) | Install the app from the Shopify App Store or a partner link |
| [Configure Lokte Integration](how-to/02-configure-lokte-integration.md) | Obtain Lokte credentials and connect them to the app |
| [Clear Conversation History](how-to/03-clear-conversation-history.md) | Clear your chat history and start a fresh conversation |
| [Troubleshoot Common Issues](how-to/04-troubleshoot-common-issues.md) | Fixes for the most common problems users and operators run into |
| [Manage FAQ Suggestions](how-to/05-manage-faq-suggestions.md) | Configure generated suggested questions and force regeneration |
| [Use the Chat History Selector](how-to/06-use-chat-history-selector.md) | Switch between saved chats, start new chats, and delete history |

---

## Infrastructure

Technical reference for developers and DevOps.

| Page | Description |
|---|---|
| [Architecture Overview](infrastructure/01-architecture-overview.md) | System design, service layout, request flow |
| [Environment Variables](infrastructure/02-environment-variables.md) | All required and optional configuration variables |
| [Database Schema](infrastructure/03-database-schema.md) | All database tables with column types and constraints |
| [Security Model](infrastructure/04-security-model.md) | HMAC request signing, OAuth, secret encryption, port hardening |

---

## FAQ

[Frequently Asked Questions](faq/01-faq.md) — quick answers for merchants, admins, and operators.

---

## Related resources

- [Local Development Setup](../LOCAL_DEVELOPMENT.md)
- [Production Deployment Guide](../PROD_DEPLOY.md)
- [Chat History Feature — Architecture](../Features/chat_history.md)
- [FAQ Suggestions Feature — Architecture](../Features/faq-suggestions.md)
- [Follow-Up Questions Feature — Architecture](../Features/follow-up-questions.md)
- [ConfigRegistry Module Reference](../../backend/src/config-registry/README.md)
- [Lokte Module Reference](../../backend/src/lokte/README.md)
