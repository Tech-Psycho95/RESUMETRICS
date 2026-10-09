# PLAN-031 summary: Job tailoring as a finished product

**Status:** Done (2026-10-05). A signed-in check with a real post is left for the user (Google sign-in; the fixes use Groq).

- Design skill: Anthropic `frontend-design` installed at `.claude/skills/frontend-design` (source in `SOURCE.md`) and followed (token plan → review against the brief → build → screenshot critique). The references won on uppercase tab and table labels, as the brief pins them.
- **Instant keywords:** `shared/jdExtract.js` (+ test): title/company, dictionary skills actually named in the post, requirement phrases from section-aware scoring (works for guards, nurses, chefs as well as engineers), soft skills, nice-to-haves. `/api/jd/parse` was removed; the AI is used only for fixes, in the background.
- **Before → After:** `src/jd/fixPreview.js` (+ test) turns fix operations into change blocks.
- **UI** (`TailorWorkspace.jsx`, `job-tailoring.css` rewritten on the extracted tokens: indigo `#261A66`, violet `#5B3FD6`, lavender `#F2F0FC`, teal/orange/red scores, mint, highlight yellow; Figtree):
  - indigo bar (job chip, New job post, Open in editor);
  - Screen-B sidebar (score ring, steps or Report/Fixes/Applied with +N values, Edit keywords);
  - workspace: Paste the job post → Review keywords (filterable checkbox table, add your own, sticky Score my resume) → report with the Screen-A score hero and KEYWORDS / FIXES / JOB TITLE underline tabs;
  - keyword table (in post, in resume, key ★, Found/Buried/Missing, See fix, toggles, Copy missing);
  - Screen-B fix card (pager, impact ring, What will change Before/After with added words marked, Apply change / Skip / Undo, auto-advance by id);
  - job-title check with an applicable headline fix;
  - preview pane with Side by side / Job post / Your resume / Changes pills; changed lines flash yellow.
  - Spotlight themed to the palette.
- Responsive: the preview becomes a drawer at ≤1180px (Preview button); the sidebar becomes a strip at ≤760px. Reduced motion is respected.
- Removed: `TailorPanel.jsx`.

## Verified
- `npm test` (+ jdExtract, fixPreview), `npm run build`.
- Fixture `tests/editor-studio.html?view=tailor&demo=post|keywords|results`: captures at 1440, 820 and 390 (in the pane; headless Edge clips below ~500px). Scripted run: Apply → 48 → 58 with "+10", auto-advance through all 3 fixes, spotlight "from 48% to 58%", job-title fix sets the headline, Changes lists all applied fixes.
- Security Officer sample post: incident reporting / access control / valid guard licence (key), CCTV cameras, security incidents, first aid certificate (nice), communication and attention to detail (soft), extracted instantly.
