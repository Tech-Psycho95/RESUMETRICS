<!-- PLAN-012 START -->
# PLAN-012 — NIMBUS engine v2: steps, full resume control, options, questions

**Milestone:** M2 · **Phase:** 12 · **Requirements:** NIM-02…NIM-07 (server + data contract)

## Context
- **Research F4:** today one call returns `{status, message, operations}`; style ops limited to 6 fonts / fixed sizes / one colour.
- **PLAN-009:** element overrides (no per-element size), inline marks. **PLAN-010:** font + colour catalogues with tags. **PLAN-011:** task registry, strict schemas, NDJSON streaming, fact guard, eval harness.
- UI is PLAN-013; this plan defines the contract it renders.

## Goal
NIMBUS turns a request into an ordered plan of steps, each with validated operations the client applies live; or returns visual options; or asks a question.

## Response contract (streamed NDJSON, `POST /api/nimbus/turn`)
```
{type:"thinking", text}                         // short status line
{type:"plan", steps:[{id, title}]}              // shown as checklist immediately
{type:"step", id, operations:[...], summary}    // one per step, in order
{type:"options", kind:"font"|"colour"|"palette", target, prompt, choices:[...]}   // mood requests
{type:"question", text, quickReplies:[...]}     // ambiguity
{type:"message", text}                          // conversation / final note
{type:"done"} | {type:"error", message}
```
- Choices: font `{fontId, name, why}` (ids from catalogue); colour `{hex, name, why, contrast}`; palette `{heading, accent, text, name, why}`. Server validates ids/hex/contrast before sending.

## Operations (shared, validated in `shared/resumeEditPlan.js` v2)
- Content: existing ops (set_field, item fields, bullets, details, skills, lists, links, footer) + `reorder_items`, `remove_item` (only with explicit user ask), `reorder_sections`.
- Marks: `apply_marks {elementId, range|whole, mark}`.
- Element style: `set_element_style {elementId | elementGroup, changes}` where `elementGroup` ∈ `all-headings | all-job-titles | all-dates | all-bullets | name | contact …` (resolved client-side to element ids); allowed properties = EDT set (no fontSize).
- Global style: `set_resume_style {fontId, baseSize (9–18), textColor, lineHeight, letterSpacing}`, `set_accent {hex}`, `reset_style {scope}`.
- Every op validated: element ids must exist, fonts from catalogue, colours valid hex with contrast check for body text, content changes pass the fact guard (no new companies/dates/numbers/skills not in resume or instruction).

## Planner behaviour (task `nimbus.plan`)
- Context sent: full resume, element map (ids → role, text), current styles per element, global style, template (layout, sections), selection, font/colour catalogue summaries (ids + tags only), conversation (last 10), last JD analysis if any.
- Decide mode: `edit` (plan with steps), `options` (mood/aesthetic vague → choices), `question` (target or intent unclear, or facts needed), `conversation`.
- Steps are small and user-meaningful ("Rewrite summary for a backend role", "Make job titles bold", "Switch headings to navy"). Max 8 steps.
- Server streams `plan` first, then generates/validates each step (single model call returning all steps, emitted one by one; long plans may use one call per step).
- On validation failure for a step: one repair attempt, else that step is reported failed and the rest continue.

## Mood mapping
- `nimbus.options` task maps phrases to catalogue tags (e.g. "professional" → serif/sans with `professional`, `ats-safe`; "modern" → geometric sans; "warmer colours" → warm palettes passing contrast). Returns 4–6 diverse choices with one-line reasons, never the current one.

## Tasks
1. `shared/resumeEditPlan.js` v2 (+ tests), element-group resolver, fact guard integration.
2. `server/routes/nimbus.routes.js` streaming endpoint; keep `/api/resume/edit` as a thin compatibility wrapper until PLAN-013 ships.
3. Prompts + few-shot for plan/options/question; eval cases (≥ 40) covering edits, mood options, ambiguity, refusals, injection.
4. Client `applyNimbusOperations` (content via existing applier; styles via `applyEditorOperations`; marks via `inlineMarks`).

## Verification
Harness scores ≥ baseline + agreed target (e.g. ≥ 90% schema-valid first try, 0 fact-guard violations, ≥ 80% correct targets); manual checks for the user's examples ("font more professional" → font cards; "heading colour seems off" → colour cards; vague "make it better" → question).

## Definition of done
Contract implemented and validated server-side; eval report saved; PLAN-013 can render it.
<!-- PLAN-012 END -->
