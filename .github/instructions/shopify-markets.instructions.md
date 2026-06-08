---
applyTo: "**/*.{liquid,tsx,jsx,ts,js}"
---

# Shopify Markets & Internationalisation — Coding Standards

## Shopify Markets Overview

- **Shopify Markets** manages multi-region selling: currency, language, domain/path, and pricing per market
- Never build custom multi-currency or multi-language logic — use Markets APIs and Liquid objects
- All market configuration lives in the Shopify admin — apps and themes must read and respect it, not override it

## Currency & Pricing in Liquid

- Always use `{{ price | money }}` for price display — never format currency amounts manually
- Use `{{ price | money_with_currency }}` when the currency code must be visible alongside the amount
- Use `{{ cart.currency.iso_code }}` to get the active presentment currency — never hardcode currency codes
- For price ranges: use `product.price_varies` to conditionally show "From {{ product.price_min | money }}"
- `product.price` returns the price in the **presentment currency** — it is already market-adjusted; do not convert manually

```liquid
{% if product.price_varies %}
  From {{ product.price_min | money }}
{% else %}
  {{ product.price | money }}
{% endif %}
```

## Language & Translation in Liquid

- Always use `{{ 'key' | t }}` for all user-visible strings — never hardcode English
- Use the `localization` object to expose language and country switching UI:
  - `localization.language` — currently active language
  - `localization.available_languages` — all enabled languages for the current market
  - `localization.country` — active country
  - `localization.available_countries` — all countries available for selection
- Use `{% form 'localization' %}` to render a language/country switcher form — do not build a custom switcher

```liquid
{% form 'localization' %}
  <select name="language_code">
    {% for language in localization.available_languages %}
      <option value="{{ language.iso_code }}"
        {% if language.iso_code == localization.language.iso_code %}selected{% endif %}>
        {{ language.endonym_name }}
      </option>
    {% endfor %}
  </select>
  <button type="submit">{{ 'general.language.submit_button_label' | t }}</button>
{% endform %}
```

## Market-Aware URLs

- Use `routes.root_url` instead of hardcoded `/` — in market-specific path setups (e.g. `/en-gb/`), the root differs
- Use `{{ product.url }}` and `{{ collection.url }}` — these automatically include the market path prefix
- Never construct URLs by string concatenation — always use Liquid URL helpers

## Markets in Hydrogen

- Access the active market via the `i18n` context: `context.storefront.i18n` provides `language` and `country`
- Use `getLocaleFromRequest(request)` to detect the correct locale from the URL or headers
- Pass locale to `createStorefrontClient()` — Storefront API responses will be market-adjusted automatically

```ts
const { language, country } = storefront.i18n;
const { data } = await storefront.query(PRODUCT_QUERY, {
  variables: { handle, language, country },
});
```

- Define market-aware routes in `app/routes/` using locale prefixes: `($locale).products.$handle.tsx`
- Always redirect to the correct locale path when a market is detected — use a root loader for locale detection

## Multi-Currency in Hydrogen / Storefront API

- Pass `country` variable to all Storefront API queries that return prices — without it, prices are in the store's default currency
- Use the `MoneyV2` type for all price fields — never use deprecated `price` float fields
- Display prices with the `<Money>` Hydrogen component — it formats according to the active locale and currency automatically

```graphql
query GetProduct($handle: String!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
  product(handle: $handle) {
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
}
```

## Markets in the Admin API

- Use the `markets` query to list configured markets and their settings
- When updating pricing for a market, use `marketCatalogCreate` / `priceListCreate` — never manually adjust product prices per market
- Market-specific metafields are not natively supported — use a separate metafield per market identified by a market ID key if needed

## Testing

- Test with multiple locales — at minimum: LTR (English), RTL (Arabic/Hebrew if applicable), and a non-USD currency
- Verify price display does not break layout with long currency names (e.g. "Brazilian Real")
- Verify language switcher correctly persists the selection across navigation
