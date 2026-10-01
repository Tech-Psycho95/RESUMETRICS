import React, { useEffect, useRef, useState } from 'react'
import ProfilePhotoControls from './ProfilePhotoControls.jsx'
import { getTemplateSectionPlan } from './templates/ResumeTemplateLayout.jsx'
import { linkDisplayLabel } from '../templates/templateDataAdapter.js'
import { spokenLanguages } from '../data/languages.js'

const text = value => String(value ?? '')
const asArray = value => Array.isArray(value) ? value : []
const fromLines = value => text(value).split(/\r?\n/).map(item => item.trim()).filter(Boolean)
const fromList = value => text(value).split(/[\n,]/).map(item => item.trim()).filter(Boolean)

function setPath(source, path, value) {
  const next = structuredClone(source ?? {})
  const parts = path.split('.')
  let target = next
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]
    const key = /^\d+$/.test(part) ? Number(part) : part
    const nextIsIndex = /^\d+$/.test(parts[index + 1])
    if (target[key] == null || typeof target[key] !== 'object') target[key] = nextIsIndex ? [] : {}
    target = target[key]
  }
  const last = parts.at(-1)
  target[/^\d+$/.test(last) ? Number(last) : last] = value
  return next
}

function Field({ label, path, value, onChange, multiline = false, type = 'text', required = false, parse = value => value, hint = '' }) {
  const id = `builder-${path.replace(/[^a-z0-9]+/gi, '-')}`
  const Input = multiline ? 'textarea' : 'input'
  return <label className="builder-field" htmlFor={id}>
    <span>{label}{required && <span className="builder-required"> *</span>}</span>
    <Input id={id} type={multiline ? undefined : type} value={value} required={required} rows={multiline ? 3 : undefined} aria-describedby={hint ? `${id}-hint` : undefined} onChange={event => onChange(path, parse(event.target.value))} />
    {hint && <small className="builder-field-hint" id={`${id}-hint`}>{hint}</small>}
  </label>
}

const emptyExperience = () => ({ role: '', company: '', location: '', startDate: '', endDate: '', bullets: [] })
const emptyEducation = () => ({ degree: '', institution: '', location: '', startDate: '', endDate: '', details: [] })
const emptyProject = () => ({ name: '', techStack: [], description: '', bullets: [] })

function EntryCard({ title, children, onRemove }) {
  return <fieldset className="builder-entry-card">
    <legend><span>{title}</span><button className="builder-remove-button" type="button" onClick={onRemove}>Remove</button></legend>
    {children}
  </fieldset>
}

// How each template presents particular sections, so people know what they are filling in.
const templateSectionNotes = {
  azurill: { experience: 'Each role is marked on a timeline down the main column.', skills: 'Skills sit in the left sidebar; keep each group short.' },
  bronzor: { summary: 'Every section heading sits in a narrow column to the left of its content.' },
  chikorita: { skills: 'Shown in white on the coloured right sidebar.', summary: 'Sits under your name in the main column.' },
  ditgar: { summary: 'Shown as a highlighted panel at the top of the main column, without a heading.', experience: 'Job titles are marked with an accent bar.' },
  ditto: { summary: 'Your name and headline sit in the coloured band; the summary starts the main column.' },
  gengar: { summary: 'Shown as a highlighted panel at the top of the main column, without a heading.' },
  glalie: { skills: 'Listed in the tinted left sidebar under your boxed contact details.' },
  kakuna: { summary: 'Everything is centred, so shorter lines read best.' },
  lapras: { summary: 'Each section is drawn as its own outlined card.' },
  leafish: { skills: 'Listed in the right sidebar beside your experience.' },
  meowth: { experience: 'Position, organisation and dates share one line, so keep titles short.', education: 'Degree, school and dates share one line.' },
  pikachu: { summary: 'Your name and contact details sit in the solid header block above it.' },
  rhyhorn: { summary: 'A minimal header with lots of whitespace; short paragraphs suit it best.' },
  scizor: { summary: 'Section headings are printed in capitals with a rule above each one.' },
  'navy-professional': { education: 'This template puts education first.' },
  'curve-academic': { experience: 'Clearly dated entries; add start and end dates for every role.' }
}

// Search matches the start of any word, so "hin" finds Hindi but not Mandarin Chinese.
const matchesLanguage = (language, query) => !query.trim() || language.toLocaleLowerCase().split(/[\s-]+/).some(word => word.startsWith(query.trim().toLocaleLowerCase())) || language.toLocaleLowerCase().startsWith(query.trim().toLocaleLowerCase())

