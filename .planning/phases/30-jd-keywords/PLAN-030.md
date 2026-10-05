<!-- PLAN-030 START -->
# PLAN-030: Keyword-driven job match and the score spotlight

**Milestone:** M2.3 · **Phase:** 30 · **Requirements:** JDK-01…JDK-08 · **Supersedes:** the job-match half of PLAN-029 and the coin follow-up

## Context (user, 2026-10-05)
- The score must **update after every executed change**, not only at the end. Today it is skills 60% + experience 40% (`shared/jdScoring.js`), so reordering or rewording bullets never moves it (a Security Officer match stayed at 48% after an Execute).
- **Final-execution moment:** the score ring moves toward the user, everything behind it blurs, soft light shines from it, and below it reads "Your JD match score went from X to Y". Then it goes back. Not game-like.
- **UI:** the job match half is too plain and crowded. Reference: Resume Worded's Targeted Resume. Flow: pick **keywords** from the JD → compare them to the resume → score; fixes live in a **separate container you switch to**. Use product-grade buttons, screens and containers.

## Design
### Scoring (shared, deterministic): `shared/jdKeywords.js`
- `extractJdKeywords(jd, jobText)`: `[{ term, group: 'hard'|'soft'|'keyword', key, jdCount, selected }]`. Hard = mustHave (`key: true`) + niceToHave; keyword = other important terms; soft = softSkills. `jdCount` is the number of occurrences in the posting.
- `scoreKeywords(resume, keywords)`: only selected keywords count. Weight is 3 for a key skill, 2 for other hard skills and keywords, 1 for soft skills. Coverage is 0 if missing; if found it is 0.7, plus 0.2 if **prominent** (headline, summary, skills list, or the first two bullets of a role), plus 0.1 if it appears twice or more. Score = weighted coverage × 100. Each row reports `{ found, prominent, resumeCount }`.
- So adding a keyword, surfacing one in the summary or skills, or moving a keyword bullet to the top **raises the score**. Every fix's exact gain is computed beforehand by applying its operations to a copy (`applyNimbusOperations` is pure) and shown as "+N".
- Verdict bands: <50 Needs work · 50–74 Getting there · 75–84 Good match · ≥85 Strong match ("Aim for 85+").

### Flow and endpoints
1. **Job description**: paste or attach, then **Find keywords** → `POST /api/jd/parse` (NDJSON: stage, then `jd`).
2. **Keywords**: chips grouped as Hard skills / Soft skills / Other keywords, each with "×N in job" and a star for key skills. All are selected by default; Select all / Clear; add your own keyword. Then **Score my resume** (instant, client-side). The baseline score is stored.
3. **Results**: a score card (ring, verdict, "x of y keywords found") and a **segmented switch**:
   - **Keywords**: a table (keyword, key star, in job, in resume, Found / Missing / Add to summary state) with a "Missing only" filter.
   - **Fixes (n)**: `POST /api/jd/fixes` with the selected keywords and gaps; cards with title, reason, **+N impact**, Execute / Undo, and an "x of y applied" progress bar; plus "Could also add" ideas.
- After each Execute or Undo the score is recomputed and the ring counts to the new value.

### Spotlight (`ScoreSpotlight`, portal)
When the last executable fix is executed: a clone of the ring flies from its position to the centre (FLIP via Web Animations, 650ms, ease-out), scaling to ~1.9×. The backdrop fades in with `backdrop-filter: blur(6px)` and a dim veil. Behind the ring, a soft radial light grows and a very faint, slow conic ray layer turns (15° over 3s, opacity ≤ .35). The caption fades in: **"Your JD match score went from X% to Y%"**. After ~3.6s (or on click / Esc / Continue) it reverses back to the ring's place and unmounts. With reduced motion there is no flight, only a fade. Focus moves to Continue and back again.

### Right half
A toggle **Your resume | Job description**. The job description view shows the posting with selected keywords highlighted: green when found in the resume, red when missing.

## Tasks
1. `shared/jdKeywords.js` + `tests/jdKeywords.test.js`.
2. Server: `parseJobDescription` unchanged; routes `/parse` and `/fixes` (`/analyze` removed); `suggestFixes({ resumeData, jd, keywords, elementIds })` prompts from missing and weak keywords.
3. `src/jd/useJobMatch.js` rewritten: `parse`, `setKeywords`, `scoreNow`, `fetchFixes`, `executeFix` / `undoFix` with rescore, `impacts`, `reset`; the analysis state is persisted.
4. Components in `src/components/jd/`: `TailorPanel` (steps + switch), `KeywordPicker`, `KeywordTable`, `FixList`, `ScoreCard`, `ScoreSpotlight`, `JdHighlight`. `JobMatchPanel` is removed; `ScoreRing` celebrate props are removed.
5. `src/job-tailoring.css` rewritten (design tokens, cards, segmented control, chips, table, buttons, spotlight).
6. `main.jsx` and the fixture are wired to the new panel.

## Verification
- `npm test` (+ jdKeywords), `npm run build`.
- Fixture `tests/editor-studio.html?view=tailor&demo=keywords`: injected JD → keywords → score → fixes with impacts; executing each fix raises the score; the last one plays the spotlight with "from X% to Y%". Captures of each screen.
<!-- PLAN-030 END -->
