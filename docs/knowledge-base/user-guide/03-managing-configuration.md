# Managing Configuration

The Configuration page is where app settings are managed. Admins use it to enable the AI Assistant, connect Lokte credentials, and adjust any other module-level settings.

Access it from the AI Assistant app sidebar: **Configuration**.

> **📸 Screenshot:** AI Assistant sidebar navigation showing the Configuration link.

---

## Page layout

The Configuration page loads all registered modules dynamically from the backend. Each module appears as a labeled section with its fields grouped under collapsible headers.

> **📸 Screenshot:** Configuration page showing the Lokte section expanded with three fields: Enable toggle, API Key, and User ID.

Fields are rendered according to their type:

| Field type | Rendered as |
|---|---|
| Toggle | On/Off switch |
| Text | Single-line text input |
| Secret | Password input (value masked after save) |
| Number | Number input |
| Select | Dropdown |

Changes are not saved automatically. You must click **Save changes** after editing.

---

## AI Assistant toggle

The **AI Assistant** section contains a single toggle:

- **Enabled** — the chat assistant is available for all admin users on the store
- **Disabled** — the chat page shows a "disabled" message and the input is locked

This toggle acts as a global kill switch for the feature. Lokte credentials can still be configured while the assistant is disabled.

> **ℹ️ Note:** Even if Lokte is fully configured, the assistant will not function unless this toggle is on.

---

## Lokte settings

The **Lokte** section contains three fields:

### Enable

A toggle that controls whether the Lokte integration is active for this shop. Both the AI Assistant toggle and this toggle must be on for the chat to work.

### API Key

The secret key used to authenticate requests to the Lokte API. This field is masked — once saved, the stored value shows as `****`.

> **⚠️ Warning:** Do not share your API key. It grants access to your Lokte workspace and all indexed documents.

### User ID

The Lokte persona ID that the assistant uses for conversations. This determines which Lokte persona and knowledge set the assistant draws from.

---

## Saving changes

After editing any field:

1. Click **Save changes** at the bottom of the page.
2. Each changed field is saved individually to the backend.
3. A success or error indicator is shown once the save completes.

> **📸 Screenshot:** Save changes button in active state, and the result banner after a successful save.

If a save fails for any field, a warning is shown. Try refreshing and saving again — if the problem persists, check the app's backend logs.

---

## Dev / Testing section (non-production only)

In non-production environments, a **Dev / Testing** section appears in Configuration. It contains toggles for simulating error states:

| Toggle | Effect |
|---|---|
| Force chat error response | Makes every chat request return a 500 error |
| Force "not configured" state | Makes the app behave as if Lokte is not configured |

These are for QA and development use only. They are not visible in production.

---

## Related

- [Configure Lokte Integration](../how-to/02-configure-lokte-integration.md) — step-by-step guide to getting Lokte credentials and connecting them
- [Getting Started](01-getting-started.md) — prerequisites and first login
