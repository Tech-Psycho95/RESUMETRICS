# PLAN-030 summary: Keyword-driven job match and the score spotlight

**Status:** Done (2026-10-05). A signed-in check with a real posting is left for the user (Google sign-in + Groq).

- `shared/jdKeywords.js` (+ `tests/jdKeywords.test.js` in `npm test`): keyword extraction with job counts, weighted keyword coverage (found / prominent / repeated), verdict bands, target 85.
- Server: `/api/jd/parse` and `/api/jd/fixes` (keyword gaps drive the prompt); `/analyze` removed; the eval harness is updated.
- `useJobMatch` rewritten: parse → keywords (toggle, select all/clear per group, add your own) → score now (baseline) → fixes. Each fix's exact gain is computed on a copy of the resume (`impactOf`). The live score is derived from the current resume, so it moves after **every** Execute/Undo/edit.
- UI (`TailorPanel`): a three-step header, job card, keyword picker with a sticky "Score my resume" bar, score card (ring, verdict pill, found count, "started at", target bar, "+N" delta chip), a segmented **Keywords | Fixes** switch, keyword table (In job / In resume / Found · Buried · Missing, "Missing only" switch), fix cards with +N impact, Execute/Undo, progress bar, and "Ideas to add yourself".
- Right half: **Your resume | Job description** (`JdHighlight` marks keywords green/red).
- `ScoreSpotlight`: after the last change, the ring flies from its place to the centre (Web Animations), the page blurs (`backdrop-filter`), a soft warm light and faint slow rays sit behind it, and the caption reads "Your JD match score went from X% to Y%"; it returns after ~4.6s or on Continue/Esc/click. Reduced motion: fade only.
- Removed: `JobMatchPanel.jsx`, the gold-coin code in `ScoreRing`/`job-match.css`. `ScoreRing` handles `duration={0}` and no longer counts below its start.

## Verified
- `npm test`, `npm run build`.
- `tests/editor-studio.html?view=tailor&demo=keywords|results` (headless captures + scripted run): keyword picker and results render; Execute moved the score 48 → 58 with a "+10" chip; progress 1/3 → 3/3; the spotlight showed "Your JD match score went from 48% to 58%" over a 7px blur.
