<!-- PLAN-028 START -->
# PLAN-028: Skills and form for every profession, accessible to all

**Milestone:** M2.3 · **Phase:** 28 · **Requirements:** INC-01…INC-06, A11Y-01…A11Y-07

## Context
- User request (2026-10-05): Resumetrics is for everyone, not just engineers. The skills section must let people **add and name their own skill groups**, and the whole form must be **accessible to all**.
- Today `SectionForm` hard-codes six engineering groups (`skillLabels`: programming languages, frameworks, tools, databases, soft skills, other). The data model is already an object of group → list (`resumeData.skills`). Templates print groups by camel-case splitting the key (`ResumeTemplateLayout` `RenderBlock`), and the server normalisers (`server/services/resumeData.js`, `shared/resumeEditPlan.js`) only keep the six fixed keys.

## Design
### Skill groups
- **Data:** unchanged shape. A custom group's key is the name the person typed (trimmed, max 40 characters, no `.`), so `skills["Patient care"] = [...]`. The six existing keys stay valid, so old drafts and AI extraction keep working.
- **One label helper** (`shared/skillGroups.js`): `skillGroupLabel(key)` gives the printed name. Known keys keep their current print names (Languages, Frameworks, Tools, Databases, Soft Skills, Other); any other key prints as typed. `formGroupLabel(key)` gives clearer form wording for the known keys. `sanitizeGroupName(name)` trims and validates.
- **Form (skills section):**
  - Shows every group that has skills, plus three neutral starter groups when they are empty: **Key skills** (`other`), **Tools & software** (`tools`), **Soft skills** (`softSkills`). Technical groups appear only if they already hold skills or the person adds them.
  - **Add a skill group:** a name input with a button, plus suggestion chips covering many professions (Clinical skills, Teaching, Sales & negotiation, Design tools, Trades & equipment, Programming languages, Frameworks, Databases, Research methods). Duplicate and empty names are rejected with a message.
  - Each group can be **renamed** (inline; Enter or blur saves) and **removed** (with its skills).
  - The rule is unchanged: at least 3 skills in total.
- **Everywhere else:** templates and the format-panel label use the helper; the server normaliser keeps extra groups (string lists, sanitised names, max 12 groups); the NIMBUS/JD edit plan accepts any existing group name for `append_skills`/`replace_skills`.

### Profession-neutral wording
- Headline placeholder "e.g. Registered Nurse, Sales Manager, Teacher".
- "Job title" → "Job title or role"; "Company" → "Company or organisation".
- Achievement placeholder "Start with a verb: Led, Cared for, Taught, Sold, Built…".
- Degree placeholder "e.g. B.Sc Nursing, Diploma in Hospitality".
- Projects: hint "Work you are proud of: campaigns, research, events, designs, builds"; "Technologies" → "Tools, skills or methods used".
- Certifications placeholder "e.g. CPR and First Aid (2025)"; achievements placeholder "e.g. Employee of the Month, March 2025".
- New optional section **Additional sections**: titled free-text sections (Volunteering, Licences, Publications, Interests, Portfolio…) stored as `customSections: [{ title, content }]`, which every template already prints.

### Accessibility (WCAG 2.2 AA)
- **A11Y-01** Every input, select and chip input has a programmatic label. Groups use `fieldset`/`legend`. Hints and errors are linked through `aria-describedby` (the chip input's hint "Press Enter or comma to add" is always linked).
- **A11Y-02** A polite live region announces "Added X" / "Removed X" for chips and skill groups.
- **A11Y-03** "Show me" moves focus to the first missing field, not only scrolling to it.
- **A11Y-04** Visible focus rings (`:focus-visible`, 2px, ≥3:1) on all form controls and buttons.
- **A11Y-05** Targets are at least 24×24px (chip remove, row move/remove buttons).
- **A11Y-06** Hint, optional and status text contrast is at least 4.5:1. Status badges have screen-reader text ("40% complete", "Optional").
- **A11Y-07** Everything works by keyboard alone (add, rename and remove groups; chips; entries), and motion respects `prefers-reduced-motion`.

## Tasks
1. Add `shared/skillGroups.js` and a node test, `tests/skillGroups.test.js`, wired into `npm test`.
2. `FormFields.jsx`: `SkillGroupsEditor`, `CustomSectionsEditor`, and a shared live-region announcer. `SectionForm.jsx`: neutral copy and the new section.
3. `sectionProgress.js`: `customSections` in `sectionInfo` (optional); a title is required once one is added.
4. Templates and editor labels use `skillGroupLabel`.
5. Server: `server/services/resumeData.js` keeps custom groups; `shared/resumeEditPlan.js` accepts existing custom groups.
6. Form CSS (`section-form.css`): focus rings, target sizes, contrast.

## Verification
- `npm test` (the new skill-group test plus the existing ones) and `npm run build`.
- `tests/scratch-builder.html`: add a "Patient care" group, rename it, remove it; check the preview prints the custom label; tab through the skills section by keyboard only.

## Definition of done
A nurse, teacher or chef can name their own skill groups and see them on the resume, and the form works with keyboard and screen reader.
<!-- PLAN-028 END -->