// Multi-select language picker: tick several languages, then add them all at once.
function LanguagePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState([])
  const rootRef = useRef(null)
  const selectedKeys = new Set(value.map(item => item.toLocaleLowerCase()))
  const available = spokenLanguages.filter(language => !selectedKeys.has(language.toLocaleLowerCase()) && matchesLanguage(language, query))

  useEffect(() => {
    if (!open) return undefined
    const onPointer = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const onKey = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open])

  const toggle = language => setPicked(current => current.includes(language) ? current.filter(item => item !== language) : [...current, language])
  const addPicked = () => {
    onChange([...value, ...picked])
    setPicked([])
    setQuery('')
    setOpen(false)
  }

  return <div className="language-picker" ref={rootRef}>
    {value.length > 0 && <ul className="language-chips" aria-label="Languages on your resume">{value.map(language => <li key={language}>
      {language}
      <button type="button" onClick={() => onChange(value.filter(item => item !== language))} aria-label={`Remove ${language}`}>×</button>
    </li>)}</ul>}
    <button className="language-picker-toggle" type="button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(current => !current)}>
      <span>{value.length ? 'Add more languages' : 'Choose languages'}</span><span aria-hidden="true">▾</span>
    </button>
    {open && <div className="language-picker-panel">
      <input className="language-picker-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search languages" aria-label="Search languages" autoFocus />
      <ul className="language-picker-list" role="listbox" aria-multiselectable="true" aria-label="Languages">
        {available.length ? available.map(language => <li key={language}>
          <label className={picked.includes(language) ? 'is-picked' : ''}>
            <input type="checkbox" checked={picked.includes(language)} onChange={() => toggle(language)} />
            <span>{language}</span>
          </label>
        </li>) : <li className="language-picker-empty">No languages match “{query}”.</li>}
      </ul>
      <div className="language-picker-footer">
        <span>{picked.length ? `${picked.length} selected` : 'Tick one or more'}</span>
        <button type="button" onClick={addPicked} disabled={!picked.length}><span aria-hidden="true">+</span> Add{picked.length ? ` ${picked.length}` : ''}</button>
      </div>
    </div>}
  </div>
}

