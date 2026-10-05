<!-- PLAN-017 START -->
# PLAN-017 — Evidence screen: independent sources, live GitHub visuals, exits to editor

**Milestone:** M2 · **Phase:** 17 · **Requirements:** EV-01, EV-02, GH-04…GH-06

## Context
- **PLAN-008:** `/workspace/evidence` inside the workspace; returning to the editor keeps everything.
- **PLAN-016:** GitHub NDJSON events (`start`, `repo`, `progress`, `result`). **PLAN-018** adds the LinkedIn panel to this same screen.
- Current screen (`EvaluationPage`, screenshots from the user): large headings, sparse cards, a list of 0% rows — replace entirely.
- Design principles (avoid "UI slop"): real data density, one accent colour plus a categorical chart palette, no gradient blobs, no emoji, no filler copy, consistent 8px spacing, numbers right-aligned with tabular figures, every element interactive or informative. Load the `dataviz` skill before building charts.

## Screen structure
1. **Header bar:** back to editor · "Evidence" · resume name.
2. **Source picker** (first visit or "Change sources"): two selectable cards — GitHub (connect status, "Scan repositories") and LinkedIn (upload PDF). User can run either or both, in any order; nothing requires the other (EV-01).
3. **GitHub panel** (while scanning and after):
   - **Progress:** thin bar + "Scanning 37 of 84 repositories · 44%" + current repo name; pause/cancel. Percent updates on every event.
   - **Language donut** (SVG, categorical palette, ≤ 10 slices + "Other"): grows live; centre shows total code size and repo count; hover a slice → tooltip (language, %, bytes, repos) and highlights its legend row and the repos using it; click → filters repo list. Legend = sortable table (language, share %, repos).
   - **Resume skills evidence:** horizontal bars per resume skill, sorted by evidence; bar colour by status (strong ≥ 15%, moderate 5–15%, weak < 5% = "Too little evidence" badge, none = grey "No evidence", mentioned-only = dashed). Click a skill → repos that support it.
   - **Repositories:** compact rows — name (link), description (1 line), stacked language bar (like GitHub's), last pushed, stars, matched skill chips, files checked (expand). Sort by recent / size / skills matched; filter by language/skill; search.
   - **Summary line** (AI narrative, factual) above the charts.
4. **LinkedIn panel** — PLAN-018.
5. **Footer actions (sticky, EV-02):** **Add evidence** (primary) → back to editor (attaching evidence to bullets is a later feature; note shown) · **Continue without evidence** (secondary) → back to editor. Both keep results in the store.

## Tasks
1. Route screen component `src/components/evidence/EvidenceScreen.jsx` + `SourcePicker`, `GitHubEvidencePanel`, `ScanProgress`, `LanguageDonut`, `SkillEvidenceBars`, `RepositoryList`.
2. Chart components in `src/components/charts/` (own SVG, keyboard-focusable segments, accessible table fallback); shared palette tokens light/dark.
3. Stream consumer + reducer (live aggregates); cancel → partial results kept and labelled.
4. Remove `EvaluationPage`, `GitHubEvidenceReview.jsx`, `github-evidence.css` once replaced.
5. Fixture `tests/evidence-screen.html` replaying the recorded scan at speed.

## Verification
Fixture: percent and donut update during replay; hover/click interactions filter correctly; 4.9% skill flagged; footer buttons return to editor with resume intact (signed-in). Dark mode and 375px width checked.

## Definition of done
EV-01, EV-02, GH-04…06 pass; old evaluation page removed.
<!-- PLAN-017 END -->
