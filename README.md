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

## Roadmap

- Broaden integration coverage for cross-domain synchronization under concurrent updates.
- Add structured telemetry for AI fallback rates and acceptance outcomes.
- Expand acceptance criteria snapshots for AI-generated structured outputs.
- Publish a portfolio case study with architecture decision records and tradeoff notes.

## Portfolio assets

- [CASE_STUDY.md](./CASE_STUDY.md) for interview- and recruiter-facing architecture summary.

## Author

Jenna Zawaski — frontend product engineering with workflow-first architecture focus.
