<!-- PLAN-021 START -->
# PLAN-021 — NIMBUS: simple chat, Bloub cloud back, content-only

**Milestone:** M2.1 Simplicity · **Phase:** 21 · **Requirements:** NIMS-01…NIMS-06

## Context
- User feedback (2026-10-05): PLAN-013's chat is too busy (avatars/star icons, step checklists, option cards, change lists). The animated Bloub cloud that follows the cursor was lost; the NIMBUS wordmark should be a well-designed font with a rainbow shine moving up and down.
- **Scope change:** NIMBUS edits **content only** (deepen my summary, add this to my education, change my name, rewrite bullets, add skills I mention). Fonts, colours, sizes, alignment are done in the Format panel. Supersedes D-decisions about NIMBUS styling/options (PLAN-012 style ops and mood options; fit-to-one-page via NIMBUS).
- Reuses PLAN-011 (runner, NDJSON, fact guard) and PLAN-012 engine/contract (edit/question/conversation/refuse modes; content operations only).
- Rate limits: a Groq 429 must show a friendly message, never raw error JSON.

## UI (top to bottom)
1. **NIMBUS wordmark** — Rammetto One (already loaded) with a rainbow gradient clipped to the text, animating vertically (background-position up ↔ down, ~4s). Reduced motion: static gradient.
2. **Bloub cloud** (`BloubAIIcon`) — follows the cursor over the rail; state by activity: idle → `idle`, typing → `exploring`, waiting for the model (searching) → `curious`, model planning (contemplating) → `thinking`, applying changes (executing) → `processing`, done → `success`, error → `exclaim`.
3. **Thread** — user messages in a translucent rounded container on the right; NIMBUS replies as plain text on the left. No avatars, no icons, no step lists, no option cards, no change lists.
4. **Current task line** — while NIMBUS is executing, the active step title appears just above the composer, small, left-aligned, translucent, with a shimmer moving through the letters. Disappears when done.
5. **Composer** — one textarea with a rotating one-line placeholder (changes on each send / every few seconds while empty), send button. Enter sends. Stop appears only after the request starts (≥ 600 ms guard so a double-click on Send can't stop it).

## Engine changes
- Prompt rewritten for content work with examples ("deepen my summary", "add my 2023 hackathon win to achievements", "change my name to …", "make my TA bullets stronger"); style requests answered conversationally: "Use the Format panel on the right to change fonts and colours."
- Server rejects style/option operations from NIMBUS (validator option `contentOnly`).
- Friendly errors: 429 → "NIMBUS is getting a lot of requests right now — try again in a minute."; config → setup message; never raw JSON.
- Undo: the editor's undo (Ctrl+Z / top bar) covers NIMBUS changes; no per-message undo UI.

## Definition of done
Chat shows only messages + the shimmering task line; the cloud animates by state and follows the cursor; wordmark shines; a style request gets pointed to the Format panel; a rate limit shows a friendly line.
<!-- PLAN-021 END -->
