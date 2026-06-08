---
applyTo: "**/app/**/*.{tsx,jsx}"
---

# Shopify Polaris — App UI Standards

## App Structure

- Wrap the entire app in `<AppProvider>` with the `i18n` prop — required for all Polaris components to function
- Use `<Frame>` as the root layout for embedded apps that have navigation, top bars, or toast notifications
- Define navigation with `<Navigation>` inside `<Frame>` — never build custom nav for standard admin navigation patterns

```tsx
<AppProvider i18n={enTranslations}>
  <Frame navigation={<Navigation>...</Navigation>}>
    {children}
  </Frame>
</AppProvider>
```

## Page Layout

- Every route renders a `<Page>` component as its root — never render content directly without a `<Page>` wrapper
- Use `title`, `subtitle`, `primaryAction`, and `secondaryActions` props on `<Page>` — do not build custom page headers
- Use `<Layout>` + `<Layout.Section>` for two-column layouts; `<Layout.AnnotatedSection>` for settings pages with descriptions

```tsx
<Page
  title="Loyalty Points"
  primaryAction={{ content: 'Save', onAction: handleSave }}
>
  <Layout>
    <Layout.Section>
      <Card>...</Card>
    </Layout.Section>
    <Layout.Section variant="oneThird">
      <Card>...</Card>
    </Layout.Section>
  </Layout>
</Page>
```

## Cards & Sections

- Use `<Card>` to group related content — never use raw `<div>` containers for content grouping
- Use `<BlockStack>` and `<InlineStack>` for spacing and alignment — never use CSS margin/padding hacks between Polaris components
- Use `<Divider>` between logically separate sections within a card

## Forms & Validation

- Use Polaris `<Form>` + `<FormLayout>` for all forms
- Use `<TextField>`, `<Select>`, `<Checkbox>`, `<RadioButton>` — never build custom form inputs for standard data types
- Display field-level errors via the `error` prop on individual inputs — not as a separate error component
- Display form-level errors with `<Banner tone="critical">` above the form
- Validate on submit, not on every keystroke — use `onBlur` for individual field validation only

```tsx
<TextField
  label="Points per dollar"
  type="number"
  value={value}
  onChange={setValue}
  error={error}
  autoComplete="off"
/>
```

## Loading States

- Use `<SkeletonPage>` + `<SkeletonBodyText>` / `<SkeletonDisplayText>` for initial page loads — never show a blank page or spinner alone
- Use `<Spinner>` only for inline loading states (e.g. a button action in progress)
- Set `loading={true}` on `<Page>` during navigation transitions
- Never block the entire UI with a full-screen loading overlay — prefer skeleton screens

## Empty States

- Use `<EmptyState>` when a list or page has no data — always include a heading, description, and a primary action
- Never show a blank space or "no data" text without a Polaris `<EmptyState>`

## Feedback & Notifications

- Use `<Toast>` (via `useToast()`) for transient success/info messages — auto-dismiss after 5 seconds
- Use `<Banner>` for persistent status messages (warnings, errors, informational notices that require action)
- Use `tone="success"` for confirmations, `tone="warning"` for non-blocking issues, `tone="critical"` for errors
- Never use `alert()` or `confirm()` — always use Polaris modal and banner patterns

## Data Tables

- Use `<DataTable>` for tabular data with sorting — always define `columnContentTypes` for alignment
- Use `<IndexTable>` for resource lists that support bulk actions, filtering, and row selection
- Always include pagination for lists with potentially >25 items — use `<Pagination>` component

## Modal Dialogs

- Use `<Modal>` for confirmations, forms that shouldn't navigate away, and detail views
- Destructive actions (delete, reset) must use `<Modal>` with a `tone="critical"` primary action — never inline destructive buttons without confirmation
- Always set `onClose` and ensure the modal can be dismissed with the Escape key

## React Polaris vs Polaris Web Components

- **Embedded app pages** (routes under `app/`): use React Polaris components (`@shopify/polaris`)
- **Admin UI extensions** and **App Home**: use Polaris web components (`<s-page>`, `<s-button>`, `<s-text-field>`, etc.) — React Polaris is not available in extension sandboxes
- Never import `@shopify/polaris` in extension code — use `@shopify/ui-extensions/admin` web components only

## Accessibility

- Every interactive Polaris component already handles ARIA roles, keyboard navigation, and focus management — do not override these with custom attributes unless absolutely necessary
- `<Button>` with `icon` only: always set `accessibilityLabel`
- Custom interactive elements that are not Polaris components must implement full keyboard support manually
