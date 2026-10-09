import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/resumetrics-logo.png'
import LandingIcon from './LandingIcon.jsx'
import useScrollProgress from './useScrollProgress.js'

// Each animated piece plays while the hero's scroll progress --p moves from s to e.
const at = (s, e, extra) => ({ '--s': s, '--e': e, ...extra })

const summary = [
  'Full-stack engineer who ships product features end to end, from data model to polished UI.',
  'Cut page load by 38% and led a 4-person team through a design-system migration.'
]
const roles = [
  { title: 'Software Engineer', org: 'Northwind Labs', dates: '2024 – Present', bullets: ['Built a real-time analytics dashboard used by 12k weekly users', 'Rewrote the billing service in Node, cutting errors by 61%', 'Mentored two interns through their first production launches'] },
  { title: 'Frontend Intern', org: 'Brightpath', dates: '2023', bullets: ['Shipped an accessible component library in React', 'Automated visual regression tests across 40 screens', 'Reduced bundle size by 24% with route-level splitting'] }
]
const skills = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL', 'AWS', 'Figma', 'CI/CD']
const chips = [
  { label: 'Name', x: '-34vw', y: '-24vh', s: .02, e: .14 },
  { label: 'Summary', x: '33vw', y: '-14vh', s: .16, e: .3 },
  { label: 'Experience', x: '-36vw', y: '8vh', s: .3, e: .48 },
  { label: 'Skills', x: '34vw', y: '16vh', s: .5, e: .6 },
  { label: 'Education', x: '-30vw', y: '28vh', s: .58, e: .67 }
]

export default function CinematicHero() {
  const navigate = useNavigate()
  const sceneRef = useRef(null)
  useScrollProgress(sceneRef, 'pin')

  return <section className="cine" id="top" ref={sceneRef}>
    <div className="cine-stage">
      <div className="cine-layer cine-grid" aria-hidden="true" />
      <div className="cine-layer cine-orbs" aria-hidden="true"><i /><i /><i /></div>

      <div className="cine-progress" aria-hidden="true"><span /></div>

      <div className="cine-brand fx" style={at(.72, .88)}>
        <img src={logo} alt="Resumetrics" className="cine-logo" />
        <div className="cine-tagline fx" style={at(.84, .95)}>
          <p>Resumes built from your real work, tuned to every job.</p>
          <button type="button" className="landing-primary-cta" onClick={() => navigate('/login')}>Get started <LandingIcon name="arrow" size={16} /></button>
        </div>
      </div>

      <div className="cine-hint fx" style={at(0, .05)} aria-hidden="true"><span className="cine-mouse"><i /></span>Scroll to build a resume</div>

      <div className="cine-chips" aria-hidden="true">
        {chips.map(chip => <span key={chip.label} className="cine-chip fx" style={at(chip.s, chip.e, { '--x': chip.x, '--y': chip.y })}><LandingIcon name="spark" size={12} />{chip.label}</span>)}
      </div>

      <div className="cine-camera fx" style={at(.72, .9)}>
        <div className="cine-deck" aria-hidden="true">
          {deck.map((card, i) => <div key={card.tpl} className="cine-deck-card fx" style={at(.78 + i * .025, .9 + i * .02, { '--slot': card.slot, '--lift': Math.abs(card.slot), '--tilt': card.tilt })}>
            <ResumeSheet className={`tpl-${card.tpl}`} style={{ '--p': 1 }} />
          </div>)}
        </div>
        <div className="cine-tilt fx" style={at(0, .12)}>
          <ResumeSheet />
        </div>
      </div>
    </div>
  </section>
}

// The same resume in other templates, fanned out behind the original once the logo appears.
const deck = [
  { tpl: 'serif', slot: -1, tilt: '-4deg' },
  { tpl: 'band', slot: 1, tilt: '4deg' },
  { tpl: 'rail', slot: -2, tilt: '-8deg' },
  { tpl: 'mono', slot: 2, tilt: '8deg' }
]

function ResumeSheet({ className = '', style }) {
  // Experience runs from .32 to .54: each role gets a header beat then three bullet beats.
  let beat = .32
  const next = width => { const s = beat; beat += width; return [s, beat] }
  return (
    <article className={`cine-paper ${className}`} style={style} aria-label="A sample resume">
      <div className="cine-sheen fx" style={at(.66, .76)} aria-hidden="true" />
      <span className="cine-done fx" style={at(.66, .72)}><LandingIcon name="shield" size={12} /> 100% complete</span>

      <header className="cv-head">
        <h3 className="fx wipe" style={at(.04, .12)}>Aarav Mehta</h3>
        <p className="cv-role fx wipe" style={at(.1, .16)}>Software Engineer</p>
        <p className="cv-contact fx wipe" style={at(.14, .2)}>aarav@mail.com · Bengaluru · github.com/aarav · linkedin.com/in/aarav</p>
        <span className="cv-rule fx" style={at(.17, .22)} />
      </header>

      <Section title="Summary" s={.2}>
        {summary.map((line, i) => <p key={i} className="fx wipe" style={at(.21 + i * .06, .27 + i * .06)}>{line}</p>)}
      </Section>

      <Section title="Experience" s={.32}>
        {roles.map(role => {
          const [hs, he] = next(.04)
          return <div className="cv-item" key={role.org}>
            <div className="cv-item-head fx wipe" style={at(hs, he)}><b>{role.title} · {role.org}</b><span>{role.dates}</span></div>
            <ul>{role.bullets.map(text => { const [s, e] = next(.025); return <li key={text} className="fx wipe" style={at(s, e)}>{text}</li> })}</ul>
          </div>
        })}
      </Section>

      <Section title="Skills" s={.52}>
        <div className="cv-skills">{skills.map((skill, i) => <i key={skill} className="fx pop" style={at(.53 + i * .011, .56 + i * .011)}>{skill}</i>)}</div>
      </Section>

      <Section title="Education" s={.6}>
        <div className="cv-item-head fx wipe" style={at(.61, .67)}><b>B.Tech, Computer Science · IIT Delhi</b><span>2020 – 2024</span></div>
      </Section>
    </article>
  )
}

function Section({ title, s, children }) {
  return <section className="cv-section">
    <h4 className="fx wipe" style={at(s, s + .03)}>{title}</h4>
    <div className="cv-body">
      <div className="cv-ghost fx" style={at(s, s + .06)} aria-hidden="true"><i /><i /><i /></div>
      {children}
    </div>
  </section>
}
