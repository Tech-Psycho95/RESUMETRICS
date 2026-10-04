<!-- PLAN-004 SUMMARY START -->
# PLAN-004 summary — Left AI rail

**Status:** Done · 2026-10-04

## Built
- `src/components/editor/AiRail.jsx`: sticky NIMBUS / Job match switch (Job match shows the last score as a badge); one tool visible at a time.
- `JobMatchPanel`: job description, Analyse, score, matched skills, skills to review with **Ask NIMBUS** per skill (switches to NIMBUS with an editable prompt that tells it not to invent experience; nothing is sent automatically), next steps; long lists collapse with "Show all".
- `EvidenceDock`: pinned to the bottom of the rail; collapsed row with GitHub / LinkedIn status and Compare; expands to connect GitHub, upload/replace LinkedIn, notices and errors.
- `AIAssistantEditor`: "Editing: <element>" chip when something is selected on the resume (removable); the selection is also sent as NIMBUS context.
- Existing logic (analyse, compare, GitHub connect, LinkedIn import) is unchanged — only moved.

## Verified (fixture, stubbed network)
Switch hides the inactive tool; badge shows 62%; Ask NIMBUS switched tabs and prefilled the prompt; dock expanded with both sources and sits flush with the rail bottom.
<!-- PLAN-004 SUMMARY END -->
