# State

**Updated:** 2026-10-05
**Milestone:** M2.2 — Cinematic landing page (PLAN-026 done)
**Position:** M2 (PLAN-008…017) and M2.1 simplicity pass (PLAN-020…025) executed; see phase SUMMARY files. Remaining: user-run AI evals, signed-in walkthrough, commit. Next milestone: M3 ATS scoring.

## Done
- PLAN-000 routing; PLAN-001 editor shell; PLAN-002 style engine; PLAN-003 format panel + undo/zoom; PLAN-004 AI rail; PLAN-005 section form; PLAN-006 PDF export; PLAN-007 clean-up. See each phase's `SUMMARY.md`.
- Everything is on branch `ui-redesign-phase-2`, **not committed**.

## Decisions
- D1: Rails resize coupled — left + right width is constant, so the resume width never changes (PLAN-001).
- D2: Formatting is element-level in M1; no word-level rich text inside a bullet (PLAN-002).
- D3: All manual and AI style edits go through `resumeEditingEngine` (PLAN-002).
- D4: No Share button, no "Saved" indicator, no element-position align or shadow effects — they would not work (PLAN-003, FMT-12).
- D5: NIMBUS and Job match share the left rail through a switch; evidence is a collapsed dock at the bottom (PLAN-004).
- D6: Form page has two containers (form left, resume centre); font/style controls live in the editor (PLAN-005).
- D7: PDF export via the browser print path for exact, selectable output — accepted by user (PLAN-006).
- D8 (user, 2026-10-04): Continue to editor is **blocked** until all mandatory fields are filled; the warning links to sections with missing fields highlighted red (FORM-10).
- D9 (user, 2026-10-04): Form back arrow → templates if untouched, otherwise confirm discard; no settings panel on the form page (FORM-11).
- D10: Partly filled sections keep the "+" button; it becomes "Edit section" only when complete.
- D11: Required sections are Personal information, Summary, Education, Skills; Experience is optional so students without jobs can finish (PLAN-005 summary).
- D12 (M2 plan): Workspace state moves into a store above the routes, persisted to sessionStorage, before any evidence work (PLAN-008).
- D13 (M2 plan): "AI training" = per-task prompts, strict schemas, few-shot examples, fact guard and a golden-set eval harness; no fine-tuning of hosted models (PLAN-011).
- D14 (M2 plan): JD fixes and NIMBUS share one validated operation set, so "Execute" and NIMBUS edits go through the same applier and undo (PLAN-012/014).

## M2 answers (user, 2026-10-04)
- D15: PLAN-018 is the **LinkedIn** profile PDF.
- D16: Language % = share of bytes of code, repo count alongside.
- D17: Scan only the **25 most recently pushed** repos, and say so in the UI ("Only your 25 most recent repositories are scanned").
- D18: Formatting works on highlighted words within a sentence **and** on whole elements.
- D19: Never auto-shrink. Overflow flows to page 2 below (scroll). If a user asks NIMBUS to fit to one page and that would need text below a readable size, NIMBUS warns instead of shrinking further.
- D20: Download ~100 open-licence font families and commit them.
- D21: Larger Groq model allowed for NIMBUS/JD if evals show it is better.
- D22: "Add evidence" returns to the editor for now.

## M2.1 decisions (user, 2026-10-05)
- D23: Comparison is **GitHub only**. LinkedIn is a third way to start a resume ("Import from LinkedIn"): parse → templates → editor. Supersedes D15/PLAN-018 compare.
- D24: NIMBUS edits **content only** (deepen summary, add education item, rename…). Styling is manual. Supersedes NIMBUS style ops, mood option cards and NIMBUS fit-to-one-page (D19's NIMBUS part).
- D25: NIMBUS UI = Bloub cloud (follows cursor, animates per state) + rainbow-shine wordmark + plain chat (user messages in translucent bubbles) + a shimmering current-task line above the composer. Nothing else.
- D26: Job match = chat box + ring + missing line + fixes with Execute.
- D27: UI simplicity first: one button system, no filters in the font dropdown, no redundant descriptions/icons.

## Blockers / notes
- Groq rate limits (429) hit during testing; the eval harness makes many calls, so the user runs it.
- Protected routes need Google sign-in, so `MainPage` was not run end to end by automation. Fixtures: `tests/editor-studio.html` and `tests/scratch-builder.html` (serve with `npm run dev`).
- Web search was blocked in the planning session; GSD conventions here come from prior knowledge. GSD's own commands are not installed (see `SKILLS.md`).
- `graft` index not rebuilt (CLI fails on this Windows setup per the handoff).
