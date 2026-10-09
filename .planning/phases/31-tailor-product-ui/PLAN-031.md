<!-- PLAN-031 START -->
# PLAN-031: Job tailoring as a finished product (Resume Worded-grade UI, instant keywords)

**Milestone:** M2.3 · **Phase:** 31 · **Requirements:** TUI-01…TUI-10 · **Supersedes:** the PLAN-030 UI (its keyword score and spotlight stay)

## Context (user, 2026-10-05)
- "Still looks like a project, not a product." Study the two Resume Worded screens (Targeted Resume; Score my resume), extract their theme, font and buttons, plan a stellar UI, then build it.
- "The JD is taking too long to find keywords." The AI parse step (one Groq round trip) goes. The user chose **instant keywords + the keyword score**: keywords are found in the browser the moment you press the button; the AI is used only to prepare fixes, in the background.
- The design skill (Anthropic `frontend-design`) is installed at `.claude/skills/frontend-design` and was followed for this plan. The brief pins the visual direction to the references, so where the skill's defaults differ (uppercase tab and table labels), the references win.

## Reference analysis

### Screen A: Targeted Resume (keyword match)
| Part | What it does | Visual details |
|---|---|---|
| Top bar | Product name, mode, account and primary action | White, 56px, a thin bottom rule; the right-hand primary is a solid violet block button in uppercase ("RE-UPLOAD RESUME") |
| Left rail | Tool switcher (Hard skills, Magic write, Soft skills…) | Deep indigo `#2B1D72`, 72px wide, icon over a tiny label, active item lighter |
| Score hero | Relevancy score + verdict | Lavender panel `#F1EEFC` with two tab-like headers on top (active = white raised tab); a large **teal** ring `#2DB59F` with a big dark number; bold verdict ("Needs improvement") followed by plain text; "Aim for 85" |
| Report tabs | Keywords / Magic target / Job title found | Uppercase 12px semibold with icons, active = violet text + 2px violet underline |
| Controls | Toggles "Found keywords", "Context"; "Export" | iOS-style toggles, small uppercase labels, an outlined white button |
| Table | Keyword, count, key skill, action | Uppercase grey headers, roomy 56px rows, hairline separators, a navy star for key skills |
| Right pane | Side by side / Job description / Your resume / Changes | Lavender background; a **segmented pill bar** (active = solid violet with white text); the JD text in a white box with matched keywords as **green rounded highlights** `#D8F3DC`; the resume below with an editor toolbar |

### Screen B: Score my resume (fix flow)
| Part | What it does | Visual details |
|---|---|---|
| Header | Product bar | Deep indigo bar `#25195E`, white text, a violet "Re-score" pill on the right |
| Sidebar | Overall score + list of fixes | White, 230px; a ring with an **orange** arc `#F08A3E` and the number; groups "TOP FIXES" (each item with a coloured score on the right, active item tinted orange `#FFF3E8`), "COMPLETED" (green scores), a locked state, and a full-width violet CTA pinned at the bottom |
| Fix card | One problem at a time | ‹ › pager, bold 22px title, grey subtitle, a small score ring on the right; "Here's what we found"; a red ✕ finding, problem words as **red outlined chips**; "Take this line" (original with the problem highlighted) → "Let's improve it" (green check, the suggested line); "Option 1 of 4" with ‹ › and outlined uppercase buttons ("CHOOSE LINE", "RE-GENERATE") |
| Resume | Live preview | The affected line highlighted in pale yellow `#FFF4C2` |

