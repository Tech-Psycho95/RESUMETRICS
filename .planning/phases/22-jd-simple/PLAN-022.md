<!-- PLAN-022 START -->
# PLAN-022 — Job match: simplest design

**Milestone:** M2.1 Simplicity · **Phase:** 22 · **Requirements:** JDS-01…JDS-03

## Context
- User feedback (2026-10-05): JD should be "just a chat box with a small definition, the simplest design".
- Keeps PLAN-014 engine (parse, score, fixes) and PLAN-015's ScoreRing + Execute behaviour; removes visual clutter.

## UI
- Empty state: one line — "Paste a job description or attach the posting to see how well your resume matches."
- Composer like NIMBUS (textarea + attach + send); attached file shown as a small chip.
- While analysing: the current stage as a shimmering line above the composer (same component as NIMBUS).
- Result: ScoreRing (animated, red → green) with the job title under it; a single muted line of missing must-have skills; then the fixes list — each fix = title + one-line reason + **Execute** (or **Answer in NIMBUS**). Done fixes show "Applied · Undo".
- Removed: category bars, keyword chip clouds, impact/category badges, seniority chip, "Execute all".

## Definition of done
A JD analysis shows ring + title + missing line + fixes only; Execute updates the ring.
<!-- PLAN-022 END -->
