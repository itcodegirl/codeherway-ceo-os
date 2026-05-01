# Case Study: CodeHerWay CEO OS

## 1) Problem framing

Founders and small operators frequently manage fragmented workflows across opportunities, content, and weekly planning, often with disconnected tools and fragile data sync.

This repository demonstrates a single-screen, browser-first operations dashboard that solves that problem by:

- Keeping domain logic organized by feature and responsibility boundary
- Maintaining local-first resilience by default
- Integrating AI assistance where it adds leverage (executive summaries, prioritization suggestions, content planning support)
- Preserving accessibility and status clarity as first-class UX concerns

## 1.1) Visual evidence map

The following assets are referenced for portfolio review and should be kept current with the app:

- Dashboard proof: `docs/assets/screenshots/dashboard-overview.png`
- Opportunities proof: `docs/assets/screenshots/opportunities-pipeline.png`
- Weekly brief proof: `docs/assets/screenshots/weekly-brief-planning.png`
- Chief of staff proof: `docs/assets/screenshots/chief-of-staff-structured-output.png`
- Settings proof: `docs/assets/screenshots/settings-workspace-profile.png`
- Walkthrough demo: `docs/assets/demo/ceo-os-workflow-walkthrough.webm`
- Capture/update workflow: `docs/assets/CAPTURE_GUIDE.md`

### Visual preview highlights

#### Dashboard overview

![Dashboard visual proof](docs/assets/screenshots/dashboard-overview.png)

#### Chief of Staff structured workflow

![Chief of staff visual proof](docs/assets/screenshots/chief-of-staff-structured-output.png)

## 2) Architecture and decisions

### Decision: route-level thin composition + repository ownership

- **Goal:** minimize churn in pages while keeping behavior testable.
- **Implementation:** route pages primarily compose components and hooks; domain hooks coordinate lifecycle + state; repositories own persistence and API boundaries.
- **Evidence:** dashboard/weekly/chief workflows are split across:
  - `src/pages/*`
  - `src/hooks/*`
  - `src/lib/*`
- **Visual tie-in:** the dashboard and weekly brief screenshots should show unchanged page-level composition while data orchestration remains hook/repository-driven.

### Decision: local-first with Supabase upgrade path

- **Goal:** preserve usability even without backend credentials.
- **Implementation:** repositories first attempt local storage fallback, and prefer Supabase when configured.
- **Evidence:** source-aware flags (`local` / `supabase`) are surfaced to the UI and tests validate fallback behavior.
- **Visual tie-in:** settings and dashboard captures should include source-status cues to demonstrate local-first transparency.

### Decision: AI through a server proxy

- **Goal:** avoid client-exposed provider secrets and keep response failure handling explicit.
- **Implementation:** route-side proxy endpoints for Vercel and Netlify; `src/lib/openai.js` performs output extraction and structured parsing with fallback handling.
- **Evidence:** parser tests cover direct payloads, fenced JSON, fallback content paths, and tool-output text arrays.
- **Visual tie-in:** chief-of-staff screenshot and walkthrough should show structured output acceptance flow and fallback-safe interaction language.

## 2.1) Product outcome narrative

- Operators can move from weekly priorities to action without leaving one shell.
- Founder content planning stays visible alongside opportunity momentum.
- AI assistance is integrated as an accelerant, not a hidden dependency, because fallback output paths remain explicit.
- Portfolio reviewers can trace each claim to both source code and visual proof assets.

## 3) Hardening focus for production credibility

- Safe normalization for:
  - null/undefined dashboard inputs
  - malformed weekly payloads
  - structured AI outputs
