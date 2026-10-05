<!-- PLAN-009 SUMMARY START -->
# PLAN-009 summary

**Status:** Done · 2026-10-05

- Selection resolves from the highlighted range (a drag ending on a gap no longer falls back to "Whole resume") and from keyboard caret moves.
- Highlight formatting: `[b]/[i]/[u]/[s]` marks inside text (`src/editor/inlineMarks.js`, tests); B/I/U/S buttons and Ctrl/Cmd+B/I/U toggle marks on highlighted words or style the whole element; inline typing keeps marks.
- Size is whole-resume only (per-element size removed).
- Pagination rewritten to use real block positions: no page-1 overflow on any of 19 templates; fewer premature page 2s (Ditgar/Gengar/Glalie now 1 page; Bronzor 3→2). Continuation pages no longer spread sections out.
<!-- PLAN-009 SUMMARY END -->
