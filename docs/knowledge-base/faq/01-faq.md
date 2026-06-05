# Frequently Asked Questions

---

## For merchants

### What is AI Assistant?

AI Assistant is a chat interface embedded in your Shopify admin. You can ask it questions about your store, products, orders, and operations. It answers by searching your organization's connected knowledge sources (documents, wikis, etc.) through Lokte.

---

### What can I ask the assistant?

You can ask anything your team's Lokte instance has been set up to answer. Common examples:

- "What are my top-selling products this month?"
- "Show me recent orders that need attention."
- "How can I improve my store's conversion rate?"

The assistant is only as good as the documents indexed in Lokte. If information has not been indexed, the assistant cannot find it.

---

### Does the assistant have access to my live Shopify data?

Not automatically. The assistant searches Lokte's indexed document sources, not a live connection to your Shopify store. If your team has set up Shopify data exports that are indexed in Lokte, it can answer those questions — otherwise, answers are based on indexed static content.

---

### Why is my input box grayed out?

There are two possible reasons:

1. **AI Assistant is disabled** — an admin has turned off the toggle. Contact your administrator.
2. **Lokte is not configured** — the API key or User ID is missing. Contact your administrator to complete the setup. See [Configure Lokte Integration](../how-to/02-configure-lokte-integration.md).

---

### Will my conversation be visible to other admins?

No. Conversations are isolated per user. Other admins on the same store have their own separate history.

> **ℹ️ Note:** In some edge cases where the app is configured with offline Shopify tokens, all admins share one conversation. Ask your administrator which mode your store uses.

---

### How long is my conversation history kept?

The last 100 messages per user are stored. Once you reach the limit, the oldest messages are automatically removed as new ones arrive. You can also clear history manually at any time.

---

### Can I undo clearing my history?

No. Clearing your conversation is permanent. Both the stored messages and the underlying Lokte session are deleted.

---

### The assistant gave me a wrong or unhelpful answer. What should I do?

Try rephrasing the question with more context. The assistant searches indexed documents — if the relevant information is there but the query was too broad, a more specific question often helps.

If the assistant consistently gives wrong information on a specific topic, the issue may be with the indexed documents in Lokte. Contact the person who manages Lokte in your organization.

---

## For administrators

### What do I need to get the assistant working?

1. The app must be installed on the store.
2. You must have a Lokte API key and a Lokte persona (User ID).
3. Both values must be entered in Configuration and saved.
4. Both the Lokte and AI Assistant **Enable** toggles must be on.

See [Configure Lokte Integration](../how-to/02-configure-lokte-integration.md).

---

### Where do I get Lokte credentials?

From your Lokte instance (e.g., `https://lokte.vaimo.network`). Log in, generate an API key under your profile settings, and copy the persona ID from the Personas section.

If you do not have access, contact the team that manages your Lokte deployment.

---

### Is the API key stored securely?

Yes. API keys and other `secret`-type fields are encrypted at rest using AES-256-GCM before being written to the database. They are masked as `****` in all API responses. The plaintext value is only used internally when making calls to Lokte.

See [Security Model — Secret field encryption](../infrastructure/04-security-model.md#secret-field-encryption).

---

### What happens if I change the Lokte API key?

The old key is replaced in the database immediately after you save. Any subsequent chat message will use the new key. In-flight requests that were already sent to Lokte with the old key are not affected.

---

### Can multiple stores use the same Lokte credentials?

Yes — each store's configuration is stored separately in the database. You can enter the same API key and persona ID for multiple stores, or use different credentials per store.

---

## For operators / DevOps

### What ports need to be open?

Only **port 3000** (the Remix frontend) needs to be publicly accessible. Port 3004 (the NestJS backend) is internal-only and must not be exposed.

---

### How do I update the app?

```bash
cd /opt/apps/ai-assistant
git pull origin main
make deploy-prod
```

The build process rebuilds the Docker image and restarts the container. Database migrations run automatically on startup.

See [Production Deployment Guide — Updating the App](../../PROD_DEPLOY.md#step-7-updating-the-app).

---

### How do I back up the database?

```bash
docker-compose exec postgres pg_dump -U postgres ai_assistant_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

Set up a cron job to run this daily. See [Production Deployment Guide — Database Backups](../../PROD_DEPLOY.md#62-database-backups).

---

### The app works but I do not see a "Dev / Testing" section in Configuration

This section only appears when `NODE_ENV` is not set to `production`. In production environments it is intentionally hidden. If you need it for testing, use a development deployment.

---

### What happens if the Lokte API is down?

The chat returns a 502 error to the user: "Could not reach the AI backend. Please try again." No data is lost — the message is simply not processed. There is no retry logic currently; the user needs to resend the message once Lokte recovers.

---

### Is there a health check endpoint?

Yes. The backend exposes `GET http://localhost:3004/health` from inside the container.

```bash
docker-compose exec app curl http://localhost:3004/health
```

Expected response: `200 OK` with a JSON body.
