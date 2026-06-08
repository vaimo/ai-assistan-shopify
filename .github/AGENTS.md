# Shopify AI Suite — Project-Wide Agent Rules

## Project Type Detection

All agents MUST detect the project type from the codebase at the start of every session. Do not assume a project type.

**Run `/detect-context` at the start of any new session** to scan the codebase and establish the active context. If context has already been established in the current session, reuse it.

### Detection rules (summary)

| Codebase signal | Detected type | Primary toolkit skills |
|-----------------|---------------|----------------------|
| `*.liquid` files / `layout/theme.liquid` | `theme` | `shopify-liquid`, `shopify-custom-data` |
| `shopify.app.toml` | `app` | `shopify-admin`, `shopify-polaris-admin-extensions` |
| `hydrogen.config.js` / `@shopify/hydrogen` in `package.json` | `hydrogen` | `shopify-hydrogen`, `shopify-storefront-graphql` |
| `extensions/*/shopify.extension.toml` with `type = "function"` | `functions` | `shopify-functions` |
| Extension toml with checkout target | `extensions` | `shopify-polaris-checkout-extensions` |
| Multiple signals | `monorepo` | All applicable skills, selected per task |

> **Rule:** Select the toolkit skill that matches the detected type. Only reach for other skills when the task explicitly requires a different domain (e.g. a theme project adding a checkout extension). Use `shopify-dev` only as a fallback when no specific skill applies.

## Environment

- **CLI**: Shopify CLI 3.x (`shopify theme dev`, `shopify app dev`, `shopify hydrogen dev`)
- **Theme path**: `./` (root) for theme-only repos; `./extensions/` for app-embedded themes
- **App path**: `./web/` or `./app/` depending on scaffold type
- **Hydrogen path**: `./` (root) — Remix-based React storefront; no `.liquid` files
- **Node**: ≥18.x required
- **Package manager**: Detect from lockfile — use `npm`, `yarn`, or `pnpm` consistently

## Shopify AI Toolkit

The [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) connects agents to Shopify's live developer resources. **The full plugin install is required** — it provides both MCP tools and Agent Skills. Agent Skills are used in mandatory research steps across all agents; without them agents skip domain-scoped research and produce lower-quality results. Install via `Chat: Install Plugin From Source` (VS Code), `/plugin marketplace add` (Claude Code), or the Cursor marketplace.

### MCP Tools

Low-level tools available directly via the `@shopify/dev-mcp` MCP server. Use these for capabilities that Agent Skills cannot provide:

| Tool | Purpose | When to use over a skill |
|------|---------|-------------------------|
| `learn_shopify_api` | Structured API surface orientation | Cross-domain tasks where the right skill isn't clear yet — use as a starting point, then switch to the relevant skill |
| `search_docs_chunks` | Search Shopify developer documentation | Cross-domain searches that span multiple skill domains |
| `validate_graphql_codeblocks` | Validate GraphQL against the live schema — also use for field/type discovery before writing GraphQL | Always run on any GraphQL query or mutation |
| `validate_component_codeblocks` | Validate Hydrogen/React components | Final validation of Hydrogen components |
| `validate_theme` | Validate Liquid theme sections and snippets | Final validation of Liquid code |

> **Note:** For most tasks, prefer Agent Skills (below) over `search_docs_chunks` — skills provide domain-scoped search that is more targeted. The `validate_*` tools have no skill equivalent and should always be used alongside skills.

### Agent Skills

Domain-specific skills bundled with the plugin install. **Prefer skills over MCP doc search tools** — each skill's `search_docs.mjs` is scoped to its domain and returns more relevant results. Each skill also includes a `validate.mjs` for domain-specific code validation. Select the skill matching the domain:

