# Demo Visual Capture Guide

Use this guide when updating screenshot or demo assets for portfolio packaging.

## Screenshot capture flow

1. Start the app locally:
   - `npm install`
   - `npm run dev`
2. Open the app in a desktop browser at a stable viewport (recommended: 1440x900).
3. Capture one screenshot per route:
   - `dashboard-overview.png` for Focus Home, including System Pulse, source-status cue, and next-move panel
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
6. After responsive UI changes, also inspect Focus Home at 390x844 and confirm topbar status, compact navigation, System Pulse nodes, reminder rows, and primary buttons wrap without clipping.
7. For `settings-workspace-profile.png`, save one version after clicking `Save settings` so the screenshot proves the topbar team label, timezone label, and saved timestamp are aligned.

## Demo walkthrough capture flow

1. Record a 45-90 second flow covering:
   - Focus Home overview
   - Compact mobile navigation open/close behavior at 390px width
   - Source-status trust cue and System Pulse next move
   - Focus Home support-mode keyboard switching
   - Reminder completion progress after checking and unchecking one reminder
   - Capture or Journal low-friction input
   - Weekly Brief priorities/blockers
   - Chief of Staff local workspace persistence (type notes, refresh once, confirm they return)
   - Chief of Staff generation
   - Fallback/trust state if AI is unavailable
   - Structured acceptance action
   - Settings save followed by one route change to prove shell branding/timezone sync
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
