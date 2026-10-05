<!-- PLAN-003 SUMMARY START -->
# PLAN-003 summary — Format panel, undo/redo, zoom

**Status:** Done · 2026-10-04

## Built
- `src/components/editor/FormatPanel.jsx` (right container):
  - Scope header: "Whole resume" or the selected element's name and text, with × to clear.
  - Selected text: edit text (commits after a pause or on blur), font, weight (weights the font supports), size, colour (picker, hex, template accent + swatches), line height, letter spacing, alignment (left/centre/right/justify), bold / italic / underline / strikethrough, reset this element.
  - Photo (photo selected, or whole resume on photo templates): upload/replace/remove, size, shape (circle/rounded/square), outline width and colour, crop.
  - Whole resume: font, base size, text colour, line height, letter spacing, accent colour, reset all formatting.
  - Values shown are the real rendered values (read from the page), not blank defaults.
- `src/editor/useEditorHistory.js`: undo/redo over content + formatting snapshots from every source (panel, inline, NIMBUS); changes within 600ms are one step; Ctrl/Cmd+Z, Ctrl+Y, Ctrl+Shift+Z (not while typing in a field).
- Top bar: undo, redo, zoom (50–150%, applies to the pages only; export unaffected).
- Not added (FMT-12): Share, Saved indicator, top/middle/bottom align, shadows.

## Verified (fixture)
Every text control changed the rendered name; undo removed the change and redo restored it; editing a bullet from the panel updated the page; whole-resume line height applied to all pages.

## Fixed during verification
Floating-point artefacts in number fields (e.g. `-1.0000000002`).
<!-- PLAN-003 SUMMARY END -->
