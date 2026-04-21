# CodeHerWay CEO OS

CodeHerWay CEO OS is a React + Vite executive operations workspace for running high-leverage founder workflows:

- Opportunities pipeline
- Content pipeline
- Weekly planning and review
- AI-assisted chief-of-staff outputs
- App preferences and accessibility settings

The project is intentionally kept local-first by default, with a clear Supabase upgrade path for account-backed persistence.

## What this repo demonstrates

### 1) Reusable architecture patterns

- Route-level pages stay focused (UI composition + orchestration hooks).
- Reusable domain components in `src/components`.
- Domain logic centralized in `src/hooks` and `src/lib` repository modules.
- Thin shell layout with route metadata, focus management, and loading/error boundaries.

### 2) Local-first persistence with fallback behavior

- Repositories load from:
  - Supabase tables when environment credentials are present and authenticated.
  - Browser `localStorage` when not configured or when auth is unavailable.
- Repositories are resilient and explicit about source (`local` vs `supabase`), so each page can surface source status to users.
- Repositories dispatch cross-component update events to keep route data synchronized after mutations.

### 3) Domain repository pattern

- `src/lib/opportunitiesRepository.js`
- `src/lib/contentRepository.js`
- `src/lib/weeklyRepository.js`
- `src/lib/settingsRepository.js`
- `src/lib/chiefRepository.js`

Each repository owns:

- normalization of stored entities
- local persistence details
- Supabase queries and mapping
- event notifications for in-app refreshes

### 4) AI proxy with server-side secrets

- Client calls the proxy via `VITE_OPENAI_PROXY_URL` (default `/api/chief-of-staff`).
- Actual provider keys stay server-side in:
  - `api/chief-of-staff.js` (Vercel-style)
  - `netlify/functions/chief-of-staff.js` (Netlify)
- Core orchestration sits in `src/lib/openai.js` with proxy timeout handling and graceful fallback output.

### 5) Accessibility and UX polish

- Skip link and focus restoration in `AppLayout`.
- One clear main landmark and unique H1 per route.
- Source/status notices for local vs persisted data state.
- Consistent keyboard and form semantics across controls.
- Route-level metadata updates and canonical URL tagging.

### 6) Testing and quality posture

- `AppLayout` and route-level accessibility checks.
- Hook unit tests for data orchestration and persistence.
- Library tests for AI response parsing, settings normalization, and metadata helpers.
- Coverage and lint/typecheck scripts available for day-to-day verification.

## Current project shape

```text
src/
  components/      # UI primitives + domain components
  hooks/           # Workflow orchestration and state logic
  layouts/         # App shell and route frame
  lib/             # Repository + integrations layer
  pages/           # Route composition
  styles/          # Page and component styling
```

## Development

### Install & run

```bash
npm install
npm run dev
```

### Quality checks

```bash
npm run lint
npm run build
npm run typecheck
npm run test:run
```

## Configuration

### Frontend environment

- `VITE_OPENAI_PROXY_URL` (optional; defaults to `/api/chief-of-staff`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Server runtime environment

- `OPENAI_API_KEY` (required for proxyed responses)
- `OPENAI_MODEL` (optional)
- `CHIEF_STAFF_PROXY_TOKEN` (optional)
- `CHIEF_STAFF_RATE_LIMIT_PER_MINUTE` (optional)

## Data model references

- Supabase migration scripts are under `supabase/migrations/`.
- Tables used by repositories include:
  - `opportunities`
  - `content_items`
  - `weekly_briefs`
  - `weekly_brief_items`
  - `profiles`
  - `chief_sessions`
  - `chief_outputs`

## Roadmap (still in progress)

- Broaden integration tests around cross-domain fallback behavior.
- Strengthen event-driven synchronization across additional screens.
- Add structured monitoring for AI proxy failures and fallback reasons.
- Add stricter data shape checks around accepted AI output ingestion.

## Author

Jenna Zawaski — frontend product engineering with workflow-first architecture focus.
