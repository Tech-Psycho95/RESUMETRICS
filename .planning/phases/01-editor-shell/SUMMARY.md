<!-- PLAN-001 SUMMARY START -->
# PLAN-001 summary — Three-pane editor shell

**Status:** Done · 2026-10-04

## Built
- `src/components/editor/EditorShell.jsx`: left / centre / right containers, each scrolling on its own; resize handles on the two resume-facing edges; drag (pointer capture, CSS variables written per animation frame), arrow keys (±16px, Shift ±48px), Home/End, Enter or double-click to reset; widths saved in `localStorage` (`resumetrics-editor-rails`).
- `src/components/editor/railSizing.js`: pure `resizeCoupled` — left + right is constant, so the resume width never changes; limits 260–520px stop both rails.
- Below 1100px the rails become tabs (AI tools / Resume / Format); handles are hidden.
- `src/editor-studio.css`: studio shell (full height, no page scroll), top bar, panes, handles.
- Editor in `src/main.jsx` now renders the top bar + `EditorShell`; the old evidence section under the page is gone.

## Verified (fixture `tests/editor-studio.html`, 1440×900)
- 340 | 760 | 340 at start; dragging left handle +80 → 419 | 760 | 261 (clamped); right handle −95 → 260 | 760 | 420; arrow key and double-click reset; page itself never scrolls.
- Narrow (768px): tabs, no handles, no horizontal scroll.
- `tests/railSizing.test.js` passes.

## Deviation
- Media-query change events don't fire under some viewport emulation; `useIsNarrow` also listens to `resize`.
<!-- PLAN-001 SUMMARY END -->
