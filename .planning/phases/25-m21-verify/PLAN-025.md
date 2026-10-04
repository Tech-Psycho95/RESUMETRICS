<!-- PLAN-025 START -->
# PLAN-025 — M2.1 verification and clean-up

**Milestone:** M2.1 Simplicity · **Phase:** 25

## Context
- After PLAN-020…024. Also closes PLAN-019 items that still apply (tests, dead code, docs) for M2.

## Tasks
1. Fixtures (`tests/editor-studio.html`, `tests/evidence-screen.html`, `tests/scratch-builder.html`) reflect the simplified UI; click through each.
2. `npm test` and `npm run build` pass.
3. Remove dead code: old `AIAssistantEditor.jsx`, LinkedIn evidence components/CSS, `EvaluationPage`, `GitHubEvidenceReview`, unused NIMBUS option/step components, unused CSS.
4. AI evals (`npm run ai:eval`) are **run by the user** when the Groq quota allows (they make many calls); results go to `.planning/evals/`.
5. Update STATE.md, ROADMAP.md, phase summaries.
<!-- PLAN-025 END -->
