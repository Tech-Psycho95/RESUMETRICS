import { useRef } from 'react'
import LandingIcon from './LandingIcon.jsx'
import { LinkedInMark } from '../ResumeStartOptions.jsx'
import ScrollReveal from './ScrollReveal.jsx'
import useScrollProgress from './useScrollProgress.js'

const features = [
  { id: 'start', tag: 'Start', title: 'Begin any way you like', text: 'Start from a blank page, upload an existing resume, or import your LinkedIn profile PDF. Your details are pulled out and dropped into a template.', Visual: StartVisual },
  { id: 'editor', tag: 'Editor', title: 'A studio for your resume', text: 'Highlight a few words to bold or colour them, pick from 100+ fonts and a full colour catalogue, and undo anything. Every edit shows on the page instantly.', Visual: EditorVisual },
  { id: 'nimbus', tag: 'AI assistant', title: <>Ask <span className="nimbus-wordmark landing-nimbus">NIMBUS</span> to rewrite it</>, text: 'Chat to deepen a summary, sharpen bullets or add an education entry. NIMBUS edits content only and is checked so it never invents facts.', Visual: NimbusVisual },
  { id: 'match', tag: 'Job match', title: 'Match it to the job', text: 'Paste a job description to get a match score, the skills you are missing, and fixes you can apply with one click on Execute.', Visual: MatchVisual },
  { id: 'github', tag: 'Evidence', title: 'Back it up with GitHub', text: 'Scan your 25 most recent repositories to see your languages by share of code and which resume skills your work actually proves.', Visual: GithubVisual },
  { id: 'export', tag: 'Export', title: 'Export exactly what you see', text: 'Download a crisp PDF with selectable text that matches the editor down to the last font and colour.', Visual: ExportVisual }
]

export default function FeatureShowcase() {
  return <section className="showcase" id="features">
    <ScrollReveal className="showcase-intro">
      <span className="landing-eyebrow">WHAT'S NEW</span>
      <h2>Everything you need, <span>from first draft to final PDF.</span></h2>
    </ScrollReveal>
    <div className="showcase-list">
      {features.map((feature, index) => <FeatureCard key={feature.id} feature={feature} index={index} />)}
    </div>
  </section>
}

function FeatureCard({ feature, index }) {
  const ref = useRef(null)
  useScrollProgress(ref, 'pass')
  const { Visual } = feature
  return <ScrollReveal className={`feature-row${index % 2 ? ' is-flipped' : ''}`}>
    <article className="feature-box" ref={ref}>
      <div className="feature-copy">
        <span className="feature-tag">{String(index + 1).padStart(2, '0')} · {feature.tag}</span>
        <h3>{feature.title}</h3>
        <p>{feature.text}</p>
      </div>
      <div className="feature-visual" aria-hidden="true"><div className="feature-visual-inner"><Visual /></div></div>
    </article>
  </ScrollReveal>
}

function StartVisual() {
  return <div className="v-start">
    {[[<LandingIcon name="edit" size={20} />, 'Start from scratch'], [<LandingIcon name="upload" size={20} />, 'Upload resume'], [<LinkedInMark size={22} />, 'Import from LinkedIn']].map(([icon, label]) => <div className="v-tile" key={label}>{icon}<span>{label}</span></div>)}
  </div>
}

function EditorVisual() {
  return <div className="v-editor">
    <div className="v-toolbar"><b>B</b><i>I</i><u>U</u><s>S</s><span className="v-font">Inter ▾</span><span className="v-swatch" /><span className="v-swatch two" /><span className="v-swatch three" /></div>
    <p>Led a team of four to ship a <mark>real-time analytics dashboard</mark> used by <strong>12k weekly users</strong>.</p>
    <div className="v-lines"><i /><i /><i /></div>
  </div>
}

function NimbusVisual() {
  return <div className="v-chat">
    <p className="nimbus-wordmark v-chat-mark">NIMBUS</p>
    <p className="v-bubble user">Make my summary more specific</p>
    <p className="v-bubble bot">Done. I added your 38% load-time win and team lead role, using only facts from your resume.</p>
    <p className="v-task"><span>Rewriting summary…</span></p>
  </div>
}

function MatchVisual() {
  return <div className="v-match">
    <svg viewBox="0 0 120 120" className="v-ring"><circle cx="60" cy="60" r="50" /><circle cx="60" cy="60" r="50" className="v-ring-fill" /></svg>
    <strong>82%</strong>
    <div className="v-fixes">
      <span className="v-missing">Missing: Docker, Kubernetes</span>
      <div className="v-fix"><span>Add "Docker" to Skills</span><b>Execute</b></div>
      <div className="v-fix"><span>Mention CI pipelines</span><b>Execute</b></div>
    </div>
  </div>
}

function GithubVisual() {
  const langs = [['TypeScript', 46, '#3178c6'], ['JavaScript', 27, '#e3b341'], ['Python', 17, '#3fa37a'], ['CSS', 10, '#8b5cf6']]
  return <div className="v-github">
    <div className="v-bar">{langs.map(([name, share, colour]) => <i key={name} style={{ '--w': `${share}%`, background: colour }} />)}</div>
    <ul>{langs.map(([name, share, colour]) => <li key={name}><span style={{ background: colour }} />{name}<b>{share}%</b></li>)}</ul>
    <small>From your 25 most recent repositories</small>
  </div>
}

function ExportVisual() {
  return <div className="v-export">
    <div className="v-page"><b /><i /><i /><i className="short" /><b /><i /><i className="short" /></div>
    <span className="v-download"><LandingIcon name="download" size={15} /> resume.pdf</span>
  </div>
}
