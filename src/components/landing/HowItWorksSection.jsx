import ScrollReveal from './ScrollReveal.jsx'
import LandingIcon from './LandingIcon.jsx'

const steps = [['Import or create', 'Start with the resume you have, or a blank canvas for the one you want.', 'upload'], ['AI extracts your profile', 'Career details become organized, reviewable, and ready to shape.', 'spark'], ['Choose your template', 'Find a layout that fits your story without losing your content.', 'switch'], ['Edit, improve, export', 'Make precise changes, align to a role, and take the finished draft with you.', 'download']]

export default function HowItWorksSection() {
  return <section className="landing-section how-section" id="how-it-works">
    <ScrollReveal className="centered-intro"><span className="landing-eyebrow">A BETTER STARTING POINT</span><h2>From document to <span>direction.</span></h2><p>Four focused steps. One resume workspace that stays yours.</p></ScrollReveal>
    <div className="steps-grid">{steps.map(([title, copy, icon], index) => <ScrollReveal className="how-step" delay={index * 80} key={title}><div className="step-top"><span>0{index + 1}</span><div className="landing-icon-box"><LandingIcon name={icon} /></div></div><h3>{title}</h3><p>{copy}</p>{index < steps.length - 1 && <span className="step-connector" aria-hidden="true"><LandingIcon name="arrow" size={15} /></span>}</ScrollReveal>)}</div>
  </section>
}
