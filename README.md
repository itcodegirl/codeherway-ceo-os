# CodeHerWay CEO OS

CodeHerWay CEO OS is a product-minded React dashboard for founder and executive workflows.  
It focuses on planning, pipeline visibility, and operational clarity across opportunities, content, and weekly execution.

## Current State

This project is a polished frontend prototype with partial persistence:

- Core pages, routing, and reusable UI system are implemented.
- Settings and Chief of Staff notes use local persistence.
- Supabase and OpenAI config scaffolding exists, but full backend/AI workflows are not yet wired end-to-end.

## Implemented Features

- Executive dashboard with:
  - KPI cards
  - top priorities
  - opportunity/content snapshots
  - momentum and activity widgets
- Opportunities pipeline view with table + modal drill-down
- Content OS workflow view with status tracking + modal drill-down
- Weekly Brief view for priorities, wins, blockers, and review notes
- Chief of Staff workspace for note-to-output drafting flows
- Reusable UI components (`Button`, `Badge`, `SectionCard`, `Modal`, `PageHeader`, etc.)
- Route-based metadata updates (`document.title`, description, OG/Twitter tags)
- Responsive layout with accessible primitives (skip link, focus-trapped modal, semantic headings)
- Automated UI regression coverage for key Chief of Staff generation paths (empty-input guard + successful response render)
- Accessibility regression coverage for modal focus trapping and compact-sidebar Escape navigation behavior
- Route-level accessibility smoke tests for single-page `h1` usage and app `main` landmark consistency
- Dashboard regression coverage for derived KPI cards and focus score calculations from persisted workflow data
- Dashboard hook coverage for no-op silent refreshes that avoid unnecessary rerenders
- Topbar timing coverage for minute-boundary date updates near midnight
- Dashboard hook coverage for stable event subscriptions while using the latest error callback on rerender
- App layout regression coverage for skip-link targeting and main landmark focus restoration on navigation

## Tech Stack

- React 19
- React Router 7
- Vite 8
- ESLint 9
- CSS (modularized by layout + feature)

## Project Structure

```text
src/
  components/
    ai/
    content/
    dashboard/
    opportunities/
    ui/
    weekly/
  data/
  hooks/
  layouts/
  lib/
  pages/
  styles/
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

- `VITE_OPENAI_PROXY_URL`
- `OPENAI_API_KEY` (server-side only)
- `OPENAI_MODEL` (optional, defaults to `gpt-4.1-mini`)
- `CHIEF_STAFF_PROXY_TOKEN` (optional; recommended in production)
- `CHIEF_STAFF_RATE_LIMIT_PER_MINUTE` (optional; positive integer to enable rate limiting)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Keep `OPENAI_API_KEY` server-side only (do not prefix with `VITE_`).

## OpenAI Proxy

This repo ships a backend proxy so OpenAI keys never touch the browser bundle:

- Vercel function: `api/chief-of-staff.js`
- Netlify function: `netlify/functions/chief-of-staff.js`
- Netlify route mapping: `netlify.toml` redirects `/api/chief-of-staff` to the function endpoint

The frontend calls `/api/chief-of-staff` by default.

Authentication and hardening options:
- Set `CHIEF_STAFF_PROXY_TOKEN` to require a shared secret on every proxy request
  (supported via `Authorization: Bearer <token>` or `X-Chief-Staff-Token` header).
- Set `CHIEF_STAFF_RATE_LIMIT_PER_MINUTE` to a positive integer to apply lightweight
  per-client request throttling in the shared proxy handler.

## Local Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run typecheck
npm run test:run
```

## Roadmap

High-impact next steps:

1. Real Supabase CRUD for opportunities/content workflows
2. Auth and user-scoped data
3. Real OpenAI-powered Chief of Staff pipeline via backend endpoint
4. Expand test coverage (more integration + route-level tests)
5. Analytics and production observability

## Author

Jenna Zawaski  
Frontend developer focused on product-grade interfaces and workflow-driven UX.
