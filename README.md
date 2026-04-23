# CodeHerWay CEO OS

CodeHerWay CEO OS is a React + Vite blueprint-style command center for founder-facing workflows:

- Focus Home command center with ADHD-supportive states and reset flow
- Sticky-note Capture workspace for fast brain-dump input
- Private Journal prompts with local daily autosave
- Deterministic reminders + suggestion layer (no AI required)
- Opportunities, Content OS, Weekly Brief, and Chief of Staff workflows
- Shared System Pulse that keeps Focus, Momentum, Blockers, Ideas, and Reset connected

The project is intentionally local-first by default with a first-class Supabase path for authenticated, account-scoped persistence.

## Quickstart for reviewers

Use this path if you are opening the repo for the first time and want proof quickly:

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173/` and run:

```bash
npm run lint
npm run test:run
npm run build
```

## Launch the site

Use these exact commands:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/` in your browser.

## 5-minute product walkthrough

Use this exact flow for portfolio demos or recruiter screenshares:

1. Focus Home: show support mode chips, next-move CTA, reminders, suggestions, and overwhelmed reset.
2. Capture: add one sticky note as `idea`, then edit text/category inline.
3. Journal: answer one prompt and show immediate autosave status.
4. Weekly Brief + Opportunities: add one blocker or in-progress item and return to Focus Home.
5. Chief of Staff: paste notes, generate output, and accept at least one structured recommendation.

## What this repository demonstrates

### 1) Architecture consistency

- Route files are intentionally thin and composition-first.
- Data orchestration and side effects live in `src/hooks`.
- Repository modules under `src/lib` own normalization, persistence, and transport concerns.
- The app shell owns shared structure and meta behaviors, not domain logic.
- CRUD domain pages now use a slot-based template contract (`header`, `status`, `summary`, `section`, `modals`) instead of a flat prop list, which keeps page scaffolding maintainable as features grow.

### 2) Repository pattern across domains

Implemented across:

- `src/lib/opportunitiesRepository.js`
- `src/lib/contentRepository.js`
- `src/lib/weeklyRepository.js`
- `src/lib/settingsRepository.js`
- `src/lib/chiefRepository.js`
- `src/lib/captureRepository.js`
- `src/lib/journalRepository.js`
- `src/lib/remindersRepository.js`

Each repository follows the same contract:

- Normalize and default incoming data
- Read/write from the active source (`local` vs `supabase`)  
- Emit domain events after changes for lightweight synchronization
- Keep consumers independent of storage transport details

The deterministic recommendation layer is handled by `src/lib/suggestions.js`, and shared cross-route pulse orchestration is handled by `src/hooks/useSystemPulse.js`.

### 3) Reliable local-first + optional cloud workflows

- Without environment credentials, the app works from browser storage.
- With credentials + session, repositories upgrade to Supabase-backed persistence.
- Source state is surfaced as `local` or `supabase` so behavior stays transparent to users.

### 4) AI proxy integration with safe failure behavior

- Client requests are routed through a server endpoint:
  - `VITE_OPENAI_PROXY_URL` in frontend config (defaults to `/api/chief-of-staff`)
  - `api/chief-of-staff.js` (Vercel-style)
  - `netlify/functions/chief-of-staff.js` (Netlify)
- `src/lib/openai.js` handles:
  - request timeout/abort behavior
  - normalized parsing across tool-like outputs and plain text responses
  - structured payload extraction with deduplication
  - graceful fallback output when proxy/parse fails

### 5) Accessibility and UX polish

- Skip link and focus restoration in shell
- Single semantic page landmarks and route heading structure
- Clear loading, empty, and fallback states
- Source/status messaging for persistence mode
- Controlled keyboard interactions and form behavior in core workflows
- Interactive data rows in opportunities/content tables support keyboard activation (`Enter` / `Space`) in addition to pointer interaction.

### 6) Test and quality culture

- Hook tests cover orchestration and synchronization.
- Library tests cover parsing, settings normalization, and metadata helper behavior.
- Route tests cover key visibility and accessibility flows.

## Project layout

```text
src/
  components/      # Reusable UI primitives and domain components
  hooks/           # Workflow orchestration and state composition
  layouts/         # Shell behavior and route frame
  lib/             # Repositories, integration, and utilities
  pages/           # Route-level composition
  styles/          # Shared styles and page-specific styling
```

## Development

```bash
npm install
npm run dev
```

### Quality checks

