const valueOr = (value, fallback) => value || fallback
const allSkills = skills => Object.values(skills ?? {}).flat().filter(Boolean)
const period = item => [item.startDate, item.endDate].filter(Boolean).join(' — ')

function Section({ title, children, className = '' }) {
  return <section className={`resume-section ${className}`}><h2>{title}</h2>{children}</section>
}

function Experience({ items }) {
  return <>{items.length ? items.map((item, index) => <article className="resume-entry" key={`${item.company}-${index}`}><div className="resume-entry-heading"><strong>{item.role}</strong><span>{period(item)}</span></div><p>{[item.company, item.location].filter(Boolean).join(' · ')}</p>{item.bullets.length > 0 && <ul>{item.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul>}</article>) : <p className="resume-placeholder">Add your work experience here.</p>}</>
}

function Projects({ items }) {
  return <>{items.length ? items.map((item, index) => <article className="resume-entry" key={`${item.name}-${index}`}><div className="resume-entry-heading"><strong>{item.name}</strong><span>{item.techStack.join(' · ')}</span></div>{item.description && <p>{item.description}</p>}{item.bullets.length > 0 && <ul>{item.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul>}</article>) : <p className="resume-placeholder">Add a project that shows your impact.</p>}</>
}

function Education({ items }) {
  return <>{items.length ? items.map((item, index) => <article className="resume-entry" key={`${item.institution}-${index}`}><div className="resume-entry-heading"><strong>{item.degree}</strong><span>{period(item)}</span></div><p>{[item.institution, item.location].filter(Boolean).join(' · ')}</p>{item.details.length > 0 && <ul>{item.details.map((detail, detailIndex) => <li key={detailIndex}>{detail}</li>)}</ul>}</article>) : <p className="resume-placeholder">Add your education details here.</p>}</>
}

export default function ResumeTemplateLayout({ resumeData, editorRef, variant, editorStyle, useGlobalTextColor = false, footerText = '', preview = false }) {
  const skills = allSkills(resumeData.skills)
  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
  const links = resumeData.links.map(link => link.label || link.url).filter(Boolean)
  const isSidebar = variant === 'elegant-sidebar'

  return <article ref={editorRef} style={editorStyle} className={`generated-resume template-${variant} ${useGlobalTextColor ? 'ai-global-text-color' : ''} ${preview ? 'template-live-preview' : ''}`} contentEditable={!preview} role="textbox" aria-multiline="true" aria-label={preview ? 'Resume template preview' : 'Generated editable resume'} suppressContentEditableWarning spellCheck>
    <header className="generated-resume-header"><div><h1>{valueOr(resumeData.fullName, 'YOUR NAME')}</h1><p>{valueOr(resumeData.headline, 'Professional headline')}</p></div><div className="generated-contact">{contact.concat(links).length ? contact.concat(links).map((item, index) => <span key={index}>{item}</span>) : <span>email@example.com · City, Country · portfolio link</span>}</div></header>
    {isSidebar ? <div className="generated-resume-sidebar-layout"><aside><Section title="Skills"><div className="skill-chip-list">{skills.length ? skills.map((skill, index) => <span key={`${skill}-${index}`}>{skill}</span>) : <span className="resume-placeholder">Add skills</span>}</div></Section><Section title="Education"><Education items={resumeData.education} /></Section>{resumeData.certifications.length > 0 && <Section title="Certifications"><ul>{resumeData.certifications.map((item, index) => <li key={index}>{item}</li>)}</ul></Section>}</aside><div className="generated-resume-main"><Section title="Profile"><p>{valueOr(resumeData.summary, 'Write a focused summary that explains the value you bring.')}</p></Section><Section title="Experience"><Experience items={resumeData.experience} /></Section><Section title="Projects"><Projects items={resumeData.projects} /></Section></div></div> : <div className="generated-resume-main"><Section title={variant === 'tech-focused' ? 'Profile' : 'Summary'}><p>{valueOr(resumeData.summary, 'Write a focused summary that explains the value you bring.')}</p></Section><Section title={variant === 'compact-ats' ? 'Core skills' : 'Skills'}><div className="skill-chip-list">{skills.length ? skills.map((skill, index) => <span key={`${skill}-${index}`}>{skill}</span>) : <span className="resume-placeholder">Add the skills most relevant to your target role.</span>}</div></Section><Section title="Experience"><Experience items={resumeData.experience} /></Section><Section title="Projects"><Projects items={resumeData.projects} /></Section><Section title="Education"><Education items={resumeData.education} /></Section>{resumeData.certifications.length > 0 && <Section title="Certifications"><ul>{resumeData.certifications.map((item, index) => <li key={index}>{item}</li>)}</ul></Section>}{resumeData.achievements.length > 0 && <Section title="Achievements"><ul>{resumeData.achievements.map((item, index) => <li key={index}>{item}</li>)}</ul></Section>}</div>}
    {footerText && <footer className="generated-resume-footer">{footerText}</footer>}
  </article>
}