| Skill | Domain |
|-------|--------|
| `shopify-admin` | Admin GraphQL API — products, orders, metafields, inventory |
| `shopify-storefront-graphql` | Storefront API — headless storefronts, Hydrogen data |
| `shopify-liquid` | Liquid templates — sections, snippets, schema, filters |
| `shopify-functions` | Shopify Functions — discounts, payment, delivery, fulfilment |
| `shopify-hydrogen` | Hydrogen framework — React, Remix, SSR |
| `shopify-custom-data` | Metafields and metaobjects |
| `shopify-polaris-checkout-extensions` | Checkout UI extensions |
| `shopify-polaris-admin-extensions` | Admin UI extensions (Polaris) |
| `shopify-polaris-customer-account-extensions` | Customer account extensions |
| `shopify-polaris-app-home` | Embedded app home UI |
| `shopify-pos-ui` | POS UI extensions |
| `shopify-payments-apps` | Payment apps |
| `shopify-use-shopify-cli` | Shopify CLI — setup, config, deployment |
| `shopify-partner` | Partner dashboard and app listing |
| `shopify-app-store-review` | App Store review guidelines |
| `shopify-dev` | General docs — fallback when no specific skill applies |

### Usage Rules

- **Research before guessing**: Use toolkit skills or MCP tools to look up API behaviour instead of relying on training data
- **Pick the right skill**: Select the domain-specific skill matching the task. Use `shopify-dev` only as a fallback when no specific skill applies
- **Verify before recommending**: Use `introspect_graphql_schema` to confirm mutations, fields, and types exist before including them in architecture plans or code
- **Validate before shipping**: Run skill validation (`validate.mjs`) or MCP validation tools on all generated code before running local quality gates
- **Docs + schema + validation only**: Do not use `store execute` or any live store operation through the toolkit — all store changes go through Shopify CLI with explicit user confirmation

## Working Directory

Always run commands from the **project root** unless stated otherwise.

## Command Safety Rules

- **Never run** `shopify theme push --live` or `shopify theme publish` without explicit user confirmation
- **Never delete** theme files or sections without listing what will be removed first
- **Never modify** `config/settings_data.json` — this is live merchant data
- Always use `--store` flag when multiple stores may be configured

## Code Conventions

- Liquid: follow `.theme-check.yml` rules if present
- JavaScript: ES modules only; no `var`; no jQuery unless already in project
- CSS: prefer CSS custom properties over hardcoded values
- Theme settings: always add schema entries for any new merchant-configurable value _(Liquid themes only)_
- Hydrogen: use `@shopify/hydrogen` primitives (`Image`, `Money`, `CartForm`); fetch data via Storefront API with `shopify-storefront-graphql` skill

## Quality Gates

All agents that produce code MUST pass these gates before declaring done:

1. `shopify theme check` (or `theme-check` CLI) — zero errors _(Liquid theme projects only)_
   For **Hydrogen** projects: run `tsc --noEmit` + `validate_component_codeblocks` instead
2. `eslint` (if configured) — zero errors
3. `prettier --check` (if configured) — no formatting violations
4. Accessibility: at minimum verify ARIA labels on interactive elements
5. Security: no `script` tag injections; no `raw` filter on user content

## Secrets & Credentials

- **Never** hardcode API keys, access tokens, or webhook secrets in any file
- Store secrets in `.env` (already gitignored) and reference via `process.env.*`
- Shopify Admin API tokens go in `.env` — never in `shopify.app.toml`

## Shopify-Specific Conventions

- Theme App Extensions: keep render targets minimal; one section per extension
- Metafields: always declare namespace + key; never use generic `custom.*` in production
- Webhooks: always verify HMAC signature; never trust payload without verification
- App Proxy: all proxy routes must validate `signature` query param
- Checkout Extensions: use only APIs available in the declared API version

## Available Agents

| Agent | Purpose |
|---|---|
| `shopify-architect` | Architecture advisor — ADRs, phased plans, tradeoffs. Read-only. |
| `shopify-implementation` | Implements features from an architect plan or Jira ticket |
| `shopify-app-builder` | Builds full Shopify app features — backend, Polaris UI, extensions, webhooks |
| `shopify-quality` | Runs all quality gates with auto-fix where safe |
| `shopify-migration` | Audits and plans migrations — API upgrades, OS 2.0, Checkout Extensions |
| `shopify-rfp-analyst` | Analyses RFP documents and produces workstream analysis and POC plans |
| `shopify-poc-builder` | Builds POC deliverables from an rfp-analyst plan |
| `shopify-security-reviewer` | Read-only security scanner — OWASP + Shopify-specific attack surface |
| `shopify-testing` | Playwright browser testing — runs full Jira AC test suite, captures console/network/interaction errors, returns Error Report |
| `shopify-i18n-validator` | Scans for hardcoded text in Liquid and JS/React — extracts to locale files, validates translation completeness |
| `shopify-seo-validator` | Validates and adds structured data (JSON-LD), meta tags, heading hierarchy, and Shopify SEO patterns |
| `shopify-format-lint` | Lightweight linter + formatter — auto-detects tooling (eslint, prettier, oxlint, biome, stylelint, theme-check), runs on changed files |
| `shopify-a11y-auditor` | Dedicated WCAG 2.1 AA accessibility auditor — ARIA, keyboard, focus, contrast, Shopify-specific patterns |
| `shopify-section-planner` | Screenshot-to-section orchestrator — analyses screenshots/descriptions, plans section structure, delegates to builder + validators |

