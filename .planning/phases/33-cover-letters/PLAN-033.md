<!-- PLAN-033 START -->
> **Revision 2026-10-06 (user):** the gate is a blurred pop-up over the current page, not a page. Everywhere below that says `/workspace/select/:tool` or a "gate page" means `ResumeGateDialog`, opened from the sidebar buttons in `Shell`.
# PLAN-033: Cover letters — a letter designed for every resume, edited like a resume, added to the resume

**Milestone:** M2.4 · **Phase:** 33 · **Requirements:** GATE-01…05, CL-01…14, SIG-01…07, LNM-01…08, ADD-01…07 · **Status:** Planned 2026-10-06
**Builds on:** PLAN-001/003/005 (editor shell, format panel, form), PLAN-002/009 (style engine, element editing), PLAN-012/021 (NIMBUS engine and chat, content-only edits D24), PLAN-006 (print export), PLAN-027 (template registry, LaTeX clones), PLAN-029/031/032 (Job tailoring and Evidence pages, `.tw` product shell), PLAN-008 (workspace store).
**Research:** `.planning/research/cover-letter-findings.md` (ResumeWay steps, the four references, code findings). Read it first.

## Context (user, 2026-10-06)
"Now we work on cover letters; they should be in the same design as the resume." The user attached four reference letters (Claire Cooper, Emily Clark, Smith Matthew, John Duisberg) and the ResumeWay guide, and asked for:
1. A cover-letter page that is an **editor like the resume's** (same UI, same function) with **signature import** — the imported signature's background must be changed to match the resume's colour.
2. **NIMBUS** gets the same edit powers on the letter that it has on the resume.
3. When done, the user **adds the letter to the resume** and returns to the main resume editor, where the cover-letter page is now part of the document.
4. **Sidebar gate:** Job tailoring, Cover letters and Evidence check, opened from the sidebar, say **"Select a resume first"** for now; a real resume picker comes when data storage is integrated.
5. Plan in `.planning`, label it so "execute latest plan" works, update that every time. (Done: `CURRENT.md`.)

