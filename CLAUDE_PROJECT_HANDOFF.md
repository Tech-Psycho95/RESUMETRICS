# Resumetrics — Project Handoff for Claude

This document is a source-grounded orientation to the current Resumetrics codebase. Treat it as a starting map, then verify behavior in the source before changing anything. The repository contains local environment configuration; this handoff intentionally lists variable names and authentication flows, never credential values.

## 1. What the product does

Resumetrics is a browser-based resume creation and evidence review app. Its main user path is:

1. Visit the public landing page and sign in with Google.
2. Open the protected dashboard/workspace and either create a blank resume or import a PDF, DOCX, or text resume.
3. Review extracted content, choose a template, and edit the resume in the workspace editor.
4. Optionally ask NIMBUS (the AI assistant) to make a constrained content/style change, compare the resume with a job description, import a LinkedIn profile export, or connect GitHub for repository evidence.
5. Export the edited resume.

The product goal is to keep resume claims tied to source facts and verifiable evidence. AI prompts repeatedly instruct the model to treat resume/profile/job-description text as untrusted source material and not to invent facts.

## 2. Stack and runtime

- Frontend: React, React DOM, React Router, Vite, Tailwind CSS Vite plugin, plain CSS stylesheets.
- Client authentication: Firebase Web SDK; Google provider popup sign-in.
- Backend: Node.js ES modules, Express 5, JSON APIs on port `8787` by default.
- AI: Groq SDK, server-side only. `server/config/env.js` currently allows provider `groq`; model is configured by environment.
- Authenticated persistence: Firebase Admin verifies Firebase ID tokens and uses Firestore for GitHub connection metadata.
- GitHub integration: Octokit GitHub App support. Per-installation tokens are generated on demand; they are not persisted.
- Resume parsing/import: browser-side `pdfjs-dist` and Mammoth extract PDF/DOCX text and page structure; server chunks source text and sends chunks to AI for structured extraction, with deterministic fallback.
- Exports/dependencies: `jspdf`, `docx`, and `pptxgenjs` are present. The visible export menu currently offers PDF, DOCX and TXT; confirm any PPTX UI path before assuming it is exposed.
- Other runtime features: DotLottie animations, IntersectionObserver/CSS motion, loaded-on-demand Google Fonts for some editor choices.

Useful commands (from `package.json`):

```sh
npm install
npm run dev       # Vite frontend
npm run server    # Express backend
npm run dev:all   # both concurrently
npm run build     # production client build
npm run preview   # preview dist output
```

Vite serves the client at `http://localhost:5173` and proxies `/api` to `http://localhost:8787` (`vite.config.js`). Backend JSON body limit is 2 MB. CORS allows configured `RESUMETRICS_WEB_ORIGIN` origins and localhost/127.0.0.1 HTTP origins when a local dev origin is configured.

## 3. Repository map