```bash
npm run lint
npm run build
npm run test:run
npm run test:integration:telemetry
npm run typecheck
npm run check:route-budgets
npm run check:route-budgets:trend
npm run report:route-budgets
npm run check:telemetry-ingest:health
npm run check:telemetry-ingest:slo
npm run build:slo-trend-snapshot
npm run persist:slo-trend-snapshot
npm run transition:ops-incident-state
```

### Route baseline governance

- Route performance baseline is tracked in `scripts/route-performance-baseline.json`.
- Baseline refresh is release-governed:
  - run workflow **Release Route Baseline Refresh** on `release` publish or manual dispatch
  - workflow executes `npm run update:route-budgets:baseline:release` with release approval env
- PR CI enforces static budgets + trend regression checks, and publishes `route-size-report` artifact.
- When `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_ROLE_KEY` secrets are available, CI also runs durable telemetry ingest integration tests against the real Supabase test project.
- `Scheduled Ops Alerts` workflow runs daily, checks route-size trend regressions plus telemetry ingest failure-rate and endpoint SLO health (p95 + non-2xx rate), persists snapshot rows into `ops_slo_snapshots`, records incident lifecycle transitions (`open`/`acknowledged`/`recovered`) in `ops_incident_lifecycle_events` for notification dedupe, publishes artifacts, upserts a tracked GitHub issue when thresholds are breached, fans out to Slack/PagerDuty when configured, and emits daily JSON snapshot artifacts plus an artifact index for trend analysis.

### Continuous integration

GitHub Actions runs the quality gate on every push to `main` and every pull request:

- `npm run lint`
- `npm run build`
- `npm run test:run`
- `npm run typecheck`

### Branch protection automation

- Dry run locally:

```bash
npm run configure:branch-protection:dry -- --repo owner/repo --branch main
```

- Apply from GitHub Actions: run the **Enforce Branch Protection** workflow and keep required check set to `Unit + E2E`.

## Configuration

### Frontend environment

