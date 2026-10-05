<!-- PLAN-032 START -->
# PLAN-032: GitHub evidence in the Job tailoring product UI

**Milestone:** M2.3 · **Phase:** 32 · **Requirements:** EVU-01…EVU-09 · **Builds on:** PLAN-031 (tokens, shell), PLAN-016/017/023 (scan engine, evidence math)

## Context (user, 2026-10-05)
"This UI is good. Now analyse the components of the evidence comparison and give it the same UI, using the same design skill. Plan thoroughly in .planning. The whole frontend should be simple, with enough detail." The `frontend-design` skill (`.claude/skills/frontend-design`) was loaded again and its process is followed: component analysis → token/layout plan → review → build → screenshot critique.

## Component analysis (today)
| # | Component (file) | What it shows | Problems |
|---|---|---|---|
| 1 | Evidence top bar (`main.jsx` evidence route) | Back, "Evidence with GitHub", resume name | A different bar from Job tailoring (white studio bar vs indigo); no actions |
| 2 | `EvidenceScreen.jsx` | Wraps the panel and a footer with two buttons | Both "Add evidence" and "Continue without evidence" go to the editor, so it's a choice that isn't one |
| 3 | `GitHubEvidencePanel.jsx`: empty states | "Connect GitHub" / "Scan repositories" as a line of text and a button | No explanation of what is read, how long it takes, or what you get |
| 4 | Progress line | "Scanning 7 of 25" + a thin bar + Stop / Scan again | Fine data, weak hierarchy; no live per-repo activity |
| 5 | "Code by language" card | `LanguageDonut` (top 5 + Other, hover/click filter) + a table of 8 languages | Good chart; the table lacks size and repo count; the filter is hidden |
| 6 | "Your skills in your code" card | A bar per resume skill with share and status (Strong/Some/Too little/README only/None) | The most important result is the same size as the donut; no headline answer ("how much of my resume is backed?"); no per-skill repos or source |
| 7 | Repositories card | Name, language bar, relative date | Description, stars, matched skills and files read are fetched but not shown |
| 8 | `LanguageDonut.jsx` + `--series-*` palette | Accessible categorical colours, stable per language | Keep as is |
| 9 | `shared/githubEvidenceMath.js` | `languageTotals`, `skillEvidence` (≥15% strong, 5–15% some, <5% too little, README only, none) | Keep; add one summary score |

Data per repo (from `server/github`): `name, url, description, pushedAt, stars, fork, archived, private, languages{bytes}, manifestSkills[], readmeSkills[], filesChecked[]`. Scan state: `status, done, total, accessible, cap, percent, current, repos[], resumeSkills[], errors[], summary`.

## Design (PLAN-031 tokens, same shell)
The page reuses the tailoring classes (`.tw` root, bar, sidebar, workspace, preview, buttons, tables, toggles, pills, hero, tabs), so the two tools read as one product. Shared React pieces move to `src/components/product/ProductUI.jsx` (Icon, NavItem, Toggle, scoreColour).

