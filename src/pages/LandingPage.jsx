import { useEffect, useRef } from 'react'
import LandingNav from '../components/landing/LandingNav.jsx'
import GoldHero from '../components/landing/GoldHero.jsx'
import ResumeWriter from '../components/landing/ResumeWriter.jsx'
import StatsBand from '../components/landing/StatsBand.jsx'
import NimbusSection from '../components/landing/NimbusSection.jsx'
import ScreenSlider from '../components/landing/ScreenSlider.jsx'
import TemplateCarousel from '../components/landing/TemplateCarousel.jsx'
import RatingStamp from '../components/landing/RatingStamp.jsx'
import WhyFolder from '../components/landing/WhyFolder.jsx'
import { BigCta, LandingFooter } from '../components/landing/ClosingSections.jsx'
import useLenis from '../components/landing/useLenis.js'
import useRevealOnScroll from '../components/landing/useRevealOnScroll.js'
import useCinematicScroll from '../components/landing/useCinematicScroll.js'
import '../styles/landing-page.css'

export default function LandingPage() {
  const rootRef = useRef(null)
  useLenis()
  useRevealOnScroll(rootRef)
  useCinematicScroll(rootRef)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Resumetrics — The resume your work deserves'
    return () => { document.title = previousTitle }
  }, [])

  return <div className="lp" ref={rootRef}>
    <LandingNav />
    <main className="lp-main">
      <GoldHero />
      <ResumeWriter />
      <StatsBand />
      <NimbusSection />
      <ScreenSlider />
      <TemplateCarousel />
      <RatingStamp />
      <WhyFolder />
      <BigCta />
    </main>
    <LandingFooter />
  </div>
}
