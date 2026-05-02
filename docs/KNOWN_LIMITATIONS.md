# Known Limitations

Use this as the honest interview framing for CodeHerWay CEO OS. The project is strong as a local-first founder operating-system prototype with production-minded architecture, but it should not be described as a finished SaaS.

## Current Boundaries

- Authentication exists as a backend path, but the end-to-end account onboarding, sign-in, account recovery, and multi-user UX still need product hardening.
- Supabase persistence is implemented as an upgrade path, but local-first workflows still need a complete authenticated regression pass against a real Supabase environment.
- In-session shell settings now stay aligned with the Settings page, but authenticated multi-device and multi-tab settings reconciliation still needs broader QA.
- Chief of Staff AI generation depends on deployed server secrets and proxy configuration. Without those, the app should be presented through its deterministic fallback and structured-review flow.
- Local browser storage is intentionally resilient for demos and solo use, but it is not a cross-device sync model by itself.
- Screenshots and demo recordings should be refreshed after UI changes, especially Focus Home source-status styling, System Pulse trust cues, and compact mobile navigation.
- Operational telemetry and route-budget tooling demonstrate production thinking, but alert response workflows are still portfolio evidence rather than a fully staffed production process.

## Open audit follow-ups

These items came out of the May 2026 calm-OS audit and are intentionally not addressed in the current branch — they are good candidates for the next iteration:

- **Per-record writes for Weekly Brief and Opportunities.** Both currently rewrite the whole collection on update, which can lose concurrent edits when two tabs save at once. A per-record update with `updated_at` + stale-write rejection would close this.
- **Offline write replay.** Local-first writes still do not replay upstream when connectivity returns. An `offlineWriteQueue` keyed in localStorage (mirroring the pattern in `appErrorTelemetry`) would harden this.
- **Cross-page promotion.** A Capture sticky cannot become a Reminder, and a Reminder cannot become a Weekly Priority. The audit recommends adding per-item "Promote to…" verbs that reuse existing repositories.
- **Chief of Staff dedup on acceptance.** Generated priorities/opportunities/content can be accepted without checking against existing rows — a fuzzy title match before creation would prevent duplicates.
- **Light theme.** Tokens are semantic and dark-only today; a `:root[data-theme="light"]` overlay plus a persisted toggle would close the premium-feel gap noted in the audit.
- **Accessibility automation.** Manual a11y is good (skip link, focus rings, focus trap, reduced-motion); axe-core in Playwright would add automated coverage.

## Best Portfolio Framing

- Present it as a calm, local-first CEO command center with a clear backend upgrade path.
- Emphasize decision-support quality: Focus Home recommends the next action from priorities, blockers, reminders, journal signals, opportunities, and content.
- Show reliability work: explicit persistence failures, stale-record protection, app-shell error recovery, route refresh coverage, compact navigation coverage, and Playwright smoke tests.
- Mention that shell identity/timezone sync is tested end to end, while deeper account-sync scenarios remain an honest next step.
- Avoid calling it a complete company operating platform until authenticated multi-user sync, AI usage controls, and production incident response are finished.
