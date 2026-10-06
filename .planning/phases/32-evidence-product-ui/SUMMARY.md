# PLAN-032 summary: GitHub evidence in the product UI

**Status:** Done (2026-10-05). A signed-in check with a real GitHub account is left for the user.

- `frontend-design` skill loaded again; process followed (component analysis table → token/layout plan → review → build → screenshot critique).
- Shared pieces moved to `src/components/product/ProductUI.jsx` (Icon incl. github/repo/code/chart/star/refresh/stop/shield/chevron, NavItem, Toggle, scoreColour); `TailorWorkspace` uses them.
- `evidenceScore()` in `shared/githubEvidenceMath.js` (Strong 1 · Some 0.7 · Too little 0.3 · README only 0.1 · None 0), tested.
- `EvidenceWorkspace.jsx` in the same shell as Job tailoring:
  - indigo bar (GitHub account chip, Scan again / Stop scan, Open in editor);
  - sidebar with the Code evidence ring and skills grouped Backed by code / Needs more proof / Not found in code;
  - start cards for Connect GitHub and Scan repositories that say exactly what is read;
  - hero with the verdict in words, the strong/weak thresholds and the live scan progress;
  - tabs **Skills** (share bar, repos, found in, status, expandable repos + advice, toggles), **Languages** (donut + share/size/repos table, picking a language filters repositories), **Repositories** (description, badges, stars, date, language bar, skills it backs);
  - preview pills **Your resume | Scan activity** (live per-repo log with files read and errors).
- `evidence.css` rewritten on the `.tw` system (chart palette and donut styles kept). The two footer buttons that both went to the editor are replaced by Open in editor.
- Removed: `EvidenceScreen.jsx`, `GitHubEvidencePanel.jsx`. The fixture `tests/evidence-screen.html?state=connect|ready|scanning|done` replays a scan in the new workspace.

## Verified
`npm test`, `npm run build`; headless captures of ready, scanning and done at 1440; pane checks of row expand, sidebar → skill, missing-skill advice, Languages → filtered Repositories (9 TypeScript repos), Scan activity (25 entries), donut drawn (6 segments), and no horizontal overflow at 390px.
