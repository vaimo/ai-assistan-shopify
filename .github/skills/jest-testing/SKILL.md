---
name: jest-testing
description: Generate Jest/Vitest unit and integration tests for Shopify app backend, React components, and theme JS utilities
---

# /jest-testing — Shopify Test Generator

## When to Use

When adding tests for existing code, for TDD before implementing a feature, or to increase coverage before a release.

## Usage

```
/jest-testing path/to/file
/jest-testing path/to/directory
```

## Test Patterns by Target Type

### App Backend (Node.js / Express / Remix)

```js
// Webhook handler test pattern
describe('webhookHandler', () => {
  it('returns 401 when HMAC is invalid', async () => { ... })
  it('returns 200 and processes payload when HMAC is valid', async () => { ... })
  it('is idempotent — processes same webhook twice safely', async () => { ... })
})

// Shopify API client test pattern — mock with nock or msw
describe('productService', () => {
  it('fetches product by ID using Admin API', async () => { ... })
  it('handles rate limit 429 with retry', async () => { ... })
  it('throws typed error when product not found', async () => { ... })
})
```

### React / Polaris Components

```tsx
// Component test pattern
describe('<ProductCard />', () => {
  it('renders product title and price', () => { ... })
  it('calls onSelect when card is clicked', () => { ... })
  it('shows skeleton when loading prop is true', () => { ... })
  it('is accessible — no axe violations', async () => { ... }) // @axe-core/react
})
```

### Theme JavaScript Utilities

```js
// Pure utility function test pattern
describe('formatMoney', () => {
  it('formats cents to currency string', () => { ... })
  it('respects currency symbol from shop settings', () => { ... })
  it('handles zero correctly', () => { ... })
})

// DOM interaction test pattern (jsdom)
describe('CartDrawer', () => {
  it('opens when trigger is clicked', () => { ... })
  it('traps focus when open', () => { ... })
  it('closes on Escape key', () => { ... })
})
```

### GraphQL Operations

```ts
// Mock with msw (Mock Service Worker)
describe('getProductQuery', () => {
  it('returns product data for valid ID', async () => { ... })
  it('returns null for non-existent product', async () => { ... })
  it('handles network error gracefully', async () => { ... })
})
```

## Coverage Requirements

Aim for:
- Statements: ≥ 80%
- Branches: ≥ 75%
- Functions: ≥ 80%
- Lines: ≥ 80%

Always test:
- Happy path
- Error / edge cases (empty arrays, null values, API failures)
- Security-sensitive paths (auth, webhook validation)

## Output

Generated test files placed alongside source files as `{filename}.test.ts`.
Test utilities / fixtures placed in `__tests__/helpers/` or `test/fixtures/`.
