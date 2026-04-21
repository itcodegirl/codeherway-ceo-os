# Release Candidate Checklist

Last updated: April 21, 2026

Use this checklist before sharing the project as portfolio evidence or treating a branch as production-ready.

## 1) Automated quality gates

Run all required checks and confirm they pass:

```bash
npm run lint
npm run build
npm run test:run
npm run typecheck
```

## 2) Manual UX smoke pass

Validate core flows without changing source code:

- Navigate all primary routes: `Dashboard`, `Opportunities`, `Content OS`, `Weekly Brief`, `Chief of Staff`, and `Settings`.
- Confirm loading, empty, and populated states render correctly.
- Confirm skip-link and route focus restoration still work from keyboard-only navigation.
- Confirm source-status messaging appears correctly for local-first and Supabase-enabled environments.
- Confirm no visible console errors in normal user flows.

## 3) AI workflow confidence checks

- Generate each chief action at least once with valid notes.
- Verify fallback behavior appears when proxy response is unavailable or malformed.
- Confirm structured acceptance only saves valid items and ignores malformed entries safely.
- Confirm rapid repeated acceptance does not create duplicate records for the same item.

## 4) Metadata and sharing checks

- Confirm page title and description match each route.
- Confirm `og:title`, `og:description`, and `twitter:*` tags are present.
- Confirm canonical URL updates on route changes, including trailing-slash route variants.

## 5) Portfolio packaging checks

- Keep `README.md` and `CASE_STUDY.md` aligned with current architecture and test scope.
- Add screenshots or short demo media when available, and keep labels consistent with route names.
- Ensure roadmap items are honest and separated from completed work.

## 6) Ship decision notes

Capture the outcome for the current candidate:

- Automated checks status: pass/fail
- Manual smoke status: pass/fail
- Known risks accepted for release: yes/no
- Follow-up tasks created: yes/no
