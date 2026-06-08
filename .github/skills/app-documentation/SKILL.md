---
name: app-documentation
description: Generate README, API docs, and extension documentation for Shopify apps and themes
---

# /app-documentation — Shopify Documentation Generator

## When to Use

When a module, extension, or feature lacks documentation, or when onboarding new developers to a project.

## Usage

```
/app-documentation path/to/extension-or-feature
/app-documentation      # documents entire project
```

## Documentation Generated

### 1. Project README.md

```markdown
# {Project Name}

> {One-line description}

## Requirements
- Shopify CLI version
- Node.js version
- Required API scopes

## Installation
{step-by-step}

## Configuration
{environment variables table}

## Development
{local setup commands}

## Deployment
{push / release process}

## Architecture
{brief description of key directories and their purpose}
```

### 2. Extension / Feature Docs (`docs/extensions/{name}.md`)

For each theme extension or app extension:
- Purpose and merchant use case
- Target surface (`product-page`, `checkout`, `admin`, etc.)
- Settings / configuration options (table)
- API / metafield dependencies
- Known limitations

### 3. API Endpoint Docs (app backend)

For each route handler:
- Method + path
- Auth requirement
- Request parameters / body schema
- Response schema
- Error codes

### 4. Changelog Entry

Formatted `CHANGELOG.md` entry for the current feature/fix:

```markdown
## [Unreleased]
### Added
- {feature}: {brief description} ({ticket-id})

### Fixed
- {bug}: {brief description} ({ticket-id})
```

## Output

- Files written to `docs/` directory
- `README.md` updated if it exists; created if not
- `CHANGELOG.md` entry prepended
- Summary of all files created/updated printed to chat
