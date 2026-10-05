<!-- PLAN-019 START -->
# PLAN-019 — M2 verification, evals and clean-up

**Milestone:** M2 · **Phase:** 19 · **Requirements:** all M2 IDs

## Context
- Runs after **PLAN-008…PLAN-018**; uses each plan's fixture, unit tests and eval reports (PLAN-011 harness).

## Tasks
1. Walk every M2 requirement in fixtures; record pass/fail in `phases/19-m2-verify/SUMMARY.md`.
2. Run all eval suites; compare with PLAN-011 baselines; record in `.planning/evals/`.
3. Signed-in walkthrough with the user: scratch and upload flows → edit (click + highlight formatting) → NIMBUS (edit, font options, colour options, question) → JD (paste + file, execute fixes, undo) → evidence (GitHub only, LinkedIn only, both) → Add evidence / Continue → editor intact → PDF export.
4. Performance: fonts loaded on demand only; bundle size compared with M1; GitHub scan of 100 repos time recorded.
5. Remove dead code (old `/api/resume/edit` and `/api/resume/analyze` if unused, old evidence components, old CSS); `npm run build`; update `STATE.md`, `ROADMAP.md`; open M3 (ATS scoring) planning.

## Definition of done
Every M2 requirement passes or has an accepted, written reason; evals at or above targets; STATE.md points at M3.
<!-- PLAN-019 END -->
