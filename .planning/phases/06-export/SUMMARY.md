<!-- PLAN-006 SUMMARY START -->
# PLAN-006 summary — PDF export that matches the design

**Status:** Done (print dialog itself not exercised by automation) · 2026-10-04

## Built
- Export → PDF renders a read-only copy of the resume at exactly 794px wide (A4 at 96 dpi) into `.print-root` via a portal, waits for fonts, then opens the browser print dialog ("Save as PDF"). The copy is removed after printing.
- `src/print.css`: prints only `.print-root`, A4 with no margins, one page per `.resume-page-frame`, colours kept, selection outlines and the photo "+" placeholder hidden.
- `ResumeTemplateLayout` accepts `pageWidthOverride`.
- Old `@media print` block in `resume-flow.css` (which targeted the removed `.resume-canvas` layout) replaced by `print.css`.
- Export menu labels: PDF "Exactly as designed · choose Save as PDF", Word "Text and structure only".

## Verified
Fixture `tests/editor-studio.html?print=1`: print copy has 794×1123px pages, `--page-scale` 1, not editable. The actual print dialog was not opened by automation.
<!-- PLAN-006 SUMMARY END -->
