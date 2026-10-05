<!-- PLAN-011 START -->
# PLAN-011 — AI platform: per-task models, strict schemas, streaming, evaluation harness

**Milestone:** M2 · **Phase:** 11 · **Requirements:** AIQ-01…AIQ-03 (foundation for NIM, JD, LI)

## Context
- **Research F4, F5, F9:** one model for all tasks, `json_object` mode, no evaluation, no streaming. Groq-hosted models cannot be fine-tuned by us; "training" here means measurable prompt/model iteration.
- Used by PLAN-012 (NIMBUS), PLAN-014 (JD), PLAN-016 (GitHub narrative), PLAN-018 (LinkedIn matching).

## Goal
A small, reliable AI layer every feature uses, plus a harness that tells us — with numbers — whether a prompt or model change made things better.

## Design
- **Task registry** `server/ai/tasks.js`: each task = `{ id, model (env override), temperature, schema (JSON Schema), systemPrompt, fewShot[], validate(), fallback() }`. Tasks: `nimbus.plan`, `nimbus.options`, `jd.parse`, `jd.fixes`, `li.match`, `gh.narrative`.
- **Per-task model env:** `RESUMETRICS_AI_MODEL_NIMBUS`, `…_JD`, `…_LINKEDIN`, falling back to `RESUMETRICS_AI_DEFAULT_MODEL`. Recommend a larger model for planning tasks (e.g. a 70B/120B-class Groq model) and the small one for extraction; final choice from harness results.
- **Strict structured output:** `json_schema` with `strict: true` where the model supports it; otherwise `json_object` + schema validation (`ajv`-style validator written in-house or a small dependency) + one repair retry with the validation errors; then deterministic fallback.
- **Streaming transport:** helper for NDJSON responses (`application/x-ndjson`) — `writeEvent(res, {type, ...})` server-side and `readNdjson(response, onEvent)` client-side; heartbeats every 10s; abort on client disconnect. Used by NIMBUS steps (PLAN-012) and GitHub scan progress (PLAN-016).
- **Safety:** all user/resume/JD/LinkedIn text passed as data blocks; prompt-injection test cases in the harness; output validators enforce "no invented facts" by checking that entities (companies, dates, numbers, skills) in AI-proposed text already exist in the source data or in the user's instruction.

## Evaluation harness ("training" loop)
- `server/ai/evals/<task>/*.json`: golden cases `{ input, expectations }` — e.g. NIMBUS: instruction + resume → expected operation types/targets, forbidden changes; JD: JD text → expected must-have skills; LinkedIn: profile + resume → expected matches.
- `npm run ai:eval -- --task nimbus.plan --model …` runs cases, scores (schema validity, exact/partial match, forbidden-change violations, latency, tokens), writes a report to `.planning/evals/<date>-<task>.md`.
- Start with ~25 cases per task, grow to 60+ during M2; any prompt change must not lower the score.
- Dataset format kept fine-tune-ready (input/output pairs) for a possible future provider; nothing is sent anywhere for training.

## Tasks
1. Task registry, schema validation + repair retry, per-task env config (document in `server/.env.example`).
2. NDJSON helpers (server + client) with abort handling.
3. Eval runner script + first 25 cases for each task (cases written by hand from realistic resumes/JDs; no real personal data).
4. Fact-preservation validator (`shared/factGuard.js`) with unit tests.

## Verification
Harness runs locally and produces reports; schema-invalid model output is repaired or falls back; injection cases ("ignore previous instructions…" inside a JD) don't change behaviour.

## Definition of done
AIQ-01…03 pass; baseline scores recorded for each task before PLAN-012/014/018 change prompts.
<!-- PLAN-011 END -->
