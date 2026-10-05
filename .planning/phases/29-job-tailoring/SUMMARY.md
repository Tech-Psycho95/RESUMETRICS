# PLAN-029 summary: Job tailoring page

**Status:** Done (2026-10-05). The signed-in walkthrough on `/workspace/tailor` is left for the user, because Google sign-in blocks automation.

- `/workspace/tailor` (sidebar "Job tailoring" now links there; with no draft it redirects to `/workspace`). The workspace stays `editor-ready`, so job match works.
- Two equal halves: **Match to a job** (`JobMatchPanel layout="page"`: wider column, 168px ring, page intro) and **Your resume** (the template canvas, read-only, with a zoom control). "Open in editor" and a back button are in the top bar.
- Execute/Undo compare each resume element's text before and after; changed parts flash green for 1.6s (`.is-tailor-changed`) and scroll into view.
- Editor rail: the Job match tab is removed; NIMBUS only, plus a `TailorDock` row ("Tailor to a job", last score, Open) above GitHub evidence. "Answer with NIMBUS" navigates to the editor with the input pre-filled. The help FAQ is updated. The dead `askNimbusAboutSkill` was removed.
- `src/job-tailoring.css`: grid, stacks at ≤1000px, reduced-motion safe.

## Verified
- `npm run build`.
- `tests/editor-studio.html?view=tailor` (scripted): halves 850px / 850px; an injected fix → Execute updated the summary on the right half, flashed it, and Undo appeared; the resume half is not editable. A headless capture of the page and of the editor rail (NIMBUS + Tailor dock + GitHub) was checked.

## Follow-up (user, 2026-10-05): "all changes applied" moment
- The match score already rises live with each Execute (`useJobMatch` rescore → `ScoreRing` count-up).
- When the **last** suggested change is executed, `JobMatchPanel` passes a new `celebrateKey`. After the count-up lands, `ScoreRing` becomes a gold coin for ~3s (gold face, one diagonal glint, a faint glow, a 4% lift), then returns to the normal ring. A status line reads "All changes applied · new match N%". No particles or bounce; with reduced motion it is a static gold state.
- Fixed: the count-up could go negative when a frame timestamp preceded its start (progress is now clamped at 0).
- Fixture: `tests/editor-studio.html?view=tailor&demo=coin` executes two injected changes so the moment can be watched.
