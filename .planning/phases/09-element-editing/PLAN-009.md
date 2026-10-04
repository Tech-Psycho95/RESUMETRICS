<!-- PLAN-009 START -->
# PLAN-009 — Element editing, highlight formatting, global size, one-page layout

**Milestone:** M2 · **Phase:** 9 · **Requirements:** EDT-01…EDT-05

## Context
- **PLAN-002/003:** element ids, `elementOverrides`, `FormatPanel`, `applyEditorOperations`. This plan corrects and extends them.
- **PLAN-008:** state lives in the workspace store.
- **Research F6:** user reports formatting applies to the whole resume in the real app; per-element size must go. **F7:** pagination's 26px inset creates early page breaks.

## Goal
Every resume element is individually editable and formattable, part of a sentence can be bolded/italicised/underlined, size is global, and page 2 appears only when page 1 is genuinely full.

## Part A — Diagnose and fix element selection (EDT-01)
1. Reproduce signed-in with the user (or a recorded session): click name, a bullet, a heading; log `selectedResumeElement` and the panel scope.
2. Likely causes to check: clicks landing on wrapper elements without `data-resume-element-id` (contact separators, list markers, entry headers); contentEditable focus moving the caret without a click event (keyboard navigation); stale build.
3. Fix: give every rendered text node an element id (audit `ResumeTemplateLayout.jsx` + any template-specific markup); select on `selectionchange` as well as click (caret inside an element selects it).
4. Add a visible hover outline + label chip ("Job title") so users see what will be formatted.

## Part B — Highlight formatting (EDT-02, EDT-03)
- **Data model:** content strings may carry a minimal inline mark syntax, parsed and rendered by the templates: `**bold**`, `*italic*`, `__underline__`, `~~strike~~` (escape rules for literal `*`/`_`). Chosen over a rich-text object model because every existing consumer (AI prompts, extraction, ATS text, DOCX/TXT export) keeps working on strings; exports strip marks via one `stripMarks()` helper.
- `src/editor/inlineMarks.js`: `parseMarks(text) → runs`, `serialiseRuns(runs)`, `applyMarkToRange(text, start, end, mark)`, `stripMarks(text)`; unit-tested (nested, overlapping, toggling off, edges, escapes).
- Rendering: `EditableText` renders runs as `<strong>/<em>/<u>/<s>`.
- Applying: when the browser selection is inside one element and non-collapsed, B/I/U/S buttons and Ctrl/Cmd+B/I/U map the DOM selection to character offsets in that element's plain text, call `applyMarkToRange`, and write via `handleManualResumeEdit`. A collapsed selection (or a clicked element) toggles the mark on the whole element (element-level override, as now).
- Inline typing: when committing inline edits from contentEditable, read the element's DOM back into runs (strong/em/u/s → marks) instead of `innerText`, so marks are preserved.
- NIMBUS & extraction: prompts told marks exist; validators allow them; ATS/plain exports strip them.

## Part C — Size is global only (EDT-04)
- Remove the per-element Size control and stop accepting `fontSize` in element overrides (engine rejects it; existing overrides migrated away on load).
- Whole-resume base size keeps scaling the template's own ratios (headings stay proportionally larger).

## Part D — One page unless genuinely full (EDT-05)
1. Replace the 26px blanket inset with exact measurement: content height = page height − page padding − header/footer, using `getBoundingClientRect` of the real last line, with a 2px rounding tolerance.
2. Measure blocks including margins collapsing correctly (use `offsetTop` of the next block, not summed `offsetHeight`).
3. Re-run pagination when fonts finish loading and after any style change (already partly done).
4. Tests: fixture with content tuned to fit exactly one page stays on one page; one extra bullet creates page 2; deleting it removes page 2. Run for all 19 templates.

## Files
`src/components/templates/ResumeTemplateLayout.jsx`, `src/editor/inlineMarks.js` (+ `tests/inlineMarks.test.js`), `src/components/editor/FormatPanel.jsx`, `src/editor/resumeEditingEngine.js`, `src/main.jsx` (shortcuts, selection), export helpers, `shared/resumeEditPlan.js` (allow marks), fixture `tests/pagination.html`.

## Verification
EDT-01…05 in fixtures and signed-in; PDF export shows bold/italic parts; TXT/DOCX show plain words; undo reverts a highlight-format in one step.

## Definition of done
User can click any element or highlight any words and format exactly that; size is global; no premature page 2 on any template.
<!-- PLAN-009 END -->