### Extracted theme → Resumetrics tokens
- **Colour:** indigo `#261A66` (chrome), violet `#5B3FD6` (primary; matches the app accent family), lavender `#F2F0FC` / line `#E4E0F5` (secondary surfaces), teal `#22A699` (good score), orange `#F08A3E` (fair), red `#E2483D` (missing/problem), green `#1E9E5A` with mint `#DDF4E6` (found/applied), highlight yellow `#FFF1BF` (changed line). Ink `#1B1A33`, muted `#6B6880`.
- **Type:** Figtree (open-licence, the closest to the references' Proxima-style geometric sans; already self-hosted), loaded with `loadResumeFont('Figtree')`. Scale 12 / 13 / 14 / 16 / 22 / 40 (score). Weights 400/600/700. Uppercase 11.5–12px +0.06em **only** for tabs, table headers and sidebar group names, as in the references; headings are sentence case.
- **Buttons:** primary = solid violet, 8px radius, 600 weight; secondary = white with violet 1px border; quiet = text button in violet; block CTA in the sidebar foot; icon buttons for the pager. Toggles are 32×18 switches. Pills are 999px.
- **Shape and depth:** panels 10px radius, inputs 8px, chips 999px; no shadows on resting cards (hairline borders like the references); a single raised shadow only on the active score tab and the spotlight.

## Layout

```
┌ indigo bar 52px ─ ← Resumetrics · Job tailoring        [Change job]  [Open in editor] ┐
├ sidebar 248px ─┬ workspace (white, scroll) ───────────┬ preview (lavender) ───────────────┤
│ ( 72 ) ring    │ ┌ score hero (lavender) ───────────┐ │ (Side by side|Job post|Resume|Changes)│
│ Good match     │ │ ◯ 72   Getting there              │ │ ┌ Job post ─────────────────┐  │
│                │ │        explanation · aim for 85   │ │ │ text with green/red marks │  │
│ REPORT         │ └───────────────────────────────────┘ │ └───────────────────────────┘  │
│  Keywords   6  │ KEYWORDS   FIXES   JOB TITLE          │ ┌ Your resume ──────────────┐  │
│  Job title  ✓  │ ─────────                             │ │ live template, changed    │  │
│ FIXES          │ toggles · Copy missing                │ │ lines flash yellow        │  │
│  Summary   +8  │ table / fix card / title check        │ └───────────────────────────┘  │
│  Skills    +5  │                                       │                                │
│ APPLIED        │                                       │                                │
│  ✓ Bullets     │                                       │                                │
│ [Open in editor]                                       │                                │
```
- Before scoring, the workspace shows **Job post** (paste/attach) and then **Review keywords** (a table with checkboxes); the sidebar shows the steps instead of the report.
- At ≤1180px the preview becomes a drawer toggled from the bar; at ≤760px the sidebar collapses into a top summary strip.
- Alignment: left-aligned throughout; numbers right-aligned in tables; the score hero is the only centred-weight element.

## The memorable element
The **score hero**: a large teal/orange ring that redraws live after every Apply, with the verdict sentence beside it, and the **Fix card** that shows the exact Before → After of each change (as Screen B does), so applying feels like editing, not clicking. Everything else stays quiet: hairlines, white space, one violet.

## Behaviour
1. **Job post:** paste or attach, then "Find keywords" → **instant** (`shared/jdExtract.js`, no network): the title and company from the opening lines; hard skills from the shared skill dictionary; requirement phrases (2–3-word noun phrases repeated or sitting in requirement/responsibility lines, for any profession: "incident reporting", "patient care", "food safety"); soft skills from a curated list. Key = appears in a "must/required/you have/essential" sentence or ≥2 times.
2. **Review keywords:** a table (checkbox, keyword, type, times in the post, key ★), filter pills All / Hard skills / Soft skills / Other, "Add a keyword", then "Score my resume" (instant). Fixes start loading in the background (`POST /api/jd/fixes`).
3. **Report → Keywords:** the score hero + a table (keyword, in post, in resume, key ★, status Found / Buried / Missing, and a "Fix" link when a fix covers it); toggles "Show found" and "Key skills only"; "Copy missing keywords".
4. **Report → Fixes:** a Screen B-style card: ‹ › "Fix 2 of 5", title, why, an impact ring "+8"; "What changes" = Before / After blocks generated from the operations (summary/headline text, bullet order or wording, skills added); **Apply change** (primary) and **Skip**, or **Undo** when applied. The sidebar lists the fixes with their +N and moves applied ones to "Applied".
5. **Report → Job title:** whether the headline or a role title contains the posting's title; when it doesn't, an applicable fix "Use “Security Officer” as your headline" (Before → After, Apply).
6. Score updates live after every apply/undo/edit (`scoreKeywords`), with a "+N" chip; after the last fix the PLAN-030 spotlight plays (restyled to the theme).
7. Preview pane tabs: Side by side (job post on top, resume below), Job post, Your resume, Changes (applied fixes with Undo).

## Tasks
1. `shared/jdExtract.js` (instant extraction) + `tests/jdExtract.test.js`; remove `/api/jd/parse` and the client parse call.
2. `src/jd/fixPreview.js` (operations → Before/After) + test.
3. `useJobMatch`: `findKeywords()` is synchronous; the rest as in PLAN-030; add `skipFix`, plus `applyLocalFix` for the job-title fix.
4. Components (`src/components/jd/`): `TailorWorkspace` (bar + sidebar + workspace + preview), `TailorSidebar`, `ScoreHero`, `JobPostStep`, `KeywordReview`, `KeywordReport`, `FixCard`, `JobTitleCheck`, `PreviewPane`; `ScoreSpotlight` and `JdHighlight` restyled. `TailorPanel.jsx` is removed.
5. `src/job-tailoring.css` rewritten on the tokens above; Figtree loaded on mount.
6. `main.jsx`: the tailor route renders `TailorWorkspace` (resume canvas passed in) and drops its old top bar. The fixture is updated.

## Requirements
- **TUI-01** Keywords appear instantly (no network) for any profession.
- **TUI-02** Three-column product layout (sidebar, workspace, preview) styled from the extracted tokens.
- **TUI-03** The score hero updates live after every change.
- **TUI-04** Keyword report table with toggles and copy.
- **TUI-05** Fix card with Before → After, Apply/Skip/Undo and a pager; the sidebar lists fixes with impact.
- **TUI-06** Job title check with an applicable fix.
- **TUI-07** Preview tabs: side by side, job post with marks, resume, changes.
- **TUI-08** The spotlight after the last fix.
- **TUI-09** Responsive (drawer ≤1180, stacked ≤760), keyboard and screen-reader friendly, reduced motion.
- **TUI-10** Figtree, the token palette, one button system.

## Verification
- `npm test` (+ jdExtract, fixPreview), `npm run build`.
- Fixture `tests/editor-studio.html?view=tailor&demo=post|keywords|results`: headless captures of each screen at 1440 and 820 wide, compared against the references; scripted Apply/Undo/score/spotlight.
<!-- PLAN-031 END -->