```
┌ indigo bar ─ ← Evidence with GitHub · resume      [@octocat ●] [Scan again] [Open in editor] ┐
├ sidebar ─────────┬ workspace ─────────────────────────────┬ preview (lavender) ───────────┤
│ ( 67 ) ring      │ ┌ hero (lavender) ─────────────────────┐ │ (Your resume | Scan activity)  │
│ Code evidence    │ │ ◯ 67  Mostly backed. 8 of 12 skills  │ │ live resume / per-repo log     │
│ SKILLS           │ │       on your resume show up in code │ │                                │
│  TypeScript 42%  │ │       ▓▓▓▓▓▓░░ scanning 18 of 25     │ │                                │
│  React      31%  │ └──────────────────────────────────────┘ │                                │
│ NEEDS PROOF      │ SKILLS   LANGUAGES   REPOSITORIES         │                                │
│  Go          3%  │ table / donut+table / repo list          │                                │
│ NOT FOUND        │                                          │                                │
│  Rust        –   │                                          │                                │
│ [Scan again]     │                                          │                                │
```
- **Before connecting / scanning:** the sidebar shows steps (Connect GitHub → Scan repositories → See your evidence); the workspace shows one card explaining what is read (languages, dependency files, READMEs of your 25 most recently updated repositories, read-only) with the primary action.
- **Score (sidebar + hero): "Code evidence"** = the average over resume skills of Strong 1 · Some 0.7 · Too little 0.3 · README only 0.1 · None 0, ×100, with the same red/orange/teal colours. The hero states it in words ("8 of 12 skills on your resume show up in your code; 2 have too little to count") and shows the live scan bar while scanning.
- **Skills tab (default):** a table with skill, share of code (a mini bar with %), repos (count), found in (Language / Dependency / README only), and a status pill. A row expands to the repositories that back it. Toggles: "Show backed skills", "Needs proof only". One-line guidance under the table: what "too little" means and what to do (push a project, or drop the skill).
- **Languages tab:** the donut (size 200) beside a table of language, share, size and repos; clicking either filters the Repositories tab.
- **Repositories tab:** a list with name (link), description, language bar, the resume skills it backs (chips), updated, ★ stars, and badges (fork, archived, private); a language filter pill; "Only your 25 most recently updated repositories are scanned" stated once.
- **Preview pane:** pills **Your resume** (the live template) | **Scan activity** (each repository as it is read: ✓ name · languages · files checked; errors in red).
- **Bar actions:** a GitHub status chip, Scan again (or Stop while scanning), Open in editor (primary). The two old footer buttons are replaced by "Open in editor" (D22 said both went to the editor anyway).
- **Simplicity rules:** one headline number, three tabs, everything else on demand (row expand, filters); no repeated counts; plain words for statuses.

### Review against the brief
- Same tokens, type, buttons and shell as tailoring, as asked. The memorable element here is the **skill table with inline share bars**, not the donut (it moves to its own tab, since it answers a secondary question).
- Changed from the first idea: dropped a separate "Proof by project" timeline. It repeated the repository list and added noise, against "simplicity".

## Tasks
1. `src/components/product/ProductUI.jsx`: Icon (plus github, repo, code, star, fork, lock, archive, refresh, stop), NavItem, Toggle, `scoreColour`; `TailorWorkspace` imports them.
2. `shared/githubEvidenceMath.js`: `evidenceScore(skills)` + test cases in `tests/githubEvidence.test.js`.
3. `src/components/evidence/EvidenceWorkspace.jsx` (bar, sidebar, start states, hero, three tabs, preview).
4. CSS: evidence additions in `src/evidence.css` (rewritten; keeps the `--series-*` palette and donut styles) on top of the `.tw` system.
5. `main.jsx`: the evidence route renders `EvidenceWorkspace` (resume canvas, GitHub state, scan actions); remove `EvidenceScreen.jsx` / `GitHubEvidencePanel.jsx`.
6. `tests/evidence-screen.jsx`: replays the scan in the new workspace (`?state=connect|ready|scanning|done`).

## Requirements
- **EVU-01** Same shell and tokens as Job tailoring (bar, sidebar, workspace, preview).
- **EVU-02** Clear start states for connecting and scanning, explaining what is read.
- **EVU-03** A Code evidence score with a plain-words verdict, updating live during the scan.
- **EVU-04** Skills table: share bar, repos, source, status, expandable repos, filters.
- **EVU-05** Languages tab: donut + table; filtering carries to repositories.
- **EVU-06** Repositories tab: description, language bar, backed skills, date, stars, badges.
- **EVU-07** Preview: live resume | scan activity log.
- **EVU-08** Responsive (drawer ≤1180, strip ≤760), keyboard and screen-reader friendly, reduced motion.
- **EVU-09** Removed dead components; the fixture is updated.

## Verification
`npm test`, `npm run build`; fixture captures (connect, scanning, done) at 1440 / 820 and 390 in the pane; scripted tab/filter/expand checks.
<!-- PLAN-032 END -->