export default function ResumeBuilderForm({ resumeData, onChange, fonts, fontFamily, onFontChange, photo, onPhotoChange, photoError, template }) {
  const plan = getTemplateSectionPlan(template?.id)
  const notes = templateSectionNotes[template?.id] ?? {}
  const updateField = (path, value) => onChange(setPath(resumeData, path, value))
  const updateArray = (key, callback) => onChange({ ...resumeData, [key]: callback(asArray(resumeData[key])) })
  const links = asArray(resumeData.links).map(link => typeof link === 'string' ? { label: '', url: link } : { label: text(link?.label), url: text(link?.url) })
  const saveLinks = next => onChange({ ...resumeData, links: next })
  const addLink = () => saveLinks([...links, { label: '', url: '' }])
  const updateLinkAt = (index, change) => saveLinks(links.map((link, linkIndex) => linkIndex === index ? { ...link, ...change } : link))
  const removeLink = index => saveLinks(links.filter((_, linkIndex) => linkIndex !== index))

  const SectionNote = ({ id }) => notes[id] ? <p className="builder-section-note">{notes[id]}</p> : null

  const renderSection = ({ id, title }) => {
    if (id === 'summary') return <details className="builder-form-section" open key={id}>
      <summary>{title}</summary>
      <SectionNote id={id} />
      <Field label="Summary" path="summary" value={text(resumeData.summary)} onChange={updateField} multiline />
    </details>

    if (id === 'experience') return <details className="builder-form-section" key={id}>
      <summary>{title} <span className="builder-count">{asArray(resumeData.experience).length}</span></summary>
      <SectionNote id={id} />
      {asArray(resumeData.experience).map((item, index) => <EntryCard title={`Position ${index + 1}`} key={item.id || index} onRemove={() => updateArray('experience', items => items.filter((_, itemIndex) => itemIndex !== index))}>
        <div className="builder-field-grid">
          <Field label="Job title" path={`experience.${index}.role`} value={text(item.role)} onChange={updateField} />
          <Field label="Company" path={`experience.${index}.company`} value={text(item.company)} onChange={updateField} />
          <Field label="Location" path={`experience.${index}.location`} value={text(item.location)} onChange={updateField} />
          <Field label="Start date" path={`experience.${index}.startDate`} value={text(item.startDate)} onChange={updateField} />
          <Field label="End date" path={`experience.${index}.endDate`} value={text(item.endDate)} onChange={updateField} />
        </div>
        <Field label="Impact and responsibilities" path={`experience.${index}.bullets`} value={asArray(item.bullets).join('\n')} onChange={updateField} multiline parse={fromLines} hint="One achievement per line." />
      </EntryCard>)}
      <button className="builder-add-button" type="button" onClick={() => updateArray('experience', items => [...items, emptyExperience()])}>+ Add experience</button>
    </details>

    if (id === 'education') return <details className="builder-form-section" key={id}>
      <summary>{title} <span className="builder-count">{asArray(resumeData.education).length}</span></summary>
      <SectionNote id={id} />
      {asArray(resumeData.education).map((item, index) => <EntryCard title={`Education ${index + 1}`} key={item.id || index} onRemove={() => updateArray('education', items => items.filter((_, itemIndex) => itemIndex !== index))}>
        <div className="builder-field-grid">
          <Field label="Degree or qualification" path={`education.${index}.degree`} value={text(item.degree)} onChange={updateField} />
          <Field label="School or institution" path={`education.${index}.institution`} value={text(item.institution)} onChange={updateField} />
          <Field label="Location" path={`education.${index}.location`} value={text(item.location)} onChange={updateField} />
          <Field label="Start year" path={`education.${index}.startDate`} value={text(item.startDate)} onChange={updateField} />
          <Field label="End year" path={`education.${index}.endDate`} value={text(item.endDate)} onChange={updateField} />
        </div>
        <Field label="GPA, coursework or honours" path={`education.${index}.details`} value={asArray(item.details).join('\n')} onChange={updateField} multiline parse={fromLines} hint="One detail per line, for example “GPA: 3.8/4.0”." />
      </EntryCard>)}
      <button className="builder-add-button" type="button" onClick={() => updateArray('education', items => [...items, emptyEducation()])}>+ Add education</button>
    </details>

    if (id === 'projects') return <details className="builder-form-section" key={id}>
      <summary>{title} <span className="builder-count">{asArray(resumeData.projects).length}</span></summary>
      <SectionNote id={id} />
      {asArray(resumeData.projects).map((item, index) => <EntryCard title={`Project ${index + 1}`} key={item.id || index} onRemove={() => updateArray('projects', items => items.filter((_, itemIndex) => itemIndex !== index))}>
        <Field label="Project name" path={`projects.${index}.name`} value={text(item.name)} onChange={updateField} />
        <Field label="Technologies" path={`projects.${index}.techStack`} value={asArray(item.techStack).join(', ')} onChange={updateField} parse={fromList} hint="Separate with commas." />
        <Field label="Description" path={`projects.${index}.description`} value={text(item.description)} onChange={updateField} multiline />
        <Field label="Contributions or results" path={`projects.${index}.bullets`} value={asArray(item.bullets).join('\n')} onChange={updateField} multiline parse={fromLines} hint="One result per line." />
      </EntryCard>)}
      <button className="builder-add-button" type="button" onClick={() => updateArray('projects', items => [...items, emptyProject()])}>+ Add project</button>
    </details>

    if (id === 'skills') return <details className="builder-form-section" key={id}>
      <summary>{title}</summary>
      <SectionNote id={id} />
      <div className="builder-field-grid">
        {Object.entries(resumeData.skills ?? {}).map(([category, values]) => <Field key={category} label={category === 'languages' ? 'Programming languages' : category.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase())} path={`skills.${category}`} value={asArray(values).join(', ')} onChange={updateField} parse={fromList} />)}
      </div>
    </details>

    if (id === 'languages') return <details className="builder-form-section" key={id}>
      <summary>{title} <span className="builder-count">{asArray(resumeData.languages).length}</span></summary>
      <SectionNote id={id} />
      <LanguagePicker value={asArray(resumeData.languages).filter(Boolean)} onChange={languages => updateField('languages', languages)} />
    </details>

    if (id === 'certifications' || id === 'achievements') {
      const singular = id === 'certifications' ? 'certification' : 'achievement'
      return <details className="builder-form-section" key={id}>
        <summary>{title} <span className="builder-count">{asArray(resumeData[id]).length}</span></summary>
        <SectionNote id={id} />
        {asArray(resumeData[id]).map((item, index) => <div className="builder-list-row" key={index}>
          <input aria-label={`${title} ${index + 1}`} value={text(item)} onChange={event => updateField(`${id}.${index}`, event.target.value)} />
          <button type="button" className="builder-remove-button" onClick={() => updateArray(id, items => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${singular} ${index + 1}`}>Remove</button>
        </div>)}
        <button className="builder-add-button" type="button" onClick={() => updateArray(id, items => [...items, ''])}>+ Add {singular}</button>
      </details>
    }
    return null
  }

  const mainSections = plan.sections.filter(section => section.placement === 'main')
  const sidebarSections = plan.sections.filter(section => section.placement === 'sidebar')
  const isTwoColumn = plan.sidebarSide !== 'none' && sidebarSections.length > 0

  return <section className="panel section-panel resume-builder-form" aria-label="Resume details form">
    <header className="builder-form-heading">
      <h2>Fill in {template?.name ?? 'your resume'}</h2>
      <p>{isTwoColumn
        ? `Two-column layout with the sidebar on the ${plan.sidebarSide}. Sections are grouped and ordered exactly as they appear on the page.`
        : 'Single-column layout. Sections are listed in the order they appear on the page.'} The preview updates as you type.</p>
    </header>

    <div className="builder-region">
      <span className="builder-region-label">Header</span>
      <details className="builder-form-section" open>
        <summary>Name and contact details</summary>
        <div className="builder-field-grid">
          <Field label="Full name" path="fullName" value={text(resumeData.fullName)} onChange={updateField} required />
          <Field label="Professional headline" path="headline" value={text(resumeData.headline)} onChange={updateField} />
          <Field label="Email" path="email" value={text(resumeData.email)} onChange={updateField} type="email" required />
          <Field label="Phone" path="phone" value={text(resumeData.phone)} onChange={updateField} type="tel" />
          <Field label="Location" path="location" value={text(resumeData.location)} onChange={updateField} />
        </div>
        <div className="builder-links">
          <div className="builder-links-heading">
            <span>Links <span className="builder-count">{links.length}</span></span>
            <button className="builder-link-add" type="button" onClick={addLink} aria-label="Add a link" title="Add a link">+</button>
          </div>
          {links.length === 0 && <p className="builder-links-empty">Add LinkedIn, GitHub, a portfolio or any other link. Each one appears on the resume as a labelled hyperlink.</p>}
          {links.map((link, index) => <div className="builder-link-row" key={index}>
            <label className="builder-field"><span>Label</span><input value={text(link.label)} placeholder={link.url ? linkDisplayLabel(link.url) : 'e.g. LinkedIn'} onChange={event => updateLinkAt(index, { label: event.target.value })} aria-label={`Link ${index + 1} label`} /></label>
            <label className="builder-field"><span>Link</span><input type="url" value={text(link.url)} placeholder="https://" onChange={event => updateLinkAt(index, { url: event.target.value.trim() })} aria-label={`Link ${index + 1} address`} /></label>
            <button className="builder-remove-button" type="button" onClick={() => removeLink(index)} aria-label={`Remove link ${index + 1}`}>Remove</button>
          </div>)}
        </div>
      </details>
      {template?.supportsPhoto && <ProfilePhotoControls photo={photo} onChange={onPhotoChange} error={photoError} />}
    </div>

    {isTwoColumn
      ? <>
        <div className="builder-region">
          <span className="builder-region-label">Main column</span>
          {mainSections.map(renderSection)}
        </div>
        <div className="builder-region">
          <span className="builder-region-label">Sidebar ({plan.sidebarSide})</span>
          {sidebarSections.map(renderSection)}
        </div>
      </>
      : <div className="builder-region">
        <span className="builder-region-label">Page sections</span>
        {plan.sections.map(renderSection)}
      </div>}

    <details className="builder-form-section">
      <summary>Typography</summary>
      <label className="builder-field" htmlFor="builder-font-family"><span>Resume font</span>
        <select id="builder-font-family" value={fontFamily} onChange={event => onFontChange(event.target.value)}>
          {[...new Set(fonts.map(font => font.category))].map(category => <optgroup label={category} key={category}>
            {fonts.filter(font => font.category === category).map(font => <option value={font.family} key={font.name}>{font.name}</option>)}
          </optgroup>)}
        </select>
        <small className="builder-field-hint">{template?.name ?? 'This template'} is designed with {fonts.find(font => font.family === template?.defaultTheme?.fontFamily)?.name ?? 'its own font'}.</small>
      </label>
    </details>
  </section>
}
