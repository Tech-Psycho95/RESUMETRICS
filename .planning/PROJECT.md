# Resumetrics — Project

## Vision
A resume builder where every claim can be tied to evidence. Users build or import a resume,
refine it with a real editor and an AI assistant (NIMBUS), check it against a job description,
verify it against GitHub/LinkedIn, and (later) score it for ATS readiness.

## Core user flow (fixed — do not change routing)

```
user ─┬─ Start from scratch ─> /workspace/templates ─> /workspace/build (form) ─┐
      └─ Upload resume ─> AI parse + review (/workspace) ─> /workspace/templates ─┴─> /workspace/editor
```

- `/workspace/templates` is one shared gallery for both paths.
- `/workspace/build` holds **only** the details form and a live preview. No AI, no JD, no evidence, no inline editing.
- `/workspace/editor` is the common edit area: NIMBUS, JD match, evidence, manual formatting.

## Milestones (high level)
1. **M1 — UI redesign v2** (current): three-pane editor, functional formatting panel,
   AI rail, section-based form. See `ROADMAP.md`.
2. **M2 — Edit features depth**: make NIMBUS, JD match and evidence genuinely useful.
3. **M3 — ATS scoring**.

## Stack
React + Vite + React Router (client), Express 5 (server, port 8787), Groq for AI, Firebase
auth/Firestore, pdfjs/mammoth for import, jsPDF/docx for export.

## Constraints
- Resume content shape: `src/data/resumeData.js`; presentation in `resumePresentation` state.
- All style edits go through the constrained engine `src/editor/resumeEditingEngine.js`
  (shared by manual controls and AI). No ad-hoc DOM styling.
- AI edit plans stay validated by `shared/resumeEditPlan.js`.
- No backend persistence of resumes yet; state lives in `MainPage` (`src/main.jsx`).
- Protected routes need Google sign-in, so automated browser checks use standalone fixtures
  in `tests/*.html` (existing pattern: `tests/scratch-builder.html`).
- Every control on screen must do something. No decorative, non-functional controls.
