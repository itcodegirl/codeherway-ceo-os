# CodeHerWay CEO OS

CodeHerWay CEO OS is a React + Vite executive operations workspace for founder-facing workflows:

- Opportunities and deal tracking
- Content planning and production
- Weekly planning and review
- AI-assisted chief-of-staff outputs
- Settings and accessibility-aware UX

The project is intentionally local-first by default with a first-class Supabase path for authenticated, account-scoped persistence.

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

Each repository follows the same contract:

- Normalize and default incoming data
- Read/write from the active source (`local` vs `supabase`)  
- Emit domain events after changes for lightweight synchronization
- Keep consumers independent of storage transport details

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
npm run typecheck
```

## Configuration

### Frontend environment

- `VITE_OPENAI_PROXY_URL` (optional, defaults to `/api/chief-of-staff`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Server runtime environment

- `OPENAI_API_KEY` (required for proxy responses)
- `OPENAI_MODEL` (optional)
- `CHIEF_STAFF_PROXY_TOKEN` (optional)
- `CHIEF_STAFF_RATE_LIMIT_PER_MINUTE` (optional)

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
| Dashboard | `docs/assets/screenshots/dashboard-overview.png` | Executive KPIs, snapshot card, momentum context |
| Opportunities | `docs/assets/screenshots/opportunities-pipeline.png` | Pipeline clarity, status flow, action readiness |
| Weekly Brief | `docs/assets/screenshots/weekly-brief-planning.png` | Priorities, blockers, and weekly operating rhythm |
| Chief of Staff | `docs/assets/screenshots/chief-of-staff-structured-output.png` | AI output quality, structured acceptance workflow |
| Settings | `docs/assets/screenshots/settings-workspace-profile.png` | Workspace defaults, persistence source alignment |

### Screenshot gallery

#### Dashboard

![Dashboard overview](docs/assets/screenshots/dashboard-overview.png)

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
- Suggested scope: dashboard snapshot -> weekly planning -> chief-of-staff generation -> structured acceptance.
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
- Local-first behavior remains default, with authenticated Supabase opt-in path available.
- Metadata and accessibility defaults are handled in shell-level orchestration.
- AI responses preserve fallback behavior when proxy output is missing or invalid.
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

## Author

Jenna Zawaski - frontend product engineering with workflow-first architecture focus.