- Explicit user feedback for generation/acceptance outcomes and errors
- Deterministic metadata and shell behavior for route transitions
- Route rendering derived from shared route metadata so navigation, page metadata, and router paths stay aligned
- App-shell error recovery catches layout/sidebar/topbar crashes, not only route-view crashes
- Event-driven refresh strategy to keep screens synchronized after mutations
- Focus Home capture, journal, and reminder subscriptions are centralized in a dedicated hook instead of living inside the route page
- Deterministic route-crash recovery back to Focus Home rather than browser-history-dependent recovery
- Mounted-ref lifecycle guards for CRUD saves/deletes and confirmation flows so async mutations do not update unmounted screens
- Strict-mode-safe hydration guards so local-first state restores reliably during real browser reloads and reviewer demos
- Stale async refresh guards for shared pulse and telemetry hooks so route changes do not overwrite current state with older request results
- Settings persistence rejects failed writes explicitly and prevents duplicate save submissions while a save is already in flight
- Chief workspace and Weekly Brief persistence use required local-write semantics so failed browser storage cannot look like a successful save
- Weekly Brief rejects stale local item mutations before writing or emitting update events
- Capture rejects stale sticky-note update/delete attempts before writing or emitting update events
- Opportunities and Content OS reject stale local update/delete attempts through shared record-mutation guards
- Route-level splitting for Chief telemetry diagnostics so operational detail does not inflate the first Chief of Staff route load
- CI enforcement for lint, build, test, and typecheck on every pull request
- Optional fail-secure proxy auth mode plus bounded in-memory rate-limit tracking for AI traffic

## 4) Accessibility and UX posture

- One consistent navigation shell with skip-link + focus restore
- Semantic route composition and consistent form behavior
- Local status indicators for data source and loading/error state
- Source-status and System Pulse cues expose accessible status/labels while staying visually lightweight
- Keyboard-friendly editing and workflow actions
- Compact mobile navigation closes predictably after route clicks, programmatic navigation, and history returns
- Focus Home loading and reminder-helper states expose busy/status/description semantics for assistive technology
- Settings form states expose busy, disabled, and invalid-timezone feedback through accessible control names without duplicate alerts
- Weekly Brief autosave copy changes when persistence is paused so the page does not reassure users incorrectly during failures
- Capture and Journal share autosave health copy so local save failures are visible without adding extra decision load
- Opportunity and Content stale-record errors tell users when refresh/retry is the right recovery path

## 5) Verification set

Run before sharing this case study or merging new work:

```bash
npm run lint
npm run build
npm run test:run
npm run typecheck
npm run check:route-budgets
npm run check:route-budgets:trend
npm run test:e2e
```

## 6) Current boundaries and next-step roadmap

- Additional telemetry around AI fallback reasons and acceptance rates
- More cross-domain event synchronization tests under concurrent multi-screen updates
- Continued refresh of screenshot/demo artifacts as UI polish evolves

## 7) Latest hardening updates (April 23, 2026)

- Dashboard KPI semantics now distinguish warning vs positive context so risk-heavy summaries are not visually framed as success.
- Dashboard snapshot, pipeline, and activity surfaces now use semantic list markup with explicit accessible labels.
- Supabase runtime access was centralized into `src/lib/supabaseRuntime.js`, removing repeated adapter/config boilerplate across repositories.
- Added focused unit coverage for shared runtime behavior and dashboard/activity rendering semantics.

## 8) Latest hardening updates (April 30, 2026)

