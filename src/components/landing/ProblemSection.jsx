import ScrollReveal from './ScrollReveal.jsx'
import LandingIcon from './LandingIcon.jsx'

const problems = [
  ['Old files fight back', 'Editing an existing resume often means fighting broken formatting, scattered versions, and fragile layouts.', 'edit'],
  ['Templates force a reset', 'Switching designs should not mean rewriting the experience you already worked hard to capture.', 'switch'],
  ['Great work gets buried', 'Important skills, projects, and outcomes disappear inside documents that were never built for change.', 'skills']
]

export default function ProblemSection() {
  return <section className="landing-section problem-section" id="product">
    <div className="section-intro"><ScrollReveal><span className="landing-eyebrow">THE FRICTION</span><h2>Your experience is valuable.<br /><span>Your document should keep up.</span></h2></ScrollReveal><ScrollReveal delay={100}><p>Most resume tools ask you to begin with a blank page. Resumetrics begins with the work you have already done.</p></ScrollReveal></div>
    <div className="problem-grid">{problems.map(([title, copy, icon], index) => <ScrollReveal className="problem-card" delay={index * 90} key={title}><div className="card-number">0{index + 1}</div><div className="landing-icon-box"><LandingIcon name={icon} /></div><h3>{title}</h3><p>{copy}</p></ScrollReveal>)}</div>
  </section>
}
