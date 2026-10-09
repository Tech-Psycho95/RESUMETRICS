# Requirements — M1 UI redesign v2

Each requirement is testable. Phases in `ROADMAP.md` map to these IDs.

## Editor layout (LAY)
- **LAY-01** The editor has three containers: left (AI rail), centre (resume), right (formatting panel).
- **LAY-02** Each container scrolls on its own; the page itself does not scroll on desktop.
- **LAY-03** The left and right containers can be resized by dragging the edge that faces the resume. The cursor changes to a resize cursor and the edge highlights on hover.
- **LAY-04** Resizing is coupled and real time: whatever width one container gains, the other loses, so the resume's width never changes. The resume itself is not resizable.
- **LAY-05** Widths are clamped (min/max); when either container reaches a limit, the drag stops for both.
- **LAY-06** Resize handles work with the keyboard (focusable separator, arrow keys) and double-click resets widths. Widths are remembered per browser.
- **LAY-07** Below the desktop breakpoint, the rails become tabs/drawers and resizing is disabled.

## Formatting panel — right container (FMT)
- **FMT-01** Clicking an element on the resume selects it; the selection is shown on the page and named in the panel.
- **FMT-02** With nothing selected, controls apply to the whole resume; with an element selected, they apply to that element only. The panel says which.
- **FMT-03** Edit text: the selected element's text can be edited in the panel and updates the resume.
- **FMT-04** Text: font family, font weight, font size, colour, line height, letter spacing.
- **FMT-05** Alignment: left, centre, right, justify.
- **FMT-06** Style toggles: bold, italic, underline, strikethrough.
- **FMT-07** Photo (only when the photo is selected): width/height, shape (circle/rounded/square), outline colour/width.
- **FMT-08** "Reset formatting" for the selection and for the whole resume.
- **FMT-09** Every change is rendered in the resume, survives pagination, and appears in the exported PDF.
- **FMT-10** Undo/redo (buttons and Ctrl+Z / Ctrl+Y) covers content and formatting changes.
- **FMT-11** Zoom control for the resume canvas (50–150%) that does not change the exported size.
- **FMT-12** No control is shown that does not work (no Share button, no element-position align for flow layouts).

## AI rail — left container (AI)
- **AI-01** NIMBUS and JD match share the rail through a segmented switch, so only one is expanded at a time.
- **AI-02** Evidence sources (GitHub, LinkedIn, Compare) sit in a dock pinned to the bottom of the rail, collapsed to a single summary row by default.
- **AI-03** JD match results link to NIMBUS: each missing skill offers "Ask NIMBUS", which opens NIMBUS with a prepared, editable prompt.
- **AI-04** NIMBUS uses the current selection from the resume as context.
- **AI-05** The rail never shows more than one long panel at once; nothing is cramped at the minimum rail width.

## Form page — /workspace/build (FORM)
- **FORM-01** Left container lists the template's sections as cards with icons, in page order.
- **FORM-02** Each card shows a status on its left: a green tick when complete; otherwise a fill percentage whose colour runs from red (low) to green (high).
- **FORM-03** Each card has a "+" button that opens the section's questions; once the section is complete, the button becomes "Edit section".
- **FORM-04** Inside a section, required fields are marked; a sticky "Complete section" button stays disabled until the required fields are validly filled.
- **FORM-05** Clicking "Complete section" returns to the section list and the card shows the tick.
- **FORM-06** If a completed section later becomes invalid, its tick reverts to a percentage.
- **FORM-07** The centre shows the live resume, updating as fields change and scrolling to the section being edited.
- **FORM-08** Only necessary fields are required; a few low-value fields are optional and visibly marked as such (see the field matrix in PLAN-005).
- **FORM-09** Entries use structured inputs: month/year pickers with "I currently work/study here", and bullet rows that can be added, removed and reordered.
- **FORM-10** "Continue to editor" is available from the section list. It is **blocked** while any mandatory field is empty (optional fields may stay empty): a warning lists the sections, and clicking one opens it with the missing fields highlighted red. *(Changed 2026-10-04 by user; was warn-but-allow.)*
- **FORM-11** The back arrow on the form goes straight to templates if nothing has been typed; otherwise it asks to confirm discarding the form. The template's design is fixed once chosen (no settings panel on the form page). *(Added 2026-10-04 by user.)*

