# How to Install the App

This guide covers installing AI Assistant on your Shopify store and completing the initial OAuth authorization.

---

## Prerequisites

- Shopify store with admin access
- The app must be available through a Shopify Partner invite link or the Shopify App Store listing

---

## Installation steps

### Step 1: Open the install link

Click the install link provided by your team or Shopify Partner. This takes you to a Shopify OAuth authorization screen.

> **📸 Screenshot:** Shopify OAuth consent screen showing the app name and requested permissions.

### Step 2: Review permissions

The app requests the following access scopes:

| Scope | Purpose |
|---|---|
| `write_products` | Access product data |
| `read_orders` | Access order data |

Review the permissions and click **Install app** to proceed.

> **ℹ️ Note:** If you see a warning about the app being from an unlisted developer, this is normal for internally distributed or development apps. Confirm with your administrator before proceeding.

### Step 3: Complete authorization

After clicking Install, Shopify redirects you back to the app. The app performs its OAuth callback and creates your shop record in its database.

> **📸 Screenshot:** App loading screen after successful OAuth redirect.

### Step 4: Access the app

After installation, AI Assistant appears in your Shopify admin left sidebar under **Apps**. Click it to open the chat page.

> **📸 Screenshot:** Shopify admin with AI Assistant listed in the Apps section of the sidebar.

---

## After installation

Once installed, the app is ready for configuration. The chat assistant will not be functional until:

1. Lokte credentials (API key and User ID) have been added in Configuration
2. The AI Assistant and Lokte toggles are both enabled

See [Configure Lokte Integration](02-configure-lokte-integration.md) for the next step.

---

## Reinstalling after uninstall

If the app was previously uninstalled and you reinstall it:

- Your shop record is recreated automatically
- Any previously saved configuration values are **not** restored (they are removed on uninstall)
- You will need to re-enter Lokte credentials

---

## Troubleshooting

**Redirect loop after authorization**
The app URL in the Shopify Partner Dashboard may not match the deployed app URL. Contact your administrator to verify the `APP_URL` environment variable and the OAuth redirect URI in the Partner Dashboard.

**"Invalid redirect URL" error**
The redirect URI registered in the Partner Dashboard (`https://your-domain.com/auth/callback`) must exactly match the deployed app's domain. Contact your administrator.
