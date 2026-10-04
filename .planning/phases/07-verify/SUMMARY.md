<!-- PLAN-007 SUMMARY START -->
# PLAN-007 summary — M1 verification and clean-up

**Status:** Automated part done · signed-in walkthrough pending (user) · 2026-10-04

## Checks
| Area | Result |
|---|---|
| LAY-01…07 | Pass (fixture) |
| FMT-01…08, 10…12 | Pass (fixture) |
| FMT-09 | Screen + print copy pass; print dialog output not checked by automation |
| AI-01…05 | Pass (fixture, stubbed network) |
| FORM-01…09 | Pass (fixture) |
| FORM-10 | Changed to "block" by user; pass |
| QA-01 | Fixtures: `tests/editor-studio.html` (`?print=1`, `?template=`), `tests/scratch-builder.html` (`?template=`) |
| QA-02 | `npx vite build` passes; `node tests/railSizing.test.js` and `node tests/sectionProgress.test.js` pass |
| QA-03 | Labelled controls, focus outlines, separator roles, alertdialogs; not screen-reader tested |

## Clean-up
Removed dead CSS: old template selector, template carousel, old scratch form (`resume-builder.css` now only holds the language picker), old print block.

## Not verified
- `MainPage` itself with sign-in (Google auth can't be automated here). All identifiers it references were checked to exist, and the build passes.
- Real NIMBUS / JD analysis / GitHub / LinkedIn calls inside the new rail.
<!-- PLAN-007 SUMMARY END -->
