import ScrollReveal from './ScrollReveal.jsx'
import LandingIcon from './LandingIcon.jsx'

const steps = [['01', 'Turn files into data', 'Upload an existing resume and let AI find the skills, experience, education, projects, and achievements inside it.'], ['02', 'Shape a fresh draft', 'Choose a professional template and create a new editable resume while your original stays untouched.'], ['03', 'Make every line count', 'Rewrite bullets, organize skills, and compare your draft against the role you want next.']]

export default function SolutionSection() {
  return <section className="landing-section solution-section">
    <div className="solution-layout"><ScrollReveal className="solution-copy"><span className="landing-eyebrow">THE RESUMETRICS APPROACH</span><h2>Turn any resume into <span>structured career data.</span></h2><p>A clear path from document to opportunity. Your existing experience becomes a flexible foundation you can edit, improve, and export with confidence.</p><button className="text-arrow-link" type="button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>See how it works <LandingIcon name="arrow" size={16} /></button></ScrollReveal><div className="solution-stack">{steps.map(([number, title, copy], index) => <ScrollReveal className="solution-row" delay={index * 100} key={number}><span className="solution-number">{number}</span><div><h3>{title}</h3><p>{copy}</p></div><LandingIcon name="arrow" size={17} /></ScrollReveal>)}</div></div>
  </section>
}
