# Changelog

All notable updates are documented here for portfolio and release-review context.

## 2026-05-01 - Compact navigation and Focus Home signal hardening

- `4484b5b` - Stabilized compact sidebar state across programmatic route changes and history returns.
- `99944c3` - Centralized Focus Home capture, journal, and reminder signals in a dedicated hook.
- `4736a4d` - Prioritized the oldest pending reminder in next-move guidance and cleaned action-copy punctuation.
- `2f7f94f` - Added accessible loading and reminder helper semantics to Focus Home with responsive chip/list polish.
- `e14d497` - Added Playwright coverage for compact mobile navigation route/history behavior.

## 2026-05-01 - Calm recovery and decision-support hardening

- `19ebcb2` - Added app-shell crash recovery around the full router/Suspense shell.
- `3b9266f` - Extracted Focus Home decision rules into tested product logic.
- `3786ca1` - Ranked blocked priorities, pending reminders, and journal heaviness in the next-move queue.
- `2be9bd6` - Improved responsive wrapping plus accessible source-status and System Pulse trust cues.
- `bfb5167` - Added QA coverage for app recovery, source-status semantics, and pulse labels.

## 2026-05-01 - CRUD stale-record integrity hardening

- `0a6a97c` - Rejected stale Opportunity update/delete attempts without emitting fake update events.
- `d040d08` - Centralized local record replace/delete guards in shared state utilities.
- `8477064` - Rejected stale Content OS update/delete attempts without emitting fake update events.
- `204ae9b` - Clarified Opportunity and Content stale-record error guidance for users.
- `88c46d3` - Added CRUD integration coverage for stale-record recovery copy.

## 2026-04-30 - Capture and journal autosave trust hardening

- `c444cd2` - Rejected stale Capture deletes without emitting fake update events.
- `1b4089d` - Centralized autosave helper copy for healthy versus paused save states.
- `0780d8a` - Rejected stale Capture updates instead of silently clearing error state.
- `f715acb` - Clarified Capture and Journal paused-autosave feedback when saves fail.
- `fdf01c4` - Added Capture and Journal page coverage for local save failure states.

## 2026-04-30 - Chief and weekly persistence truth hardening

- `bccafd8` - Made Chief workspace local note/output persistence fail explicitly when browser storage rejects writes.
- `6541eb8` - Centralized required localStorage writes behind one throwing helper to reduce missed-failure drift across repositories.
- `48749ac` - Rejected stale Weekly Brief update/delete attempts without emitting fake update events.
- `48ea73f` - Clarified Weekly Brief autosave copy when persistence is paused by an error.
- `890fbae` - Added Chief workspace and Weekly Brief tests for persistence failure states.

## 2026-04-30 - Settings persistence and accessibility hardening

- `41b8764` - Guarded Settings saves against duplicate in-flight submits.
- `03b0bbc` - Reused the shared mounted-ref lifecycle helper in Settings state orchestration.
- `632b18e` - Made Settings persistence failures reject explicitly instead of emitting a false saved event.
- `d013ca7` - Clarified Settings save-button state and invalid-timezone messaging for assistive tech.
- `91ce193` - Added Settings page coverage for saving state, invalid timezone feedback, and save interactions.

## 2026-04-30 - CRUD lifecycle and reminder integrity hardening

- `0b8db1d` - Guarded CRUD mutation lifecycles against duplicate in-flight saves and late state updates after unmount.
- `fbfa22e` - Centralized mounted-ref lifecycle handling in a shared hook for mutation-heavy workflows.
- `22ccc3a` - Rejected stale reminder toggle/delete attempts without emitting fake progress events.
- `4942074` - Preserved completed reminder checkbox/control contrast by moving the done cue to reminder text.
- `f2fcd90` - Added confirm-delete unmount safety coverage and reran the full QA gate.

## 2026-04-30 - Recovery, routing, and reversible execution hardening

- `dd8d31d` - Made route error recovery return directly to Focus Home instead of depending on browser history.
- `0128dba` - Derived React Router paths from shared route metadata to reduce navigation and metadata drift.
- `4ba77bc` - Kept completed reminders visible and recoverable so accidental checks can be undone.
- `f3a7a60` - Polished shared recovery styling, modal mobile behavior, and Focus Home arrow-key support.
- `7a8865e` - Added Playwright coverage for reversible reminder completion while keeping route budgets under trend limits.

## 2026-04-30 - Stability, execution, and route-budget hardening

- `da56ca5` - Guarded System Pulse and Chief telemetry refreshes against stale async updates after remounts or fast navigation.
- `00eb961` - Removed obsolete legacy Chief AI prompt/output components so the maintained Chief of Staff path is the single source of truth.
- `bbbf75b` - Prevented Dashboard next-move recommendations from staying pinned after they fall out of the current execution queue.
- `d504d74` - Improved Focus Home support-mode keyboard navigation with roving focus semantics.
- `e340d4b` - Added Playwright coverage for Focus Home keyboard mode switching and reminder completion, and split Chief telemetry diagnostics from the initial route bundle to keep route budgets green.

## 2026-04-23 - Accessibility, reliability, and CI quality pass

- `5081529` - Added keyboard activation (Enter/Space) and focusability for interactive rows in opportunity/content tables, with test coverage.
- `9ba1d61` - Added dashboard route tests for weekly-load error/retry and empty-state rendering.
- `ce28731` - Hardened CI permissions and enabled concurrency cancellation to reduce duplicate workflow runs.
- `6d592a1` - Aligned table helper copy with keyboard interaction support and asserted updated messaging in tests.
- `d3607c2` - Resolved markdownlint issues across case study, release checklist, and README formatting.
- `1040c2c` - Improved table semantics by promoting first cells to row headers for better assistive navigation context.
- `6feb9dc` - Enforced markdown linting in CI to catch heading/list/spacing regressions before merge.
- `44c6ce5` - Added component tests for source-status error alert and retry behavior.

## 2026-04-21 - Release readiness hardening pass

- `d95e8d3` - Added Chief of Staff edge-case resilience coverage for rapid acceptance dedupe, malformed structured items, and safe partial-payload handling.
- `188dcc7` - Hardened dashboard insight resilience with malformed-input tests and safe row normalization defaults.
- `24d811d` - Fixed route metadata resolution to normalize trailing-slash paths and added regression coverage in page-meta hook/tests.
- `f18c16a` - Added a reusable release-candidate checklist and linked it from portfolio-facing docs.
- `e9e2a50` - Added README release evidence snapshot with verification date, quality-gate status, and final hardening commit trail.
