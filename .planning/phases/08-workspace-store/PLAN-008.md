<!-- PLAN-008 START -->
# PLAN-008 — Workspace store: state that survives screens and refresh

**Milestone:** M2 · **Phase:** 8 · **Requirements:** WS-01, WS-02

## Context
- **PLAN-000/001:** routes `/workspace`, `/workspace/templates`, `/workspace/build`, `/workspace/editor`, all rendered by `MainPage`.
- **Research F1:** leaving `/workspace` (e.g. to `/evaluation`) unmounts `MainPage` and loses the resume. Every later plan that leaves the editor (evidence PLAN-017/018) depends on this one.

## Goal
One workspace store that holds the draft and its tools' state above the routes, autosaved to `sessionStorage`, so any screen can leave and come back to the editor intact.

## Out of scope
Cloud saving / multiple saved resumes (later milestone). Cross-tab sync.

## Design
- `src/workspace/WorkspaceProvider.jsx` (React context + `useReducer`), mounted above `<Routes>` inside `ProtectedRoute`'s tree.
- **Persisted slice** (sessionStorage key `resumetrics:workspace:v1`, debounced 400ms, try/catch, size-guarded): `resumeData`, `resumePresentation`, `selectedTemplateId`, `uploadedFileName`, `parseMetadata`, `resumeName`, global style (`fontFamily`, `globalFontSize`, `fontColor`, `useGlobalTextColor`, `footerText`), `confirmedSections`, NIMBUS messages (last 40), last JD analysis, last evidence results, `workspaceMode`.
- **Not persisted:** undo history (kept in memory in the provider, so it survives route changes but not refresh), uploaded File objects, transient UI (menus, dialogs).
- Photos are data URLs and can be large: persist only if under 1.5 MB total; otherwise keep in memory and show "Photo will need re-uploading after a refresh" once.
- `MainPage` reads/writes through `useWorkspace()` instead of its own `useState`s (mechanical migration of ~30 state hooks; behaviour unchanged).
- Evidence screen becomes `/workspace/evidence` (rendered by the workspace router), replacing `/evaluation`; old `/evaluation` redirects there. The GitHub OAuth snapshot (`githubResumeSnapshotKey`) is replaced by the persisted store.

## Tasks
1. Create `WorkspaceProvider`, reducer actions, `useWorkspace()` hook, persistence with versioned key and migration guard.
2. Move `MainPage` state into the store; keep handler names so later plans' diffs stay small.
3. Move the undo history hook into the provider.
4. Add `/workspace/evidence` route (placeholder screen until PLAN-017) and redirect `/evaluation`.
5. Remove the GitHub snapshot code path; OAuth return lands on `/workspace/editor` with state restored from the store.
6. Fixture `tests/workspace-store.html`: edit, navigate away and back, refresh; state intact.

## Verification
- Fixture + signed-in: make edits → open evidence → back → identical resume, formatting, chat, undo stack. Refresh in editor → resume and formatting restored.
- Starting a new resume or deleting the draft clears the store.

## Definition of done
WS-01 and WS-02 pass; no feature lost from M1.
<!-- PLAN-008 END -->
