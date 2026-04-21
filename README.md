# CodeHerWay CEO OS

CodeHerWay CEO OS is a React + Vite executive operations workspace for managing:

- opportunities pipeline
- content pipeline
- weekly planning and review
- AI-assisted chief-of-staff outputs
- user settings and workspace preferences

The project is built with a local-first architecture that upgrades to Supabase-backed persistence when configured.

## Product Snapshot

### What is implemented

- Route-based app shell with lazy-loaded pages and metadata updates
- Repository layer for core domains:
  - opportunities
  - content items
  - weekly brief
  - chief of staff sessions/outputs
  - settings/profile
- Hook layer for workflow orchestration:
  - weekly brief state/actions
  - chief of staff generation + structured acceptance flows
  - dashboard insights and derived metrics
  - settings load/save behavior
- Supabase support with local fallback behavior where appropriate
- Backend proxy path for AI requests (no API key in client bundle)
- Accessibility and interaction polish:
  - skip link
  - focus-aware app shell/main navigation behavior
  - keyboard-friendly modal and navigation interactions
  - route-level heading/landmark consistency checks

### Current quality posture

- Linting, build, typecheck, and test scripts are configured
- Core route and workflow behavior has automated tests
- The app is portfolio-ready and production-oriented in architecture
- Remaining work is mostly operational hardening (auth depth, monitoring, broader integration tests)

## Architecture

```text
src/
  components/      # reusable UI + feature components
  hooks/           # workflow/state orchestration
  layouts/         # app shell and route outlet framing
  lib/             # repository layer + domain utilities
  pages/           # route-level page composition
  styles/          # feature and shared styles
```

### Design principles used in this repo

- Local-first UX with Supabase upgrade path
- Thin page components (view composition only)
- Domain logic in hooks + repositories
- Reusable UI primitives for consistency
- Preserve accessibility and keyboard support by default

## Data and persistence modes

The app supports two operating modes:

1. `local` mode (default)
- data persists in browser localStorage
- useful for quick demos and local development

2. `supabase` mode (when env vars are configured)
- repositories read/write user-scoped data in Supabase
- row-level security policies are expected in database schema

Most pages expose a source note so you can see whether data is coming from local storage or Supabase.

## AI Chief of Staff flow

The AI workflow is proxied through server endpoints:

- Vercel: `api/chief-of-staff.js`
- Netlify: `netlify/functions/chief-of-staff.js`
- Shared core handler: `server/chiefOfStaffProxyCore.js`

The client calls `/api/chief-of-staff` by default via `src/lib/openai.js`.

The response contract supports:

- primary text output
- optional structured payload:
  - `priorities`
  - `opportunities`
  - `contentItems`
  - `tasks`

Structured items can be accepted into product domains (opportunities, content, weekly priorities) from the UI.

## Environment variables

Copy `.env.example` to `.env.local` and set the variables relevant to your environment.

### Frontend

- `VITE_OPENAI_PROXY_URL` (optional; defaults to `/api/chief-of-staff`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Server/runtime

- `OPENAI_API_KEY` (required for real AI responses; server-side only)
- `OPENAI_MODEL` (optional; defaults to `gpt-4.1-mini`)
- `CHIEF_STAFF_PROXY_TOKEN` (optional)
- `CHIEF_STAFF_RATE_LIMIT_PER_MINUTE` (optional)

Do not expose `OPENAI_API_KEY` to the browser (`VITE_` prefix must not be used).

## Local development

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

## Supabase migrations

Migration SQL is in `supabase/migrations/`.

Apply migrations in order (SQL editor or CLI) to create:

- domain tables and indexes
- `updated_at` trigger behavior
- row-level security policies
- ownership-safe defaults for user-scoped rows

## Portfolio framing

This repo demonstrates:

- product architecture thinking (page/hook/repository separation)
- maintainable React organization for multi-workflow apps
- practical accessibility and interaction quality
- incremental hardening across persistence, AI integration, and test coverage

## Next recommended phase

- deeper end-to-end integration tests around Supabase fallback behavior
- stronger operational telemetry/monitoring for AI proxy paths
- authentication/session UX hardening across all repository-backed flows

## Author

Jenna Zawaski  
Frontend developer focused on product-grade interfaces and workflow-driven UX.