## RFP → POC Handoff Protocol

### Flow

```
[RFP document attached]
        │
        ▼
[@shopify-rfp-analyst]
  Phase 0–5: parse RFP → decompose workstreams → feasibility → gaps → clarifications → scoring
  Phase 6: produces /rfp/{client-name}/poc-plan.md
        │
        ▼
[Human checkpoint]
  Review and edit poc-plan.md
  Confirm which workstreams are in POC scope
  Answer any remaining questions
        │
        ▼ (human approves)
[@shopify-poc-builder]
  Phase 0: reads approved poc-plan.md — does not re-analyse the RFP
  Phase 1: implementation specs (Jira-ready AC + test scenarios)
  Phase 2: architecture diagram (SVG React component)
  Phase 3: scope XLSX (6 sheets, Sheet 6 = Jira import)
  Phase 4: internal delivery documentation
  Phase 5: client-facing brief
  Phase 6: branded slide deck
  Phase 7: quality gate — consistency check across all output files
```

### Rules

- `@shopify-rfp-analyst` is the **sole entry point** — `@shopify-poc-builder` must never be invoked without an approved `poc-plan.md`
- The human checkpoint between the two agents is **mandatory** — `@shopify-poc-builder` must not start until the human has explicitly confirmed the plan
- `@shopify-poc-builder` reads `poc-plan.md` as-is — it does not revisit feasibility, re-run toolkit research for workstream decisions, or re-analyse the RFP
- If `poc-plan.md` has been edited since `@shopify-rfp-analyst` finished, `@shopify-poc-builder` acknowledges the changes in Phase 0 and adjusts output accordingly
- All analyst output stays in `/rfp/{client-name}/` — all POC builder output goes to `/rfp/{client-name}/poc/`

### Output ownership

| File | Owner |
|------|-------|
| `rfp-raw-notes.md`, `workstreams.md`, `gap-analysis.md`, `clarifications.md`, `use-case-scoring.md`, `poc-plan.md` | `@shopify-rfp-analyst` |
| `poc/implementation-specs.md`, `poc/architecture-diagram.tsx`, `poc/scope-breakdown.xlsx`, `poc/poc-delivery.md`, `poc/client-brief.md`, `poc/poc-slides.tsx` | `@shopify-poc-builder` |

---

## Orchestration Loop Protocol

### Entry Point
The loop is initiated by `@shopify-architect` after Stage 5 (Delivery). The Architect's output — architecture plan and Jira acceptance criteria — persists as the test contract for all subsequent iterations.

### Loop Sequence
1. `@shopify-implementation` — implements feature + writes Playwright test script
2. `@shopify-quality` — runs all quality gates
   - FAIL → returns to `@shopify-implementation` with gate errors
   - PASS → forwards to `@shopify-testing`
3. `@shopify-testing` — runs full Playwright suite against all Jira AC
   - PASS (0 errors) → loop ends, ticket complete
   - ERRORS → returns Error Report to `@shopify-implementation`
4. Repeat from step 1 with iteration counter incremented

### Termination Conditions
| Condition | Action |
|---|---|
| Testing Agent: 0 errors | Loop ends — ticket complete |
| Same error in 2 consecutive iterations | Escalate to human + flag as architectural issue |
| Iteration 5 reached | Escalate to human with full iteration history |
| Quality gate fails same issue twice | Escalate to human — implementation blocker |

### Iteration Tracking
Each agent pass must include an iteration number in its output. The Testing Agent attaches the previous Error Report to its output so the Implementor and Quality Agent have full context on what has already been tried.
