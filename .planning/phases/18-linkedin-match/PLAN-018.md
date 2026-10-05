<!-- PLAN-018 START -->
# PLAN-018 — LinkedIn evidence: profile PDF match with animated score

**Milestone:** M2 · **Phase:** 18 · **Requirements:** LI-01…LI-03, EV-01, EV-02

## Context
- **Research F3:** LinkedIn file goes through `/api/resume/extract`; comparison is skills-only overlap on the client.
- **PLAN-017:** evidence screen + footer actions; this plan fills its LinkedIn panel. **PLAN-015:** `ScoreRing`. **PLAN-011:** task `li.match`, evals, fact guard.
- Assumption (confirm): the user's "GitHub scanning is different than GitHub… download profile as PDF" means **LinkedIn** (LinkedIn → More → Save to PDF).

## Goal
Upload a LinkedIn profile PDF, compare it carefully with the resume's skills, internships and jobs, and show a clear, colour-coded match with an animated ring.

## Parsing
- Upload in the panel (PDF primarily; DOCX accepted). Browser extracts text/pages (existing util); server `POST /api/linkedin/parse` uses a LinkedIn-specific prompt (the export has a fixed layout: Contact, Top Skills, Languages, Certifications, Summary, Experience with nested roles per company and durations, Education) → `{ skills[], experience[{company, title, start, end, location, kind: job|internship}], education[], certifications[] }`. Internship detection from title/keywords ("Intern", "Trainee", "Apprentice") and duration.

## Matching (`shared/linkedinMatch.js`, deterministic first, AI only for ambiguous pairs)
- **Skills:** normalised + synonyms (shared taxonomy from PLAN-016); match % = resume skills found on LinkedIn ÷ resume skills.
- **Jobs and internships:** pair each resume entry with the best LinkedIn entry by company similarity (normalised names, aliases like "Pvt Ltd"), title similarity, and date overlap. Status per resume item: **matched** (company + title + dates within ±2 months), **partial** (company matches but title or dates differ — the difference is shown), **not found**. AI (`li.match`) only judges borderline title equivalence ("SDE Intern" vs "Software Engineering Intern") and returns a bounded verdict.
- **Scores:** skills, jobs, internships each 0–100; overall = weighted (jobs 40, internships 25, skills 35; weights re-normalised when a category is empty).

## UI (evidence screen, LinkedIn panel)
- Upload dropzone with instructions ("On LinkedIn: Me → View profile → More → Save to PDF").
- **Overall `ScoreRing`** animates filling to the score once matching finishes, colour red → green by score.
- Three smaller rings or bars (Skills, Jobs, Internships).
- **Item table:** resume item ↔ LinkedIn item side by side with status chip (green matched / amber partial with "Dates differ: Jun–Aug 2024 vs Jun–Sep 2024" / red not found).
- Skills: matched chips; resume-only skills (not on LinkedIn) listed separately.
- Same footer: Add evidence / Continue without evidence.

## Tasks
1. LinkedIn parse prompt + route; eval cases from synthetic LinkedIn-style PDFs.
2. `shared/linkedinMatch.js` with unit tests (date overlap, aliases, partial reasons, weight re-normalisation).
3. Panel UI components; reuse `ScoreRing`.
4. Remove old `LinkedInEvidenceReview.jsx`, `LinkedInImportDialog.jsx` flow from the editor rail (rail's evidence dock links to the evidence screen instead).

## Verification
Unit tests; fixture with synthetic profile showing matched/partial/not-found; ring animation + colours; works with LinkedIn only (no GitHub).

## Definition of done
LI-01…03 pass; LinkedIn independent of GitHub.
<!-- PLAN-018 END -->
