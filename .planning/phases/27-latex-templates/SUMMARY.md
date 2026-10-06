# PLAN-027 summary: Six LaTeX template clones

**Status:** Done (2026-10-05).

- `latexTemplateFeatures` in `ResumeTemplateLayout.jsx`: split name, contact-as-section, contact labels/link addresses, six entry layouts (`EntryShell`), skill chips/separators, lead sections, per-template sidebars. The page font scales from each class's base size.
- Pagination handles lead sections (Keywords' full-width summary) by flowing them with the main column.
- `latex-templates.css` (scoped under `.template-latex`), `latex-icons.css` (generated), and `LatexTemplates.jsx`. Simple Hipster was rebuilt in place; its old rules were removed from `overleaf-templates.css`.
- Libertinus Sans was added to the font catalogue (131 families). Skill group labels come from `shared/skillGroups.js`.
- Gallery label "LaTeX classic", per-template form notes, and OVERLEAF.md table.

## Verified
- `tests/latex-templates.html?check=1` (sample and `&long=1`): **PASS**. No content leaves a page and no experience is lost, in all six.
- Side-by-side captures against `reference/` (headless Edge, `scripts/capture-latex.sh`): structure, fonts, headings, entry layouts and colours match. The deviations are listed in OVERLEAF.md.
- `npm run build` passes.

## Notes
- The app sets `font-synthesis: none` globally, so the clones turn small-caps synthesis back on (LaTeX `\scshape`).
- `tests/template-rendering.html` is stale (it imports the deleted `ResumeTemplateSelector`) and was left as is.
