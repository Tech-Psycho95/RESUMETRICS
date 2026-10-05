<!-- PLAN-020 START -->
# PLAN-020 — Simplicity pass: buttons, top bar, rail switch, format panel

**Milestone:** M2.1 Simplicity · **Phase:** 20 · **Requirements:** SIM-01…SIM-05

## Context
- User feedback (2026-10-05): the editor is too crowded; buttons look plain and don't match; Export turns white on hover; the font section has unnecessary filters; too many explanatory lines.
- Builds on PLAN-001 (shell), PLAN-003/009/010 (format panel, font catalogue). Supersedes the font picker filters from PLAN-010 and the extra hints from PLAN-003/009.
- Rule for all M2.1 plans: **the simplest UI that is still navigable**. One short instruction line where needed, no repeated explanations, no decorative icons.

## Tasks
1. **Button system** (`src/buttons.css`): `.btn` + variants `primary` (solid accent, darker on hover — never white), `secondary` (white, accent border, tinted hover), `ghost` (text only), `danger` (red outline), `icon` (square). One height (36px; 32px `.btn-sm`), one radius, visible focus ring, disabled state. Apply to the top bar, format panel, rail, evidence screen and dialogs in the studio. Remove the conflicting `.canvas-export-button:hover` rule that made Export white.
2. **Top bar**: back button, resume name (rename on click) with a small clean document mark (no tinted icon tile), template name as muted text, then undo/redo/zoom, then delete (icon) + Export (primary). No step labels or "Imported from…" meta.
3. **Rail switch** (NIMBUS / Job match): a quiet segmented control (text tabs with a sliding underline), no badge clutter beyond the score number.
4. **Format panel**:
   - Header: "Format" + what is selected ("Whole resume" or element name) with a clear ×. No extra sentences.
   - **Font = one dropdown**: a simple list where each font name is written in its own font (lazy-loaded as it scrolls). No search, category, mood tags, ATS toggle or "recently used".
   - Groups: Text (font, weight, colour), Spacing (line height, letter spacing), Paragraph (align + B/I/U/S); whole resume adds size and accent. Remove helper paragraphs except one placeholder hint under B/I/U/S when nothing is highlighted ("Highlight words to style part of the text" only as a tooltip).
   - Photo controls appear only when the photo is selected on the page (click the photo), not in the whole-resume view.
   - Swatches: one row of 8.
5. **Fixtures** updated; `npm run build` passes.

## Definition of done
Export never turns white; every studio button uses the system; format panel fits without scrolling for a selected text element at 900px height; no filters in the font dropdown.
<!-- PLAN-020 END -->
