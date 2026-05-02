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

## Recently closed audit items

The May 2026 calm-OS audit pass closed several gaps in this branch:

- ✅ **Light theme.** A `:root[data-theme="light"]` overlay and a System / Dark / Light picker in Settings, persisted locally.
- ✅ **Online/offline awareness.** A three-state sync pill (Synced / Local only / Offline) backed by `useOnlineStatus`.
- ✅ **Optimistic locking for local CRUD on Opportunities and Content OS.** `updatedAt` stamping plus `StaleRecordError` rejection prevents two-tab data loss in the local-first path.
- ✅ **Chief of Staff dedup against existing rows** — exact-match dedup against existing opportunities/content/priorities is already in place at every acceptance branch (re-verified in code review).

## Open audit follow-ups

These items remain intentionally outside the current scope and are good candidates for the next iteration:

- **Per-record writes for Weekly Brief.** Weekly Brief still uses whole-collection rewrites; the same `updatedAt`/`StaleRecordError` pattern used for Opportunities and Content OS should be applied there too.
- **Server-side optimistic locking.** Local-first stale-write detection is in place, but Supabase-backed updates do not yet use ETags or a version column. A schema migration plus repository-side check would extend the protection across devices.
- **Offline write replay.** Local writes survive offline, but they do not replay upstream when connectivity returns. An `offlineWriteQueue` keyed in localStorage (mirroring the pattern in `appErrorTelemetry`) would harden this.
- **Cross-page promotion.** A Capture sticky cannot become a Reminder, and a Reminder cannot become a Weekly Priority. The audit recommends adding per-item "Promote to…" verbs that reuse existing repositories.
- **Fuzzy dedup in Chief of Staff acceptance.** Exact-match dedup is in place; titles like "Q3 launch" vs "Q3 Launch Plan" still pass through. A similarity heuristic would help, but it has to balance recall against false positives that could block legitimate distinct items.
- **Accessibility automation.** Manual a11y is good (skip link, focus rings, focus trap, reduced-motion); axe-core in Playwright would add automated coverage.

## Best Portfolio Framing

- Present it as a calm, local-first CEO command center with a clear backend upgrade path.
- Emphasize decision-support quality: Focus Home recommends the next action from priorities, blockers, reminders, journal signals, opportunities, and content.
- Show reliability work: explicit persistence failures, stale-record protection, app-shell error recovery, route refresh coverage, compact navigation coverage, and Playwright smoke tests.
- Mention that shell identity/timezone sync is tested end to end, while deeper account-sync scenarios remain an honest next step.
- Avoid calling it a complete company operating platform until authenticated multi-user sync, AI usage controls, and production incident response are finished.
