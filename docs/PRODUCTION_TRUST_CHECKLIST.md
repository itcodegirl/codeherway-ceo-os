# Production Trust Checklist

This checklist is the line between a polished local-first portfolio product and
a production account-based CEO OS. Keep it visible until each item is backed by
UX, repository behavior, and authenticated regression coverage.

## Account And Recovery

- Sign-up, sign-in, sign-out, and auth-expired states are visible and tested.
- Account recovery flow is documented and verified end to end.
- Settings and source notices clearly distinguish local-only, demo data, blank local workspace, and synced workspace states.
- Local-to-cloud migration lets a user decide what happens to existing local data before connecting Supabase.

## Sync And Conflict Trust

- Offline replay coverage includes Weekly Brief, Chief workspace, Settings, Capture, Journal, and reminders, or those surfaces keep explicit local/error states.
- Pending writes show a count only when real replay handlers exist for those queued kinds.
- Supabase Opportunity and Content OS updates use `updated_at` conflict checks; extend the same contract to every mutable table before SaaS launch.
- Conflict copy explains what changed, what was preserved, and what the user can do next.

## Staging Regression

- Supabase staging project has seeded test users for local-only, authenticated, auth-expired, and reconnect scenarios.
- Regression suite covers create/update/delete for Opportunities, Content OS, Weekly Brief, Chief workspace, and Settings under authenticated Supabase.
- Reconnect tests prove queued writes either replay successfully or remain visibly pending.
- Storage corruption tests cover every repository that reads JSON from localStorage.

## Launch Readiness

- Demo/sample setup stays covered in regression when data-source copy changes.
- Export/import backup path is available before encouraging local-first production use.
- Known limitations are linked from README and release notes.
- Screenshots and walkthrough media are refreshed after trust-message or Focus Home changes.
