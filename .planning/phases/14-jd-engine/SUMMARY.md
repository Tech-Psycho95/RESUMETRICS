<!-- PLAN-014 SUMMARY START -->
# PLAN-014 summary

**Status:** Done · 2026-10-05

- `POST /api/jd/analyze` (streamed): AI parse with fallback, deterministic scoring (`shared/jdScoring.js`, tests: skills/experience/keywords/education/structure, synonyms, years), AI fixes validated with the NIMBUS validator + fact guard; unsupported fixes become questions. Prompt-injection test ignored. Old `/api/resume/analyze` removed.
<!-- PLAN-014 SUMMARY END -->
