---
applyTo: "**/*.{test,spec}.{js,ts,jsx,tsx}"
---

# Shopify Testing Standards

## General

- Test file lives next to its source file: `webhooks/orders-paid.ts` → `webhooks/orders-paid.test.ts`
- Use `describe` blocks to group by unit under test; use `it`/`test` with an explicit behaviour description
- Follow Arrange / Act / Assert — one assertion concept per test; multiple `expect` calls are fine if they test the same behaviour
- Never use `any` in test assertions — type your mocks and responses properly

## Webhook Handler Testing

- Always test HMAC verification — include a test case for invalid HMAC returning 401
- Use real HMAC signatures in tests: generate with Node's `crypto.createHmac('sha256', secret).update(body).digest('base64')`
- Test idempotency: verify that processing the same `X-Shopify-Webhook-Id` twice does not create duplicate records
- Test the async job is enqueued (not processed) within the 5-second handler — mock the queue and assert it was called

```ts
it('rejects webhook with invalid HMAC', async () => {
  const response = await request(app)
    .post('/webhooks/orders/paid')
    .set('X-Shopify-Hmac-Sha256', 'invalid')
    .send(payload);
  expect(response.status).toBe(401);
});
```

## GraphQL / Admin API Testing

- Never make real API calls in unit tests — mock `@shopify/shopify-api` or your GraphQL client
- Use `nock` or `msw` (Mock Service Worker) to intercept HTTP requests in integration tests
- Assert the exact GraphQL operation sent — not just the response; verify mutations include correct variables
- Test `userErrors` handling: mock a response that returns `userErrors` and assert your code surfaces the error correctly

```ts
it('handles metafieldsSet userErrors', async () => {
  mockGraphQL({ userErrors: [{ field: 'value', message: 'Invalid value' }] });
  await expect(updatePoints(customerId, 100)).rejects.toThrow('Invalid value');
});
```

## Shopify Functions Testing

- Use `shopify app function run` for local end-to-end function testing with real Wasm execution
- Unit test the input transformation and output construction logic separately from the Wasm boundary
- For JavaScript functions: test with representative cart payloads that include edge cases (empty cart, 200+ line items, missing metafields)
- Always test the function with the minimum and maximum input sizes to verify it stays within resource limits

## Extension Testing

- Use `@shopify/ui-extensions-testing-framework` for checkout and admin UI extension component tests
- Mock `useAppMetafields` and other extension APIs — never assume real Shopify checkout state in tests
- Test the `instructions.discounts.canUpdateDiscountCodes === false` branch (accelerated checkout) — ensure the UI degrades gracefully

```ts
it('hides redemption UI during accelerated checkout', () => {
  mockExtensionApi({ instructions: { discounts: { canUpdateDiscountCodes: false } } });
  const { queryByText } = render(<LoyaltyRedemption />);
  expect(queryByText('Redeem points')).toBeNull();
});
```

## Hydrogen Route Testing

- Use React Router's `createMemoryRouter` + `RouterProvider` for testing Hydrogen routes in isolation
- Mock `context.storefront.query()` — never make real Storefront API calls in tests
- Test loader functions directly — call the exported `loader` function with a mock `LoaderFunctionArgs` object
- Assert cache strategy is set correctly on loader responses

```ts
it('loader returns product data with CacheLong strategy', async () => {
  const response = await loader({ params: { handle: 'test-product' }, context: mockContext });
  expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
});
```

## Mocking Shopify APIs

- Create a shared `__mocks__/shopify.ts` factory for common mock shapes (customer, order, product, metafield)
- Always include `id` as a GID (`gid://shopify/Customer/123`) — never use plain integers
- Keep mock data minimal — only include fields your code actually uses
- Use `vi.mock()` (Vitest) or `jest.mock()` at the module level — avoid per-test mock setup where possible

## Coverage

- Minimum coverage: **80% lines** — enforced in CI
- 100% coverage is not the goal — prioritise testing behaviour over implementation details
- Always test: happy path, error/failure path, edge cases (empty arrays, null values, rate limit responses)
- Do not test Polaris render output pixel-by-pixel — test behaviour (click handler called, error shown, etc.)
