<!-- PLAN-027 START -->
# PLAN-027: Six LaTeX template clones

**Milestone:** M2.3 Templates, inclusive form, job tailoring · **Phase:** 27 · **Requirements:** TPL-01…TPL-08

## Context
- User request (2026-10-05): the gallery needs more templates. Clone six supplied LaTeX résumés as closely as possible (font, structure, visuals) and add them to the app. Reference renders are in `reference/`, and the user pasted the `.tex` sources (the class files `.cls`/`setup.tex` were not supplied, so their measurements come from the renders).
- Architecture (read before planning): every template is `ResumeTemplateLayout` with a `variant` id plus scoped CSS (`overleaf-templates.css`, `reactive-templates.css`), registered in `src/config/resumeTemplates.js`. The layout already gives editable text (`data-resume-path`), per-element formatting, pagination by measured block rects (`paginateMeasurement`), sidebar column flows (`ResumeSectionFlow`), and the form's section plan (`getTemplateSectionPlan`).
- Data has no skill levels, project logos, publications/talks fields or per-job tech chips. As in OVERLEAF.md, **nothing is invented**: skill bars become plain labels, and publications/talks/interests come from custom sections.

## Approach
Keep the one shared renderer and add a small **per-variant feature table** (`cloneFeatures`) that changes only markup the CSS cannot reach:

| Feature | Effect | Used by |
|---|---|---|
| `nameSplit` | Name rendered as `<span.name-first>` + space + `<span.name-rest>` inside the same editable `fullName` element | Minimal Academic, Simple Hipster, Keywords |
| `contactSection: { title, column }` | Contact moves out of the header into a real section `contact` (so pagination measures it) | Minimal Academic ("Contact info", first), Simple Hipster (sidebar, last) |
| `contactLabels` | Each contact line gets a visible label (`E-mail`, `Phone`, `Address`, link site name), and links show their address | Minimal Academic, Keywords |
| `entryLayout` | Alternative markup for experience, education and project entries (same editable paths) | all six |
| `skillChips` | Each skill is its own span, with hidden ", " separators so editing still parses | Simple Hipster |

Icons (contact, pin and calendar, section-circle icons) are **CSS only**, using `mask-image` SVG data URIs keyed on `data-resume-path` / `href` / `.resume-section-<id>`, so they follow the accent colour and stay out of the editable text.

The new variants join a `cloneVariants` set: the page font-size scales with page width (`base × pageWidth / 794`) and all spacing is in `em`, so the editor, gallery thumbnail and print stay proportional. Each variant has a fixed base size (`cloneBaseSize`) taken from its LaTeX class.

