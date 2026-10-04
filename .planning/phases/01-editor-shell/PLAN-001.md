<!-- PLAN-001 START -->
# PLAN-001 — Three-pane editor shell with coupled resizable rails

**Milestone:** M1 · **Phase:** 1 · **Requirements:** LAY-01…LAY-07, QA-01…03

## Context
- **PLAN-000:** the editor lives at `/workspace/editor`, rendered by `MainPage` when `isEditorPage` is true.
- This plan only builds the frame. It moves existing panels into the new containers **unchanged**; PLAN-003 replaces the right rail's content and PLAN-004 redesigns the left rail.

## Goal
A full-height, three-container editor (left AI rail · centre resume · right formatting panel), each scrolling on its own, with the two rails resizable from their resume-facing edges in a coupled, real-time way.

## Out of scope
New formatting controls (PLAN-003), AI rail redesign (PLAN-004).

## Design
- **Top bar** (spans all three columns): back button, resume name (rename), template meta, delete, export. Undo/redo/zoom/saved slots are left for PLAN-003.
- **Grid:** `grid-template-columns: var(--left-w) minmax(0,1fr) var(--right-w)`; height `calc(100dvh - topbar)`; each column `overflow-y: auto; overscroll-behavior: contain`.
- **Handles:** a 8px hit-area `<div role="separator" aria-orientation="vertical">` on the left rail's right edge and on the right rail's left edge. Hover/focus shows a 2px accent line and `cursor: col-resize`.
- **Coupled resize (LAY-04):** total `T = left + right` is fixed while dragging.
  - Dragging the **left** handle by `dx`: `left = L0 + dx`, `right = R0 − dx`.
  - Dragging the **right** handle by `dx` (moving left widens the right rail): `right = R0 − dx`, `left = L0 + dx`.
  - In both cases the centre width is unchanged, which matches "one grows, the other shrinks by the same amount".
  - Clamp: each rail 260–520px (initial 340/340). Compute the allowed `dx` range from both rails' limits so neither breaks its clamp (LAY-05).
- **Real time:** pointer events with `setPointerCapture`; write widths to CSS variables on the grid element inside `requestAnimationFrame` (no React re-render per move); commit to React state + `localStorage` (`resumetrics-editor-rails`, try/catch) on pointer up.
- **Keyboard:** arrows ±16px (Shift ±48px), Home/End to limits, Enter or double-click resets to 340/340. `aria-valuenow/min/max` reflect the rail width.
- **Responsive (LAY-07):** below 1100px the rails become two tabs ("AI" / "Format") above the resume; handles are hidden.

## Tasks
1. Create `src/components/editor/EditorShell.jsx`: props `topBar`, `left`, `centre`, `right`; owns widths, handles and persistence. Pure layout, no resume logic.
2. Create `src/components/editor/useCoupledRails.js`: pointer/keyboard logic, clamp maths, persistence. Unit-testable pure function `resizeCoupled({ left, right, dx, min, max })`.
3. Create `src/editor-shell.css` (grid, handles, scroll containers, responsive tabs). Import it in `src/main.jsx`.
4. In `MainPage` editor branch: render `EditorShell` with — left: JD panel + NIMBUS + evidence (as they are today, stacked); centre: `TemplateComponent`; right: font panel + photo controls (temporary). Remove `.workspace-lower-grid` evidence section from the editor.
5. Fixture `tests/editor-shell.html` + `.jsx`: renders `EditorShell` with long dummy content in each column to prove independent scrolling and resizing without sign-in.
6. Add a small test for `resizeCoupled` (node script under `tests/`).

## Files
New: `src/components/editor/EditorShell.jsx`, `src/components/editor/useCoupledRails.js`, `src/editor-shell.css`, `tests/editor-shell.{html,jsx}`, `tests/resizeCoupled.test.js`.
Changed: `src/main.jsx` (editor branch only).

## Verification
- In the fixture: drag each handle; the centre width stays constant (check `getBoundingClientRect().width` before/after); limits stop both rails; arrows and double-click work; each column scrolls independently; reload keeps widths.
- `npm run build` passes.

## Definition of done
LAY-01…07 pass in the fixture and in the signed-in editor; no panel is lost from the editor.
<!-- PLAN-001 END -->
