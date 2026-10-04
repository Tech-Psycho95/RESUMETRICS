# .planning — how this folder works

This folder follows the GSD ("Get Shit Done") spec-driven layout: a small set of
living documents plus one self-contained plan per phase.

| File | Purpose | Changes when |
|---|---|---|
| `PROJECT.md` | What Resumetrics is, the user flow, constraints, stack | Rarely — only when the product direction changes |
| `REQUIREMENTS.md` | Numbered, testable requirements (`ED-xx`, `FORM-xx`, …) | When scope is added or cut |
| `ROADMAP.md` | Milestones and phases, each phase mapped to requirements | When a phase is added, reordered or finished |
| `STATE.md` | Where we are now, decisions made, blockers, open questions | After every plan is executed or a decision is made |
| `SKILLS.md` | The GSD workflow and project skills we use | When tooling changes |
| `research/` | Findings about the codebase and references | Before planning a phase |
| `phases/NN-name/` | One folder per phase holding its `PLAN-xxx.md` (and later `SUMMARY.md`) | Per phase |

## Plan labelling rules

1. Every plan has a global ID: `PLAN-000`, `PLAN-001`, … IDs are never reused.
2. Every plan file is wrapped in start and end markers:

   ```
   <!-- PLAN-003 START -->
   …
   <!-- PLAN-003 END -->
   ```

   Nothing outside the markers belongs to the plan. A plan never continues into the next one.
3. Every plan opens with a **Context** block naming the plans it builds on and what it takes
   from them (by ID). That is how plans share context without running into each other.
4. A plan is **self-contained**: goal, scope, out of scope, tasks, files, verification and
   a definition of done. It can be executed on its own once its dependencies are done.
5. After execution, a `SUMMARY.md` is added in the same phase folder (also wrapped in
   `<!-- PLAN-xxx SUMMARY START/END -->`) and `STATE.md` is updated.
6. New work later (edit-feature depth, ATS scoring, …) gets new milestones and new plan IDs.
