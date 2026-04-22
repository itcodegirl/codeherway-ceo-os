# Migration Ticket: CrudPageTemplate Legacy Props Removal

- Ticket: `MIG-CRUD-TEMPLATE-SLOTS-2026-09-30`
- Owner: Frontend Platform
- Status: In Progress
- Target removal date: **September 30, 2026**
- Scope: Remove deprecated legacy props `summary`, `section`, and `modals` from `CrudPageTemplate` after all callers are migrated to `slots.summary`, `slots.section`, and `slots.modals`.

## Why this migration exists

`CrudPageTemplate` currently supports both legacy and slots-based contracts for backward compatibility. Legacy support is deprecated and scheduled for removal to reduce API complexity and keep page composition predictable.

## Exit criteria

- [ ] No in-repo consumers pass legacy `summary`, `section`, or `modals` props.
- [ ] All consumers use `slots.summary`, `slots.section`, and `slots.modals`.
- [ ] `CrudPageTemplate` runtime warning for legacy props is removed.
- [ ] `CrudPageTemplate` legacy fallback logic is removed.
- [ ] Unit tests cover slots-only behavior.
- [ ] Release notes include the migration completion and breaking-change notice (if applicable).

## Implementation checklist

- [ ] Audit callsites using `summary`, `section`, `modals`.
- [ ] Migrate each callsite to `slots.*`.
- [ ] Remove legacy prop parsing and fallback branches.
- [ ] Update tests to enforce slots-only API.
- [ ] Validate with:
  - [ ] `npm run lint`
  - [ ] `npm run build`
  - [ ] `npm run test:run`
  - [ ] `npm run typecheck`
  - [ ] `npm run test:e2e`

## Risk notes

- Removing legacy branches too early can break older feature branches that still pass legacy props.
- CI should remain green for both unit and e2e after each migration slice.

## Rollout notes

- Keep deprecation warning active in development until all callsites are migrated.
- Complete and merge this ticket before **September 30, 2026** to avoid API drift.
