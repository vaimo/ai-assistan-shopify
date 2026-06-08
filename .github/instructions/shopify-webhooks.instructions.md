---
applyTo: "**/webhooks/**/*.{js,ts,jsx,tsx}"
---

# Shopify Webhooks — Coding Standards

## Response Requirements

- **Always return HTTP 200 within 5 seconds** — Shopify marks a delivery as failed if no 200 is received in time
- Never do heavy processing synchronously in the webhook handler — enqueue the payload to a job queue (Bull, SQS, etc.) and return 200 immediately
- Return 200 even when the payload is intentionally ignored (e.g. duplicate, already processed) — returning 4xx causes unnecessary retries

## HMAC Verification

- **Always verify `X-Shopify-Hmac-Sha256` before processing any payload** — reject unverified requests with 401
- Use the raw request body for HMAC computation — never parse JSON first; parsing may alter byte order
- Use `@shopify/shopify-api`'s `shopify.webhooks.validate()` for verification — do not implement raw HMAC manually

```ts
// Correct: verify before touching payload
const verified = await shopify.webhooks.validate({
  rawBody: rawBody,
  rawRequest: req,
  rawResponse: res,
});
if (!verified.valid) return res.status(401).send('Unauthorized');
```

## Idempotency

- Every webhook handler MUST be idempotent — Shopify delivers each webhook **at least once**; duplicates are expected
- Store processed event IDs (use `X-Shopify-Webhook-Id` header) and skip already-processed payloads
- Use database upserts or conditional writes — never assume a webhook is the first or only delivery

## GDPR Mandatory Webhooks

All apps must register and handle these three GDPR webhooks — **required for App Store approval**:

| Topic | Handler responsibility |
|-------|----------------------|
| `customers/data_request` | Return all customer data your app stores within 30 days |
| `customers/redact` | Delete all data for the specified customer |
| `shop/redact` | Delete all data for the specified shop (triggered 48h after uninstall) |

- Register GDPR webhooks in `shopify.app.toml` under `[webhooks.privacy_compliance]`
- Log all GDPR requests — failure to comply can result in app removal from the App Store

## Registration

- Always pin `api_version` when registering webhooks — use the same version as your app's Admin API calls
- Register webhooks programmatically on app install via the `afterAuth` hook, not manually in the Partner Dashboard
- Use `shopify.webhooks.addHandlers()` to declare handlers; use `shopify.webhooks.register()` to sync with Shopify

```ts
shopify.webhooks.addHandlers({
  ORDERS_PAID: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/webhooks/orders/paid',
    callback: handleOrderPaid,
  },
});
```

## Delivery Guarantees

- Shopify retries failed webhook deliveries with exponential backoff for **up to 48 hours**
- After 19 consecutive failures, Shopify pauses delivery for that topic — monitor webhook delivery health in the Partner Dashboard
- Design handlers to tolerate out-of-order delivery — do not assume webhook order matches event order

## Error Handling

- If processing fails after returning 200, handle the error in your async job — do not surface it to the webhook response
- Log all webhook processing errors with the `X-Shopify-Webhook-Id` and topic for debugging
- Implement a dead-letter queue for payloads that repeatedly fail processing

## Security

- Validate the `X-Shopify-Domain` header matches the expected shop domain — prevents cross-shop payload injection
- Never log full webhook payloads in production — they may contain PII (customer email, address, order details)
- Webhook endpoints must be HTTPS — Shopify will not deliver to HTTP endpoints
