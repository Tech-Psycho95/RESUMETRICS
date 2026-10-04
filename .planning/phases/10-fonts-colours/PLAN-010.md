<!-- PLAN-010 START -->
# PLAN-010 — Font and colour catalogues (100+ self-hosted fonts)

**Milestone:** M2 · **Phase:** 10 · **Requirements:** FNT-01…FNT-03

## Context
- **Research F8:** 28 fonts today, fetched from Google Fonts CSS at runtime (`src/editor/fontRegistry.js`).
- Consumers: `FormatPanel` (PLAN-003/009), NIMBUS options (PLAN-012/013), PDF print (PLAN-006 — fonts must be loaded before printing).

## Goal
A tagged catalogue of 100+ open-licensed fonts stored in the project and a curated colour library, shared by manual editing and NIMBUS.

## Fonts
- **Source:** Google Fonts families under SIL OFL 1.1 or Apache 2.0 only. Download `woff2`, Latin + Latin-Extended subsets, weights 400/500/600/700 + 400 italic where available (≈ 30–60 KB per weight).
- **How:** a one-off script `scripts/fetch-fonts.mjs` that reads `src/fonts/catalogue.json`, downloads from the Google Fonts CSS2 API into `public/fonts/<family>/…`, and writes `licenses/fonts/<family>.txt`. Requires a network download — run once with the user's approval; files are committed so the app never calls Google at runtime.
- **Catalogue entry:** `{ id, name, family, category: serif|sans|slab|mono|display, weights, italics, tags: [professional, modern, friendly, academic, technical, elegant, compact, ats-safe…], atsSafe: bool, pairsWith: [ids], license }`. Display/script fonts limited to headings-only use (`roles: ['heading']`).
- **Loading:** `@font-face` declared lazily with the `FontFace` API on first use (format panel preview, applied font, NIMBUS option card). Font picker shows names rendered in their own face, loaded as rows scroll into view (IntersectionObserver).
- **Picker UI:** search, category filter, tag chips, "ATS-safe" toggle, recently used.
- **Budget:** fonts are not in the JS bundle; only fonts used by the current resume are fetched. Measure `public/fonts` total size and keep below ~25 MB.

## Colours
- `src/editor/colourCatalogue.js`: text colours (near-black, ink, slate…), heading/accent palettes (navy professional, forest, burgundy, teal modern, graphite minimal, warm editorial…) each with mood tags and recommended pairings (heading + accent + body).
- Contrast helper: WCAG ratio vs white; body text options must be ≥ 4.5:1, headings ≥ 3:1. Panel warns when a picked colour fails.

## Tasks
1. Write `catalogue.json` (≥ 100 families, tagged), `fetch-fonts.mjs`, licences.
2. Replace `fontRegistry.js` with a catalogue-backed module (keep export names used by M1 code).
3. Font picker component for `FormatPanel`; colour catalogue + contrast warnings in `ColorField`.
4. Make print export wait for all fonts used by the resume.
5. Expose `catalogue` summaries to the server (shared JSON) so NIMBUS can pick by tags (PLAN-012).

## Verification
Count ≥ 100 families; every family has a licence file; picker search/filter works; switching font downloads only that family (network tab); PDF uses the font; contrast warning appears for light grey body text.

## Definition of done
FNT-01…03 pass; no runtime requests to Google Fonts.
<!-- PLAN-010 END -->
