import { useNavigate } from 'react-router-dom'
import LandingIcon from './LandingIcon.jsx'
import ScrollReveal from './ScrollReveal.jsx'

export default function FinalCTA() {
  const navigate = useNavigate()
  return <section className="final-cta-section"><div className="final-cta-glow" /><ScrollReveal className="final-cta-content"><span className="landing-eyebrow">READY WHEN YOU ARE</span><h2>Your next resume<br /><span>should not start from zero.</span></h2><p>Bring your experience forward with a workspace built for the next version of your story.</p><button className="landing-primary-cta" type="button" onClick={() => navigate('/login')}>TRY NOW <LandingIcon name="arrow" size={17} /></button></ScrollReveal></section>
}
