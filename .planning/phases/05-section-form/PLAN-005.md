<!-- PLAN-005 START -->
# PLAN-005 — Section-based form page with completion status

**Milestone:** M1 · **Phase:** 5 · **Requirements:** FORM-01…FORM-10

## Context
- **PLAN-000:** `/workspace/build` renders `ResumeBuilderForm` (right rail) + read-only live preview (left/centre). This plan replaces that form and swaps the layout to form-left, resume-centre.
- **PLAN-001:** reuse `EditorShell`'s grid/scroll styles (left + centre only, no resizing needed here).
- Reference: second screenshot from the user (section cards with icons, structured fields, "Next section").
- Font and photo-style controls leave the form (they live in the editor's format panel, PLAN-003). Photo **upload** stays in Personal information.

## Goal
A visual, guided form: a list of section cards that each open into their questions, with completion ticks or colour-coded percentages, beside a live resume.

## Screens (left container)
**A. Section list**
- Card per section in the template's page order (`getTemplateSectionPlan`), with an icon, title, one-line hint.
- Left status: green tick if complete; else `NN%` badge, colour `hsl(pct × 1.2, 70%, 42%)` (0% red → 100% green), with the number shown so colour isn't the only signal.
- Right button: "+" (aria-label "Fill in <section>") until complete, then "Edit section".
- Footer: overall progress bar + "Continue to editor" (FORM-10: if required sections are incomplete, a confirm dialog lists them; user can still continue).

**B. Section detail**
- Back arrow to list, title, required-field legend.
- Fields (see matrix). Optional fields labelled "(optional)".
- Multi-entry sections: entry cards with collapse, add, remove, reorder (up/down buttons).
- Sticky bottom: "Complete section" — disabled until valid, with a hint listing what's missing (FORM-04). On click → back to list, card shows tick (FORM-05).

**Centre:** live read-only resume; opening a section scrolls the preview to it and highlights it (FORM-07).

## Field matrix (FORM-08)
| Section | Required | Optional |
|---|---|---|
| Personal information | Full name; email (valid format); phone **or** location | Headline, links (each needs a valid URL if present), photo (templates with photo) |
| Summary | Summary ≥ 40 characters | — |
| Experience | ≥ 1 entry; each: job title, company, start month/year, end month/year **or** "currently work here", ≥ 1 bullet | Location |
| Education | ≥ 1 entry; each: degree, institution, end year (or "currently studying") | Start year, location, GPA/coursework |
| Projects | Each entry: name, and description **or** ≥ 1 bullet | Technologies, link |
| Skills | ≥ 3 skills in total | Category split |
| Languages / Certifications / Achievements | ≥ 1 item | — |

Required **sections** for the Continue warning: Personal information, Experience **or** Education, Skills. Others are optional sections; an optional section with 0% shows "Optional" instead of 0% red.

**Percentage** = filled tracked fields ÷ tracked fields (required + optional) for that section, across all entries; entries with nothing filled are ignored.

## State
- Completion is derived, not trusted: `complete = confirmed[section] && isValid(section)`. `confirmed` is set by "Complete section" and kept in `MainPage` state (so it survives going to the editor and back). If data becomes invalid, the tick turns back into a percentage (FORM-06).
- Validation and percentages live in pure functions: `src/form/sectionSchema.js` (fields per section) and `src/form/sectionProgress.js` (`progressFor(section, resumeData)` → `{ percent, missing[], valid }`).

## Inputs (FORM-09)
- Month/year: two selects (month, year 1970–current+6) storing `"MMM YYYY"` to stay compatible with existing data; "Currently here" stores `endDate: "Present"`.
- Bullets: row list with add/remove/reorder; Enter in a row adds the next row.

## Tasks
1. `src/form/sectionSchema.js`, `src/form/sectionProgress.js` + node tests (`tests/sectionProgress.test.js`).
2. `src/components/form/SectionList.jsx`, `SectionCard.jsx`, `SectionDetail.jsx`, `MonthYearField.jsx`, `BulletListField.jsx`, `EntryList.jsx`; reuse `Field`, `LanguagePicker`, link editor from `ResumeBuilderForm.jsx` (move them into `src/components/form/`).
3. Replace `ResumeBuilderForm` usage on `/workspace/build`; layout = form left, resume centre. Delete the old component once unused.
4. Preview scroll-to-section + highlight.
5. `src/section-form.css` (cards, badges, sticky footer, responsive single column below 900px).
6. Update fixture `tests/scratch-builder.html` to the new form.

## Verification
- Unit tests: percentages and validity for empty / partial / complete / invalid-email / "Present" cases.
- Fixture: fill each section; button enables exactly when the matrix says; tick appears; clearing a required field turns tick back into %; colours go red → green.
- `npm run build` passes.

## Definition of done
FORM-01…10 tick; no plain long-scroll form remains on the build page.
<!-- PLAN-005 END -->