- `src/main.jsx` — application composition, route definitions, workspace state machine, resume import/edit/export flow, assistant calls, role analysis, LinkedIn and GitHub evidence orchestration, settings/dashboard/evaluation UI. This is the main feature integration point and is comparatively large; inspect the relevant function and nearby state before editing.
- `src/pages/` — public landing page and login page.
- `src/components/` — workspace, assistant, profile photo, import/review, evidence components, and template components.
- `src/components/landing/` — landing-page sections and scroll/motion helpers.
- `src/components/templates/` — template implementations and shared `ResumeTemplateLayout.jsx` renderer/pagination behavior.
- `src/config/resumeTemplates.js` — central template registry, defaults, compatibility fallback for old template IDs, and editor presentation defaults.
- `src/data/resumeData.js` — canonical blank resume shape.
- `src/context/AuthContext.jsx`, `src/firebase.js`, `src/components/ProtectedRoute.jsx` — Firebase setup, auth state/actions, and route gating.
- `src/utils/extractResumeDocument.js` — browser extraction of PDF/DOCX/TXT into structured page/text data.
- `src/utils/applyResumeEditPlan.js` — applies safe AI-generated resume edit plans to client state.
- `src/editor/` — semantic element registry, constrained editing engine, and available fonts.
- `server/index.js` — Express initialization, CORS/body limits, route mounting, Firebase Admin startup, common error handler.
- `server/config/env.js` — private environment loading, defaults, provider checks, and configuration validation.
- `server/routes/` — AI health/test, resume APIs, GitHub APIs.
- `server/services/` — AI client/prompts, resume normalization/extraction/fallback, Firebase Admin, GitHub App, state, Firestore store, and evidence analysis.
- `shared/roleAnalysis.js` — deterministic skill extraction and resume-versus-job comparison shared by client/server.
- `shared/resumeEditPlan.js` — strict shared validation/capability schema for AI edit plans.
- `tests/` — includes resume extraction service test and browser-oriented template/scratch-builder fixtures. No test script is currently declared in `package.json`.
- `public/`, `src/assets/` — static images, animations, fonts, logos.
- `graft/` — generated repository context graph. `graft/INDEX.md` describes per-file wiring cards and exact spans. The `graft` CLI currently errors in this Windows environment because an installed native Tree-sitter Kotlin binding is unavailable; use the cards/INDEX and rebuild/fix the local CLI only if needed.

## 4. Current routes and app structure

Current React routes are declared at the bottom of `src/main.jsx`:

| Path | Access | Current behavior |
| --- | --- | --- |
| `/` | public | Landing page |
| `/login` | public | Google sign-in |
| `/dashboard` | protected | Dashboard / template entry |
| `/workspace/*` | protected | Resume creation/import/editor workflow; editor route is `/workspace/editor` |
| `/settings` | protected | Settings |
| `/evaluation` | protected | Evidence comparison review |

`ProtectedRoute.jsx` waits for auth initialization, redirects unauthenticated users to login, and preserves the intended destination through router state. `AuthContext.jsx` exposes `currentUser`, `loading`, `error`, `isConfigured`, `signInWithGoogle`, and `signOut`.

The workspace uses an in-memory `workspaceMode` state (for example `initial`, `file-selected`, `extracting`, `extraction-review`, `template-selection`, `editor-ready`) rather than a backend resume CRUD system. A few cross-screen/temporary items are held in `sessionStorage`: LinkedIn imported profile (24-hour freshness), pending GitHub resume snapshot (15 minutes), evidence comparison request (30 minutes). Appearance is stored in `localStorage` as `resumetrics-appearance`. Do not assume resumes are automatically saved to Firestore or survive a page/session reload.

## 5. Resume data and template model

Canonical resume data fields (see `src/data/resumeData.js` and normalization in `server/services/resumeData.js`):

- Identity: `fullName`, `headline`, `email`, `phone`, `location`, `links`.
- Content: `summary`, `skills`, `experience`, `projects`, `education`, `certifications`, `achievements`.
- Parse metadata carried with the data shape: `missingFields`, `confidenceNotes`.
- Skill categories: `languages`, `frameworks`, `tools`, `databases`, `softSkills`, `other`.
- Experience includes role/company/location/dates/bullets; projects include name/tech stack/description/bullets/links; education includes degree/institution/location/dates/details.

The current template registry contains four active templates: `navy-professional`, `simple-hipster`, `curve-academic`, and `receive`. Templates share a normalized data contract, and generally delegate rendering/pagination to `ResumeTemplateLayout.jsx`. `getResumeTemplate` maps unknown non-empty legacy IDs to the first current template, preserving content rather than failing. Template definitions/default presentation are in `src/config/resumeTemplates.js`; edit this registry when adding/removing a template.

The editor semantic bridge is `buildResumeElementRegistry` in `src/editor/resumeElementRegistry.js`. It creates stable IDs for records and maps rendered elements to normalized content paths and editable capabilities. `resumeEditingEngine.js` applies constrained low-level operations. The AI assistant uses a distinct, narrower plan workflow (`shared/resumeEditPlan.js` + server `resumeEdit.js` + client `applyResumeEditPlan.js`); keep validation and application aligned when changing supported operations.

