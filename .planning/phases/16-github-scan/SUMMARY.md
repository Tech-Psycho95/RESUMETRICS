<!-- PLAN-016 SUMMARY START -->
# PLAN-016 summary

**Status:** Done · 2026-10-05

- `POST /api/github/evidence-scan` (streamed): paginated listing, 25 most recently pushed repos (`RESUMETRICS_GITHUB_SCAN_CAP`), 4 at a time with rate-limit backoff, cancellable. Language share by bytes, repo counts, manifest/README skill detection (`shared/skillTaxonomy.js`, `shared/githubEvidenceMath.js`); < 5% flagged. Tests with a fake GitHub. Old `/evidence-analysis` removed.
<!-- PLAN-016 SUMMARY END -->
