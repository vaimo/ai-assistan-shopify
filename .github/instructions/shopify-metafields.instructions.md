---
applyTo: "**/*.{graphql,gql,toml}"
---

# Shopify Metafields & Metaobjects — Coding Standards

## Namespace Conventions

- Use the **app-reserved namespace** for all app-owned metafields — omit `namespace` in API calls to default to it, or use `$app` explicitly in queries
- **Never** use the legacy `app--*` prefix pattern — it is deprecated
- Never use the generic `custom` namespace in production apps — it is for merchant-created metafields only
- Use descriptive key names in `snake_case`: `loyalty_points_balance`, not `pts` or `lpb`

## Declaring Metafield Definitions

- Declare app-owned metafield definitions in `shopify.app.toml` — do not use `metafieldDefinitionCreate` mutation for app-owned fields
- Pin the owner type explicitly: `customer`, `product`, `variant`, `order`, `collection`, `location`, or `page`

```toml
[[customer.metafields]]
namespace = "app"
key = "loyalty_points_balance"
type = "number_integer"
name = "Loyalty Points Balance"
```

- After adding definitions, run `shopify app deploy` to sync — definitions are not live until deployed

## Type Selection Guide

| Data | Recommended type |
|------|-----------------|
| Integers (points, counts) | `number_integer` |
| Decimals (ratings, percentages) | `number_decimal` |
| Short text (labels, codes) | `single_line_text_field` |
| Long text (notes, descriptions) | `multi_line_text_field` |
| Rich content | `rich_text_field` |
| Boolean flags | `boolean` |
| Dates | `date` |
| Datetimes | `date_time` |
| URLs | `url` |
| JSON objects / arrays | `json` — only when no typed alternative exists |
| References to other resources | `product_reference`, `variant_reference`, `file_reference`, etc. |
| Colour values | `color` |
| Dimensions | `dimension` |

- Prefer typed metafield types over `json` — typed fields are validated, indexable, and surfaced in the Shopify admin automatically
- Use `json` only for complex nested structures with no typed equivalent

## Reading Metafields

- Query metafields on their owner resource — do not use the standalone `metafield` root query unless absolutely necessary
- Always request `key`, `value`, `type`, and `namespace`:

```graphql
query GetCustomerPoints($customerId: ID!) {
  customer(id: $customerId) {
    metafield(namespace: "$app", key: "loyalty_points_balance") {
      value
      type
      compareDigest
    }
  }
}
```

- Use `compareDigest` when you need compare-and-swap (atomic updates) — available since API `2024-07`

## Writing Metafields

- Use `metafieldsSet` mutation for creating and updating — it is an upsert operation
- For concurrent writes (e.g. incrementing a counter), use `compareDigest` to prevent race conditions:

```graphql
mutation UpdatePoints($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      key
      value
    }
    userErrors {
      field
      message
      code
    }
  }
}
```

- Always handle `userErrors` — a `compareDigest` mismatch returns a `STALE_OBJECT` error; retry with a fresh read

## Metaobjects

- Use metaobjects for structured, reusable content types (e.g. FAQs, team members, loyalty tiers)
- Define metaobject schemas in the Shopify admin or via `metaobjectDefinitionCreate` mutation — pin `type` as a stable identifier
- Access metaobjects in Liquid with `{% metaobject %}` or via the Admin/Storefront GraphQL API
- Metaobjects can be referenced from metafield definitions using the `metaobject_reference` type

## Storefront API Access

- Metafields are not exposed on the Storefront API by default — they must be explicitly enabled per definition
- Enable Storefront API access in the metafield definition settings or via `metafieldDefinitionUpdate`
- Never expose sensitive app data (e.g. internal IDs, pricing rules, fraud signals) via Storefront API metafields — they are publicly readable

## Performance

- Batch metafield reads using `metafields(namespace: "$app", keys: [...])` — avoid N+1 metafield queries
- Metafield values exceeding **10,000 bytes** are not returned in Shopify Functions input queries
- For large JSON metafields, consider splitting into multiple typed fields or using an external data store
