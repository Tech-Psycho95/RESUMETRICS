<!-- PLAN-006 START -->
# PLAN-006 — Formatting-faithful PDF export

**Milestone:** M1 · **Phase:** 6 · **Requirements:** FMT-09 (export part)

## Context
- **PLAN-002:** overrides and global styles render on screen through the template components.
- **Research:** `exportDraft` in `src/main.jsx` writes plain text into jsPDF/docx, so today's PDF ignores the template and every formatting edit. Without this plan the formatting panel (PLAN-003) would be "just for show" in the downloaded file.

## Goal
The exported PDF looks like the resume on screen, with selectable text.

## Approach (recommended)
Print-based export: render the paginated pages into a hidden print container and call `window.print()` with an `@media print` stylesheet (A4, zero margins, one `.resume-page-frame` per page, hide app chrome). Gives vector, selectable, ATS-readable text and exact fonts with no new dependency. The user picks "Save as PDF" in the print dialog — label the menu item "PDF (print dialog)" and add a one-line hint.

Alternative considered: `jsPDF.html()` / html2canvas — rasterises or mis-handles web fonts and makes text unselectable, which hurts ATS (M3). Not chosen.

## Scope
- PDF via print path (above). Zoom (PLAN-003) must not affect output.
- DOCX and TXT stay content-only, labelled as such ("Word — text and structure only").

## Tasks
1. `src/print.css` with `@media print` rules; page size A4.
2. `printResume()` in `MainPage`: clear selection outline, set print class, `window.print()`, restore.
3. Export menu labels updated.
4. Fixture check with `tests/style-overrides.html` → print preview.

## Verification
Print preview of every template with overrides matches the screen; page breaks identical; text selectable in the saved PDF.

## Definition of done
A formatting change made in the panel is visible in the saved PDF.
<!-- PLAN-006 END -->
