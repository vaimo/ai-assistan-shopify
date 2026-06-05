# How to Configure the Lokte Integration

Before merchants can use the AI Assistant, an administrator must connect the app to Lokte by providing an API key and a User ID (persona). This guide walks through how to get those credentials and enter them in the app.

---

## What you need

- Admin access to the Shopify store where the app is installed
- A Lokte account (provided by your organization)
- A Lokte API key
- A Lokte persona (User ID)

If you do not have a Lokte account, contact the person in your organization who manages Lokte, or the team that deployed this app.

---

## Step 1: Get your Lokte API key

1. Log in to your Lokte instance (e.g., `https://lokte.vaimo.network`).
2. Go to your user profile or API settings page.
3. Generate or copy an existing API key.

> **⚠️ Warning:** Treat this key like a password. Anyone with it can query your Lokte workspace.

> **📸 Screenshot:** Lokte UI showing the API key generation screen.

---

## Step 2: Get your Lokte User ID (persona)

The User ID is the persona identifier the assistant uses when creating chat sessions. In Lokte, this corresponds to a persona that determines which knowledge set and behavior the assistant uses.

1. In the Lokte admin panel, navigate to **Personas** (or **Assistants**, depending on your version).
2. Find the persona you want to use for this Shopify store.
3. Copy the persona's numeric ID.

> **📸 Screenshot:** Lokte personas list with the ID column visible.

---

## Step 3: Enter credentials in the app

1. Open AI Assistant in your Shopify admin.
2. Click **Configuration** in the sidebar.
3. Find the **Lokte** section.

> **📸 Screenshot:** Configuration page with the Lokte section expanded.

4. Set **Enable** to **On**.
5. Paste your API key into the **API Key** field.
6. Paste the persona ID into the **User ID** field.
7. Click **Save changes**.

> **📸 Screenshot:** Lokte section with all three fields filled in and the Save button highlighted.

After saving:
- The API Key field shows `****` — this is expected. The value is encrypted and stored securely.
- The User ID field shows the ID you entered.

---

## Step 4: Enable the AI Assistant

The Lokte section has its own **Enable** toggle, but there is also a top-level **AI Assistant** toggle in the **AI Assistant** section of Configuration. Both must be on.

1. In Configuration, find the **AI Assistant** section.
2. Set **Enable** to **On**.
3. Click **Save changes**.

---

## Step 5: Verify the connection

1. Go back to the main AI Assistant page (click the chat icon or **Home** in the sidebar).
2. The input box should be active and the placeholder should read "How can AI Assistant help you today?"
3. Type a test question and press Enter.
4. If you get a response, the connection is working.

> **ℹ️ Note:** If you see "Configure Lokte integration to start chatting…", the save may not have completed successfully, or one of the required fields is still empty. Return to Configuration and check each field.

---

## Troubleshooting

**The input is still disabled after saving**
- Confirm both the Lokte **Enable** toggle and the top-level **AI Assistant** toggle are on and saved.
- Confirm the API Key field is not empty (it shows `****` if set, empty if not).
- Confirm the User ID field has a value.

**The assistant returns a 503 error**
Lokte is enabled in the configuration but the API key or User ID did not save correctly. Open Configuration, re-enter both fields, and save again.

**The assistant returns a 502 error**
The app could not reach the Lokte API. This is usually a network or Lokte availability issue. Check with your infrastructure team.
