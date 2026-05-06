# Migration Ticket: CrudPageTemplate Legacy Props Removal

- Ticket: `MIG-CRUD-TEMPLATE-SLOTS-2026-09-30`
- Owner: Frontend Platform
- Status: **Complete** (completed 2026-05-05)
- Target removal date: **September 30, 2026** (completed ahead of schedule)
- Scope: Remove deprecated legacy props `summary`, `section`, and `modals` from `CrudPageTemplate` after all callers migrated to `slots.summary`, `slots.section`, and `slots.modals`.

## Why this migration exists

`CrudPageTemplate` previously supported both legacy and slots-based contracts for backward compatibility. Legacy support was deprecated and scheduled for removal to reduce API complexity and keep page composition predictable.

## Exit criteria

- [x] No in-repo consumers pass legacy `summary`, `section`, or `modals` props.
- [x] All consumers use `slots.summary`, `slots.section`, and `slots.modals`.
- [x] `CrudPageTemplate` runtime warning for legacy props is removed.
- [x] `CrudPageTemplate` legacy fallback logic is removed.
- [x] Unit tests cover slots-only behavior.
- [x] Release notes include the migration completion.

## Completion notes

Both production callers (`OpportunityCrudPage`, `ContentCrudPage`) were already using `slots.*`. The migration was completed by:
- Removing legacy prop destructuring (`summary`, `section`, `modals`) from `CrudPageTemplate`
- Removing the `hasWarnedLegacyProps` ref and `usesLegacyProps` warning effect
- Removing the `|| summary` fallbacks in slot resolution
- Updating all tests in `CrudPageTemplate.test.jsx` to use `slots.*` exclusively
- Verified clean with `npm run lint`, `npm run build`, `npm run test:run`
