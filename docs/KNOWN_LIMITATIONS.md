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

- ✅ **Light theme.** A `:root[data-theme="light"]` overlay and a System / Dark / Light picker in Settings, persisted locally. Raw-rgba surfaces in `system.css` and `chief-of-staff.css` are retuned in light mode.
- ✅ **Online/offline awareness.** A three-state sync pill (Synced / Local only / Offline) backed by `useOnlineStatus`.
- ✅ **Optimistic locking for local CRUD on Opportunities, Content OS, and Weekly Brief items.** `updatedAt` stamping plus `StaleRecordError` rejection prevents two-tab data loss across all three local-first surfaces.
- ✅ **Chief of Staff dedup against existing rows** — exact-match dedup against existing opportunities/content/priorities runs at every acceptance branch (re-verified in code review).
- ✅ **Cross-page promotion verbs.** Four verbs share the same `usePromotionAction` hook: Capture sticky → Dashboard reminder, Capture sticky → Opportunity, Capture sticky → Content draft, and pending reminder → weekly priority. All reuse the existing repositories, leave the source record in place, confirm via toast, and reject rapid double-clicks via a per-record in-flight guard.
- ✅ **Cross-tab list refresh.** `useCrudPage` subscribes to its repository's `*_UPDATED_EVENT` so writes from other surfaces (cross-page promotions, other tabs) silently re-fetch the current page's list without a manual reload, and refreshes keep `isLoading` false so the page never flashes a skeleton during in-page CRUD writes.
- ✅ **Composer rehydration on Capture.** Draft text and last-used category persist through `usePersistentState`; long brain-dumps survive reloads, route changes, and accidental navigation. The category stays selected after a successful save for rapid-fire batches; invalid stored values fall back safely.
- ✅ **Offline write queue infrastructure.** `offlineWriteQueue` ships with enqueue/drain/remove/clear primitives, FIFO-trimmed at 200 entries, stop-on-first-failure semantics, attempt counters, and an `OFFLINE_QUEUE_UPDATED_EVENT`. The topbar `SyncStatusPill` renders a `+N` badge when the queue is non-empty. Repository wiring is the open follow-up.
- ✅ **Unmount-safe promotion toasts.** `usePromotionAction` no longer fires success or failure toasts after the host component has unmounted, preventing stale-closure setState and orphaned dismiss timeouts.
- ✅ **Shared `readUpdatedAtMs` helper.** Three repositories used to inline the same timestamp parser for the optimistic-locking protocol; extracted into one helper alongside `assertRecordIsFresh`.
- ✅ **Chief notes-limit warning token.** `.chief-notes-meta--limit` no longer hardcodes a soft-pink color that fades on light paper; uses the semantic `--danger-text` token so the warning reads in both themes.
- ✅ **Accessibility automation.** `@axe-core/playwright` scans every primary route with a wcag2a/wcag2aa/best-practice rule set; test fails on serious or critical violations and reports lighter findings to the test output for review.
- ✅ **Stale-write recovery refresh.** When a save is rejected as stale, the items list re-fetches under the open modal so closing it reveals the up-to-date row instead of hiding the conflict. Non-stale errors do NOT trigger a refetch (covered by an explicit test).
- ✅ **Shared optimistic-locking helper.** Three repositories shared the same locking guard; extracted into `assertRecordIsFresh` with full back-compat semantics.
- ✅ **Light-mode polish on Focus Home, the corruption banner, and the weekly status dot.** Diagonal accent stripe softened; corruption banner amber strengthened; autosave status-dot box-shadow rings retuned with ink-on-paper halos so the pulse remains legible.
- ✅ **Tap-target hygiene on Dashboard inline link buttons.** Promote/Remove now ship at 32 px+ with a visible focus ring instead of 17 px tall.

## Open audit follow-ups

These items remain intentionally outside the current scope and are good candidates for the next iteration:

- **Server-side optimistic locking.** Local-first stale-write detection is in place, but Supabase-backed updates do not yet use ETags or a version column. A schema migration plus repository-side check would extend the protection across devices.
- **Offline write replay — repository wiring.** The queue infrastructure (`offlineWriteQueue` + sync-pill `+N` indicator) is in place. The remaining work is to hook `createOpportunity` / `createContentItem` / etc. into the queue on Supabase failure and call `drainOfflineQueue` on the `online` event. Deferred until a Supabase staging environment is available to validate end-to-end.
- **Fuzzy dedup in Chief of Staff acceptance.** Exact-match dedup is in place; titles like "Q3 launch" vs "Q3 Launch Plan" still pass through. A similarity heuristic would help, but it has to balance recall against false positives that could block legitimate distinct items.
- **Light-mode polish across the remaining page-specific surfaces.** Focus Home, the corruption banner, the weekly autosave dot, the journal prompts, and the Chief notes-limit warning are tuned; production demos may still surface a few minor surface tweaks.

## Best Portfolio Framing

- Present it as a calm, local-first CEO command center with a clear backend upgrade path.
- Emphasize decision-support quality: Focus Home recommends the next action from priorities, blockers, reminders, journal signals, opportunities, and content.
- Show reliability work: explicit persistence failures, stale-record protection, app-shell error recovery, route refresh coverage, compact navigation coverage, and Playwright smoke tests.
- Mention that shell identity/timezone sync is tested end to end, while deeper account-sync scenarios remain an honest next step.
- Avoid calling it a complete company operating platform until authenticated multi-user sync, AI usage controls, and production incident response are finished.
