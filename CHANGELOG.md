# Changelog

All notable updates are documented here for portfolio and release-review context.

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
