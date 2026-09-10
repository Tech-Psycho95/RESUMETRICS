import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/resumetrics-logo.png'
import AnimatedLogo from './AnimatedLogo.jsx'
import LandingIcon from './LandingIcon.jsx'

export default function HeroSection() {
  const navigate = useNavigate()
  const sceneRef = useRef(null)

  useEffect(() => {
    let frameId = 0
    const updateScene = () => {
      frameId = 0
      const progress = Math.min(1, Math.max(0, window.scrollY / 520))
      sceneRef.current?.style.setProperty('--hero-opacity', String(1 - progress * .72))
      sceneRef.current?.style.setProperty('--hero-scale', String(1 - progress * .045))
      sceneRef.current?.style.setProperty('--hero-y', `${progress * -42}px`)
    }
    const handleScroll = () => {
      if (!frameId) frameId = requestAnimationFrame(updateScene)
    }
    updateScene()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => { window.removeEventListener('scroll', handleScroll); if (frameId) cancelAnimationFrame(frameId) }
  }, [])

  return <section className="landing-hero" id="top">
    <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
    <header className="landing-nav">
      <a href="#top" className="landing-brand" aria-label="Resumetrics home"><img src={logo} alt="Resumetrics" /></a>
      <nav className="landing-links" aria-label="Landing page navigation"><a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#features">Features</a></nav>
      <button className="landing-nav-cta" type="button" onClick={() => navigate('/login')}>TRY NOW <LandingIcon name="arrow" size={15} /></button>
    </header>
    <div className="hero-scene" ref={sceneRef}>
      <div className="hero-kicker"><span className="kicker-dot" /> THE RESUME WORKSPACE</div>
      <AnimatedLogo />
      <div className="hero-copy">
        <h1>Build smarter resumes <em>with AI.</em></h1>
        <p>Import your resume, extract your career data, choose a template, and generate a polished resume tailored for your next opportunity.</p>
        <div className="hero-actions"><button className="landing-primary-cta" type="button" onClick={() => navigate('/login')}>TRY NOW <LandingIcon name="arrow" size={17} /></button><span>AI-powered extraction, rewriting, templates, and role alignment.</span></div>
      </div>
      <a className="scroll-cue" href="#product"><span className="scroll-line" /> Scroll to explore</a>
    </div>
  </section>
}