## Quality (QA)
- **QA-01** Each phase adds or updates a standalone fixture in `tests/` that renders its UI without sign-in.
- **QA-02** `npm run build` passes after every plan.
- **QA-03** Keyboard and screen-reader basics: labelled controls, visible focus, no keyboard traps.

---

# Requirements — M2 Edit features depth (added 2026-10-04)

## Workspace (WS)
- **WS-01** The resume, formatting, NIMBUS conversation, JD results and undo history survive moving between editor, evidence screen and back, and a page refresh in the same tab.
- **WS-02** The evidence screen lives inside the workspace (`/workspace/evidence`) and returns to `/workspace/editor` without losing anything.

## Element editing (EDT)
- **EDT-01** Clicking any element (name, headline, contact item, section heading, summary, job title, company, dates, each bullet, skill group, education field, project field) selects only that element; formatting applies only to it. Verified in the signed-in app.
- **EDT-02** Bold, italic, underline, strikethrough, colour, font, alignment, line height and letter spacing work per element. Ctrl/Cmd+B, I, U work on the selection.
- **EDT-03** Highlighting part of an element's text and pressing B/I/U formats only that part, and it survives re-render, undo/redo, NIMBUS edits and PDF export. Plain-text/DOCX exports keep the words.
- **EDT-04** Font size is a whole-resume setting only; the per-element size control is removed.
- **EDT-05** A resume stays on one page; page 2 (below, scrolling) is created only when content would cross the page's printable edge. Removing content pulls it back to one page. The app never shrinks text to fit; NIMBUS warns if fitting to one page would need text below a readable size.

## Fonts and colours (FNT)
- **FNT-01** 100+ self-hosted, open-licensed font families, grouped (serif, sans, slab, mono, display-safe), each with tags (professional, modern, friendly, academic, technical, ATS-safe…), loaded only when used.
- **FNT-02** A curated colour library: text colours, heading colours and accent palettes with mood tags and a contrast check against white (WCAG AA for body text).
- **FNT-03** The format panel and NIMBUS use the same font and colour catalogues.

## NIMBUS (NIM)
- **NIM-01** Chat UI like a modern assistant: message thread, composer pinned at the bottom, user and NIMBUS bubbles, scroll-to-latest, typing indicator.
- **NIM-02** A task is broken into steps shown to the user as a live checklist (pending → running → done/failed); each step's change appears on the resume as it completes.
- **NIM-03** NIMBUS can edit everything the user can: content, element formatting, whole-resume font/size/colour/accent, line height, spacing, section order, template accent.
- **NIM-04** Mood requests ("more professional font", "the heading colour looks off") return 3–6 visual options in the chat (fonts rendered in themselves; colour swatches) as square cards; clicking one applies it; hover previews it.
- **NIM-05** When the request is ambiguous NIMBUS asks a question (optionally with quick-reply chips) instead of guessing.
- **NIM-06** Each NIMBUS turn can be undone in one step.
- **NIM-07** NIMBUS never invents facts (employers, dates, metrics, skills); this rule is enforced by validation, not only the prompt.

## Job description match (JD)
- **JD-01** The JD tool has a chat-style composer with paste-text and file upload (PDF/DOCX/TXT).
- **JD-02** The JD is parsed into structured requirements (title, seniority, must-have and nice-to-have skills, experience, education, keywords, responsibilities).
- **JD-03** Overall match % with an animated ring (red→green) and a breakdown: skills, experience, keywords, education, structure.
- **JD-04** Structure checks: required sections present, summary targets the role, keyword placement, bullet quality, length.
- **JD-05** A list of fixes below the score; each has a title, why, expected impact and an **Execute** button that applies it (and can be undone). Fixes needing facts the resume doesn't contain ask the user instead of executing.

## GitHub evidence (GH)
- **GH-01** The scan covers the **25 most recently pushed** accessible repositories (cap configurable), and the UI says only the 25 most recent are scanned. *(Changed by user 2026-10-04.)*
- **GH-02** Language share = bytes of code per language ÷ total bytes across scanned repos; also shows how many repos use each language.
- **GH-03** Any resume skill with < 5% share (or no signal) is flagged "Too little evidence".
- **GH-04** Scan progress (% and current repo) updates live while scanning; results (chart, repo list) fill in as repos complete.
- **GH-05** Interactive charts: language donut with distinct colours + legend, per-skill evidence bars; hover/click a language to highlight it and filter repositories.
- **GH-06** Repositories shown as a dense, readable list (name, description, language bar, updated, matched skills, files checked) with sort and filter — no decorative filler.

