import ScrollReveal from './ScrollReveal.jsx'
import LandingIcon from './LandingIcon.jsx'

const features = [
  ['AI resume extraction', 'Turn PDF, DOCX, or TXT files into structured career data.', 'upload'],
  ['Template switching', 'Change the look without starting your content over.', 'switch'],
  ['Bullet rewriting', 'Strengthen one line at a time while keeping facts intact.', 'wand'],
  ['Skill organization', 'Group your skills into a profile that is easy to scan.', 'skills'],
  ['JD role alignment', 'Compare your draft to a target role beyond loose keywords.', 'target'],
  ['Editable workspace', 'Make focused edits in a clean, familiar document canvas.', 'edit'],
  ['Export-ready layouts', 'Take a polished draft into the format your application needs.', 'download'],
  ['Original resume safety', 'Your source stays untouched while every new draft is separate.', 'shield']
]

export default function FeatureGrid() {
  return <section className="landing-section feature-section" id="features"><ScrollReveal className="section-intro centered-feature-intro"><span className="landing-eyebrow">BUILT FOR THE NEXT EDIT</span><h2>Everything your resume needs<br /><span>to move forward.</span></h2></ScrollReveal><div className="feature-grid">{features.map(([title, copy, icon], index) => <ScrollReveal className="feature-card" delay={(index % 4) * 70} key={title}><div className="feature-icon"><LandingIcon name={icon} /></div><h3>{title}</h3><p>{copy}</p></ScrollReveal>)}</div></section>
}