- Netlify direct-route reloads are protected by an SPA fallback and covered with Playwright direct-route refresh tests.
- Route labels, navigation items, and page metadata now come from centralized route definitions to reduce drift.
- Route-level error boundaries reset on navigation so one failed view does not trap the rest of the app shell.
- Chief of Staff fallback output is explicitly labeled, preserves proxy error metadata, and explains when no structured actions can be saved.
- Chief workspace notes now persist across reloads, reset cleanly, and are covered by Playwright to prove the workflow behaves like a saved workspace.
- Async mount guards were normalized for Strict Mode so dev/test reload behavior matches production expectations more closely.
- Reminder completion now records completion timestamps and feeds a visible Focus Home progress summary.
- Sample-data/source messaging has been rewritten as product-facing local workspace language rather than developer setup copy.
- System Pulse and Chief telemetry refreshes now ignore stale async responses during fast navigation and Strict Mode remounts.
- Dashboard next-move recommendations now clear when they no longer belong to the current execution queue.
- Focus Home next-action logic is extracted to `src/lib/focusHomeLogic.js`, where blocked work, reminders, and journal heaviness are ranked as calm decision-support signals.
- Focus Home support-mode controls now use roving keyboard focus and have Playwright coverage for keyboard switching plus reminder completion.
- Obsolete legacy Chief AI prompt/output components were removed so the product has one maintained Chief of Staff workflow path.
- Chief telemetry diagnostics are lazy-loaded separately from the main Chief of Staff route to keep route budgets green while preserving observability.
- Error-boundary recovery now routes directly to Focus Home, giving users a reliable escape hatch from a failed view.
- App route declarations now derive paths from shared route metadata, reducing future route/navigation drift.
- Completed reminders remain visible and can be toggled back to pending, so progress tracking is reversible.
- Focus Home support-mode radios now support vertical arrow keys as well as horizontal arrows.
- Playwright now verifies reversible reminder completion and route budgets remain within trend limits.
- CRUD save/delete flows now guard duplicate in-flight submits and avoid late state updates after route changes.
- Mounted-ref lifecycle handling is centralized in a shared hook for mutation-heavy hooks.
- Stale reminder toggle/delete attempts are rejected without emitting fake progress events.
- Completed reminder styling now preserves checkbox/control contrast while keeping text-level completion cues.
- Confirmation unmount safety is covered with targeted hook tests, and the full QA gate remains green.
- Settings saves now guard duplicate in-flight submits and reuse the shared mounted-ref lifecycle helper.
- Settings persistence failures now reject explicitly, avoiding false cross-tab update events when local storage fails.
- Settings validation now disables saving with an explanatory accessible name and announces invalid timezone feedback once.
- Settings page tests cover saving state, invalid timezone feedback, changed workspace fields, and save submission.
- Chief workspace local note/output writes now reject when browser storage fails.
- Required localStorage write handling is centralized in `src/lib/utils.js` and reused by local-first repositories.
- Weekly Brief update/delete mutations now reject stale item ids without emitting fake update events.
- Weekly Brief communicates paused autosave state when persistence errors are active.
- Tests cover Chief note-save errors, Weekly stale mutations, failed weekly persistence, and Weekly Brief autosave copy.
- Capture stale edits/deletes now reject without emitting fake sticky-note update events.
- Capture and Journal autosave status now moves to paused copy when local persistence fails.
- Tests cover Capture stale mutations and Capture/Journal local save failure UI.
- Opportunities and Content OS stale edits/deletes now reject without emitting fake update events.
- Shared record-mutation guards in `src/lib/stateUtils.js` reduce duplicated local CRUD failure handling.
- Integration tests cover stale-record recovery guidance in Opportunity and Content workflows.

## 9) Latest hardening updates (May 1, 2026)

- App-shell crash recovery now wraps the full router/Suspense shell, so non-route shell failures return a stable recovery UI instead of a blank app.
- Focus Home decision-support logic moved out of the route page and into tested product logic.
- Next-move recommendations now include blocked priorities, pending reminders, and journal entries that name heaviness without a next action.
- Source-status cues and System Pulse nodes now have accessible status/label semantics and stronger small-screen wrapping behavior.
- Added tests for global app recovery, source-status trust cues, System Pulse labels, and Focus Home decision rules.
- Full local verification passed on May 1, 2026: lint, typecheck, full Vitest, build, route budgets, and Playwright E2E.
- Compact mobile navigation now closes across clicks, programmatic route changes, and browser-history returns.
- Focus Home signal subscriptions now live in `src/hooks/useFocusHomeSignals.js`, keeping the route focused on composition.
- Next-move guidance now prioritizes the oldest pending reminder and avoids awkward punctuation in quoted actions.
- Focus Home reminder input copy now connects helper and progress context through accessible descriptions.
- Playwright coverage now includes a 390px mobile navigation flow through Capture and browser-back behavior.

## 10) Latest hardening updates (May 1, 2026, batch two)

- Persisted state now reloads cleanly when a storage key changes, preventing stale shell or settings values from leaking between contexts.
- CRUD list hooks now treat malformed repository payloads as real load failures instead of quietly rendering a false empty state.
- Sidebar branding and topbar timezone metadata now refresh through a shared workspace-settings hook, reducing drift between the Settings page and the app shell.
- Weekly Brief optimistic edits now recover to the persisted record after save failures, which is a more honest product behavior for planning workflows.
- Source-status banners now explain when the interface is showing the latest available snapshot while sync reconnects.
- Browser coverage now includes the settings-to-shell workflow so portfolio demos prove that saved workspace identity updates survive routed navigation.
- Capture empty-submit feedback is now wired directly to the note field and covered by a reload-persistence Playwright flow.
- Route performance static budgets and the tracked baseline were refreshed after the latest Dashboard trust/recovery work, with both static and trend checks passing locally.
