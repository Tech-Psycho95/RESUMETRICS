<!-- PLAN-016 START -->
# PLAN-016 — GitHub evidence engine v2: language shares, live scan progress

**Milestone:** M2 · **Phase:** 16 · **Requirements:** GH-01…GH-04 (server + contract)

## Context
- **Research F2:** first page of repos only, 25 scanned, language bytes discarded, no progress events.
- **PLAN-011:** NDJSON streaming helpers. UI in PLAN-017.

## Goal
Scan every accessible repository (up to a cap), measure how much code is in each language, map that to the resume's skills, flag weak evidence (< 5%), and report progress live.

## Scan (`POST /api/github/evidence-scan`, NDJSON)
1. List repos with pagination (`GET /installation/repositories`, 100/page) → total accessible. Cap: `RESUMETRICS_GITHUB_SCAN_CAP` (default 100), most recently pushed first; forks and archived repos included but marked (user can exclude in UI later). Emit `{type:"start", total, cap}`.
2. For each repo (concurrency 4, respecting rate-limit headers; back off on 403/429): languages (bytes), README (≤ 2k chars), manifests (existing list + `Cargo.toml`, `composer.json`, `Gemfile`, `*.csproj` via tree lookup), topics. Emit `{type:"repo", done, total, repo:{name, url, description, pushedAt, stars, fork, archived, languages:{lang: bytes}, manifests:[...], skills:[...]}}`.
3. Emit running aggregates every repo: `{type:"progress", done, total, percent, languageTotals}` so the chart grows live.
4. Finish: `{type:"result", ...}` then `{type:"done"}`. Client disconnect aborts the scan.

## Metrics
- **Language share** = bytes in language L across scanned repos ÷ all bytes (GitHub's own measure). Also **repo coverage** = repos containing L ÷ repos scanned. Both shown; share is the headline (matches the user's "25% TypeScript, 30% Python").
- Markup/config languages (HTML, CSS, SCSS, Dockerfile, Makefile, Shell, Jupyter Notebook) are kept but labelled; optional toggle to exclude markup from the denominator.
- **Resume skill evidence:**
  - Language skills (Python, TypeScript…) → their share.
  - Frameworks/tools (React, Django, Docker, PostgreSQL…) → detected from manifests/imports; evidence = share of the parent language's bytes in repos where the framework is detected (e.g. React in repos totalling 18% of all code → 18%), plus repo count.
  - **< 5% → `weak` ("Too little evidence")**; 0 / not found → `none`; README-only mentions → `mentioned` (not counted as evidence).
- AI narrative (task `gh.narrative`, short, factual, uses only computed numbers).

## Tasks
1. Rewrite `githubEvidence.js` as an async generator yielding events; pagination; concurrency limiter; rate-limit handling.
2. Skill ↔ language/framework map `shared/skillTaxonomy.js` (language parents, manifest package names → skills, aliases) with tests.
3. Route + NDJSON wiring; keep old endpoint until PLAN-017 ships.
4. Fixture data: recorded anonymised scan (synthetic repos) for UI development and tests.

## Verification
Unit tests for shares and thresholds (exactly 5% is not flagged; 4.9% is); large account (100+ repos) completes with progress events; rate-limit simulation backs off; abort stops API calls.

## Definition of done
GH-01…GH-04 satisfied server-side with a stable event contract.
<!-- PLAN-016 END -->
