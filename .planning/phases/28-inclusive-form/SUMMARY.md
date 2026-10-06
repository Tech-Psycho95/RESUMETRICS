# PLAN-028 summary: Skills and form for every profession, accessible to all

**Status:** Done (2026-10-05).

- `shared/skillGroups.js` (+ `tests/skillGroups.test.js` in `npm test`): labels, name checks, rename, server normalisation.
- `SkillGroupsEditor`: starter groups Key skills / Tools & software / Soft skills; add any named group (it prints as typed); rename; remove; suggestion chips across professions; duplicate and empty names are rejected.
- `CustomSectionsEditor` and the new optional **Additional sections** section (title and text required once started).
- Neutral wording in the personal, experience, education, project, certification and achievement fields.
- The server normaliser keeps custom groups; NIMBUS/JD edits may target an existing custom group; the format panel and templates use the shared label.
- Accessibility: the chip input hint is always linked; a polite live region announces adds, removes and renames; "Show me" focuses the first missing field; one `:focus-visible` ring; 24px chip remove targets; muted text darkened to `#5b6478` (≥4.5:1 on the badge grey); "% complete" for screen readers; reduced-motion safe.

## Verified
- `npm test` (all, including skillGroups and sectionProgress), `npm run build`, server `resumeExtraction.test.js` (7 pass).
- `tests/scratch-builder.html` (scripted): add "Patient care" + 2 skills, and the preview prints "Patient care: Triage, Wound care"; rename to "Bedside care" (preview follows); remove; "key skills" duplicate rejected; live region announces "Added Scheduling to Key skills"; "Show me" focuses the first skill input.
