<!-- PLAN-005 SUMMARY START -->
# PLAN-005 summary — Section-based form

**Status:** Done · 2026-10-04

## Built
- `src/form/sectionProgress.js` (pure): sections in template order with Personal information first; mandatory fields per section; percentage; validity; `blockingSections`; `hasStartedForm`; red→green `percentColour`; blank entries ignored.
- `src/components/form/SectionForm.jsx`: section cards (icon, title, hint, status, "+" → "Edit section" when complete); section detail with sticky **Complete section** (disabled until valid; "Skip section" for untouched optional sections, which also drops blank entries); "N mandatory fields left · Show me".
- `src/components/form/FormFields.jsx`: text fields, month/year pickers with "I currently work/study here" (stored as `Present`), bullet rows (Enter adds, Backspace on empty removes, reorder, remove), chip input for skills/technologies, collapsible entry cards.
- Language picker and template notes moved to `src/components/form/`; old `ResumeBuilderForm.jsx` deleted.
- Build page = top bar + form (left) + live read-only resume (centre); the section being filled is outlined in the preview.

## User decisions applied (2026-10-04)
- **Continue is blocked** until every mandatory field is filled (optional fields can stay empty). A warning lists the sections; clicking one opens it with the missing fields highlighted red.
- **Back arrow:** form untouched → straight to templates; anything typed → "Discard this form and start fresh?" confirm.
- No settings panel on the form page; template look is fixed once chosen.

## Field rules as built
Required sections: Personal information (name, valid email, phone), Summary (≥ 40 characters), Education (≥ 1 entry: degree, institution, end/expected), Skills (≥ 3). Optional sections: Work experience, Projects, Languages, Certifications, Achievements — but any entry that is started must have its mandatory fields (experience: title, company, start, end or current, ≥ 1 achievement; project: name, description).

## Verified (fixture `tests/scratch-builder.html`)
Continue with an empty form → warning listing Personal, Summary, Education, Skills; clicking Personal opened it with name/email/phone red; filling them enabled Complete; tick + "Edit section" appeared; breaking the email turned the tick back into 43% (amber); a half-filled optional experience entry blocked Continue; after removing it Continue went through with overall 100%. `tests/sectionProgress.test.js` passes.

## Deviations from PLAN-005 text
- FORM-10 changed from warn-but-allow to block (user decision).
- Experience is optional (fresher-friendly); Education is required instead of "Experience or Education".
- Phone required, location optional (plan said phone or location).
<!-- PLAN-005 SUMMARY END -->
