# Demo Visual Capture Guide

Use this guide when updating screenshot or demo assets for portfolio packaging.

## Screenshot capture flow

1. Start the app locally:
   - `npm install`
   - `npm run dev`
2. Open the app in a desktop browser at a stable viewport (recommended: 1440x900).
3. Capture one screenshot per route:
   - `dashboard-overview.png` for Focus Home
   - `capture-workspace.png`
   - `journal-reflection.png`
   - `opportunities-pipeline.png`
   - `content-os-workflow.png`
   - `weekly-brief-planning.png`
   - `chief-of-staff-structured-output.png`
   - `ops-reliability-trends.png`
   - `settings-workspace-profile.png`
4. Save files under `docs/assets/screenshots/`.
5. Keep filenames stable so README and case study links remain valid.

## Demo walkthrough capture flow

1. Record a 45-90 second flow covering:
   - Focus Home overview
   - Focus Home support-mode keyboard switching
   - Reminder completion progress after checking one reminder
   - Capture or Journal low-friction input
   - Weekly Brief priorities/blockers
   - Chief of Staff local workspace persistence (type notes, refresh once, confirm they return)
   - Chief of Staff generation
   - Fallback/trust state if AI is unavailable
   - Structured acceptance action
2. Export as `ceo-os-workflow-walkthrough.webm` (or convert to mp4 if needed for sharing platforms).
3. Save under `docs/assets/demo/`.

## Update checklist

- Confirm links in `README.md` and `CASE_STUDY.md` still match filenames.
- Re-run verification commands:
  - `npm run lint`
  - `npm run build`
  - `npm run test:run`
  - `npm run typecheck`
  - `npm run test:e2e`
