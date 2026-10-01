import React from 'react'
import ProfilePhotoControls from './ProfilePhotoControls.jsx'

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

function Field({ label, path, value, onChange, multiline = false, type = 'text', required = false, parse = value => value }) {
  const id = `builder-${path.replace(/[^a-z0-9]+/gi, '-')}`
  const Input = multiline ? 'textarea' : 'input'
  return <label className="builder-field" htmlFor={id}>
    <span>{label}{required && <span className="builder-required"> *</span>}</span>
    <Input id={id} type={multiline ? undefined : type} value={value} required={required} rows={multiline ? 3 : undefined} onChange={event => onChange(path, parse(event.target.value))} />
  </label>
}

const emptyExperience = () => ({ role: '', company: '', location: '', startDate: '', endDate: '', bullets: [] })
const emptyEducation = () => ({ degree: '', institution: '', location: '', startDate: '', endDate: '', gpa: '', details: [] })
const emptyProject = () => ({ name: '', techStack: [], description: '', bullets: [] })

function EntryCard({ title, children, onRemove }) {
  return <fieldset className="builder-entry-card">
    <legend><span>{title}</span><button className="builder-remove-button" type="button" onClick={onRemove}>Remove</button></legend>
    {children}
  </fieldset>
}

export default function ResumeBuilderForm({ resumeData, onChange, fonts, fontFamily, onFontChange, photo, onPhotoChange, photoError }) {
  const updateField = (path, value) => onChange(setPath(resumeData, path, value))
  const updateArray = (key, callback) => onChange({ ...resumeData, [key]: callback(asArray(resumeData[key])) })
  const updateLink = (kind, value) => {
    const links = asArray(resumeData.links).map(link => typeof link === 'string' ? { label: link, url: link } : { ...link })
    const marker = kind.toLowerCase()
    let index = links.findIndex(link => `${link.label ?? ''} ${link.url ?? ''}`.toLowerCase().includes(marker))
    if (index < 0) index = links.length
    if (!value.trim()) {
      if (index < links.length) links.splice(index, 1)
    } else links[index] = { label: kind, url: value.trim() }
    onChange({ ...resumeData, links })
  }
  const linkValue = kind => {
    const marker = kind.toLowerCase()
    const link = asArray(resumeData.links).find(item => `${typeof item === 'string' ? item : `${item?.label ?? ''} ${item?.url ?? ''}`}`.toLowerCase().includes(marker))
    return typeof link === 'string' ? link : link?.url ?? ''
  }

  return <section className="panel section-panel resume-builder-form" aria-label="Resume details form">
    <header className="builder-form-heading">
      <h2>Resume details</h2>
      <p>Enter details; the preview updates live.</p>
    </header>

    <details className="builder-form-section" open>
      <summary>Personal information</summary>
      <div className="builder-field-grid">
        <Field label="Full name" path="fullName" value={text(resumeData.fullName)} onChange={updateField} required />
        <Field label="Professional headline" path="headline" value={text(resumeData.headline)} onChange={updateField} />
        <Field label="Email" path="email" value={text(resumeData.email)} onChange={updateField} type="email" required />
        <Field label="Phone" path="phone" value={text(resumeData.phone)} onChange={updateField} type="tel" />
        <Field label="Location" path="location" value={text(resumeData.location)} onChange={updateField} />
        <Field label="LinkedIn URL" path="linkedin" value={linkValue('linkedin')} onChange={(_, value) => updateLink('LinkedIn', value)} type="url" />
        <Field label="GitHub or portfolio URL" path="github" value={linkValue('github') || linkValue('portfolio')} onChange={(_, value) => updateLink('GitHub', value)} type="url" />
      </div>
    </details>

    <details className="builder-form-section" open>
      <summary>Professional summary</summary>
      <Field label="Summary" path="summary" value={text(resumeData.summary)} onChange={updateField} multiline />
    </details>

    <details className="builder-form-section">
      <summary>Experience <span className="builder-count">{asArray(resumeData.experience).length}</span></summary>
      {asArray(resumeData.experience).map((item, index) => <EntryCard title={`Position ${index + 1}`} key={item.id || index} onRemove={() => updateArray('experience', items => items.filter((_, itemIndex) => itemIndex !== index))}>
        <div className="builder-field-grid">
          <Field label="Job title" path={`experience.${index}.role`} value={text(item.role)} onChange={updateField} />
          <Field label="Company" path={`experience.${index}.company`} value={text(item.company)} onChange={updateField} />
          <Field label="Location" path={`experience.${index}.location`} value={text(item.location)} onChange={updateField} />
          <Field label="Start date" path={`experience.${index}.startDate`} value={text(item.startDate)} onChange={updateField} />
          <Field label="End date" path={`experience.${index}.endDate`} value={text(item.endDate)} onChange={updateField} />
        </div>
        <Field label="Impact and responsibilities" path={`experience.${index}.bullets`} value={asArray(item.bullets).join('\n')} onChange={updateField} multiline parse={fromLines} />
      </EntryCard>)}
      <button className="builder-add-button" type="button" onClick={() => updateArray('experience', items => [...items, emptyExperience()])}>+ Add experience</button>
    </details>

    <details className="builder-form-section">
      <summary>Education <span className="builder-count">{asArray(resumeData.education).length}</span></summary>
      {asArray(resumeData.education).map((item, index) => <EntryCard title={`Education ${index + 1}`} key={item.id || index} onRemove={() => updateArray('education', items => items.filter((_, itemIndex) => itemIndex !== index))}>
        <div className="builder-field-grid">
          <Field label="Degree or qualification" path={`education.${index}.degree`} value={text(item.degree)} onChange={updateField} />
          <Field label="School or institution" path={`education.${index}.institution`} value={text(item.institution)} onChange={updateField} />
          <Field label="Location" path={`education.${index}.location`} value={text(item.location)} onChange={updateField} />
          <Field label="Start year" path={`education.${index}.startDate`} value={text(item.startDate)} onChange={updateField} />
          <Field label="End year" path={`education.${index}.endDate`} value={text(item.endDate)} onChange={updateField} />
          <Field label="GPA or grade" path={`education.${index}.gpa`} value={text(item.gpa)} onChange={updateField} />
        </div>
        <Field label="Coursework, honors, or details" path={`education.${index}.details`} value={asArray(item.details).join('\n')} onChange={updateField} multiline parse={fromLines} />
      </EntryCard>)}
      <button className="builder-add-button" type="button" onClick={() => updateArray('education', items => [...items, emptyEducation()])}>+ Add education</button>
    </details>

    <details className="builder-form-section">
      <summary>Projects <span className="builder-count">{asArray(resumeData.projects).length}</span></summary>
      {asArray(resumeData.projects).map((item, index) => <EntryCard title={`Project ${index + 1}`} key={item.id || index} onRemove={() => updateArray('projects', items => items.filter((_, itemIndex) => itemIndex !== index))}>
        <Field label="Project name" path={`projects.${index}.name`} value={text(item.name)} onChange={updateField} />
        <Field label="Technologies" path={`projects.${index}.techStack`} value={asArray(item.techStack).join(', ')} onChange={updateField} parse={fromList} />
        <Field label="Description" path={`projects.${index}.description`} value={text(item.description)} onChange={updateField} multiline />
        <Field label="Contributions or results" path={`projects.${index}.bullets`} value={asArray(item.bullets).join('\n')} onChange={updateField} multiline parse={fromLines} />
      </EntryCard>)}
      <button className="builder-add-button" type="button" onClick={() => updateArray('projects', items => [...items, emptyProject()])}>+ Add project</button>
    </details>

    <details className="builder-form-section">
      <summary>Skills</summary>
      <div className="builder-field-grid">
        {Object.entries(resumeData.skills ?? {}).map(([category, values]) => <Field key={category} label={category.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase())} path={`skills.${category}`} value={asArray(values).join(', ')} onChange={updateField} parse={fromList} />)}
      </div>
    </details>

    {['certifications', 'achievements'].map(key => <details className="builder-form-section" key={key}>
      <summary>{key === 'certifications' ? 'Certifications' : 'Achievements'} <span className="builder-count">{asArray(resumeData[key]).length}</span></summary>
      {asArray(resumeData[key]).map((item, index) => <div className="builder-list-row" key={index}>
        <input aria-label={`${key === 'certifications' ? 'Certification' : 'Achievement'} ${index + 1}`} value={text(item)} onChange={event => updateField(`${key}.${index}`, event.target.value)} />
        <button type="button" className="builder-remove-button" onClick={() => updateArray(key, items => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${key === 'certifications' ? 'certification' : 'achievement'} ${index + 1}`}>Remove</button>
      </div>)}
      <button className="builder-add-button" type="button" onClick={() => updateArray(key, items => [...items, ''])}>+ Add {key === 'certifications' ? 'certification' : 'achievement'}</button>
    </details>)}

    <details className="builder-form-section">
      <summary>Typography</summary>
      <label className="builder-field" htmlFor="builder-font-family"><span>Resume font</span>
        <select id="builder-font-family" value={fontFamily} onChange={event => onFontChange(event.target.value)}>
          {[...new Set(fonts.map(font => font.category))].map(category => <optgroup label={category} key={category}>
            {fonts.filter(font => font.category === category).map(font => <option value={font.family} key={font.name}>{font.name}</option>)}
          </optgroup>)}
        </select>
      </label>
    </details>

    <ProfilePhotoControls photo={photo} onChange={onPhotoChange} error={photoError} />
  </section>
}
