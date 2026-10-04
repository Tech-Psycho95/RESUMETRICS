<!-- PLAN-000 START -->
# PLAN-000 — Workspace routing (scratch and upload converge)

**Milestone:** M1 · **Phase:** 0 · **Status:** Executed, uncommitted, not yet tested with sign-in

## Context
- First plan. No dependencies.
- Provides the route structure every later plan builds on.

## Goal
Scratch and upload flows share one template gallery and one editor; the form page has no editing tools.

## What was done
- Routes: `/workspace` (start, upload, extraction review) → `/workspace/templates` (shared `TemplateGallery`) → `/workspace/build` (scratch only: form + read-only preview) → `/workspace/editor` (all edit tools).
- Removed `src/components/ResumeTemplateSelector.jsx`.
- Added `readOnly` to `ResumeTemplateLayout`; added `onContinue` footer to `ResumeBuilderForm`.
- Route guard effect in `MainPage` keeps URL and draft in step.

## Remaining
- Manual click-through of both flows while signed in.
- Dead CSS for the old selector in `src/resume-flow.css` (`.template-selector*`, `.resume-template-selector`) — remove in PLAN-007.

## Definition of done
Both flows reach `/workspace/editor` with the right content; the form page shows no NIMBUS/JD/evidence.
<!-- PLAN-000 END -->
