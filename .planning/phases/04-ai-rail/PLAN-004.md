<!-- PLAN-004 START -->
# PLAN-004 — Left AI rail: NIMBUS, JD match and evidence without crowding

**Milestone:** M1 · **Phase:** 4 · **Requirements:** AI-01…AI-05

## Context
- **PLAN-001:** the left container of `EditorShell` currently holds JD panel, NIMBUS and evidence stacked (moved unchanged).
- **PLAN-002:** selection is available; NIMBUS already reads the browser selection via `getAssistantWorkspaceContext` in `MainPage` — extend it with the selected registry element.
- M2 will deepen what these tools do; this plan is layout and integration only.

## Goal
One calm rail: a switch between NIMBUS and Job match on top, the active tool filling the scroll area, and evidence docked at the bottom.

## Layout
```
┌ Left rail ─────────────────────┐
│ [ NIMBUS | Job match (72%) ]   │  segmented switch, sticky
│                                │
│  active tool (scrolls)         │
│                                │
├────────────────────────────────┤
│ ▸ Evidence · GitHub ✓ · LinkedIn – · [Compare] │  dock, collapsed
└────────────────────────────────┘
```
- **Switch (AI-01):** NIMBUS chat (messages, input, suggestions) or Job match (JD textarea, Analyse, score, matched/missing skills, next steps). The Job match tab shows the last score as a badge so users see it without switching.
- **Evidence dock (AI-02):** pinned to the rail bottom (`position: sticky; bottom: 0`). Collapsed: one row with source status icons and Compare. Expanded: GitHub connect, LinkedIn upload/replace, notices — max 50% of rail height, scrolls inside.
- **Linking (AI-03):** each missing skill in Job match has "Ask NIMBUS" → switches to NIMBUS with a prefilled, editable prompt such as "Add evidence of <skill> to my experience only if it is true; ask me first if unsure." Nothing is sent automatically.
- **Selection context (AI-04):** NIMBUS input shows a chip "Editing: <element>" when something is selected; removable.
- **Density (AI-05):** check at 260px rail width; long lists collapse with "Show all".

## Tasks
1. `src/components/editor/AiRail.jsx` — switch, panes, dock; state for active tab and dock open (session only).
2. Extract the JD panel JSX from `MainPage` into `src/components/editor/JobMatchPanel.jsx` (props: description, analysis, loading, handlers). No logic change.
3. Extract evidence sources JSX into `src/components/editor/EvidenceDock.jsx`.
4. `AIAssistantEditor`: accept `prefill` and `selectionLabel` props.
5. Fixture `tests/ai-rail.html` with mocked props (no network).

## Verification
At 260px and 520px rail width: no overlap/clipping; switch keeps each pane's state; dock expands/collapses; Ask NIMBUS prefills and focuses the input; existing analyse/compare/connect flows still work signed in.

## Definition of done
AI-01…05 tick; nothing from the old editor (JD, NIMBUS, GitHub, LinkedIn, Compare) is missing.
<!-- PLAN-004 END -->