## LinkedIn evidence (LI)
- **LI-01** User uploads the LinkedIn profile PDF ("Save to PDF" export); it is parsed into skills, experience and internships.
- **LI-02** Match % for skills, experience and internships, plus overall; each resume item is shown as matched / partly matched (e.g. dates differ) / not found.
- **LI-03** Overall match shown as a ring that animates filling up, coloured red (low) → green (high).

## Evidence flow (EV)
- **EV-01** Evidence is independent: the user picks GitHub, LinkedIn or both; neither is required for the other.
- **EV-02** Results end with two buttons: **Add evidence** (returns to the editor; attaching evidence is a later feature) and **Continue without evidence** (returns to the editor).

## AI quality (AIQ)
- **AIQ-01** Every AI task uses a strict JSON schema and server-side validation; invalid output falls back safely.
- **AIQ-02** Golden evaluation sets for NIMBUS, JD parsing/fixes and LinkedIn matching, with a script that scores prompts/models; results recorded in `.planning`.
- **AIQ-03** Model per task is configurable in `server/.env.local`.

## Landing page (LND), PLAN-026
- **LND-01** Lenis smooth scrolling on the landing page only.
- **LND-02** Scroll-driven, reversible resume fill: name → contact → summary → experience → skills → education.
- **LND-03** Parallax depth with at least 3 layers.
- **LND-04** Logo appears at the top only once the resume is complete.
- **LND-05** Six feature containers for the M2/M2.1 features, revealed on scroll.
- **LND-06** CTAs go to `/login`.
- **LND-07** Reduced motion shows a static, complete layout.
- **LND-08** No horizontal scroll at 375px; animate only transform/opacity/clip-path.

## Templates (TPL), PLAN-027
- **TPL-01…08** Six LaTeX clones (Minimal Academic, Libre CV, Simple Hipster rebuilt, Single-page Keywords, Elegant Resume, Developer CV): faithful font/structure/visuals, editable, paginated, CSS-only icons, no invented data, existing templates unchanged, form order follows the template. See PLAN-027.

## Inclusive form (INC / A11Y), PLAN-028
- **INC-01** People name their own skill groups (add, rename, remove); custom names print on the resume.
- **INC-02** Neutral starter groups (Key skills, Tools & software, Soft skills); technical groups are optional.
- **INC-03** Profession-neutral labels and placeholders across the form.
- **INC-04** Additional free-text sections (volunteering, licences, publications…).
- **INC-05** Custom groups survive server normalisation and AI edits.
- **INC-06** One shared skill-group label helper for the form, templates and editor.
- **A11Y-01…07** Labels, live announcements, focus to errors, focus rings, 24px targets, 4.5:1 contrast, keyboard-only use. See PLAN-028.

## Job tailoring (TLR), PLAN-029
- **TLR-01…06** `/workspace/tailor`: Job match half plus live resume half, changes highlighted, Job match tab removed from the editor, shared state, responsive. See PLAN-029.


## Cover letters (CL / SIG / LNM / ADD / GATE), PLAN-033
- **GATE-01…05** Sidebar Job tailoring, Cover letters and Evidence check open a "Select a resume first" pop-up over the current page (page blurred, no navigation); the session resume is the one pickable row; picker is array-driven for the storage milestone; direct visits without a draft go to the gate; in-editor entry points skip it.
- **CL-01…14** A letter per template using the template's real masthead (5 families from the four references + centred); paper/font/accent follow the template; full anatomy; one-page guidance with no auto-shrink; prints as designed; `/workspace/letter` editor with the resume editor's shell; inline edits; Details form; Format panel; shared header edits write to the resume; persisted; Letter guide from the ResumeWay checklist; ghost hints.
- **SIG-01…07** Signature import with background removed to transparent (matches any paper), ink recolour, clean-up/size/align/remove, clear errors, storage-safe.
- **LNM-01…08** NIMBUS letter operations (content only), writes a whole letter from resume + job, asks rather than inventing company facts, fact guard + lint, golden evals, own thread and chips, per-turn undo.
- **ADD-01…07** Add to resume puts the letter on page 1 of the editor; Edit/Remove bar; isolated from resume page logic; PDF, letter-only PDF, DOCX/TXT; dock and tailoring entry points; help copy.
Details and checks: PLAN-033.
