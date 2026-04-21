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

- `VITE_OPENAI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Local Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
```

## Roadmap

High-impact next steps:

1. Real Supabase CRUD for opportunities/content workflows
2. Auth and user-scoped data
3. Real OpenAI-powered Chief of Staff pipeline via backend endpoint
4. Automated tests (unit + integration)
5. Analytics and production observability

## Author

Jenna Zawaski  
Frontend developer focused on product-grade interfaces and workflow-driven UX.
