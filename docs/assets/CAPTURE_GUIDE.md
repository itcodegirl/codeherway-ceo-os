# Demo Visual Capture Guide

Use this guide when updating screenshot or demo assets for portfolio packaging.

## Screenshot capture flow

1. Start the app locally:
   - `npm install`
   - `npm run dev`
2. Open the app in a desktop browser at a stable viewport (recommended: 1440x900).
3. Capture one screenshot per route:
   - `dashboard-overview.png`
   - `opportunities-pipeline.png`
   - `weekly-brief-planning.png`
   - `chief-of-staff-structured-output.png`
   - `settings-workspace-profile.png`
4. Save files under `docs/assets/screenshots/`.
5. Keep filenames stable so README and case study links remain valid.

## Demo walkthrough capture flow

1. Record a 45-90 second flow covering:
   - Dashboard overview
   - Weekly Brief priorities/blockers
   - Chief of Staff generation
   - Structured acceptance action
2. Export as `ceo-os-workflow-walkthrough.mp4`.
3. Save under `docs/assets/demo/`.

## Update checklist

- Confirm links in `README.md` and `CASE_STUDY.md` still match filenames.
- Re-run verification commands:
  - `npm run lint`
  - `npm run build`
  - `npm run test:run`
  - `npm run typecheck`
