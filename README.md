# CodeHerWay CEO OS

CodeHerWay CEO OS is a React + Vite blueprint-style command center for founder-facing workflows:

- Focus Home command center with ADHD-supportive states and reset flow
- Sticky-note Capture workspace for fast brain-dump input
- Private Journal prompts with local daily autosave
- Deterministic reminders + suggestion layer (no AI required)
- Opportunities, Content OS, Weekly Brief, and Chief of Staff workflows
- Shared System Pulse that keeps Focus, Momentum, Blockers, Ideas, and Open Loops connected

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
5. Chief of Staff: paste notes, reload once to show local persistence, then generate output and accept at least one structured recommendation.

## Recruiter summary

CodeHerWay CEO OS is best framed as a product-minded frontend systems project: a calm founder command center with local-first resilience, a Supabase upgrade path, explicit failure handling, and end-to-end verification for the workflows reviewers can actually click through.

## Honest screenshot status

The PNGs in [`docs/assets/screenshots/`](./docs/assets/screenshots/) predate
the recent calm-OS audit cycle and **do not match the current UI**. They
show the older "Dashboard" surface with a purple-accent sidebar, no Capture
or Journal pages, and a Chief of Staff with action chips that the page
currently renders again post-audit (Phase 3 below). A re-capture pass is
the cheapest next portfolio improvement and is tracked in
[`docs/audits/ceo-os-product-readiness-audit.md`](./docs/audits/ceo-os-product-readiness-audit.md)
(Phase A — Portfolio surface).

If you are reviewing this repository, please run `npm run dev` and open the
app directly rather than relying on the embedded screenshots.

## Recent audit follow-up

The product-readiness audit in
[`docs/audits/ceo-os-product-readiness-audit.md`](./docs/audits/ceo-os-product-readiness-audit.md)
was followed by a six-phase fix branch
(`improve/ceo-os-audit-priority-fixes`). The shipped phases:

1. **Trust & reliability** — wired the save-status bus into the shared
   `requireLocalStorageSetItem` so CRUD writes (not just UI prefs) feed the
   trust pill; declared the two real chief-workspace storage keys in
   `dataSchema.js`; standardized storage-quota handling; tightened CSP to
   remove the unused `api.openai.com` host; gave Capture and Journal an
   explicit "stays on this device" notice.
2. **UX clarity** — removed the "coming soon" Weekly Digest / Keyboard
   Shortcuts toggles in Settings; removed the misleading "Import backup:
   coming soon" and "Connect Supabase: setup required" chips; collapsed the
   5-step ritual list above Focus Home into a `<details>` block to reduce
   density; defined four previously-undefined design tokens; added a base
   CSS rule for `.stat-card`.
3. **Feature flow** — restored the four secondary Chief of Staff action
   chips (Summarize / Draft LinkedIn / Convert to Action Items / Suggest
   Next Priorities) alongside the primary Build Action Plan; added an
   "Awaiting Reply > 7 days" aging signal to Opportunities; added a
   rendered `WeeklyBriefSummary` above the editors with copy-to-clipboard
   so the Monday-morning founder artifact is actually produced.
4. **Accessibility & mobile** — bumped pill contrast above AA on dark
   surfaces; added `aria-label` support to `Badge`; grouped the Chief of
   Staff actions under a labeled landmark; ensured the Weekly summary
   metric grid collapses cleanly on phones.
5. **Architecture cleanup** — extracted `useSilentRefresh` and migrated
   `useDashboardData` and `useWorkspaceSettings` onto it, removing
   duplicated event-subscription effects.
6. **Documentation** — split the long env-variable reference into
   [`docs/CONFIGURATION.md`](./docs/CONFIGURATION.md), refreshed
   [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md), and added the
   screenshot caveat above.