- `VITE_OPENAI_PROXY_URL` (optional, defaults to `/api/chief-of-staff`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ERROR_TELEMETRY_URL` (optional remote ingest endpoint for app error telemetry)
- `VITE_APP_ERROR_TELEMETRY_TOKEN` (optional shared ingest token header)
- `VITE_APP_ERROR_TELEMETRY_HMAC_SECRET` (optional HMAC signing secret for trusted/internal deployments only)
- `VITE_APP_ERROR_TELEMETRY_SIGNATURE_KEY_ID` (optional key-id header used with signed payloads)

### Server runtime environment

- `OPENAI_API_KEY` (required for proxy responses)
- `OPENAI_MODEL` (optional)
- `CHIEF_STAFF_PROXY_TOKEN` (optional)
- `CHIEF_STAFF_REQUIRE_TOKEN` (optional, set to `true` to reject requests when no proxy token is configured)
- `CHIEF_STAFF_RATE_LIMIT_PER_MINUTE` (optional)
- `APP_ERROR_TELEMETRY_INGEST_TOKEN` (optional, validates telemetry ingest requests when set)
- `APP_ERROR_TELEMETRY_HMAC_SECRET_CURRENT` (optional, active HMAC key for ingest signature validation)
- `APP_ERROR_TELEMETRY_HMAC_SECRET_NEXT` (optional, next HMAC key used during overlap windows)
- `APP_ERROR_TELEMETRY_HMAC_NEXT_VALID_FROM` (optional ISO datetime cutoff for when `*_NEXT` becomes valid)
- `APP_ERROR_TELEMETRY_HMAC_CURRENT_VALID_UNTIL` (optional ISO datetime cutoff for current key sunset)
- `APP_ERROR_TELEMETRY_HMAC_SECRET` (optional legacy fallback when rotation keys are not configured)
- `APP_ERROR_TELEMETRY_ASYMMETRIC_PUBLIC_KEYS_JSON` (optional JSON map of `keyId -> PEM public key` for ed25519 verification)
- `APP_ERROR_TELEMETRY_KMS_KEYS_URL` (optional KMS-backed key distribution endpoint for asymmetric verification)
- `APP_ERROR_TELEMETRY_KMS_AUTH_TOKEN` (optional bearer token used to fetch KMS keysets)
- `APP_ERROR_TELEMETRY_KMS_CACHE_MS` (optional keyset cache TTL in milliseconds, defaults to `300000`)
- `APP_ERROR_TELEMETRY_KEY_PROVIDER` (optional provider-native key adapter: `aws-kms`, `gcp-kms`, `azure-keyvault`)
- `APP_ERROR_TELEMETRY_AWS_KMS_KEYS_JSON` (optional JSON array for AWS KMS signature key mappings)
- `APP_ERROR_TELEMETRY_GCP_KMS_KEYS_JSON` (optional JSON array for GCP KMS signature key mappings)
- `APP_ERROR_TELEMETRY_AZURE_KV_KEYS_JSON` (optional JSON array for Azure Key Vault signature key mappings)
- `APP_ERROR_TELEMETRY_AWS_REGION` (optional AWS region for provider-native key lookups)
- `APP_ERROR_TELEMETRY_ROTATION_MAX_KEY_AGE_DAYS` (optional asymmetric key max-age enforcement window)
- `APP_ERROR_TELEMETRY_ROTATION_MIN_ACTIVE_KEYS` (optional minimum active asymmetric keys required, default `1`)
- `APP_ERROR_TELEMETRY_ROTATION_REQUIRE_FUTURE_KEY` (optional, require at least one future-dated key to validate rollout readiness)
- `APP_ERROR_TELEMETRY_KEY_AUDIT_ENABLED` (optional, set to `false` to disable key verification audit writes)
- `SUPABASE_SERVICE_ROLE_KEY` (required for durable telemetry ingest persistence)
- `APP_ERROR_TELEMETRY_RETENTION_DAYS` (optional, defaults to `45`)
- `APP_ERROR_TELEMETRY_MAX_ROWS` (optional, defaults to `50000`)
- `OPS_INCIDENT_SUPABASE_URL` (optional, durable lifecycle state persistence for scheduled ops incidents)
- `OPS_INCIDENT_SUPABASE_SERVICE_ROLE_KEY` (optional service role key for lifecycle event writes)
- `OPS_INCIDENT_KEY` (optional override for incident dedupe key, defaults to `<repo>:scheduled-ops-alert`)
- `TELEMETRY_INGEST_MONITOR_URL` (optional, used by scheduled SLO probe job)
- `TELEMETRY_INGEST_MONITOR_TOKEN` (optional ingest token for SLO probe requests)
- `TELEMETRY_INGEST_MONITOR_SIGNATURE_MODE` (optional: `hmac-sha256` or `ed25519`)
- `TELEMETRY_INGEST_MONITOR_SIGNATURE_KEY_ID` (optional key-id header for SLO probe signatures)
- `SLACK_OPS_WEBHOOK_URL` (optional webhook used by scheduled ops fanout alerts)
- `PAGERDUTY_EVENTS_ROUTING_KEY` (optional PagerDuty Events v2 routing key for on-call fanout)

## Data model references

- Supabase migration scripts in `supabase/migrations/`.
- Primary tables:
  - `opportunities`
  - `content_items`
  - `weekly_briefs`
  - `weekly_brief_items`
  - `profiles`
  - `chief_sessions`
  - `chief_outputs`
  - `chief_telemetry_events`
  - `app_error_telemetry_events`
  - `app_error_telemetry_key_audit_events`
  - `ops_slo_snapshots`
  - `ops_incident_lifecycle_events`

## Roadmap

- Broaden integration coverage for cross-domain synchronization under concurrent updates.
- Add structured telemetry for AI fallback rates and acceptance outcomes.
- Expand acceptance criteria snapshots for AI-generated structured outputs.
- Publish a portfolio case study with architecture decision records and tradeoff notes.

## Tracked migrations

- [MIG-CRUD-TEMPLATE-SLOTS-2026-09-30](./docs/tracking/CRUD_TEMPLATE_SLOTS_MIGRATION_2026-09-30.md): remove deprecated `CrudPageTemplate` legacy props (`summary`, `section`, `modals`) after migration to `slots.*`.

## Portfolio assets

- [CASE_STUDY.md](./CASE_STUDY.md) for interview- and recruiter-facing architecture summary.
- [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md) for final release-candidate verification.
- [CHANGELOG.md](./CHANGELOG.md) for timestamped hardening and release-readiness updates.
- [docs/assets/README.md](./docs/assets/README.md) for screenshot and demo asset structure.
- [docs/assets/CAPTURE_GUIDE.md](./docs/assets/CAPTURE_GUIDE.md) for updating screenshots and walkthrough captures.

## Product visuals and proof

The repository now includes stable paths for visual proof artifacts so portfolio updates can be made quickly without changing docs structure.

### Screenshot targets

| Product area | Asset path | Proof focus |
| --- | --- | --- |
| Focus Home | `docs/assets/screenshots/dashboard-overview.png` | Focus command center, next move flow, and system signal |
| Opportunities | `docs/assets/screenshots/opportunities-pipeline.png` | Pipeline clarity, status flow, action readiness |
| Weekly Brief | `docs/assets/screenshots/weekly-brief-planning.png` | Priorities, blockers, and weekly operating rhythm |
| Chief of Staff | `docs/assets/screenshots/chief-of-staff-structured-output.png` | AI output quality, structured acceptance workflow |
| Settings | `docs/assets/screenshots/settings-workspace-profile.png` | Workspace defaults, persistence source alignment |

### Screenshot gallery

#### Focus Home

![Focus Home overview](docs/assets/screenshots/dashboard-overview.png)

#### Opportunities pipeline

![Opportunities pipeline](docs/assets/screenshots/opportunities-pipeline.png)

#### Weekly brief

![Weekly brief planning](docs/assets/screenshots/weekly-brief-planning.png)

#### Chief of staff workflow

![Chief of staff structured output](docs/assets/screenshots/chief-of-staff-structured-output.png)

#### Settings

![Settings workspace profile](docs/assets/screenshots/settings-workspace-profile.png)

### Demo target

- Walkthrough capture: `docs/assets/demo/ceo-os-workflow-walkthrough.webm`
- Suggested scope: focus-home command center -> weekly planning -> chief-of-staff generation -> structured acceptance.
- Current walkthrough asset: [ceo-os-workflow-walkthrough.webm](./docs/assets/demo/ceo-os-workflow-walkthrough.webm)

## Portfolio and production readiness

### Portfolio evidence

- Repository quality gates are codified and runnable from CI or local terminals:
  - `npm run lint`
  - `npm run build`
  - `npm run test:run`
  - `npm run typecheck`
- The codebase keeps a clear separation of concerns between:
  - Route shells (`src/layouts`)
  - Orchestrator hooks (`src/hooks`)
  - Persistence and transport (`src/lib`)
- Structured behavior is backed by explicit tests in:
  - `src/lib/openai.test.js`
  - `src/hooks/useChiefOfStaff.test.js`
  - `src/hooks/useDashboardInsights.test.js`
  - `src/hooks/useWeeklyBrief.test.js`
  - `src/lib/pageMeta.test.js`

### Production readiness checklist

- Secrets and API endpoints are resolved from environment configuration.
- Pull requests and pushes to `main` are validated by GitHub Actions before merge.
- Local-first behavior remains default, with authenticated Supabase opt-in path available.
- Metadata and accessibility defaults are handled in shell-level orchestration.
- AI responses preserve fallback behavior when proxy output is missing or invalid.
- Chief-of-staff proxy authentication can be made fail-secure with `CHIEF_STAFF_REQUIRE_TOKEN=true`.
- Repository includes architecture decision records and tradeoffs via:
  - `README.md`
  - `CASE_STUDY.md`
  - `docs/RELEASE_CHECKLIST.md`

## Release evidence

- Verification snapshot date: April 21, 2026
- Quality gates executed successfully:
  - `npm run lint`
  - `npm run build`
  - `npm run test:run`
  - `npm run typecheck`
- Final hardening and readiness commits:
  - `d95e8d3` - test: harden chief-of-staff edge-case coverage
  - `188dcc7` - test: harden dashboard insight edge-case resilience
  - `24d811d` - fix: normalize route paths for page metadata resolution
  - `f18c16a` - docs: add release-candidate checklist and portfolio polish
- Post-verification hardening cycle (April 23, 2026):
  - `f5ae62c` - test: stabilize source status copy assertion
  - `07f3213` - feat: improve dashboard credibility and accessibility semantics
  - `3da3eae` - refactor: centralize supabase runtime access
- Blueprint redesign foundation cycle (April 23, 2026):
  - `2e02795` - feat: establish blueprint design system foundation
  - `541f140` - feat: replace dashboard with focus command center
  - `eba9561` - feat: add sticky-note capture workspace with local persistence
  - `a13bd86` - feat: add journal page with local daily prompt autosave
  - `eec8c74` - feat: add deterministic reminders and suggestion layer
  - `0c15d13` - feat: add shared system pulse across the app shell

## Author

Jenna Zawaski - frontend product engineering with workflow-first architecture focus.
