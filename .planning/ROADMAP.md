# Roadmap

## M1 — UI redesign v2 (current)

| Phase | Plan | Goal | Requirements | Depends on | Status |
|---|---|---|---|---|---|
| 0 | PLAN-000 | Routing: scratch/upload converge on one gallery and one editor | — | — | Done (uncommitted, needs sign-in test) |
| 1 | PLAN-001 | Three-pane editor shell with coupled resizable rails | LAY-01…07, QA | PLAN-000 | Done |
| 2 | PLAN-002 | Style override rendering + selection model (engine wiring) | FMT-01, FMT-02, FMT-09 | PLAN-001 | Done |
| 3 | PLAN-003 | Right formatting panel, undo/redo, zoom | FMT-03…08, FMT-10…12 | PLAN-002 | Done |
| 4 | PLAN-004 | Left AI rail: NIMBUS / JD switch, evidence dock | AI-01…05 | PLAN-001 | Done |
| 5 | PLAN-005 | Section-based form page with completion status | FORM-01…10 | PLAN-000 | Done |
| 6 | PLAN-006 | Formatting-faithful PDF export | FMT-09 | PLAN-002 | Done |
| 7 | PLAN-007 | Milestone verification and clean-up | QA-01…03 | all above | Automated part done; signed-in walkthrough pending |

Execution order: 1 → 2 → 3 → 6, with 4 and 5 able to run in parallel after 1 (5 only touches the build page).

## M2 — Edit features depth (planned 2026-10-04)

| Phase | Plan | Goal | Requirements | Depends on | Status |
|---|---|---|---|---|---|
| 8 | PLAN-008 | Workspace store: state survives screens and refresh; `/workspace/evidence` | WS-01, WS-02 | M1 | Planned |
| 9 | PLAN-009 | Element editing fix, highlight formatting (B/I/U/S), global-only size, one-page pagination | EDT-01…05 | PLAN-008 | Planned |
| 10 | PLAN-010 | 100+ self-hosted fonts + colour catalogue | FNT-01…03 | PLAN-009 | Planned |
| 11 | PLAN-011 | AI platform: per-task models, strict schemas, NDJSON streaming, fact guard, eval harness | AIQ-01…03 | — | Planned |
| 12 | PLAN-012 | NIMBUS engine v2: steps, full control, options, questions | NIM-02…07 | 009, 010, 011 | Planned |
| 13 | PLAN-013 | NIMBUS chat UI v2 | NIM-01…06 | 012, 008 | Planned |
| 14 | PLAN-014 | JD engine: parse, content + structure score, executable fixes | JD-02, 04, 05 | 011, 012 | Planned |
| 15 | PLAN-015 | JD UI: composer + upload, ScoreRing, breakdown, fix cards | JD-01, 03, 05 | 014 | Planned |
| 16 | PLAN-016 | GitHub engine v2: language shares, <5% flag, live progress | GH-01…04 | 011 | Planned |
| 17 | PLAN-017 | Evidence screen: independent sources, live charts, repo list, exits | EV-01, 02, GH-04…06 | 008, 016 | Planned |
| 18 | PLAN-018 | LinkedIn profile-PDF match with animated ring | LI-01…03 | 011, 015, 017 | Planned |
| 19 | PLAN-019 | M2 verification, evals, clean-up | all M2 | all above | Planned |

**Execution order:** 008 → 009 → 011 (can start in parallel with 009) → 010 → 012 → 013 → 014 → 015 → 016 → 017 → 018 → 019.
Waves: [008] → [009, 011] → [010, 016] → [012, 014, 017] → [013, 015, 018] → [019].

## M2.1 — Simplicity pass (user feedback 2026-10-05) — done (pending sign-in check)

| Phase | Plan | Goal | Supersedes |
|---|---|---|---|
| 20 | PLAN-020 | Button system, simple top bar & rail switch, font dropdown without filters, lean format panel | parts of PLAN-003/010 |
| 21 | PLAN-021 | NIMBUS simple chat: Bloub cloud back, rainbow wordmark, task shimmer line; content-only edits; friendly rate-limit errors | PLAN-013 UI, PLAN-012 style/options |
| 22 | PLAN-022 | Job match simplest design: ring + missing line + fixes | parts of PLAN-015 |
| 23 | PLAN-023 | Evidence = GitHub only, minimal data | PLAN-017 two-source picker, PLAN-018 |
| 24 | PLAN-024 | Import from LinkedIn as a third way to start | PLAN-018 LinkedIn compare |
| 25 | PLAN-025 | Verify, clean dead code, update docs | PLAN-019 (merged) |

PLAN-008…017 stay done (as superseded above). PLAN-018's LinkedIn comparison is withdrawn. PLAN-019 is merged into PLAN-025.

## M3 — ATS scoring (later)
To be planned after M2.

## M2.2 — Cinematic landing page (user request 2026-10-05)

| Phase | Plan | Goal | Requirements | Status |
|---|---|---|---|---|
| 26 | PLAN-026 | Lenis + scroll-driven resume-fill hero, logo reveal, six feature containers | LND-01…08 | Done |

## M2.3: Templates, inclusive form, job tailoring (user request 2026-10-05)

| Phase | Plan | Goal | Requirements | Status |
|---|---|---|---|---|
| 27 | PLAN-027 | Six LaTeX template clones on the shared renderer | TPL-01…08 | Done |
| 28 | PLAN-028 | User-defined skill groups, neutral copy, additional sections, accessible form | INC-01…06, A11Y-01…07 | Done |
| 29 | PLAN-029 | Job tailoring page: JD half and live resume half | TLR-01…06 | Done (sign-in walkthrough pending) |
| 30 | PLAN-030 | Keyword-driven job match, fixes switch, score spotlight | JDK-01…08 | Done (signed-in check pending) |
| 31 | PLAN-031 | Product-grade tailoring UI from the Resume Worded references, instant keywords | TUI-01…10 | Done (signed-in check pending) |
| 32 | PLAN-032 | GitHub evidence in the same product UI | EVU-01…09 | Done (signed-in check pending) |

Order: 27, then 28 (it reuses the skill label helper from 27), then 29.
