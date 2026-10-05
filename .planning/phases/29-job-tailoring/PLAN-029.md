<!-- PLAN-029 START -->
# PLAN-029: Job tailoring page (JD match moves out of the editor rail)

**Milestone:** M2.3 · **Phase:** 29 · **Requirements:** TLR-01…TLR-06

## Context
- User request (2026-10-05): move the JD (job match) feature into **Job tailoring** and give it a **whole page like the evidence section**, split into two halves: the JD feature on one side and the **live resume being changed** on the other.
- Today: `JobMatchPanel` is a tab of the editor's left rail (`AiRail`, `main.jsx` ~1904). Its state lives in `MainPage` (`useJobMatch`, `analysis`, `description`), so a new page can share it. "Job tailoring" is already in the sidebar `navSections` with a null path (shown as "Soon"). The evidence page (`/workspace/evidence`, `main.jsx` ~1791) is the model: a studio top bar plus a full page.

## Design
- **Route** `/workspace/tailor`, and the sidebar item "Job tailoring" points to it. With no draft it redirects to `/workspace` (same as evidence). Opening it puts the workspace in `editor-ready` mode so job match is available.
- **Layout** (`.tailor-page`): a studio top bar (back to the editor, title "Job tailoring", resume name, Export), then two equal half containers:
  - **Left: Job match.** The existing `JobMatchPanel` with `layout="page"`: a larger ring (168px), the job title, the skills line, role relevance, the **Changes** list (Execute/Undo) and **Could also add**, with the composer at the bottom.
  - **Right: Live resume.** The same template canvas, read-only, with a zoom control. After **Execute** or **Undo**, the changed parts flash for 1.6s (`.is-tailor-changed`) and scroll into view.
  - At ≤1000px the halves stack, Job match first.
- **Editor rail:** the Job match tab is removed, so the rail is NIMBUS only. A dock row "Tailor to a job" shows the last match score and an **Open** button to `/workspace/tailor`, above the GitHub evidence row.
- **NIMBUS hand-offs:** "Answer with NIMBUS" on a fix navigates to the editor with the NIMBUS input pre-filled.
- **Help/FAQ** text is updated: "Open Job tailoring from the sidebar or the editor".

## Tasks
1. `main.jsx`: `isTailorRoute` with the redirect/mode effect; the tailor page render; the canvas on that page (read-only); remove the Job match tab; the dock row; the NIMBUS hand-off navigation; the nav path and help copy.
2. `AiRail.jsx`: NIMBUS-only body plus `TailorDock`.
3. `JobMatchPanel.jsx`: a `layout` prop (`rail` / `page`) with the bigger ring and page intro.
4. New `src/job-tailoring.css`: page grid, halves, flash animation (reduced-motion safe).

## Requirements
- **TLR-01** "Job tailoring" in the sidebar opens `/workspace/tailor` for the current resume.
- **TLR-02** The page has two equal halves: Job match and the live resume.
- **TLR-03** Execute/Undo change the resume on the right immediately, and the changed parts are highlighted.
- **TLR-04** The editor no longer has a Job match tab; it links to Job tailoring instead.
- **TLR-05** Job match state (JD text, result, fixes) is kept between the editor and the tailoring page.
- **TLR-06** Responsive: the halves stack under 1000px with no horizontal scroll.

## Verification
- `npm run build`. `/workspace/tailor` needs Google sign-in, so the full walkthrough is a user check: paste a JD, Execute a fix, see the right half update, Undo, go back to the editor, and see the score in the dock.

## Definition of done
Job matching happens on its own two-half page with the live resume beside it, and the editor links to it.
<!-- PLAN-029 END -->
