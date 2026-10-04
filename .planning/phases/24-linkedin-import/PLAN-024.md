<!-- PLAN-024 START -->
# PLAN-024 — Import from LinkedIn (third way to start a resume)

**Milestone:** M2.1 Simplicity · **Phase:** 24 · **Requirements:** LIN-01…LIN-03

## Context
- User decision (2026-10-05): start options become **Start from scratch · Upload resume · Import from LinkedIn** (LinkedIn icon). Routing: LinkedIn PDF → parse → `/workspace/templates` → `/workspace/editor` (no review step).
- Reuses the existing extractor (`/api/resume/extract` with `sourceType: 'linkedin'`), PLAN-000 routing, and the shared gallery.

## Tasks
1. `ResumeStartOptions`: third card "Import from LinkedIn" with the LinkedIn mark and a one-line how-to ("LinkedIn → your profile → More → Save to PDF").
2. `MainPage`: `importLinkedIn(file)` → extracting state → on success set resume data, `uploadedFileName`, source `linkedin`, go to `/workspace/templates`; choosing a template goes straight to the editor (same as uploads).
3. Remove the LinkedIn evidence import dialog/flow from the editor.

## Definition of done
From the start page a LinkedIn PDF lands in the gallery and then the editor with its data filled in.
<!-- PLAN-024 END -->
