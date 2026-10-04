# PLAN-026 summary: Cinematic landing page

**Status:** Done (2026-10-05). `npm run build` passes and there are no console errors on `/`.

## Built
- `useLenis.js`: one Lenis instance on the landing page, skipped for reduced motion.
- `useScrollProgress.js`: writes `--p` (pin and pass modes). All motion is CSS driven from `--p` using per-element `--s`/`--e` windows (`.fx`, `.wipe`, `.pop`).
- `CinematicHero.jsx`: a 560vh pinned scene. A tilted empty page fills in (name → contact → summary → experience → skills → education) while field chips fly in and placeholder bars fade. Then a sheen and a "100% complete" badge play, the camera pulls back, the logo wipes in at the top, and the tagline and CTA appear. The parallax layers are the grid, the orbs and the chips.
- `FeatureShowcase.jsx`: six feature containers (start options, studio editor, NIMBUS, job match, GitHub evidence, PDF export) with animated mini visuals and visual parallax.
- `FinalCTA.jsx` was rewritten, and `LandingPage.jsx` now has a fixed nav. Removed: AnimatedLogo, HeroSection, ProblemSection, SolutionSection, HowItWorksSection, FeatureGrid, ProductPreview, landing-wordmark.css.

## Verified (browser pane)
Frames checked at p=0, 0.4 and 1, plus the feature cards. At 375px there is no horizontal scroll (scrollWidth = 375).
