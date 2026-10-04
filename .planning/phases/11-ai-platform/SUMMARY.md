<!-- PLAN-011 SUMMARY START -->
# PLAN-011 summary

**Status:** Done (evals pending user run) · 2026-10-05

- `server/ai/runTask.js`: per-task model (`RESUMETRICS_AI_MODEL_*`), JSON validation, one repair retry, fallback; no retries on 401/429/timeouts. Groq client: 1 retry, 30 s timeout.
- NDJSON streaming (`server/ai/ndjson.js`, `src/utils/readNdjson.js`).
- Fact guard (`shared/factGuard.js`, tests): rejects new numbers, skills or links not in the resume or the request.
- Eval harness `npm run ai:eval -- --task nimbus|jd-parse|jd-fixes|all [--model …]` with synthetic cases; writes `.planning/evals/`. Not run here (Groq rate limits) — user to run.
<!-- PLAN-011 SUMMARY END -->
