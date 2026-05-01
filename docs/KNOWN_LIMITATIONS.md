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

## Best Portfolio Framing

- Present it as a calm, local-first CEO command center with a clear backend upgrade path.
- Emphasize decision-support quality: Focus Home recommends the next action from priorities, blockers, reminders, journal signals, opportunities, and content.
- Show reliability work: explicit persistence failures, stale-record protection, app-shell error recovery, route refresh coverage, compact navigation coverage, and Playwright smoke tests.
- Mention that shell identity/timezone sync is tested end to end, while deeper account-sync scenarios remain an honest next step.
- Avoid calling it a complete company operating platform until authenticated multi-user sync, AI usage controls, and production incident response are finished.
