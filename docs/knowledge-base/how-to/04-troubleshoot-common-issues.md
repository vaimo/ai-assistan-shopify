# Troubleshooting Common Issues

This page covers the most frequent issues that users and administrators run into, along with the steps to resolve them.

---

## "Configure Lokte integration to start chatting…"

**What it means:** The app is running but Lokte is not fully configured. The input box is disabled.

**How to fix:**

1. Open **Configuration** in the app sidebar.
2. In the **Lokte** section, verify:
   - **Enable** is set to **On**
   - **API Key** is set (shows as `****` if saved)
   - **User ID** has a value
3. In the **AI Assistant** section, verify **Enable** is **On**.
4. Click **Save changes** if you made any changes.
5. Return to the chat page and reload.

See [Configure Lokte Integration](02-configure-lokte-integration.md) for the full setup walkthrough.

---

## "AI Assistant is disabled. Enable it in Configuration…"

**What it means:** The top-level AI Assistant toggle has been turned off.

**How to fix:**

1. Open **Configuration**.
2. In the **AI Assistant** section, set **Enable** to **On**.
3. Click **Save changes**.

---

## The assistant returns a 503 error

**What it means:** The app's backend considers Lokte not configured for this shop. This happens when the API key or User ID is missing or empty in the database.

**How to fix:**

1. Open **Configuration**.
2. Re-enter the Lokte **API Key** and **User ID**.
3. Click **Save changes**.
4. Try sending a message again.

If the problem persists, check the backend logs:

```bash
docker-compose logs app | grep -i "lokte\|ServiceUnavailable"
```

---

## The assistant returns a 502 error

**What it means:** The app's backend could not reach the Lokte API at `https://lokte.vaimo.network`. This is a network or Lokte availability issue, not a configuration problem.

**How to check:**

```bash
# From inside the app container
docker-compose exec app curl -s -o /dev/null -w "%{http_code}" https://lokte.vaimo.network
```

If the response is not `200`, Lokte may be down or unreachable from your server's network. Contact your infrastructure team.

---

## Chat history is not loading

**What it means:** The history panel stayed empty when you opened the app, even though you had previous conversations.

**Possible causes and fixes:**

| Cause | Fix |
|---|---|
| Slow backend startup | Refresh the page — history loads after the page mounts |
| Session token expired | Log out of Shopify admin and log back in |
| Backend is down | Check container health: `docker-compose ps` |
| Database error | Check backend logs: `docker-compose logs app | grep -i "history\|chat_message"` |

---

## Configuration page is blank or shows a spinner indefinitely

**What it means:** The Configuration page could not load the schema or config values from the backend.

**How to check:**

1. Open your browser's developer tools (F12) → Network tab.
2. Reload the Configuration page.
3. Look for failed requests to `/config/schema` or `/config/<shopId>`.

**Common causes:**

- Backend container is not running (`docker-compose ps` to check)
- Session token expired — try logging out and back in to Shopify admin
- CORS or network misconfiguration — contact your administrator

---

## OAuth redirect loop after app installation

**What it means:** After completing the Shopify OAuth flow, the browser keeps redirecting back to the login page.

**How to fix (administrator):**

1. Check that `APP_URL` in your deployment environment exactly matches the **Application URL** in the Shopify Partner Dashboard.
2. Check that the redirect URI in the Partner Dashboard matches `https://your-domain.com/auth/callback`.
3. Restart the app container after making changes:

```bash
docker-compose restart app
```

---

## Frontend can't connect to backend

**What it means:** The Remix frontend is running but cannot reach the NestJS backend.

**How to check:**

```bash
# Backend health check from inside the container
docker-compose exec app curl http://localhost:3004/health
```

**Expected:** `200 OK` with a JSON response.

**If it fails:**

```bash
# Check backend logs
docker-compose logs app | grep -i "NestJS\|backend\|3004"
```

Ensure `BACKEND_URL=http://localhost:3004` is set in your docker-compose environment. Both services run in the same container — the frontend always connects to the backend on `localhost:3004`, never through an external URL.

---

## Database connection errors (backend won't start)

**Symptom:** Backend logs show `ECONNREFUSED` or TypeORM connection errors.

**How to check:**

```bash
docker-compose logs postgres | grep "ready\|error"
docker-compose ps postgres
```

**Fix:**

- Make sure the Postgres container is healthy before the app container starts. The `docker-compose.yml` already configures a health check dependency — if you are seeing this, the Postgres container may have failed to start.
- Verify that `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` match between the app container and the Postgres container.

See [Production Deployment Guide — Troubleshooting](../../PROD_DEPLOY.md#step-8-troubleshooting) for more detailed steps.

---

## A "Dev / Testing" section appears in Configuration

This is expected in non-production environments. The **Dev / Testing** section provides toggles to simulate error states for QA purposes. It does not appear in production (`NODE_ENV=production`).

If you see it in a production deployment, verify that `NODE_ENV` is set to `production` in your environment.
