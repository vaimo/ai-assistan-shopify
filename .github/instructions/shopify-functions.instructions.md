---
applyTo: "extensions/**/*.{rs,js,ts}"
---

# Shopify Functions — Coding Standards

## Language Choice

- **Rust is strongly recommended** — most performant; least risk of hitting resource limits with large carts
- JavaScript/TypeScript is supported but increases the risk of exceeding instruction limits on high-volume carts
- All functions compile to **WebAssembly (Wasm)** — Node.js APIs and standard library modules are not available

## Resource Limits

### Fixed Limits (all functions)

| Resource | Limit |
|----------|-------|
| Compiled binary size | 256 kB |
| Runtime linear memory | 10,000 kB |
| Runtime stack memory | 512 kB |
| Log output | 1 kB (truncated beyond this) |

### Dynamic Limits (carts up to 200 line items)

| Resource | Limit |
|----------|-------|
| Execution instruction count | 11 million |
| Function input | 128 kB |
| Function output | 20 kB |

Limits scale proportionally for carts with >200 line items.

## Rules

- **No randomness or clock access** — Shopify enforces determinism; `Math.random()`, `Date.now()`, Rust `rand` crate, etc. are not allowed
- **No STDOUT/STDERR debugging** — do not use `println!` or `console.log` in production functions; test locally via `shopify app function run`
- **No dynamic code execution** — the Shopify App Store prohibits apps that edit or execute function code at runtime
- Apps can only reference **their own** functions in GraphQL mutations — never another app's function ID; doing so results in a `Function not found` error
- Functions are **never invoked directly by URL** — Shopify invokes them within the customer journey as needed

## Configuration (`shopify.extension.toml`)

- Always pin `api_version` to the latest supported version (`2026-01`)
- `name` is merchant-visible in the Shopify admin — choose a clear, descriptive name
- Declare run targets under `[[extensions.targeting]]` with `target`, `input_query`, and `export`
- After API version bumps, regenerate the schema: `shopify app function schema`
- After schema changes in JavaScript functions, regenerate types: `shopify app function typegen`

## Input Queries

- Request only the fields your function needs — minimise query cost to stay under the 30-point limit
- Maximum input query size (excluding comments): **3,000 bytes**
- Maximum calculated query cost: **30 points**
- Metafield values exceeding 10,000 bytes will **not** be returned

### Input Query Field Costs

| Field type | Cost |
|------------|------|
| `__typename` | 0 |
| Any field returning a `Metafield` object | 3 |
| Any field on a `Metafield` object | 0 |
| `metaobject` root field | 1 |
| `field(key:)` on a `Metaobject` | 3 |
| `hasAnyTag`, `hasTags` | 3 |
| `inAnyCollection`, `inCollections` | 3 |
| Other leaf nodes (`id`, `sku`, etc.) | 1 |

## Checkout Execution Order

Functions execute in this sequence — a function's input is built from the output of prior steps:

1. **Cart Transform** — modify cart line items
2. **Discount** — apply cart line discounts
3. **Fulfillment Constraints** — define fulfillment group constraints
4. **Order Routing** — assign fulfillment locations
5. **Pickup Point Delivery Option Generator** — generate pickup point options
6. **Local Pickup Delivery Option Generator** — generate local pickup options
7. **Delivery Customization** — filter or sort delivery methods
8. **Discount** — apply delivery discounts
9. **Payment Customization** — filter or sort payment methods
10. **Cart and Checkout Validation** — validate cart and checkout state (runs last)

Understanding this order is critical — do not assume data from a later step is available as input to an earlier one.

## Plan Availability

- **Any plan**: public apps distributed through the Shopify App Store that contain functions
- **Shopify Plus only**: custom apps using Shopify Function APIs