## What a great cover letter is (from ResumeWay, built into the product)
Six steps: contact block · named salutation · opening (role, how found, one key qualification, enthusiasm) · middle (strongest skills and *measurable* results matched to the job) · closing (restate interest, thank, call to action) · sign-off with signature above the typed name ("sincerely" for a named person, "faithfully" for a generic greeting). Under one page, specific to the company, never a repeat of the resume, no hyperbole or generic openers.
The product encodes this three ways: (a) the **letter structure** (Opening / Proof / Fit / Close blocks with ghost hints), (b) the **Letter guide** (a live checklist from the article's pre-submission list), (c) the **NIMBUS letter prompt** (same rules, plus: it asks for the reason for the company instead of inventing one).

## Decisions this plan makes (the user may veto any before execution; recorded in STATE as D31–D36)
- **D31 Gate:** from the sidebar, the three career tools always open a "Select a resume first" page. It lists the resume in this session as the one pickable row (the future picker's first row) and offers Start / Import when there is none. Entry points *inside* the editor (docks, tailoring page) open the tool directly because a resume is already chosen.
- **D32 One letter per resume, designed per template:** the letter follows the resume's template. 24 templates → **5 layout families** (`rule`, `band`, `rail`, `offset`, `centred`) × each template's own header, font, accent and paper, because the letter **renders the template's real masthead**. No separate layout picker.
- **D33 Position:** once added, the letter is **page 1** of the document (before the resume), in the editor canvas, in PDF export and in DOCX/TXT.
- **D34 Editing locations:** the letter is edited in its own studio (`/workspace/letter`). In the resume editor it is shown as a page with *Edit letter* and *Remove* actions (not edited inline), so the two documents never fight over selection and the NIMBUS context.
- **D35 Signature:** import a photo or scan of a signature; the background is removed to **transparent** and the ink recoloured, so it matches any paper colour, template or later colour change. No draw/type signature now.
- **D36 NIMBUS on letters:** content-only (consistent with D24). Same turn engine, steps, undo, questions; letter-specific operations, prompt, fact guard and eval set.

## Component analysis and design (frontend-design process)

### Anatomy and what is shared with the resume
| Part | Source of truth | Editable where |
|---|---|---|
| Masthead (name, role, photo) | **Resume** (`fullName`, `headline`, photo). The role line can be overridden for this letter (`letter.role`). | Inline on the letter; name and photo write to the resume |
| Contact (email, phone, location, links) | **Resume** | Inline, writes to the resume |
| Date | Letter; auto = today until the user types one | Inline + Details |
| Recipient (name, title, company, address) | Letter; prefilled from the last tailored job (`analysis.jd`) when present | Inline + Details |
| Subject / heading line | Letter, optional | Inline + Details |
| Salutation | Letter; "Dear {name}," or "Dear Hiring Manager," | Inline + Details |
| Paragraphs | Letter: `opening`, `proof`, `fit`, `closing` (+ extra `body`) | Inline, NIMBUS |
| Sign-off, signature, typed name | Letter; typed name = resume name | Inline + Signature panel |

### Five layout families (mapped from the four references and the 24 resume headers)
Body rules for all families: one column of text ≤ 66 characters wide, ragged right, no first-line indents, 0.9em between paragraphs, line-height 1.55 (sans) / 1.62 (serif), body at the template's body size, the template's own font. Accent is used in at most two small devices per page (a rule, a bar, a tab) and never in body text. Paper colour = the template's page colour (white unless the template tints it). Memorable element = **masthead continuity**: the letter's top is the resume's top. Everything else stays quiet.

```
rule (ref 1 Claire)        band (ref 2 Emily)          rail (ref 3 Smith)         offset (ref 4 John)        centred
┃ NAME BIG        contact  ┌───── NAME ─────┐          NAME                       ▌NAME                     ─── NAME ───
┃ Role                      │     ROLE       │          ▬ Role                     ▌ROLE         address        role · contact
┃ date                      └────────────────┘          ▌CONTACT ┃ TO WHOM…       T P E contacts            ───────────────
┃ To: name                  contact │ date              ▌email   ┃ date          date                       date
┃ salutation                email   │ recipient         ▌phone   ┃ recipient       ┌ recipient             recipient
┃ paragraph…                phone   │ subject           ▌city    ┃ Dear …          │ HEADING               Dear …
┃ sign-off                  site    │ Dear …                     ┃ paragraph…      │ paragraph…            paragraph…
┃ signature                           │ paragraph…                 ┃ sign-off        │ sign-off              sign-off
┃ Name                                │ sign-off · signature       ┃ Name            │ Name                  signature · Name
```
| Family | Reference | Distinct device | Templates |
|---|---|---|---|
| `rule` | 1 | Full-height vertical rule at the left in the accent/ink, masthead left, contact block top-right, recipient as a "To:" block | keywords-cv, receive, lapras, onyx, rhyhorn, meowth |
| `band` | 2 | The template's own coloured/tinted header band across the top, contact rail left, letter right with date, recipient, subject | simple-hipster, ditgar, ditto, gengar, glalie, leafish, pikachu |
| `rail` | 3 | Labelled "Contact" rail on the left (margin label) with a hairline divider and one accent bar; body on the right | minimal-academic, libre-cv, curve-academic, chikorita |
| `offset` | 4 | Body column offset to the right two-thirds; masthead and date left; hairline ticks; recipient above a quiet heading | developer-cv, scizor |
| `centred` | none | Centred masthead, hairline, then a left-aligned letter | navy-professional, elegant-resume, azurill, bronzor, kakuna |

The mapping is a starting table in `coverLetterDesigns` (registry); **Wave 0 renders all 24 and the table is corrected from screenshots** before any further work. A template that fits none gets its own variant class, not a different family.

### Review against the brief
- The generic outcome would be one centred letter template re-coloured 24 times. Rejected: the brief says "design specific cover letters for each resume". Using each template's real masthead plus five structural families gives 24 visibly different letters that match their resume exactly, without 24 hand-built layouts.
- The refs lean on cream/grey papers and gold/yellow tabs. Those are the references' choices, not defaults: here **paper colour is a Format control** (White, Warm, Stone, Template) so the signature-transparency promise is visible, and accent colours come from the template.
- Dropped: a "letter template gallery". The resume's template decides; fewer choices, the same design system.

### Letter studio UI (same shell as the resume editor)
```
┌ topbar: ← Back · ✉ Cover letter · "Jordan Lee resume"     undo redo zoom      [Export ▾] [Add to resume] ┐
├ left rail ────────────────┬ canvas (A4 letter page, live) ─────────────┬ right panel ───────────────────┤
│ NIMBUS chat (same comp.)  │                                            │ ( Details | Format ) segmented │
│  chips: Write my letter · │        masthead (template header)          │ Details: Job post (optional),  │
│  Shorter · More confident │        date / recipient / subject          │  Recipient, Date, Subject,     │
│ ───────────────────────── │        Dear …                              │  Salutation, Sign-off          │
│ Letter guide  6 of 8 ✓  ▾ │        ¶ opening ¶ proof ¶ fit ¶ close     │ Format: same FormatPanel +     │
│ Tailor to a job   Open    │        sign-off · signature · name         │  Paper colour, Signature       │
└───────────────────────────┴────────────────────────────────────────────┴────────────────────────────────┘
```
- Reused as-is: `EditorShell` (resizable rails), `NimbusChat`, `FormatPanel` pieces, `useEditorHistory`, buttons/tokens (`buttons.css`), `studio-*` bar classes, zoom, export menu.
- **Details | Format** segmented switch: Details is the default; selecting any text on the page switches to Format (as the resume editor does when something is selected).
- **Letter guide** = one headline ("6 of 8 checks") that expands to the checklist; each failing check has one button that sends the fix to NIMBUS. Checks (all deterministic, `shared/letterLint.js`): role named · company named · addressed to a person (or the generic fallback is used correctly) · opening is specific (not a generic opener) · at least one measurable result · says why this company · ends with a call to action · 250–400 words and fits one page · does not repeat resume bullets. Spelling uses the browser's own spellcheck on the editable text.
- Empty paragraphs show **ghost hints** (not printed): Opening "Name the role, where you found it, and your strongest qualification"; Proof "Pick one or two results from your resume that match what the job asks for"; Fit "Say why this company, in one specific sentence"; Close "Thank them and ask for a conversation".
- One-page rule: the page is one A4 sheet; if text runs over, a visible "Page 2" divider appears with the warning "Over one page. Shorten it or ask NIMBUS." Nothing is ever shrunk automatically (D19).

### Signature (the user's colour-match requirement)
Pipeline in `src/coverLetter/signature.js`: decode image (PNG/JPG/WebP/HEIC-free, ≤ 8 MB) → downscale to ≤ 700px wide → estimate paper colour from a ring of border pixels (median) → per pixel `alpha = smoothstep(lo, hi, colourDistance)` with `lo/hi` set by the **Clean-up** slider → recolour every pixel to the chosen **Ink** (default: the letter's text colour; swatches: text / black / navy / accent) → trim to the ink's bounds → PNG data URL (target ≤ 120 KB). The downscaled original is kept (budgeted like the photo) so Clean-up/Ink changes re-process without re-uploading. Because the result is transparent, **the page's paper colour shows through**: cream, grey, white, a band — it always matches, and changing the template or paper colour needs no re-processing. The pure maths (`estimatePaper`, `alphaFor`, `inkBounds`) takes plain arrays so it is unit-tested in node; the canvas wrapper is tested in the fixture.
Controls (Format → Signature): Upload / Replace, Clean-up, Ink, Size, Align (follows the family by default), Remove. Shown on the page above the typed name; in the empty state, a dashed "Add signature" target.

### NIMBUS on the letter (LNM)
- Same `useNimbusTurns` with a **letter adapter**: `snapshot/restore` (letter + presentation), `applyOperations` → `applyLetterOperations` (pure, new `src/coverLetter/applyLetterOperations.js`), `buildContext` (letter, resume, job, elements on the letter page, selection, conversation). `endpoint` stays `/api/nimbus/turn`; the body carries `document: 'letter'`.
- Separate chat thread (`letterMessages`) from the resume's, same component and Bloub states (D25). Placeholder lines and chips are letter-specific.
- Operations (shared validation in `shared/letterPlan.js`, content only):
  `set_letter_field` {target: `role|date|recipientName|recipientTitle|company|address|subject|salutation|signoff`, value} · `clear_letter_field` · `set_paragraph` {index, text} · `insert_paragraph` {index, kind, text} · `remove_paragraph` {index} · `replace_paragraphs` {values[] ≤ 6} · `move_paragraph` {from, to} · and the existing `set_field` for the shared header fields (`fullName|headline|email|phone|location`) since they are visible on the page. Inline marks `[b][i][u][s]` are kept as on the resume.
- What it can do, equal to the resume: **write** the whole letter from the resume and the job, **deepen / shorten / strengthen / re-tone** a paragraph or the letter, **add** a paragraph (e.g. about leadership), **correct** recipient/date/salutation, **answer by question** when a fact is missing ("What drew you to {company}?"), refuse invention.
- Rules in `LETTER_SYSTEM_PROMPT` (from the article): structure Opening/Proof/Fit/Close; 250–400 words; opener must name the role and one qualification; **no sentence copied from a resume bullet** (reword and connect to the job); numbers only from the resume or the user; **company facts only from the job post or the user's reply, otherwise ask**; salutation uses the named person or "Dear Hiring Manager,"; sign-off matches ("Sincerely," named, "Yours faithfully," generic when asked for British style); never "I am writing to apply for…" style openers; no "I really need this job".
- Fact guard: `sourceTextOf(resume, job text, user messages, recipient fields)`; the existing `findInventedFacts` runs on every paragraph. New letter lints (`letterLint`) reject a draft that repeats a resume bullet (≥ 60% word overlap), exceeds 450 words, or has a generic opener, and ask the model to repair once (same repair path as `runStructuredTask`).
- Job context: the Details tab has an optional **Job post** box bound to the same `description`/`analysis` state as Job tailoring; if the user already tailored, company/title/keywords are prefilled. NIMBUS receives title, company, must-have keywords and the raw post (≤ 2,500 characters).

### Add to resume (ADD)
- **Add to resume** (primary, topbar): sets `coverLetterIncluded`, returns to `/workspace/editor`, scrolls to and highlights the new first page. The page has a slim bar: "Cover letter · Edit letter · Remove". Removing keeps the letter data (it can be re-added); *Delete letter* is inside the studio.
- Canvas order: letter page, then the resume pages. The letter uses its own class names (`letter-page-document`, `letter-page-frame`), **never** `resume-page-*`, so NIMBUS element lists, page counts and fit-to-page logic are untouched.
- PDF: print root renders letter first, then resume, with a page break; the letter-only export prints just the letter. DOCX/TXT: the letter text first (name block, date, recipient, salutation, paragraphs, sign-off, name) then the resume; DOCX adds a page break.
- The editor's NIMBUS never edits the letter (it is not in its element list); the AiRail gets a third dock **Cover letter** (Write / Edit) beside Tailor and Evidence. After a tailoring report, a secondary action "Write a cover letter for this job" opens the studio with the job prefilled.

### Sidebar gate (GATE)
- `src/pages/ResumeGate.jsx`, route `/workspace/select/:tool` (`tailor | letter | evidence`), inside the normal `Shell` (sidebar visible). Copy: heading **"Select a resume first"**, one line stating what the tool does and that resume storage is coming, then the resume list:
  - session resume present → one row (name, template, "Edited …", button **Open {tool}**);
  - none → empty state with **Start a resume** and **Import a resume** (links to `/workspace/templates` and `/workspace`).
- The list is rendered by `<ResumePicker resumes onPick />` taking an array, so the storage milestone only changes where the array comes from.
- `navSections`: Job tailoring → `/workspace/select/tailor`, Cover letters → `/workspace/select/letter` (no longer "Soon"), Evidence check → `/workspace/select/evidence`. `/evaluation` keeps redirecting, now to the gate. Direct visits to `/workspace/tailor|letter|evidence` with no draft go to the gate for that tool instead of silently to `/workspace`.

## Data model (`src/coverLetter/letterData.js`)
```
coverLetter = {
  version: 1,
  role: '',                      // '' → resume headline
  date: '', dateAuto: true,      // dateAuto → today, formatted by locale
  recipient: { name, title, company, address: [] },
  subject: '', showSubject: false,
  salutation: '',                // '' → derived from recipient.name
  paragraphs: [{ id, kind: 'opening'|'proof'|'fit'|'closing'|'body', text }],
  signoff: 'Sincerely,',
  signature: { image, source, ink, cleanup, width, align } | null,
  showPhoto: true,
  presentation: { fontFamily, baseSize, textColor, accentColor, paper, elementOverrides }
}
```
Workspace additions (persisted by `workspacePersistence`): `coverLetter`, `coverLetterIncluded`, `letterMessages`, `letterPanelTab`. The signature source is dropped first when storage is tight (same rule as the photo). `resetWorkspace` clears them. Undo/redo: `useEditorHistory` over `{coverLetter, resumeHeader}` where `resumeHeader` is the shared header fields so name/contact edits undo too.
Element ids: `letter.role`, `letter.date`, `letter.recipient.name|title|company|address.N`, `letter.subject`, `letter.salutation`, `letter.paragraph.<id>`, `letter.signoff`, `letter.signature`, plus the shared `resume.header.*`. `describeResumeElement` learns the `letter.*` labels.

## Tasks

### Wave 0 — spike and design check (no product changes except a fixture)
- **T0.1** Export `ResumeHeader` and `ContactList` from `ResumeTemplateLayout.jsx` (no behaviour change). Fixture `tests/cover-letter-templates.html/.jsx` renders a draft letter for **all 24 templates** in a wrapper `article.generated-resume.template-<collection> template-<id>` with the real header.
- **T0.2** Screenshot all 24 at 1440; correct the family table; list the templates whose header grid areas need letter overrides (two-column templates define `grid-area: header` on the resume grid, so the wrapper needs a matching grid). Record under *Execution log* below. Gate: every header looks identical to its resume's.

### Wave 1 — foundation
- **T1** Gate: `ResumeGate.jsx`, `ResumePicker.jsx`, route in `main.jsx`, `navSections` updated, redirects changed, unit-free (fixture `tests/resume-gate.html?state=none|draft`). *GATE-01…05*
- **T2** `src/coverLetter/letterData.js` (defaults, derive salutation/date/recipient from job, helpers), `letterElements.js` (ids, registry, labels), `workspacePersistence.js` additions, `resetWorkspace`. Tests: `tests/letterData.test.js`.
- **T3** `CoverLetterPage.jsx` + `cover-letter.css` (five families, paper colour, ghost hints, page-over warning, print rules in `print.css`), `coverLetterDesigns` in `resumeTemplates.js` (family + overrides per template). *CL-01…06*

### Wave 2 — the studio
- **T4** `src/coverLetter/LetterStudio.jsx` + `useCoverLetter.js` (state, edit handlers, history, export), route `/workspace/letter` in `main.jsx` as a thin wrapper (≤ 80 lines added to main.jsx). Topbar, `EditorShell`, Details panel, Format panel (reusing `FormatPanel`; hides sections that don't apply, adds Paper colour and Signature). Inline editing through the same `EditableText` pipeline (paths prefixed `coverLetter.` routed to the letter reducer; shared header paths routed to `handleManualResumeEdit`). *CL-07…12*
- **T5** Signature: `signature.js` (pure maths + canvas wrapper), `SignatureControls.jsx`, errors for unreadable/oversize files, tests `tests/signature.test.js` (paper estimate, alpha curve, bounds on synthetic arrays; a white-paper, cream-paper and grey-paper case). *SIG-01…07*
- **T6** `shared/letterLint.js` (word count, generic opener, resume-overlap, numbers, call to action, company/role presence), the Letter guide component, ghost hints. Tests `tests/letterLint.test.js`. *CL-13, CL-14*

### Wave 3 — NIMBUS
- **T7** `shared/letterPlan.js` (operations + validation + limits), `src/coverLetter/applyLetterOperations.js` (pure), describe-ops text, tests `tests/letterPlan.test.js`, `tests/applyLetterOperations.test.js`. *LNM-01…03*
- **T8** Server: `LETTER_SYSTEM_PROMPT`, `buildLetterPrompt`, `planNimbusTurn` branches on `document`, route validation (`document: 'resume'|'letter'`, `context.letter`), fact guard sources, lint-and-repair. Golden set added to `server/ai/evals` (draft from resume + job, shorten, re-tone, add paragraph, ask-for-company-reason, refuse invented number, style request → points to Format panel). The user runs the eval (Groq rate limits, as before). *LNM-04…07*
- **T9** Client letter adapter, chat thread, chips and placeholder lines, task-line copy. *LNM-08*

### Wave 4 — integration
- **T10** Add to resume: `coverLetterIncluded`, letter page in the editor canvas with the slim bar, Remove / Edit, `CoverLetterDock` in `AiRail`, "Write a cover letter for this job" on the tailoring report. *ADD-01…03, ADD-06*
- **T11** Export: print root letter-then-resume (`printing` becomes `null|'resume'|'letter'|'both'`), letter-only export from the studio, DOCX/TXT with letter, filenames. *ADD-04, ADD-05*
- **T12** Help topics ("How do I add a cover letter?", "Why can't I open Job tailoring?"), docs, `npm test` script gets the new tests. *ADD-07*

### Wave 5 — verify and close
- **T13** `npm test`, `npm run build`. Fixtures for studio (`tests/cover-letter-studio.html`) and gate. Screenshots (1440, 820, 390) of: all 24 letters (contact sheet), signature before/after on white, cream and grey paper, the Letter guide, NIMBUS turn replay (stubbed endpoint), editor with the letter as page 1. Keyboard-only pass. Critique against the review above; fix.
- **T14** Write `SUMMARY.md`, update `STATE.md`, `ROADMAP.md`, `CURRENT.md`; note that `graft build` is not run (CLI fails here).

## Files
New: `src/coverLetter/{letterData,letterElements,signature,applyLetterOperations,useCoverLetter}.js`, `src/coverLetter/{CoverLetterPage,LetterStudio,LetterDetails,SignatureControls,LetterGuide}.jsx`, `src/cover-letter.css`, `src/pages/{ResumeGate,ResumePicker}.jsx`, `shared/{letterPlan,letterLint}.js`, tests listed above and fixtures.
Changed: `src/main.jsx` (nav, routes, redirects, state wiring, export, canvas order; keep additions thin), `src/components/templates/ResumeTemplateLayout.jsx` (exports only), `src/config/resumeTemplates.js` (`coverLetterDesigns`), `src/workspace/workspacePersistence.js`, `src/editor/describeResumeElement.js`, `src/print.css`, `src/components/editor/AiRail.jsx`, `src/components/jd/TailorWorkspace.jsx` (one action), `server/nimbus/nimbusEngine.js`, `server/routes/nimbus.routes.js`, `server/ai/evals/*`, `package.json` (test script), `.planning/*`.

## Requirements
**GATE** — 01 The three sidebar tools open "Select a resume first". 02 The session resume appears as a selectable row; none → Start/Import. 03 The picker takes an array (storage-ready). 04 Direct visits without a draft go to the gate for that tool. 05 In-editor entry points skip the gate.
**CL** — 01 A letter exists for each of the 24 templates and uses that template's real masthead. 02 Five families built from the four references plus the centred derivation. 03 Paper colour, font, accent follow the template and are changeable. 04 Anatomy complete: masthead, contact, date, recipient, subject, salutation, paragraphs, sign-off, signature, typed name. 05 One-page guidance, "page 2" warning, nothing auto-shrunk. 06 Prints as designed (A4). 07 `/workspace/letter` is an editor with the resume editor's shell, undo/redo, zoom, resize, export. 08 Inline editing of every part. 09 Details form for recipient/date/subject/salutation/sign-off and optional job post. 10 Format panel with element styling, fonts, size, colour, paper. 11 Name/contact edits write to the resume. 12 State persists across refresh; reset clears it. 13 Letter guide from the article's checklist. 14 Ghost hints for each block, never printed.
**SIG** — 01 Import PNG/JPG/WebP. 02 Background becomes transparent and matches any paper. 03 Ink recolour (default = text colour). 04 Clean-up and Size sliders; re-process without re-upload. 05 Trim, size, align, remove. 06 Clear errors for unreadable/oversize files. 07 Fits storage budget; dropped gracefully.
**LNM** — 01 Letter operation set, validated server and client. 02 Content only. 03 Marks preserved. 04 Writes a whole letter from resume + job. 05 Asks instead of inventing company facts. 06 Fact guard + lint-and-repair. 07 Golden eval set. 08 Own thread, chips, same UI/animation, undo per turn.
**ADD** — 01 Add to resume returns to the editor with the letter as page 1. 02 Slim bar: Edit letter / Remove. 03 Letter classes isolated from `resume-page-*`. 04 PDF and letter-only PDF. 05 DOCX/TXT include the letter. 06 Dock and tailoring-report entry points. 07 Help copy.

## Out of scope
Several letters per resume and the real resume picker (storage milestone) · draw/type signature · a letter layout different from the resume's template · letter in the Job tracker · ATS scoring of the letter (M3) · translating letters · inline editing of the letter inside the resume editor.

## Risks and answers
- **Two-column templates place the header with `grid-area` rules.** Wave 0 finds each; wrapper gets matching areas. If a template cannot reuse its header, it gets a letter-only override, not a new family.
- **`main.jsx` is already 1,992 lines.** All letter logic lives in `src/coverLetter/`; `main.jsx` gets wiring only. Do not add more inline helpers there.
- **NIMBUS counts elements with `.studio-canvas .resume-page-document …`.** Letter classes are different; the letter studio uses its own selector in its adapter.
- **Groq rate limits (429).** Evals are user-run; the letter has non-AI scaffolding (ghost hints, guide) so it is usable without the model.
- **Signature photo quality** (shadows, lined paper). Clean-up slider + trim; honest message "Try a photo on plain white paper in daylight" when the ink share is under 0.2% or over 40%.
- **sessionStorage cap (4.5 MB).** Letter text is tiny; signature budget 120 KB processed + original dropped first.

## Verification
`npm test` (adds letterData, letterLint, letterPlan, applyLetterOperations, signature), `npm run build`, fixture captures listed in T13, gate fixture, stubbed NIMBUS replay, keyboard-only pass, and a user-run `npm run ai:eval` for the letter set. Signed-in walkthrough (gate with a real session, add to resume, export PDF) is left for the user, as in earlier plans.

## Definition of done
All requirements above pass their checks; the contact sheet shows 24 letters whose mastheads equal their resumes'; a signature photo on white becomes ink on any paper; NIMBUS writes and edits a letter and refuses to invent; the letter appears as page 1 in the editor and in the PDF; the three sidebar tools say "Select a resume first"; `SUMMARY.md`, `STATE.md`, `ROADMAP.md`, `CURRENT.md` updated.

## Execution log
Executed 2026-10-06 (see `SUMMARY.md`).
- **Wave 0:** exporting `ResumeHeader`, `ContactList` and the layout helpers was enough: rendering the template's own markup (header, then `.resume-columns-flow` with sidebar and main columns when the template has columns) reproduced all 24 mastheads and column grids. The family table was kept as planned; it now lives in `src/coverLetter/letterDesigns.js` and drives only a small device per family. DOM audit: all 24 fit one page with no horizontal overflow.
- **Changes:** pure model in `shared/letterModel.js` (shared with the server) instead of `src/coverLetter/letterData.js`; no `useCoverLetter.js`; flat `{title, operations}` edit form accepted; letter guard allows soft-skill and everyday-English skill words and only flags near-verbatim resume sentences; nine Letter guide checks.
- **Not done here:** signed-in walkthrough, print dialog capture, user-run `ai:eval --task letter`.
<!-- PLAN-033 END -->
