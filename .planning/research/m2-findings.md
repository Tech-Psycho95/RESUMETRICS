# Research — M2 findings (2026-10-04)

Verified by reading source. Plans PLAN-008…PLAN-019 cite these.

## F1. Workspace state is lost when leaving /workspace (blocks "back to editor")
- All resume state lives inside `MainPage` (`src/main.jsx`). "Compare" navigates to `/evaluation` (`EvaluationPage`), which unmounts `MainPage`; the resume, formatting, NIMBUS chat and history are gone. Only a 15-minute sessionStorage snapshot exists for the GitHub OAuth round-trip, and the evidence request is copied to sessionStorage.
- Consequence: "Continue without evidence → back to editor" cannot work until workspace state survives navigation. → PLAN-008 (foundation).

## F2. GitHub evidence today
- `server/services/githubEvidence.js`: lists repos via `GET /installation/repositories` **first page only (100)**, sorts by updated date, scans **25**, sequentially.
- Per repo it calls `GET /repos/{o}/{r}/languages` — the API returns **bytes of code per language** — but the code keeps only the names (`Object.keys`), so language share cannot be computed today.
- It also reads README (≤1,800 chars) and ten manifest files (package.json, requirements.txt, …) to match resume skills.
- "Presence" = repos with a signal ÷ repos scanned. "Verified" = language or manifest match; README-only = unverified.
- One request returns everything at the end; there is no progress reporting. A live progress bar needs a streaming response (NDJSON over `fetch`) or a job + polling.
- AI writes a narrative summary (`createAiNarrative`).

## F3. LinkedIn evidence today
- LinkedIn PDF/DOCX goes through the same `/api/resume/extract` as resumes (`sourceType: 'linkedin'`), giving resume-shaped data.
- Comparison (`buildLinkedInResumeComparison`, client) is skills-only set overlap; experience/internships are not matched. Optional JD analysis is mixed in.
- Evidence comparison currently requires the user to have a source connected before "Compare" is enabled, and runs whichever sources are present.

## F4. NIMBUS today
- One call: `POST /api/resume/edit` → `createResumeEditPlan` (Groq, `json_object` mode, temperature 0.1) → `{status, message, operations[]}` validated by `shared/resumeEditPlan.js`, applied by `src/utils/applyResumeEditPlan.js`.
- Style operations are very narrow: `set_style` supports **6 font keys** (inter, dm-sans, space-grotesk, merriweather, georgia, arial), **fixed sizes** (12–24) and one global text colour. It cannot target an element, a heading, the accent colour, or any of the 28 fonts the editor offers.
- No step-by-step output, no option lists, no streaming. Clarification exists (`needs_clarification`) but is single-question text.
- Model: `RESUMETRICS_AI_DEFAULT_MODEL` (example `openai/gpt-oss-20b`), one model for every task.

## F5. JD analysis today
- `POST /api/resume/analyze`: deterministic skill overlap (`shared/roleAnalysis.js`) + AI one-sentence summary and ≤4 generic recommendations. No JD file upload, no structure scoring, no actionable fixes.

## F6. Editor formatting (after M1)
- Element-level overrides work in fixtures (click → select → format). The user reports formatting applies to the whole resume in the real app → must be reproduced signed-in (could be an old build, the click landing on a non-element, or contentEditable focus behaviour). Diagnose before building on it.
- Per-element font size exists; the user wants size to be **global only** (per-element size breaks template structure).
- Formatting only works on whole elements; there is no formatting of a highlighted part of a sentence (content is plain strings).

## F7. Pagination
- `paginateMeasurement` subtracts a 26px "safety inset" plus padding from the A4 content height before deciding to break, and measures blocks individually. This can push content to page 2 while page 1 still has visible room. The user wants page 2 **only** when content actually reaches the page edge.

## F8. Fonts
- 28 fonts in `src/editor/fontRegistry.js`, loaded from Google Fonts CSS at runtime. Self-hosting 100+ requires downloading font files (OFL/Apache-licensed families only) and lazy `@font-face`/`FontFace` loading so the bundle doesn't grow.

## F9. "AI model training"
- The app calls hosted Groq models; Groq does not offer fine-tuning of these models to us. What we can do with real effect: strict JSON-schema outputs, task-specific system prompts with few-shot examples, deterministic pre/post-processing, per-task model choice, and an **evaluation harness** (golden cases + automated scoring) to iterate prompts measurably. Fine-tuning would need a different provider and a consented dataset — out of scope for M2, data format prepared for later.
