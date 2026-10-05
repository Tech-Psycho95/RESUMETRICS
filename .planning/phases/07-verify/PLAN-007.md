<!-- PLAN-007 START -->
# PLAN-007 — M1 verification and clean-up

**Milestone:** M1 · **Phase:** 7 · **Requirements:** QA-01…QA-03 and a final pass over every M1 ID

## Context
- Runs after **PLAN-001…PLAN-006**. Uses each plan's fixture and definition of done.
- Picks up leftovers recorded in **PLAN-000** (dead `.template-selector` CSS).

## Tasks
1. Walk `REQUIREMENTS.md` ID by ID in fixtures; record pass/fail in `phases/07-verify/SUMMARY.md`.
2. Signed-in walkthrough by the user of both flows (scratch → form → editor; upload → templates → editor), since sign-in can't be automated.
3. Remove dead CSS/components left by the redesign; `npm run build`.
4. Update `STATE.md` (M1 closed) and `ROADMAP.md`; open M2 planning (PLAN-008).

## Definition of done
Every M1 requirement passes or has a written, accepted reason; build is clean; STATE.md points at M2.
<!-- PLAN-007 END -->
