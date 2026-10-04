<!-- PLAN-026 START -->
# PLAN-026: Cinematic landing page (M3-pre, landing redesign)

**Milestone:** M2.2 Landing · **Phase:** 26 · **Requirements:** LND-01…LND-08

## Context
- User request (2026-10-05): the landing page looks dated and describes old features. Replace it with a **parallax, scroll-driven, cinematic animation of a resume being filled in**. When the resume is full, the **Resumetrics logo appears at the top**. Scrolling further shows **feature containers for the latest features**, revealed one by one. Smooth scrolling uses **Lenis**.
- Current page: `src/pages/LandingPage.jsx` with 9 components in `src/components/landing/` and `src/styles/landing.css` + `landing-wordmark.css`. The only route is `/` in `src/main.jsx:1972`, and CTAs go to `/login`.
- Logo asset: `src/assets/resumetrics-logo.png` (black script on white, 2172×724). On the light page it uses `mix-blend-mode: multiply` so the white box disappears.
- Latest features (M2/M2.1, see STATE D23–D27): three ways to start (scratch / upload / LinkedIn PDF import), template gallery + studio editor (word-level B/I/U/S, 100+ self-hosted fonts, colour catalogue, undo), NIMBUS AI chat (content-only edits, fact guard), Job match (JD → score ring, missing skills, one-click **Execute** fixes), GitHub evidence (25 latest repos, language shares by bytes), print-exact PDF export.

## Design
### Architecture: one scroll-progress primitive, CSS does the rest
- `useLenis()` (in `LandingPage`) creates one Lenis instance (`lerp 0.09`, `smoothWheel`) driven by `requestAnimationFrame` and destroyed on unmount. It is skipped when `prefers-reduced-motion: reduce`.
- `useScrollProgress(ref)` computes `p = clamp(-rect.top / (rect.height - innerHeight), 0, 1)` for a tall section on every scroll/resize (rAF-throttled) and writes it as the CSS variable `--p`. Native `scroll` events fire under Lenis because Lenis scrolls the window.
- Every animated element sets its own window with `--s` (start) and `--e` (end). CSS derives `--t: clamp(0, (var(--p) - var(--s)) / (var(--e) - var(--s)), 1)` and maps `--t` to opacity, transforms and `clip-path`. No per-frame React renders, no GSAP.

### Scene 1: "The fill" (pinned, 520vh tall, sticky 100vh stage)
| p range | Beat |
|---|---|
| 0.00–0.06 | Empty resume page, tilted in 3D (`rotateX 18deg → 0`), skeleton placeholder bars, hint "Scroll to build". |
| 0.04–0.16 | Name is "written" left-to-right (clip-path wipe), then the role line. |
| 0.14–0.22 | Contact row and divider rule draw in. |
| 0.20–0.34 | Summary lines wipe in one after another. |
| 0.32–0.54 | Experience: two roles, three bullets each, staggered. |
| 0.52–0.62 | Skills chips pop in (scale + fade). |
| 0.60–0.68 | Education line. Each section's placeholder bar fades as its content arrives. |
| 0.66–0.74 | "Filled" moment: page settles, a soft highlight sweeps across it and a "100% complete" badge appears. |
| 0.72–0.90 | Camera pulls back: page scales to ~0.62 and moves down. The **logo appears at the top** with a left-to-right clip-path wipe plus blur-to-sharp. |
| 0.86–1.00 | Tagline + **Get started** CTA fade up under the logo. |
- Parallax layers: background grid (0.2× speed), soft colour orbs (0.4×), floating "field chips" around the page (Name, Experience, Skills… at 1.3×, flying into the page as each section fills, then fading out).
- A thin progress bar on the left edge mirrors `p`.

### Scene 2: "What's new" feature containers
- Section heading, then six containers. Each one is a two-column card (copy + mini visual), revealed by `ScrollReveal` (rise + unblur) with its own `useScrollProgress` for a gentle parallax on the visual (`translateY` ±40px).
  1. **Start any way**: scratch, upload, Import from LinkedIn (three mini tiles).
  2. **Studio editor**: highlight words to format, 100+ fonts, colours, undo (mock toolbar + text with marks).
  3. **NIMBUS**: AI chat that edits content and never invents facts (chat bubbles + shimmer task line).
  4. **Job match**: paste a JD, get a score ring, missing skills and one-click Execute fixes (animated ring).
  5. **GitHub evidence**: languages by share of code from your 25 latest repos (stacked language bar).
  6. **Exact PDF export**: what you see is what prints (page + download chip).
- Final CTA band + slim footer.

### Nav
Fixed, transparent top bar: small logo (fades in only after the hero logo has appeared or after scene 1), anchors "Features", and a "Sign in" button to `/login`.

## Tasks
1. `npm i lenis`; import `lenis/dist/lenis.css`.
2. Create `src/components/landing/useLenis.js` and `useScrollProgress.js`.
3. Create `CinematicHero.jsx` (scene 1) and `FeatureShowcase.jsx` (scene 2 with six visuals), plus `FinalCTA.jsx` rewritten.
4. Rewrite `LandingPage.jsx` to compose nav, hero, showcase, CTA and footer.
5. Replace `src/styles/landing.css`; delete `landing-wordmark.css`, `AnimatedLogo`, `HeroSection`, `ProblemSection`, `SolutionSection`, `HowItWorksSection`, `FeatureGrid`, `ProductPreview`.
6. Reduced motion: no Lenis, scene 1 not pinned (`--p: 1`, final state shown statically), reveals show immediately.
7. Responsive: at ≤720px the stage is the full width with a 16px gutter, the page scales to fit, floating chips are hidden, and feature cards stack.

## Requirements
- **LND-01** Lenis smooth scrolling on the landing page only (destroyed on leaving `/`).
- **LND-02** Scroll-driven resume fill in the order name → contact → summary → experience → skills → education, reversible when scrolling up.
- **LND-03** Parallax depth: at least 3 layers moving at different speeds.
- **LND-04** The logo appears at the top only after the resume is complete.
- **LND-05** Six feature containers covering the M2/M2.1 features, revealed on scroll.
- **LND-06** CTAs go to `/login`.
- **LND-07** `prefers-reduced-motion` shows a static, complete layout.
- **LND-08** No horizontal scroll at 375px, 60fps-friendly (transform/opacity/clip-path only).

## Verification
- `npm run build` passes.
- Preview `/` in the browser pane: check frames at p≈0, 0.3, 0.7, 1 (empty → filling → filled → logo), the feature cards, mobile width, and the console for errors.

## Definition of done
Scrolling `/` plays the fill animation smoothly, the logo appears when the resume is full, the six feature containers reveal below it, and the old sections are gone.
<!-- PLAN-026 END -->
