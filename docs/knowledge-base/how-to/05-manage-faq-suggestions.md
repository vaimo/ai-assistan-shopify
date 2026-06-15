# How to Manage FAQ Suggestions

The AI Assistant can show three suggested questions when a chat is empty. These suggestions help users start faster and reflect the kinds of questions people ask in your store.

This guide explains how FAQ suggestions work, how to enable or disable automatic generation, and how to force a regeneration from the Configuration page.

---

## What FAQ suggestions are

FAQ suggestions are the three clickable question buttons shown on the empty chat screen.

> **📸 Screenshot:** Empty chat screen showing three suggested question buttons near the input box.

Clicking a suggestion sends that question immediately, just like typing it into the input box.

Suggestions can come from:

- **Generated FAQ suggestions** — questions created from recent real user questions in this store
- **Built-in default questions** — shown when no generated suggestions are available yet

The built-in defaults are:

- "What are my top-selling products this month?"
- "Show me recent orders that need attention."
- "How can I improve my store's conversion rate?"

---

## What you need

- Admin access to the Shopify store where the app is installed
- The AI Assistant app installed and available in Shopify admin
- Lokte configured and reachable
- AI Assistant enabled in Configuration

FAQ generation uses the same Lokte API key and User ID as the chat assistant. If Lokte is not configured, FAQ generation cannot complete.

See [Configure Lokte Integration](02-configure-lokte-integration.md) if setup is not complete.

---

## Step 1: Open FAQ Suggestions settings

1. Open AI Assistant in your Shopify admin.
2. Click **Configuration** in the sidebar.
3. Find the **FAQ Suggestions** section.

> **📸 Screenshot:** Configuration page showing the FAQ Suggestions section.

The section includes:

| Setting | What it does |
|---|---|
| **Enable AI-generated suggestions** | Turns automatic FAQ suggestion generation on or off |
| **Regeneration interval (hours)** | Sets how often the app may generate new suggestions |
| **Fallback questions** | Stored fallback text fields for future use |

> **ℹ️ Note:** The fallback question fields are visible in Configuration, but the current chat screen still uses the built-in default questions when no generated FAQ suggestions are available.

---

## Step 2: Enable AI-generated suggestions

1. In **FAQ Suggestions**, set **Enable AI-generated suggestions** to **Enabled**.
2. Set **Regeneration interval (hours)**.
   - The default is **24** hours.
   - The backend enforces a minimum of **1** hour and a maximum of **168** hours.
3. Click **Save changes**.

> **📸 Screenshot:** FAQ Suggestions settings with Enable set to Enabled and the regeneration interval filled in.

After saving, the app checks for new FAQ suggestions during its hourly background job.

---

## Step 3: Let the app collect questions

FAQ suggestions are generated from real questions asked in the chat. Each successful user message is added to a shop-specific FAQ question pool.

The app needs at least **5 distinct questions** before it attempts to generate suggestions. If there are fewer than 5 distinct questions, generation is skipped and the current suggestions stay unchanged.

Questions in the FAQ pool are:

- Scoped to the current shop
- Used only for FAQ suggestion generation
- Not removed when a user clears their own conversation history
- Cleared after a successful FAQ generation run

---

## Step 4: Check current FAQ status

1. Open **Configuration**.
2. Scroll to **FAQ Suggestions — Management**.

> **📸 Screenshot:** FAQ Suggestions — Management card showing last generated timestamp and current questions.

The management card shows:

- The last successful generation time
- The currently generated questions, if any exist
- A **Force Regenerate FAQ Now** button

If no suggestions have been generated yet, the card shows:

> "No FAQ suggestions have been generated yet."

The chat screen will continue showing the built-in default questions until generated suggestions exist.

---

## Step 5: Force regeneration

Use force regeneration when you want to generate suggestions immediately instead of waiting for the next scheduled run.

Manual regeneration does not wait for the configured interval. In the current implementation, the button can still attempt a manual run even if automatic AI-generated suggestions are disabled, but future scheduled runs stay disabled until you turn the setting back on.

1. Open **Configuration**.
2. Scroll to **FAQ Suggestions — Management**.
3. Click **Force Regenerate FAQ Now**.

> **📸 Screenshot:** FAQ Suggestions — Management card with the Force Regenerate FAQ Now button highlighted.

While generation is running, the button shows **Generating...**.

After the run finishes:

- If generation succeeds, the management card updates with the latest questions and timestamp.
- If generation is skipped because there are fewer than 5 distinct questions, the existing suggestions remain unchanged.
- If generation fails, the page shows an error message: "FAQ generation failed. Check that Lokte is configured and reachable."

---

## What users see on the chat screen

When a user opens a new or empty chat:

1. The frontend requests the current FAQ suggestions for the shop.
2. If generated questions exist, the chat screen shows those three questions.
3. If no generated questions exist, the chat screen shows the built-in default questions.

> **📸 Screenshot:** Empty chat screen showing generated FAQ suggestion buttons.

Generated suggestions are shop-specific. Questions from one Shopify store are not used for another store.

---

## Disabling AI-generated suggestions

To stop automatic FAQ generation:

1. Open **Configuration**.
2. Find **FAQ Suggestions**.
3. Set **Enable AI-generated suggestions** to **Disabled**.
4. Click **Save changes**.

When disabled, the hourly generation job skips the shop. Existing generated suggestions may remain stored, but no new automatic generation runs will happen while the setting is disabled.

---

## Troubleshooting

**No generated suggestions appear**
- Confirm **Enable AI-generated suggestions** is enabled and saved.
- Confirm Lokte is configured and reachable.
- Make sure users have asked at least 5 distinct questions since the last successful generation.
- Check **FAQ Suggestions — Management** for the last generated timestamp.

**Force regeneration does not change the questions**
- There may be fewer than 5 distinct questions in the FAQ question pool.
- Existing suggestions are preserved when a generation run is skipped.
- Ask a few new, distinct chat questions and try again.

**Generation fails**
- Confirm the Lokte API key and User ID are configured.
- Confirm the top-level **AI Assistant** setting is enabled.
- Check whether Lokte is reachable from the app environment.

See [Troubleshoot Common Issues](04-troubleshoot-common-issues.md) for more general setup and connectivity checks.
