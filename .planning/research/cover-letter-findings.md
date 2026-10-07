# Cover letter findings (2026-10-06)

Inputs for PLAN-033: the ResumeWay guide, the four reference letters the user attached, and how the codebase would carry a second document type.

## 1. ResumeWay: "How to write a great cover letter"
Source: https://www.resumeway.com/blog/how-to-write-great-cover-letter/ (fetched 2026-10-06).
**Assets:** the page has no downloadable template or example images, only lazy-load placeholders and links to its own template pages. The four references the user attached are the visual source.

### The six steps
1. **Contact information.** Full name, phone, professional email, city/state, date at the top. Use a firstname.lastname style address.
2. **Salutation.** Formal and personal: "Dear [Hiring Manager's name]". Research the company to find a named person.
3. **Opening paragraph.** Name the position, say how you found it, state one key qualification, show genuine enthusiasm. First paragraph must grab attention and stay short.
4. **Middle paragraph(s).** Match your strongest skills and *measurable* achievements to the job's requirements. Concrete examples of how your background solves the company's problem.
5. **Closing paragraph.** Brief summary of interest and qualifications, restate enthusiasm, thank the reader, ask to discuss further (clear call to action).
6. **Complimentary close and signature.** "Yours sincerely" for a named person, "Yours faithfully" for a generic greeting. Digital signature above the typed full name.

### Tone and form
Professional, enthusiastic, personalised. Under one page. Clean, visually organised, error-free.

### Dos
Tailor to each position. Highlight transferable skills. Include accomplishments with numbers. Show knowledge of the company and its mission. Show genuine interest.

### Don'ts
Don't repeat the resume (add context instead). No hyperbole or vague claims. No irrelevant personal details or life story. No "I really need this job". No generic openings.

### Situations
| Writer | Emphasis |
|---|---|
| No experience | Internships, volunteering, academics, extracurriculars; eagerness to learn |
| Career changer | Transferable skills; how earlier roles prepared you; fresh perspective |
| Underqualified | Be upfront about the gap, lead with strongest skills, show active growth |
| Recent graduate | No mass applications; soft skills, education, internships; personalised |

### Example openings/closings (patterns, not to copy)
- Opening names the role and ties it to something concrete about the company ("excited to see [Company] is hiring a … focused on …").
- Entry-level opening: caught my eye + why the company's values match mine.
- Closing: thank you, what I bring, "look forward to discussing how I can support your goals".

### Pre-submission checklist (becomes the in-app Letter guide)
Self-introduction clear in the first sentences · distinctive format · most relevant achievements highlighted · company knowledge shown · why *this* company · organised and clean · free of spelling/grammar errors · concise, under one page · clear call to action.

## 2. The four references
Common anatomy: **masthead** (name + role) · **contact block** · **date** · **recipient block** (name, title, company, address) · optional **subject / heading line** · **salutation** · **3–4 short paragraphs** · **sign-off** · **signature** · **typed name**.

| # | Reference | Page | Distinct structure | Becomes family |
|---|---|---|---|---|
| 1 | Claire Cooper | Warm cream paper | Full-height black vertical rule at the left; huge stacked display name with the role beneath; grey contact block top-right; date, "To:" recipient block with bold name / italic title / grey company; ragged paragraphs; bold-italic name as signature | `rule` |
| 2 | Emily Clark | White, soft beige band across the top | Wide-tracked serif name centred in the band with small tracked title; narrow left column for contact; right column for bold date, recipient, bold subject line, salutation, dense paragraphs, script signature image, typed name | `band` |
| 3 | Smith Matthew | Light grey | Tracked geometric name; short gold accent bars under the title, behind the contact column and as a corner tab; left "CONTACT" rail, thin vertical divider, right column opens with a tracked "TO WHOM IT MAY CONCERN" heading | `rail` |
| 4 | John Duisberg | Light grey, lots of air | Body pushed right (left third empty); stacked condensed name over a yellow highlight block; hairline ticks; T/P/E contact with yellow tabs; address right-aligned; tracked heading; justified small paragraphs | `offset` |

A fifth family, `centred`, covers resumes whose header is centred (no reference; derived from the resume headers).

What the references teach (applied in PLAN-033): the masthead carries the identity and is where the designs differ; the body is always quiet, short measure, generous paragraph gaps; accent appears in 1–2 small devices (bar, rule, tab), never in body text; contact is a labelled block, not a line; a visible signature above the typed name; the recipient block is as important as the masthead.

## 3. Codebase findings relevant to a second document type
(graft CLI fails on this machine, see STATE; read from source.)

- `src/main.jsx` (1992 lines) owns all workspace state in `MainPage`; routes switch on `workspaceRoute` (`start/templates/build/editor/tailor/evidence`). Adding another route must not grow this file by more than a thin wrapper: put the letter in `src/coverLetter/`.
- Sidebar: `navSections` (main.jsx:64). "Cover letters" is already listed with `path: null` ("Soon"). "Job tailoring" → `/workspace/tailor`, "Evidence check" → `/evaluation` → redirect `/workspace/evidence`. With no draft, `MainPage` silently redirects to `/workspace` (main.jsx:1032–1033); there is no "select a resume" message.
- Saved projects exist only as dashboard placeholders in localStorage (`readSavedProjects`); there is no real resume storage. The editor draft is persisted to sessionStorage by `workspacePersistence.js` (4.5 MB cap, photo dropped first).
- Templates: 24 in `src/config/resumeTemplates.js` (navy, curve, receive; 6 LaTeX; 15 Reactive). All render through `ResumeTemplateLayout`, whose `ResumeHeader` and `ContactList` are keyed by CSS classes `.generated-resume.template-<id> .generated-resume-header`. **Rendering the same header inside a letter wrapper reuses each template's masthead exactly**, which is how "same design as the resume" is guaranteed.
- Header archetypes from the CSS: centred (navy, elegant, azurill, bronzor, kakuna), identity-left + contact-right (keywords-cv, developer-cv, receive, meowth, rhyhorn, scizor, onyx, lapras), coloured/tinted band (simple-hipster, ditgar, ditto, gengar, glalie, leafish, pikachu), margin-label/rail (minimal-academic, libre-cv, curve-academic, chikorita).
- NIMBUS: `POST /api/nimbus/turn` (`server/routes/nimbus.routes.js`) → `planNimbusTurn` (`server/nimbus/nimbusEngine.js`) with one resume-specific system prompt, `validateNimbusTurn` (`shared/nimbusPlan.js`, content ops only per D24), fact guard (`shared/factGuard.js`: numbers, skills, links must exist in resume/request). Client: `useNimbusTurns` is generic over an `adapter` `{snapshot, restore, applyOperations, buildContext, fitToOnePage}` and `applyNimbusOperations` (pure). **So a letter is a second adapter + a second prompt/op set, not a second chat.**
- Element selection and counting use the selector `.studio-canvas .resume-page-document …` (NIMBUS context, page counts, fit-to-page). The letter page must **not** use `resume-page-document` / `resume-page-frame` classes, or it would pollute those counts.
- PDF export = browser print of a `.print-root` portal sized 794px (`src/print.css`, `printResume`). DOCX/TXT export is text from `editorRef.innerText`.
- Signature has no precedent; the profile photo path (`readProfilePhoto`, cropper dialog, data URL in presentation, dropped first when storage is full) is the pattern to copy.
- `useEditorHistory(snapshot, restore)` watches any JSON snapshot, so it can drive undo for the letter unchanged.
- `shared/jdExtract.js` already derives `{title, company}` from a pasted job post; `analysis.jd` holds the last tailoring job.