Items deliberately deferred to follow-up PRs are listed in
[`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md).

## Portfolio review snapshot

This project is strongest when presented as a local-first productivity system with a real backend upgrade path, not as a finished SaaS. The current implementation now covers the core reviewer risks:

- Direct Netlify routes are protected with an SPA fallback and E2E direct-route refresh tests.
- Persisted state key swaps and malformed CRUD repository responses now recover cleanly instead of silently reusing stale values or showing false empty states.
- Route labels, navigation, and metadata come from one route definition source to reduce product drift.
- App routing now derives route paths from the same route metadata used by navigation and page descriptions.
- Route error recovery returns users directly to Focus Home instead of relying on fragile browser history.
- Sidebar branding and topbar timezone metadata now consume the same workspace-settings pathway as the Settings page, with browser coverage for the save-to-shell flow.
- CRUD mutation flows guard in-flight saves, deletes, and pending confirmations so rapid clicks or route changes do not create duplicate writes or late state updates.
- Settings saves now guard duplicate submits, reject failed local persistence explicitly, and expose busy/invalid states through accessible button names.
- Chief workspace and Weekly Brief local persistence now fail explicitly when browser storage rejects writes, so the UI does not imply unsaved work was safely stored.
- Weekly Brief rejects stale item update/delete attempts without emitting fake progress events.
- Weekly Brief Supabase item rows now preserve `updated_at` through list/create/update paths and use expected timestamps on update/delete conflict checks, with focused mocked-Supabase coverage.
- A central data-schema registry now names the primary local storage domains and model shapes, and Weekly Brief local storage writes a versioned envelope while still reading legacy data.
- Weekly Brief recovery now reloads persisted data after save failures so optimistic edits do not linger as false truth in the interface.
- Capture rejects stale sticky-note edits/deletes without fake update events.
- Opportunities and Content OS reject stale local edits/deletes without writing unchanged data or emitting fake update events.
- Capture and Journal autosave copy now changes to a paused state when local saves fail.
- Chief of Staff fallback output is visibly labeled when AI is unavailable, with error metadata preserved for trust/debugging.
- Chief workspace notes now persist across reloads, reset cleanly, and are covered by Playwright so the workflow behaves like a real saved workspace instead of a one-tab demo.
- Reminder completion is timestamped, summarized, and reversible so Focus Home shows real execution progress without trapping accidental checks.
- Source-status recovery cues now explain when the app is showing a cached workspace snapshot while sync reconnects.
- Async hydration guards are strict-mode-safe, which keeps local dev, Playwright, and production behavior aligned for reviewer demos.
- System Pulse and Chief telemetry refreshes ignore stale async results, reducing noisy state updates during Strict Mode, fast navigation, and reviewer reloads.
- Dashboard next-move selection is validated against the current queue so stale recommendations do not stay pinned after the underlying work changes.
- Focus Home decision rules now live in tested product logic, including blocked-work context, pending reminders, and journal heaviness without a next action.
- Focus Home support modes now use keyboard-friendly roving focus, with E2E coverage for mode switching and reminder completion.
- Compact mobile navigation now closes cleanly after clicks, programmatic route changes, and browser-history returns, with unit and Playwright coverage.
- Focus Home capture, journal, and reminder signal loading is centralized in a dedicated hook so the command center stays composition-first.
- Next-move guidance now prioritizes the oldest unfinished reminder, reducing the risk that quiet commitments get buried.
- Focus Home loading and reminder-helper states now expose busy/status/description semantics without making the interface visually louder.
- Focus Home and Weekly Brief now refresh from storage, focus, and visibility changes so the command center is less likely to show stale context after tab switches.
- Capture empty-submit feedback is connected directly to the note field, and the Capture workspace has reload-persistence E2E coverage.
- App-shell crash recovery is covered globally, so sidebar/topbar/shell failures are caught instead of blanking the whole app.
- Source and System Pulse cues now expose accessible status/labels while staying visually quiet on mobile screens.
- Chief telemetry diagnostics are split from the initial route bundle so observability detail stays available without bloating the first Chief of Staff load.
- CI covers lint, build, typecheck, unit tests, route performance budgets, and Playwright smoke flows.

### Honest current boundaries

- Authentication and multi-user account UX are not yet a complete product experience.
- Supabase persistence exists as an upgrade path, but several local-first workflows still need end-to-end authenticated UX review.
- Chief of Staff is useful as a structured assistant workflow, but production AI readiness still depends on deployed secrets, proxy auth, observability, and usage controls.
- Screenshots and demo recordings should be refreshed after major UI changes before this is used as a flagship portfolio artifact.
- See [docs/KNOWN_LIMITATIONS.md](./docs/KNOWN_LIMITATIONS.md) for the current recruiter-facing limitation list and [docs/PRODUCTION_TRUST_CHECKLIST.md](./docs/PRODUCTION_TRUST_CHECKLIST.md) for the account/sync work that still separates this from a production SaaS.
- See [docs/FINAL_ROADMAP.md](./docs/FINAL_ROADMAP.md) for the phased path from stabilization to a calmer guided operating system and portfolio case study.

## Recent calm-OS audit improvements

Driven by a structured product + UX audit of the system, this branch adds:

- **Honest sync status** - a `SyncStatusPill` in the topbar combines `useWorkspaceSettings().source`, `useOnlineStatus()`, and the offline write queue. It renders **Synced**, **Local only**, **Offline**, or **Pending sync** when supported Supabase writes are actually waiting to replay. Users never silently fall off Supabase, and the UI no longer labels pending work as fully synced.
- **Corruption recovery, not silent loss** - `usePersistentState` and repository localStorage reads preserve unreadable JSON blobs under `${key}__corrupt_<ts>` backup keys and emit `ceo-os:storage-corruption`. A non-blocking `StorageCorruptionBanner` tells the user we kept a copy.
- **Schema-version foundation** - `src/lib/dataSchema.js` centralizes storage domains and model shapes. Weekly Brief local storage now writes `{ schemaVersion, domain, model, data }` envelopes and keeps legacy unwrapped data readable, creating a safe path for migrations and backup/import validation.
- **Optimistic locking for local CRUD** — local Opportunities, Content OS, and Weekly Brief items now stamp `updatedAt` on writes and reject stale saves with a `StaleRecordError` (encoded once in a shared `assertRecordIsFresh` helper). `useCrudPage` surfaces this as a friendly form error: *"This record was changed in another window."* — and refreshes the list under the open modal so closing it reveals the up-to-date row instead of hiding the conflict. Supabase-backed Weekly Brief items now preserve `updated_at` and use expected timestamps for update/delete conflicts in focused repository tests; full authenticated staging regression remains a next step.
- **Cross-page promotion** — four verbs share a single `usePromotionAction` hook (per-record in-flight guard, id-membership check, async run, toast feedback): each Capture sticky has "Make reminder", "Track opportunity", and "Draft as content" actions, and each pending Focus Home reminder has a "Promote" action that creates a weekly priority. All four use the existing repositories, fire calm toast confirmations, and leave the source record in place so the user decides whether to keep the long-form context.
- **Cross-tab list refresh** — `useCrudPage` subscribes to its repository's `*_UPDATED_EVENT` so promotions from Capture (or any other tab) silently re-fetch an open Opportunities or Content OS list without a manual reload, and refreshes never flash the loading skeleton because items stay on screen during the refetch.
- **Composer rehydration** — the Capture composer persists in-progress draft text and the last-used category through `usePersistentState`, so a long brain-dump survives reloads, route changes, and accidental navigation. Invalid stored category values fall back to the default safely.
- **Offline write queue for supported Supabase writes** - `src/lib/offlineWriteQueue.js` ships a localStorage-backed queue with FIFO drop, drain-on-handler, stop-on-first-failure, attempt counters, and `OFFLINE_QUEUE_UPDATED_EVENT` notifications. Opportunities and Content OS create/update/delete mutations enqueue on recoverable Supabase/network failure and drain through shell replay handlers. Weekly Brief, Chief workspace, Settings, Capture, Journal, and reminders still present honest local/error states instead of claiming queued replay.
- **Intentional local setup** - first-run local users can choose **Start blank** or **Load demo workspace** from Focus Home, and Settings includes a visible **Clear demo data** action. Blank mode stops automatic sample seeding for Opportunities, Content OS, and Weekly Brief while preserving user-created local records.
- **Local data portability** - Settings now shows local record count, backup-ready stores, pending supported sync writes, and last local settings save. Users can export/import a validated local JSON backup for known CEO OS browser storage keys. This is a local backup safety valve, not a Supabase migration.
- **Expectation-safe controls** - Settings labels unwired email digest and keyboard shortcut preferences as coming soon, and Weekly Brief shows that saved priorities/blockers influence Focus Home recommendations.
- **Accessibility automation** — `@axe-core/playwright` scans every primary route with the wcag2a/wcag2aa/best-practice rule set; serious/critical violations fail CI, and lighter findings are reported for review.
- **Debounced reflective autosave** — the Weekly Brief close-of-week reflection now debounces to 600ms and surfaces an explicit `Saving / Saved / Couldn't save` indicator next to the field; errors are routed through toasts and `appErrorTelemetry`.
- **Tonal scope** — `SystemPulse` is hidden on Settings and Ops Reliability so action-mode copy doesn't pull at users who are in setup or diagnostic contexts.
- **Grouped IA** — the sidebar now groups routes into **Today / This week / Workspace / Account**. Account links (Ops Reliability, Settings) are visually demoted so daily surfaces lead the eye.
- **Light theme** — a `:root[data-theme="light"]` overlay in `tokens.css` and a `useThemePreference` hook expose a System / Dark / Light picker in Settings. The preference is stored locally so no Supabase profile-schema migration is required, and OS preference changes are reactive when "System" is selected.
- **Architecture cleanup** — `Dashboard.jsx` is split into `FocusModeChips` and `RemindersPanel` (491 → 379 lines); the `.crm-table` primitives are extracted into a shared `crm-table.css` consumed by Opportunities and Content OS; the sync-pill descriptor is a pure helper at `src/lib/syncStatusDescriptors.js`.
- **Settings autosave on blur** — input fields and toggles persist immediately while the explicit `Save Settings` button is preserved as a "save now" affordance.
- **Motion token system** — `--duration-fast / --duration-base / --duration-deliberate` and `--easing-standard` are exported from `tokens.css` so transitions can converge on a calm rhythm.

Coverage for the above ships in this branch: 491 unit/integration tests, lint, typecheck, build, and route-budget checks all pass. The `@axe-core/playwright` sweep ships as a Playwright spec — exercise it on a machine with browsers installed (`npx playwright install` first).

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
Focus Home next-action ranking is handled by `src/lib/focusHomeLogic.js` so decision-support behavior can evolve without bloating the route page.
Focus Home supporting signals are handled by `src/hooks/useFocusHomeSignals.js`, keeping capture, journal, and reminder subscriptions out of route composition.

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
- Accessible source-status and System Pulse labels for trust cues that assistive technology can read
- Controlled keyboard interactions and form behavior in core workflows
- Compact mobile navigation closes predictably across route clicks and history navigation.
- Focus Home loading and reminder-helper states include status and described-by semantics for assistive technology.
- Interactive data rows in opportunities/content tables support keyboard activation (`Enter` / `Space`) in addition to pointer interaction.
- Settings validation announces invalid timezone feedback once, keeps the save action disabled with a descriptive name, and exposes save progress through form busy state.
- Weekly Brief pauses its autosave confidence copy when a save/load error is active instead of over-promising persistence.
- Capture and Journal use the same autosave health copy pattern, so failure states do not keep reassuring users incorrectly.
- Opportunity and Content stale-record errors tell users to refresh and retry when a record changed elsewhere.

### 6) Test and quality culture

- Hook tests cover orchestration and synchronization.
- Library tests cover parsing, settings normalization, and metadata helper behavior.
- Route tests cover key visibility and accessibility flows.
- Playwright covers direct-route refreshes, CRUD smoke paths, Focus Home execution, and Chief workspace persistence/reset behavior.
- Playwright also covers compact mobile navigation behavior so portfolio demos do not depend on untested responsive shell assumptions.
- Playwright now also covers saving workspace settings and seeing shell branding/timezone update across routed navigation.

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
npm run test:e2e
npm run check:route-budgets
npm run check:route-budgets:trend
npm run report:route-budgets
npx markdownlint-cli2 "**/*.md" "!node_modules/**"
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

- Markdown lint
- `npm run lint`
- `npm run build`
- `npm run test:run`
- `npm run typecheck`

The PR test suite also runs route performance budget checks and Playwright smoke tests, including direct route refresh coverage for every primary route.

### Branch protection automation

- Dry run locally:

```bash
npm run configure:branch-protection:dry -- --repo owner/repo --branch main
```

- Apply from GitHub Actions: run the **Enforce Branch Protection** workflow and keep required check set to `Unit + E2E`.

## Configuration

For the full environment variable reference (frontend, Chief proxy, error
telemetry signing + KMS adapters, scheduled SLO probe), see
[`docs/CONFIGURATION.md`](./docs/CONFIGURATION.md).

The short version: the core app runs **without any environment configuration**
on local-first storage. `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
enable sync; `OPENAI_API_KEY` + `CHIEF_STAFF_PROXY_TOKEN` enable AI in
Chief of Staff. Everything else is opt-in.

## Roadmap

- Broaden integration coverage for cross-domain synchronization under concurrent updates.
- Add structured telemetry for AI fallback rates and acceptance outcomes.
- Expand acceptance criteria snapshots for AI-generated structured outputs.
- Publish a portfolio case study with architecture decision records and tradeoff notes.

## Tracked migrations

- [MIG-CRUD-TEMPLATE-SLOTS-2026-09-30](./docs/tracking/CRUD_TEMPLATE_SLOTS_MIGRATION_2026-09-30.md): remove deprecated `CrudPageTemplate` legacy props (`summary`, `section`, `modals`) after migration to `slots.*`.

## Portfolio assets

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the *why* — design decisions, trade-offs, and what's intentionally out of scope.
- [CASE_STUDY.md](./CASE_STUDY.md) for interview- and recruiter-facing architecture summary.
- [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md) for final release-candidate verification.
- [CHANGELOG.md](./CHANGELOG.md) for timestamped hardening and release-readiness updates.
- [docs/assets/README.md](./docs/assets/README.md) for screenshot and demo asset structure.
- [docs/assets/CAPTURE_GUIDE.md](./docs/assets/CAPTURE_GUIDE.md) for updating screenshots and walkthrough captures.
- [docs/KNOWN_LIMITATIONS.md](./docs/KNOWN_LIMITATIONS.md) for honest boundaries to mention in interviews.

## Product visuals and proof

The repository now includes stable paths for visual proof artifacts so portfolio updates can be made quickly without changing docs structure.

### Screenshot targets

| Product area | Asset path | Proof focus |
| --- | --- | --- |
| Focus Home | `docs/assets/screenshots/dashboard-overview.png` | Focus command center, next move flow, and system signal |
| Opportunities | `docs/assets/screenshots/opportunities-pipeline.png` | Pipeline clarity, status flow, action readiness |
| Weekly Brief | `docs/assets/screenshots/weekly-brief-planning.png` | Priorities, blockers, and weekly operating rhythm |
| Chief of Staff | `docs/assets/screenshots/chief-of-staff-structured-output.png` | AI output quality, structured acceptance workflow |
| Settings | `docs/assets/screenshots/settings-workspace-profile.png` | Workspace defaults, persistence source alignment, local backup/data health |

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
  - `src/hooks/useDashboardData.test.js`
  - `src/hooks/useWeeklyBrief.test.js`
  - `src/hooks/useWorkspaceSettings.test.js`
  - `src/hooks/useFocusHomeSignals.test.js`
  - `src/lib/focusSignalUtils.test.js`
  - `src/lib/pageMeta.test.js`
  - `src/pages/Settings.test.jsx`
  - `src/hooks/useSettings.test.js`
  - `src/lib/settingsRepository.test.js`
  - `src/lib/weeklyRepository.test.js`
  - `src/pages/WeeklyBrief.test.jsx`
  - `src/hooks/useChiefWorkspace.test.js`
  - `src/lib/captureRepository.test.js`
  - `src/lib/opportunitiesRepository.test.js`
  - `src/lib/contentRepository.test.js`
  - `src/lib/stateUtils.test.js`
  - `src/pages/Capture.test.jsx`
  - `src/pages/Journal.test.jsx`
  - `src/lib/focusHomeLogic.test.js`
  - `src/App.test.jsx`
  - `src/components/ui/Sidebar.test.jsx`
  - `e2e/capture-workspace.spec.js`
  - `e2e/mobile-navigation.spec.js`
  - `e2e/settings-shell.spec.js`

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

A timestamped history of audit + hardening cycles lives in
[`CHANGELOG.md`](./CHANGELOG.md). The recent product-readiness audit and the
follow-up phase work are documented in
[`docs/audits/ceo-os-product-readiness-audit.md`](./docs/audits/ceo-os-product-readiness-audit.md).

## Author

Jenna Zawaski - frontend product engineering with workflow-first architecture focus.
