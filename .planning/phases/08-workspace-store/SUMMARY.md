<!-- PLAN-008 SUMMARY START -->
# PLAN-008 summary

**Status:** Done (lighter design) · 2026-10-05

- Draft state is hydrated from and autosaved to sessionStorage (`src/workspace/workspacePersistence.js`, key `resumetrics:workspace:v1`): resume, presentation, template, global style, NIMBUS chat, JD result, GitHub scan. Survives refresh and leaving the workspace. Photos over 1.5 MB are kept for the visit only (notice shown).
- Evidence lives at `/workspace/evidence` inside MainPage, so returning to the editor keeps undo history too; `/evaluation` redirects there.
- Deviation: kept MainPage's own state hooks (hydrated) instead of a context provider — same behaviour, far smaller change.
<!-- PLAN-008 SUMMARY END -->
