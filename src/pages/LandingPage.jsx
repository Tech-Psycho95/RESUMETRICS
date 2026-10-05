import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/resumetrics-logo.png'
import CinematicHero from '../components/landing/CinematicHero.jsx'
import FeatureShowcase from '../components/landing/FeatureShowcase.jsx'
import FinalCTA from '../components/landing/FinalCTA.jsx'
import useLenis from '../components/landing/useLenis.js'
import '../styles/landing.css'

export default function LandingPage() {
  const navigate = useNavigate()
  useLenis()

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Resumetrics — Build smarter resumes with AI'
    return () => { document.title = previousTitle }
  }, [])

  return <div className="landing-page">
    <header className="landing-nav">
      <a href="#top" className="landing-brand" aria-label="Resumetrics home"><img src={logo} alt="Resumetrics" /></a>
      <nav className="landing-links" aria-label="Landing page navigation"><a href="#features">Features</a></nav>
      <button className="landing-nav-cta" type="button" onClick={() => navigate('/login')}>Sign in</button>
    </header>
    <CinematicHero />
    <FeatureShowcase />
    <FinalCTA />
    <footer className="landing-footer"><img src={logo} alt="Resumetrics" /><span>Resumes built from your real work.</span></footer>
  </div>
}