## 6. Main user flows

### Blank resume

Dashboard template selection passes a template ID via router state. Workspace initializes blank normalized resume data, presentation settings, and a selected template, then navigates to `/workspace/editor`.

### Import and extraction

The browser reads PDF, DOCX, or text using `extractResumeDocument.js`, preserving page text and metadata. It posts `{document}` to `POST /api/resume/extract`. Server `resumeExtraction.js` normalizes source pages, removes repeated page headers/footers, chunks large documents, invokes structured JSON extraction per chunk, merges partial sections, and returns extraction metadata/warnings. If AI extraction fails, `resumeFallback.js` produces a heuristic structured fallback. UI shows `ResumeExtractionReview` before template selection/editor. The extraction prompt explicitly forbids invented facts and asks the model to preserve source details.

### Manual editing and export

The selected template renders editable resume content. Manual edits are converted into normalized data updates. The workspace includes theme/font/color/layout controls, selectable semantic resume elements, photo controls, assistant, delete/reset and export actions. Current UI export choices are PDF, DOCX, TXT. Resume data is client state, so export is the user-facing durable output.

### NIMBUS assistant

The browser sends a natural-language instruction plus full structured resume/workspace context to `POST /api/resume/edit`. Server prompts Groq for a small JSON edit plan, validates it against allowed fields, indexes, caps, styles, and operation types, then returns the plan. The client applies only a valid plan with `applyResumeEditPlan.js`; the model does not directly mutate DOM or save data remotely. Keep the model-generated text considered untrusted and preserve shared schema validation.

### Job-description role alignment

The client previews a deterministic skill-aware match (`shared/roleAnalysis.js`) and calls `POST /api/resume/analyze`. Server derives matched/missing skills and a score deterministically, then uses Groq for concise summary/recommendations. If AI fails, the API still returns deterministic skill fallback. LinkedIn profile analysis can include additional extracted profile signals. This is guidance based on extracted text/skills, not a complete ATS simulation.

### LinkedIn evidence

There is no LinkedIn OAuth integration. User downloads their own LinkedIn PDF or supplies a DOCX export through `LinkedInImportDialog`; browser extracts text and calls the same resume extraction endpoint. Parsed profile is kept temporarily in session storage and compared against resume skills and optionally a job description. This is an imported-file workflow, not live LinkedIn API access.

### GitHub evidence

The signed-in user connects the Resumetrics GitHub App. Frontend uses Firebase ID token to start the flow; connection metadata (Firebase UID, installation ID, GitHub identity/display data and timestamp) is stored in Firestore. On evidence review, server fetches only authorized installation repositories/files/languages/README/issues/PR metadata via Octokit, maps found terms to resume skills, and may ask Groq for a narrative summary. It returns sanitized evidence. Disconnect clears Resumetrics' stored association; it does not uninstall the GitHub App.

## 7. Backend API surface

All endpoints are mounted under `/api` in `server/index.js`:

