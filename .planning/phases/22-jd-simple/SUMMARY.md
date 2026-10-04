<!-- PLAN-022 SUMMARY START -->
# PLAN-022 summary

**Status:** Done · 2026-10-05

- Job match = one intro line, composer with attach, stage as the shimmer line, then ring + job title + "Missing: …" + fixes (Execute / Undo / Answer). Verified live: 78% with 6 fixes in 2.5 s.
<!-- PLAN-022 SUMMARY END -->

<!-- PLAN-022 FOLLOW-UP START -->
## Follow-up (user, 2026-10-05)
- Match = **skills 60%** (required/nice-to-have job skills found on the resume) + **experience 40%** (each job/internship rated relevant / partly relevant / not related to the target role by shared title words, job skills and duties; plus years vs required). Other checks no longer affect the score.
- Panel: ring + job title, one skills line (matched · missing), one line per role with its relevance, **Changes** (structural/wording, Execute/Undo) and **Could also add** (suggestions, no button).
- Fix generation: two kinds (`change` with validated content operations, `add` as suggestions); malformed model JSON is unwrapped/repaired; usage-limit fallback is explained in the panel.
- Evidence row renamed "Evidence with GitHub" with the GitHub logo.
- Live check: scoring and role lines verified (85%: Google role relevant, Microsoft internship partly relevant). Tailored changes could not be re-verified live: the Groq account hit its daily token limit (200k TPD).
<!-- PLAN-022 FOLLOW-UP END -->
