<!-- PLAN-015 START -->
# PLAN-015 — JD match UI: composer with upload, score ring, breakdown, fix cards

**Milestone:** M2 · **Phase:** 15 · **Requirements:** JD-01, JD-03, JD-05 (client)

## Context
- **PLAN-004:** Job match is a tab in the left rail (`JobMatchPanel`), currently a plain textarea and text results.
- **PLAN-014:** NDJSON stages + result contract (categories, keywords, fixes with operations).
- **PLAN-012/013:** shared operation applier and per-turn undo. **PLAN-008:** results persisted in the store.
- Introduces the shared **`ScoreRing`** component reused by LinkedIn (PLAN-018).

## UI
- **Composer** (bottom of the tab, chat-style like NIMBUS): textarea "Paste the job description" + attach button (PDF/DOCX/TXT, drag-and-drop onto the rail too). Attached file shows as a chip with name/size/remove. Send → stages appear: "Reading job description → Finding requirements → Comparing → Preparing fixes".
- **JD card:** parsed title + seniority, must-have and nice-to-have chips (collapsible), "Change JD".
- **Score:** `ScoreRing` — SVG ring that animates from 0 to the score over ~1.2s (ease-out), colour interpolated red (0) → amber (50) → green (100), number counts up in the centre; respects reduced motion (no animation, final state).
- **Breakdown:** five horizontal bars (Skills, Experience, Keywords, Education, Structure) with their own colours by score and weights; click a bar → expands evidence and gaps.
- **Keywords:** matched (green outline) vs missing (red outline) chips; hover a matched keyword highlights where it appears on the resume.
- **Fixes:** cards sorted by impact: impact badge, title, one-line why, **Execute** button. Executing applies the operations live (changed elements flash), the card turns to "Done · Undo", and the deterministic score updates immediately (animated ring delta, e.g. 62 → 68). Needs-input fixes show **Answer** → inline question → sends to NIMBUS with context.
- "Execute all high-impact" with confirmation listing what will change.

## Tasks
1. `ScoreRing` (shared, `src/components/charts/ScoreRing.jsx`) + tests in fixture for colours at 0/25/50/75/100.
2. Rebuild `JobMatchPanel` with composer, file upload (reuse `extractResumeDocument`), stage list, results.
3. Fix execution via shared applier; per-fix undo; instant re-score with `shared/jdScoring.js`.
4. Fixture `tests/jd-match.html` with mocked stream.

## Verification
Paste and file upload both work; ring animates and colours match the score; Execute changes the resume and raises the score; Undo restores; reduced-motion shows static ring.

## Definition of done
JD-01, JD-03, JD-05 pass in fixture and signed-in.
<!-- PLAN-015 END -->
