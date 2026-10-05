# Skills and workflow

## GSD workflow (as used here)
GSD ("Get Shit Done", by TÂCHES, for Claude Code) is a spec-driven workflow: project → requirements →
roadmap → per-phase plan → execute → verify, with state kept in `.planning/` so each session starts
with full context instead of re-deriving it.

The loop we follow per phase:
1. **Discuss** — settle open questions (STATE.md › Open questions).
2. **Plan** — write `phases/NN-name/PLAN-xxx.md` (atomic tasks, files, verification, done).
3. **Execute** — implement one plan; small commits per task.
4. **Verify** — run the plan's checks; write `SUMMARY.md`; update `STATE.md`.

**Not installed.** GSD ships as a Claude Code command pack installed with an npm installer
(`npx get-shit-done-cc`, from memory — confirm on its GitHub page first). Installing it changes
your Claude Code configuration, so do it yourself if you want its `/gsd:*` slash commands. This folder already
uses its layout, so it works with or without the commands.

## Project skills used by these plans
- **Repo context:** `graft` (`graft/INDEX.md`) — the CLI currently fails in this Windows environment; read source directly at cited lines.
- **Frontend:** React function components, plain CSS files per feature (pattern: `src/resume-builder.css`), no new UI libraries.
- **Verification:** standalone Vite fixtures in `tests/*.html` (pattern: `tests/scratch-builder.html`), node tests for pure functions, `npm run build`.
