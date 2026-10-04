<!-- PLAN-023 START -->
# PLAN-023 — Evidence: GitHub only, minimal

**Milestone:** M2.1 Simplicity · **Phase:** 23 · **Requirements:** EVS-01…EVS-03

## Context
- User decision (2026-10-05): **comparison is GitHub only**. LinkedIn is no longer an evidence source; it becomes a way to create a resume (PLAN-024). Supersedes EV-01's two-source picker and PLAN-018's LinkedIn panel (its matcher `shared/linkedinMatch.js` is removed).
- Keeps PLAN-016 scan engine (25 most recent repos, byte shares, < 5% flag, live progress) and PLAN-017's donut/table/bars, trimmed.

## Screen
- Header: back to editor · "GitHub evidence".
- Not connected: one line + Connect. Connected, not scanned: one line + Scan.
- While scanning: progress bar + "12 of 25 repositories" (+ note "Your 25 most recently updated repositories").
- Results: donut + compact language table (language, %, repos) side by side; skill list (skill, %, status word; "too little" in the warning colour); repository list = name + stacked language bar + last updated. No summaries, flags banners, tags, file lists, sort/search tools, markup toggle.
- Footer: Continue without evidence · Add evidence.
- Editor rail: the dock becomes one quiet row "GitHub evidence → Compare".

## Definition of done
No LinkedIn anywhere in comparison; evidence screen fits results on one scroll page for 25 repos with minimal text.
<!-- PLAN-023 END -->
