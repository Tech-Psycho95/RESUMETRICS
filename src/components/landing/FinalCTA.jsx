import { useNavigate } from 'react-router-dom'
import LandingIcon from './LandingIcon.jsx'
import ScrollReveal from './ScrollReveal.jsx'

export default function FinalCTA() {
  const navigate = useNavigate()
  return <ScrollReveal className="final-cta">
    <h2>Your next resume is <span>a scroll away.</span></h2>
    <p>Sign in with Google and build it in minutes.</p>
    <button className="landing-primary-cta" type="button" onClick={() => navigate('/login')}>Get started <LandingIcon name="arrow" size={16} /></button>
  </ScrollReveal>
}