| Method + path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/ai/health` | none | Reports whether AI config is valid (provider only; no secret returned) |
| ~~`POST /api/ai/test`~~ | removed | Replaced by `npm run ai:ping` (CLI); it let anyone send prompts on the server's key |
| `POST /api/resume/extract` | Firebase ID token | Structure resume/profile text; max document chars enforced; heuristic fallback on model failures |
| `POST /api/resume/analyze` | none | Deterministic skill comparison plus optional AI summary/recommendations; JD max 12,000 chars |
| `POST /api/resume/edit` | none | Prepare a validated edit plan; instruction max 4,000 chars |
| `GET /api/github/connect` | Firebase ID token | Create connection state and return GitHub authorization URL |
| `GET /api/github/callback` | GitHub callback/state | Complete OAuth-on-install flow or redirect frontend for installation-only completion |
| `POST /api/github/complete-installation` | Firebase ID token + matching HTTP-only state cookie | Verify and associate an installation-only callback |
| `POST /api/github/complete-authorization` | Firebase ID token + matching cookie state | Exchange one-time GitHub OAuth code server-side and associate authorized installation |
| `GET /api/github/status` | Firebase ID token | Check stored connection and whether installation still exists |
| `GET /api/github/repos` | Firebase ID token | List sanitized repositories for connected installation |
| `POST /api/github/evidence-analysis` | Firebase ID token | Analyze authorized repository evidence against structured resume |
| `DELETE /api/github/disconnect` | Firebase ID token | Remove stored Resumetrics connection metadata |

GitHub routes authenticate with `Authorization: Bearer <Firebase ID token>`. AI and resume endpoints currently do not require Firebase auth, even though workspace UI is route-protected. Do not assume API authentication is global.

## 8. Authentication, authorization, keys, and secret handling

### Firebase / Google

- Browser uses Firebase Web SDK and `GoogleAuthProvider` with email/profile scopes via `signInWithPopup` (`src/context/AuthContext.jsx`). Firebase SDK persists/manages browser auth state; app listens with `onAuthStateChanged`.
- Frontend config is read from Vite variables in `src/firebase.js`. These web app config values are client-side configuration, not admin credentials, though the Firebase API key should still be managed according to Firebase restrictions.
- Backend uses Firebase Admin (`server/services/firebaseAdmin.js`) to verify bearer ID tokens and to access Firestore. Service-account JSON never belongs in frontend variables.
- Backend accepts service account file path from `FIREBASE_SERVICE_ACCOUNT_PATH` or fallback `GOOGLE_APPLICATION_CREDENTIALS`.

### GitHub App

- Backend-only variables: `GITHUB_APP_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_PRIVATE_KEY_PATH`, `GITHUB_APP_SLUG`, `GITHUB_CALLBACK_URL`, `FRONTEND_URL`.
- State token is stored server-side with TTL and bound to Firebase UID; an HTTP-only, SameSite=Lax cookie is used for frontend-forwarded callback completion. Secure flag follows HTTPS frontend URL.
- GitHub OAuth one-time code exchange, App JWT signing, installation-token minting, and repository calls stay server-side. App private key file is pointed to by path and ignored by Git.
- GitHub installation token is generated as needed, not persisted. Stored Firestore document collection is `githubConnections`, keyed by Firebase UID; it stores connection metadata, not the GitHub private key/token.
- GitHub App needs read permission to repository contents, metadata, issues, and pull requests for described evidence collection. Firestore must be enabled for durable connection metadata.

### Groq AI

- Backend-only variables: `RESUMETRICS_AI_API_KEY`, `RESUMETRICS_AI_PROVIDER` (must currently equal `groq`), `RESUMETRICS_AI_DEFAULT_MODEL`.
- Keep the API key in `server/.env.local` or server environment; never use a `VITE_` prefix. The frontend calls this app's Express routes and never imports Groq SDK.

### Environment variable inventory (names only; values intentionally redacted)

Frontend Firebase config (`.env.local`, documented in `.env.example`):

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID (optional)
```

Backend config (`server/.env.local`, template `server/.env.example`):

```text
RESUMETRICS_AI_API_KEY
RESUMETRICS_AI_PROVIDER
RESUMETRICS_AI_DEFAULT_MODEL
RESUMETRICS_WEB_ORIGIN
PORT (optional; defaults to 8787)
FIREBASE_SERVICE_ACCOUNT_PATH
GOOGLE_APPLICATION_CREDENTIALS (alternate service-account path)
GITHUB_APP_ID
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_PRIVATE_KEY_PATH
GITHUB_APP_SLUG
GITHUB_CALLBACK_URL
FRONTEND_URL
```

At handoff time, a root `.env.local` and a Firebase service-account path variable are present locally. Secret values and the contents of local environment/service-account files were not read into this handoff. Check only locally if a particular integration is configured; never paste live values into Claude, commits, issues, logs, or frontend code. `.gitignore` excludes `.env*` except example files, PEMs, secrets directories, and service-account JSON.

