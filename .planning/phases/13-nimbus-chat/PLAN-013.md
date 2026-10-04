<!-- PLAN-013 START -->
# PLAN-013 — NIMBUS chat UI v2

**Milestone:** M2 · **Phase:** 13 · **Requirements:** NIM-01…NIM-06 (client)

## Context
- **PLAN-004:** NIMBUS sits in the left rail tab; `AIAssistantEditor.jsx` is a small composer + log with an animated blob.
- **PLAN-012:** streamed turn contract (`thinking`, `plan`, `step`, `options`, `question`, `message`, `done`).
- **PLAN-008:** conversation persisted in the workspace store; undo history in the provider.

## Goal
A chat that feels like a capable assistant: you ask, it shows its plan, ticks off steps while the resume changes live, offers visual choices, and asks when unsure.

## UI
- **Thread:** full-height in the rail; user messages right-aligned bubbles; NIMBUS messages left with small avatar (existing blob, idle when not working). Auto-scroll unless the user scrolled up ("Jump to latest" pill).
- **Composer:** pinned bottom; multiline auto-grow; Enter sends, Shift+Enter newline; Stop button while running (aborts stream; already-applied steps stay and are undoable); selection chip ("Editing: Job title") from PLAN-004.
- **Step checklist** inside the NIMBUS message: each step row = status icon (pending circle / spinner / check / warning) + title + one-line summary when done; collapsible "Details" listing the concrete changes. Steps apply to the resume as each `step` event arrives (with a short highlight flash on changed elements).
- **Option cards:** square cards in a horizontal scroll or 2–3 column grid. Font cards render "Aa" + the name + sample line in that font; colour cards show swatch + hex + contrast badge; palette cards show heading/accent/text chips. Hover = temporary preview on the resume; click = apply (one undo step) and NIMBUS confirms. "More options" asks for another set.
- **Questions:** text + quick-reply chips; clicking a chip sends it as the user's reply.
- **Turn actions:** "Undo this" on every turn that changed the resume (restores the snapshot taken before the turn); copy message.
- **Empty state:** 4 suggestion chips relevant to the resume ("Tighten my summary", "Make job titles stand out", "Suggest a more professional font", "Check bullet strength").
- Accessibility: `role="log"`, live region announcements for step completion, focus returns to composer.

## Tasks
1. Rebuild `AIAssistantEditor.jsx` as `NimbusChat` (+ `StepList`, `OptionCards`, `QuickReplies`, `MessageBubble`).
2. Stream reader using PLAN-011 helper; reducer for turn state.
3. Live apply + highlight; per-turn snapshot for undo; hover preview that reverts on leave.
4. Fixture `tests/nimbus-chat.html` with a mocked NDJSON stream (edit plan, options, question, error).

## Verification
Fixture: steps tick one by one and the resume changes after each; Stop mid-plan keeps finished steps; option hover previews and click applies; quick reply sends; undo per turn restores exactly. Signed-in: the user's three example prompts behave as specified.

## Definition of done
NIM-01…06 pass in fixture and signed-in app.
<!-- PLAN-013 END -->
