<!-- PLAN-003 START -->
# PLAN-003 — Right formatting panel, undo/redo, zoom

**Milestone:** M1 · **Phase:** 3 · **Requirements:** FMT-03…FMT-08, FMT-10…FMT-12

## Context
- **PLAN-001:** the panel goes in `EditorShell`'s right container; the top bar has slots for undo/redo/zoom.
- **PLAN-002:** selection (`selectedResumeElement` → registry element) and `applyEditorOperations(ops)` exist; overrides render. This plan is UI on top of that — it must not write styles any other way.
- Reference: first screenshot from the user (Word/PowerPoint-style text panel on the right).

## Goal
A Word-like formatting panel where every control changes the resume, with undo/redo and zoom.

## Panel layout (top to bottom)
1. **Scope header:** "Whole resume" or "Selected: Job title — Senior UX Designer" with a clear (×) button. Controls below act on that scope (FMT-02).
2. **Edit text** (selection only, FMT-03): textarea bound to the element's content path; commits through the same path as inline edits (`handleManualResumeEdit`). Hidden for the photo.
3. **Text** (FMT-04): font family (grouped select from `fontRegistry`), weight (only weights the font supports), size (stepper, 7–48), colour (swatch + hex input + template accent shades), line height (%), letter spacing.
4. **Paragraph** (FMT-05): left / centre / right / justify segmented control.
5. **Style** (FMT-06): bold, italic, underline, strikethrough toggles with `aria-pressed`.
6. **Photo** (only when the photo is selected, FMT-07): width/height (linked by default), shape (circle/rounded/square), outline colour and width. Uses `set_image_style`.
7. **Reset** (FMT-08): "Reset this element" / "Reset all formatting".

Controls show the **current effective value** of the scope (override → global → template default), not blank defaults.

Deliberately **not** included (FMT-12): Share, element-position align (top/middle/bottom), shadow effects — they would be non-functional or meaningless in a flowing resume.

## Top bar additions
- **Undo / Redo** (FMT-10): history stack of `{ resumeData, resumePresentation }` snapshots, capped at 100; text typing coalesced (one entry per 600ms burst). Ctrl/Cmd+Z, Ctrl+Y / Ctrl+Shift+Z — but not while focus is inside a text input (browser undo there).
- **Zoom** (FMT-11): 50–150% select + fit-width; CSS `zoom`/transform on the canvas wrapper only; export unaffected.
- **Saved indicator:** only if a real save exists. Today there is none, so omit (FMT-12). Revisit when persistence lands.

## Tasks
1. `src/components/editor/FormatPanel.jsx` (+ small controls: `ColorField`, `NumberStepper`, `SegmentedControl`, `ToggleGroup`).
2. `src/editor/effectiveStyle.js`: resolve effective values for a scope (override → global → computed style of the selected DOM node as last fallback).
3. `src/editor/useEditorHistory.js`: snapshot history wired into `applyEditorOperations` and manual/AI content edits.
4. Top bar undo/redo/zoom in the editor branch of `MainPage`.
5. Move the old font panel and `ProfilePhotoControls` (photo upload/remove) into the panel: upload/remove stay under the Photo group.
6. Fixture `tests/format-panel.html`: panel + one template with a fake selection, to click every control and see the change.

## Verification
Checklist in the fixture and signed-in editor — for each control: change → visible on resume → undo reverts → redo reapplies → value shown in panel matches. Keyboard: every control reachable and labelled.

## Definition of done
No control in the right container is decorative; all FMT requirements above tick.
<!-- PLAN-003 END -->