## 9. Security and correctness invariants

- Do not expose Groq API key, GitHub client secret/private key, Firebase service-account JSON, Firebase ID tokens, GitHub OAuth codes, GitHub App JWTs, or installation tokens in frontend bundles or logs.
- Firebase web config may be in browser, but Admin SDK credentials must be server-only.
- Verify the Firebase ID token and user association before GitHub connection reads/writes; never trust a Firebase UID supplied by the browser.
- Preserve state/CSRF binding for GitHub callbacks. Consume short-lived state after success; do not bypass callback state validation.
- Treat all uploaded resume/profile/JD content as untrusted data, not prompt instructions. AI output is not authoritative and must be schema-validated before application.
- Never invent resume facts. Fallback parsing is heuristic and should be shown/reviewed as such.
- Keep repository outputs sanitized; respect installation permissions and use read access only.
- Handle Firestore-unavailable, missing installation, invalid configuration and provider failures through current safe user-facing errors.
- Resume content is currently client-memory state except for transient session storage; avoid implying server-side resume persistence exists.

## 10. Documentation drift / source of truth

The README is useful for broad product intent and setup, but some specifics are stale compared with current code:

- Current routes include `/dashboard`, `/settings`, and nested `/workspace/editor`; the README's old route table lists a simpler `/workspace` and does not cover all current routes.
- Current central template registry exposes four templates (`Navy Professional`, `Simple Hipster`, `CurVe Academic`, `ReCeiVe`), not the five templates named in README.
- Current resume API includes `POST /api/resume/edit`; LinkedIn is a client-upload/import and comparison path, not a listed standalone server route.
- README says PPTX export is available; current visible export menu shows PDF, DOCX, and TXT. Inspect `exportDraft` and current UI before extending export behavior.
- README tree and feature notes do not fully reflect the current editor engine/element registry, LinkedIn import, dashboard/settings, or complete GitHub setup/authorization paths.
- README's sample says GitHub callback `http://localhost:5173/workspace`; `server/.env.example` currently also uses the frontend URL, while backend defaults in `server/config/env.js` point to `/api/github/callback` on port 8787. Match the GitHub App's configured Redirect URI to the actual chosen flow and environment; inspect latest code/config before changing this because both frontend-forwarded and backend callback behaviors exist.

Use implementation files as source of truth for current behavior, and update README alongside user-visible architecture changes.

## 11. Suggested first files when continuing work

- Project overview/setup: `README.md`, `package.json`, `vite.config.js`
- Auth: `src/firebase.js`, `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`, `server/services/firebaseAdmin.js`
- Workspace flows: relevant portions of `src/main.jsx`; read state handlers and component render together
- Templates: `src/config/resumeTemplates.js`, `src/components/templates/ResumeTemplateLayout.jsx`
- Import/extraction: `src/utils/extractResumeDocument.js`, `server/routes/resume.routes.js`, `server/services/resumeExtraction.js`, `server/services/resumeAI.js`, `server/services/resumeFallback.js`
- Assistant: `server/services/resumeEdit.js`, `shared/resumeEditPlan.js`, `src/utils/applyResumeEditPlan.js`
- Role analysis: `shared/roleAnalysis.js`, `server/services/resumeAI.js`, `server/routes/resume.routes.js`
- GitHub evidence: `server/routes/github.routes.js`, `server/services/githubApp.js`, `server/services/githubEvidence.js`, `server/services/githubConnectionStore.js`, client handling in `src/main.jsx`
- Visual behavior: `src/styles.css` plus feature styles (`resume-builder.css`, `resume-flow.css`, `github-evidence.css`, `linkedin-evidence.css`, `ai-assistant.css`, overrides)

The repository includes `AGENTS.md` instructions to consult the `graft/` context graph before searching/opening source and refresh it after big changes. Preserve those repo workflows where possible.