Pagination changes: `paginateMeasurement` also handles **lead sections** that sit outside the column flow (Keywords' full-width summary) by flowing them with the first column. Developer CV's side-by-side summary/skills uses a CSS grid inside the single-column flow, so no extra case is needed.

The skill group label moves to one shared helper, `skillGroupLabel` (known keys keep their old printed names; custom groups print as typed). Its markup becomes `<strong>Label</strong><span class="skill-sep">: </span>values` so templates can drop the colon.

## The six templates (target = reference render)

### 1. Minimal Academic: `minimal-academic` (reference/minimal-academic.png)
- Font **Nunito Sans** (closest open match to the render's Avenir-style face). Base 13.3px. Accent slate `#6b7d8f`, rules `#2b2b2b`, body grey `#7b8594`.
- Header: first name in large, light, widely letter-spaced uppercase slate (`L E W I S`, ~2.5em, tracking .35em), the rest in uppercase regular ink below (~1.35em, tracking .08em), all starting at the content column (24% in). Short 2px vertical bars above and below the name block.
- Body grid: a **label column (24%)** with uppercase bold dark headings, tracked .06em and right-aligned; a **content column** with a 2px dark rule on the heading's line, content below it.
- Contact info is the first section, with rows of a bold dark label (E-mail, Phone, Address, LinkedIn/site) in an 8em column and a grey value.
- Entries: title uppercase bold dark, date right in bold slate; second line company in italic bold slate, then ` | location` in italic grey; bullets have small grey dots; details grey.
- Order: contact, summary (About me), experience, education, projects, skills, languages, certifications, achievements.

### 2. Libre CV: `libre-cv` (reference/libre-cv.png)
- Font **Libertinus Sans** (the maintained fork of Linux Biolinum, which `[sf]libertine` selects). Added to the font catalogue and fetched by the existing script. Base 16px (12pt), ink black.
- Margins: 1.75cm sides (66px), 2.5cm top/bottom (94px). Columns 65% / 35% with a 5% gap (`paracol` 0.65/0.35, columnsep 0.05).
- Header is in the same 65/35 grid: name centred in the left column (Huge ≈ 2.07em, regular), headline centred below (large ≈ 1.2em); contact on the right as a two-column table of a small icon (phone, envelope, LinkedIn, pin, link) and its text.
- Section heading: small caps, LARGE (≈1.44em), left, regular weight, then a thin full-width black rule (`\titlerule`); 24pt space before, 8pt after.
- Entry (`\entry`): row 1 has the bold organisation on the left and the location on the right; row 2 has the role/degree on the left and the dates on the right. Bullets are tight with a 3.5mm indent.
- Left column: summary, experience, education, projects. Right column: skills, languages, certifications, achievements, custom. Skills are rows with the category in **small caps right-aligned** in a narrow column, then the values joined by ` · `.

### 3. Simple Hipster: `simple-hipster` (rebuilt; reference/simple-hipster.png)
- Same id, so saved drafts keep working; the old loose adaptation is replaced. Font **Raleway**. Base 12px (`\small` on 10pt with 1cm margins). Header colour `#3d3d3d`; label colour cyan `#30a8d8` (accent, editable); sidebar `#e5e5e5`.
- Header: a full-bleed dark band (~12% of the page height) with the name centred, first name light (300) and the rest bold, white ≈2.6em; headline small white below.
- Sidebar (left, 26%): grey and full height under the band, text right-aligned at ~.9em. The round photo is centred at the top (~11em). Each sidebar heading is a **cyan tag** (white text on cyan, right-aligned). The contact section sits at the bottom as rows of cyan circle icons with monospace text.
- Main column: headings large in Raleway regular, no caps transform, and a 1px black rule. Experience and education use a **timeline table**: dates right-aligned in a 16% column, then a 1px vertical bar, then the bold title, a small-caps `COMPANY · location` line with a pin icon, and the description in grey `.9em`.
- Skills render as **grey label boxes** (`\bg{skilllabelcolour}`) in a flowing row; the proficiency bars are left out (no data).
- Order: sidebar = summary (About me), skills, languages, custom, contact; main = experience, education, projects, certifications, achievements.

### 4. Single-page Keywords: `keywords-cv` (reference/keywords-cv.webp)
- Font **Raleway**. Base 13.3px. Accent sky blue `#4b9fd5` (headings), ink `#1b1b1b`.
- Header: "John" bold black ~3.4em; the rest at the same size as an **outline** (transparent fill, 1px stroke) set below-left and overlapping; headline small to the right under it. Contact on the right, right-aligned rows of a light label (Email, Phone, GitHub, Website) and a **bold value**.
- Section heading: a black **circle icon** (2.2em, white glyph by section: summary file, experience pencil, projects brush, education cap, skills list, achievements star, languages globe, custom ball) followed by the title in bold uppercase accent ≈1.45em.
- Summary is full width; the rest is in **two equal columns** (left: experience, skills, languages; right: projects, education, certifications, achievements, custom).
- Entries: bold heading `Role / Start - End` (≈1.15em); a bold small sub-line `Company - Location`; description; bullets. Education: `Degree - End` bold, `Institution - Location`, details as a `Thesis`-style line. Skills: `**Group:** values` paragraphs.

### 5. Elegant Resume: `elegant-resume` (reference/elegant-resume.png)
- Font **Lato**. Base 13.3px (10pt), margins 1.2cm (45px). Accent `#4a7bd6`.
- Header centred: name in bold uppercase, tracking .2em, ≈1.9em; tagline in accent uppercase, tracking .2em, ≈1.05em; contact on one centred line with accent icons (envelope, phone, pin, LinkedIn).
- Section heading: accent bold uppercase, tracking .25em, ≈.95em, then a 1.5px accent rule under it with spacing.
- Bullets are accent dots. Experience entry: row 1 has the **company** in bold uppercase (tracking .12em) on the left and the **role** in bold uppercase on the right; row 2 has the pin icon and location on the left, and the calendar icon and dates on the right; then the bullets. A **dashed accent divider** separates entries in the same section.
- Order: summary (Profile), experience, projects, education, skills, certifications, achievements, languages.

### 6. Developer CV: `developer-cv` (reference/developer-cv.png)
- Font **Raleway**. Base 12px (9pt class). Ink black; accent `#111` (editable).
- Header: name in bold uppercase ≈1.5em (16pt), headline Large below on the left; contact on the right in a **2×3 grid** of icon and text (globe, envelope, phone, GitHub, pin, LinkedIn).
- Section heading: bold uppercase ≈.95em, then a 1px line filling the rest of the row (`cvsect`).
- The summary and skills sections sit **side by side** (46% / 46.5%); everything else is full width. Skills rows have a bold label in a ~20% column, then the values.
- Entry list (`entrylist`): three columns, with the date in a small 17% column, then the bold title with bullets/description, then the organisation in small bold, right-aligned. Bullets use `•` with no indent.
- Order: summary, skills, projects, education, experience, languages, certifications, achievements.

## Tasks
1. `ResumeTemplateLayout.jsx`: add `cloneFeatures`, `cloneVariants`, `cloneBaseSize`; split name; contact section + `contact` block; contact labels; entry layouts (`academic`, `libre`, `hipster`, `keywords`, `elegant`, `developer`); skill chips; `skillGroupLabel`; section orders and sidebar sets for the six; lead-section pagination.
2. New `src/components/templates/latex-templates.css`, scoped under `.template-<id>` (no rule leaks into existing templates).
3. `LatexTemplates.jsx` exports the five new components (`createLatexTemplate(variant)`); Simple Hipster is restyled in place (its old rules in `overleaf-templates.css` are removed).
4. `resumeTemplates.js`: register the six with names, one-line summaries, tags and the default font and accent. Only Simple Hipster shows a photo (its reference has one); the other five have no photo slot, matching their references.
5. Fonts: add Libertinus Sans to `catalogue.source.js` and run `npm run fonts:fetch`.
6. `tests/latex-templates.html`: a fixture that renders each new template at A4 next to its reference image, plus a long-content run, with a check for content outside the page and lost entries.
7. Update `OVERLEAF.md` with the six sources and their deviations.

## Requirements
- **TPL-01** Six new or rebuilt templates in the gallery: Minimal Academic, Libre CV, Simple Hipster (rebuilt), Single-page Keywords, Elegant Resume, Developer CV.
- **TPL-02** Each matches its reference in font family, column structure, header layout, heading style, entry layout and colours.
- **TPL-03** Everything stays editable in the editor (same `data-resume-path` paths), formatting overrides work, and accent and font remain changeable.
- **TPL-04** Multi-page content paginates without clipping in every new template, including column and lead-section layouts.
- **TPL-05** Icons are decorative CSS, never part of the editable or exported text.
- **TPL-06** No invented data: no skill levels, logos or fake sections.
- **TPL-07** Existing templates render exactly as before.
- **TPL-08** The scratch form's section order follows each new template (via `getTemplateSectionPlan`).

## Known deviations (to state in OVERLEAF.md)
- Nunito Sans stands in for the Minimal Academic render's Avenir-style face (Avenir is not open-licensed).
- Hipster skill bars, project logos and language dots, and the Keywords per-job tech chips, need data the app does not collect, so they are left out.

## Verification
- `npm run build`, `npm test`.
- Fixture `tests/latex-templates.html` in the browser pane: a side-by-side screenshot against each reference, the long-content check passing, and no console errors.

## Definition of done
All six appear in the gallery, open in the editor, look like their references, paginate long content and stay editable.
<!-- PLAN-027 END -->
