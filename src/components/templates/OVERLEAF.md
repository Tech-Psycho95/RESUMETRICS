# Overleaf template adaptations

The active catalog is `src/config/resumeTemplates.js`. Each of its four components lives beside `ResumeTemplateLayout.jsx`, with scoped styles in `overleaf-templates.css`. The selector and editor reuse these components and the normalized resume adapter.

| App template | Supplied source | Adapted design |
| --- | --- | --- |
| Navy Professional | Christian Maria Giannetti, `resume.cls` example | Restrained navy rules, centered identity, Source Serif 4, education first |
| Simple Hipster | LaTeX Ninja, `simplehipstercv` | Dark header, muted green labels, single-column timeline |
| CurVe Academic | LianTze Lim, CurVe example, August 2024 | Academic section rules, Source Serif 4 headings, wrapped dates |
| ReCeiVe | Ged Lex, ReCeiVe 1.12.0, `rightPos` | Single-column engineering CV, clear dates, soft copper accents |

These are native React/CSS adaptations, not a TeX compilation pipeline or pixel-identical reproductions. The supplied main files omit their custom classes, `settings.sty`, included sections, bibliography and image assets. All four use a one-column text flow, standard section headings, wrapped dates and technology details, selectable text and a decorative sample photo with empty alternative text. The sample portrait is by [Danny Postma on Unsplash](https://unsplash.com/photos/a-man-in-a-blue-shirt-smiling-at-the-camera-zNxOw2JFNKs). The editor offers the 25 typefaces from Figma's resume-font guide plus Roboto Slab and Roboto Mono; the selected Google Font loads on demand. The four templates default to Roboto, Montserrat, Roboto Slab, and Roboto respectively, with Roboto Mono reserved for compact engineering metadata. Optional publications, interests and references can use custom sections; skill proficiency levels are not invented. Existing saved template identifiers fall back to Navy Professional without discarding resume content.

Run `npm run dev` and open `/tests/template-rendering.html` for the browser preview fixture. It shows every design with the John Doe profile and includes short/long editor data checks.

## LaTeX clones (PLAN-027)

Six supplied LaTeX résumés are recreated as close copies in `LatexTemplates.jsx` + `latex-templates.css` (icons in the generated `latex-icons.css`, from `scripts/latex-icons.mjs`). Per-template markup switches live in `latexTemplateFeatures` in `ResumeTemplateLayout.jsx`. Compare against the samples with `/tests/latex-templates.html` (`?t=<id>`, `&long=1`, `&check=1`), or headlessly with `scripts/capture-latex.sh`.

| App template | Source | Font | Notes |
| --- | --- | --- | --- |
| Minimal Academic | Minimal Academic CV (Overleaf) | Nunito Sans | Avenir-style face in the render is not open-licensed |
| Libre CV | Libre CV (paracol, `[sf]libertine`) | Libertinus Sans (Biolinum fork) | Category icons replaced by small-caps group names |
| Simple Hipster (rebuilt, same id) | LaTeX Ninja `simplehipstercv`, lighthipster | Raleway | No skill bars, logos or language dots (no such data) |
| Single-page Keywords | `my_cv` class sample | Raleway | No per-job tech chips (experience has no tech field) |
| Elegant Resume | Harikrishnan B. Kurup, `cvhari` | Lato | Project/client rows need data the app does not collect |
| Developer CV | Developer CV v2 (LaTeXTemplates.com, MIT) | Raleway | Monospace tags omitted |
