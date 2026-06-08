---
applyTo: "**/*.{graphql,gql}"
---

# Shopify GraphQL API Standards

## Query Design

- Request only fields you display — never use `__typename` dumps or wildcard selections
- Use fragments for shared field sets across queries
- Name all operations: `query GetProductById($id: ID!)` — never use anonymous operations
- Paginate with `first:` / `after:` cursors — never fetch more than 250 nodes per request

## API Version

- Pin API version explicitly in all client configurations (e.g. `2026-04`)
- Document the minimum required API version in `README.md`
- Test version upgrades in a development store before promoting
- Shopify releases new API versions quarterly — review the [developer changelog](https://shopify.dev/changelog) before upgrading

## Mutations

- Always request `userErrors` field on every mutation — surface errors to the user
- Use optimistic UI updates for cart mutations; roll back on error
- Wrap related mutations in a single API call where the API supports it

## Rate Limiting

- Admin API (GraphQL): cost-based throttling via a leaky bucket algorithm — bucket size and restore rate vary by plan: Standard 100 pts, Advanced 200 pts, Plus 1000 pts, Enterprise 2000 pts; restore rate is 50 pts/s for Plus (proportionally lower for other plans)
- Admin API (REST): leaky bucket with 40-request bucket size, 2 requests/second leak rate
- Storefront API: **no request-count rate limits** — only a query complexity limit of 1,000 for tokenless access; bot protection may return 430 for suspicious traffic
- Implement exponential backoff on 429 responses
- Use bulk operations (`bulkOperationRunQuery`) for large data exports — never loop paginated queries

## Webhooks vs. Polling

- Prefer webhooks over polling for real-time data needs
- Register webhooks with `apiVersion` matching your app's current version
- Always process webhooks idempotently — duplicate delivery is expected
