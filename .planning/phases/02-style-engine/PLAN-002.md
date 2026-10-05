<!-- PLAN-002 START -->
# PLAN-002 — Wire the editing engine: selection + style overrides that actually render

**Milestone:** M1 · **Phase:** 2 · **Requirements:** FMT-01, FMT-02, FMT-09 (screen part)

## Context
- **PLAN-001:** the resume renders in the centre container of `EditorShell`.
- **Research** (`research/codebase-findings.md`): `applyResumeEditingOperations` stores `presentation.elementOverrides`, but nothing renders them; selection is captured but unused; bullets/headings aren't registered.
- PLAN-003 builds the visible panel on top of this; PLAN-006 makes the same overrides reach the PDF.

## Goal
Any style written to `presentation.elementOverrides[elementId]` or to the global theme shows on the resume, across every template and through pagination; the current selection is visible on the page.

## Out of scope
The panel UI (PLAN-003). Word-level formatting inside a single text run (bold one word in a bullet) — element-level only in M1.

## Tasks
1. **Registry coverage** (`resumeElementRegistry.js`): add elements for section headings (`section.<id>.heading`), each bullet (`<kind>.<itemId>.bullets.<i>`), education details, project bullets, links, skills groups. Keep ids stable across reorders (item `id` based).
2. **Templates emit ids:** make sure every rendered text node in `ResumeTemplateLayout.jsx` goes through `EditableText` with an `elementId` that matches the registry (headings and bullets currently don't).
3. **Render overrides:** add a `ResumePresentationContext` provided by `ResumeTemplateLayout`; `EditableText` reads `getElementOverride(presentation, elementId)` and maps it to inline style (`fontFamily, fontSize(px), fontWeight, fontStyle, textDecoration, color, textAlign, lineHeight, letterSpacing`). `textAlign` needs `display:block` on block-level elements only — apply on the containing block element, not the span.
4. **Engine:** add `textDecoration` (`none|underline|line-through|underline line-through`) to `validStyleProperties`; add `clear_style` operation (remove an element's overrides) and `set_global_style` for whole-resume font/size/colour/line height (replacing the scattered `globalFontSize` / `fontColor` / `useGlobalTextColor` state with `presentation.globalStyle`).
5. **Single state path:** route all manual and AI style changes in `MainPage` through one `applyEditorOperations(ops)` helper that calls the engine and sets `resumePresentation`. (Undo history hooks into this helper in PLAN-003.)
6. **Selection on page:** selected element gets `data-selected="true"` + outline style; Escape or clicking empty page clears selection; selection survives re-render by id.
7. **Pagination:** overrides must be applied in the measurement pass too (same components), so page breaks account for bigger text. Add `presentation.elementOverrides` to the `useLayoutEffect` dependencies (already depends on `presentation`, verify).
8. Fixture `tests/style-overrides.html`: renders all templates with a fixed overrides object (big red heading, centred summary, underlined bullet) for visual check.

## Files
Changed: `src/editor/resumeElementRegistry.js`, `src/editor/resumeEditingEngine.js`, `src/components/templates/ResumeTemplateLayout.jsx`, `src/main.jsx`, `shared/resumeEditPlan.js` (only if AI may emit the new operations — keep AI capabilities unchanged unless needed).
New: `tests/style-overrides.{html,jsx}`.

## Verification
- Fixture shows overrides on every template, including after a page break.
- Clicking any heading, bullet or field selects it (outline) and reports a registry id that exists.
- Existing NIMBUS edit flow still applies (`applyResumeEditPlan.js` unchanged behaviour).
- `npm run build` passes.

## Definition of done
Setting an override in state visibly changes exactly that element on screen; global style changes the whole resume.
<!-- PLAN-002 END -->
