import { useMemo } from 'react'
import { extractJd } from '../../shared/jdExtract.js'
import { SIGNOFFS, applyLetterEdit, letterFromJob, salutationOf, signoffOf } from '../../shared/letterModel.js'

const Field = ({ label, hint, children }) => <label className="fp-field is-wide"><span className="fp-label">{label}</span>{children}{hint && <small className="letter-field-hint">{hint}</small>}</label>

/** The Details tab: who the letter is for, the date, the job post and the sign-off. Everything is also editable on the page. */
export default function LetterDetails({ letter, onChange, jobText, onJobTextChange, supportsPhoto }) {
  const detected = useMemo(() => jobText && jobText.trim().length > 20 ? extractJd(jobText) : null, [jobText])
  const set = (path, value) => onChange(applyLetterEdit(letter, path, value))
  const recipient = letter.recipient
  const canUseJob = detected && (detected.title || detected.company)
  return <div className="fp letter-details">
    <header className="fp-head"><h2>Details</h2><div className="fp-scope"><b>Cover letter</b></div></header>

    <section className="fp-group">
      <h3>Job post <small className="letter-optional">optional</small></h3>
      <textarea className="fp-textarea" rows={5} value={jobText} placeholder="Paste the job post. NIMBUS uses it to write for this job." aria-label="Job post" onChange={event => onJobTextChange(event.target.value)} />
      {canUseJob && <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(letterFromJob(letter, detected))}>Use {detected.title}{detected.company ? ` at ${detected.company}` : ''}</button>}
    </section>

    <section className="fp-group">
      <h3>To</h3>
      <Field label="Name" hint="Leave empty to greet “Hiring Manager”."><input className="fp-input" value={recipient.name} onChange={event => set('letter.recipient.name', event.target.value)} autoComplete="off" /></Field>
      <Field label="Job title"><input className="fp-input" value={recipient.title} onChange={event => set('letter.recipient.title', event.target.value)} autoComplete="off" /></Field>
      <Field label="Company"><input className="fp-input" value={recipient.company} onChange={event => set('letter.recipient.company', event.target.value)} autoComplete="off" /></Field>
      <Field label="Address"><textarea className="fp-textarea" rows={3} value={(recipient.address ?? []).join('\n')} onChange={event => onChange({ ...letter, recipient: { ...recipient, address: event.target.value.split('\n') } })} /></Field>
    </section>

    <section className="fp-group">
      <h3>Letter</h3>
      <Field label="Job you want" hint="Shown under your name. Starts as your resume headline."><input className="fp-input" value={letter.role} placeholder="Same as resume headline" onChange={event => set('letter.role', event.target.value)} autoComplete="off" /></Field>
      <div className="fp-row">
        <Field label="Date"><input className="fp-input" value={letter.dateAuto ? '' : letter.date} placeholder="Today" onChange={event => set('letter.date', event.target.value)} autoComplete="off" /></Field>
        <Field label="Sign-off">
          <select className="format-select fp-input" value={letter.signoff} onChange={event => set('letter.signoff', event.target.value)} aria-label="Sign-off">
            <option value="">Automatic ({signoffOf({ ...letter, signoff: '' })})</option>
            {SIGNOFFS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Greeting"><input className="fp-input" value={letter.salutation} placeholder={salutationOf({ ...letter, salutation: '' })} onChange={event => set('letter.salutation', event.target.value)} autoComplete="off" /></Field>
      <label className="letter-toggle"><input type="checkbox" checked={letter.showSubject} onChange={event => onChange({ ...letter, showSubject: event.target.checked })} /><span>Add a subject line</span></label>
      {letter.showSubject && <Field label="Subject"><input className="fp-input" value={letter.subject} placeholder="Application for …" onChange={event => set('letter.subject', event.target.value)} autoComplete="off" /></Field>}
      {supportsPhoto && <label className="letter-toggle"><input type="checkbox" checked={letter.showPhoto !== false} onChange={event => onChange({ ...letter, showPhoto: event.target.checked })} /><span>Show my photo</span></label>}
    </section>
  </div>
}
