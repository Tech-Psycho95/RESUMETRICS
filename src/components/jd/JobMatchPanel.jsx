import { useEffect, useRef, useState } from 'react'
import ScoreRing from '../charts/ScoreRing.jsx'

const ACCEPT = '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

/** Job match: paste or attach a job description; see the match and apply fixes. */
export default function JobMatchPanel({ analysis, busy, draft, onDraftChange, attachedFile, onAttachFile, onClearFile, onAnalyse, onStop, onExecuteFix, onUndoFix, onAnswerFix, onReset, onRetry, available, error }) {
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)
  const draftRef = useRef(null)
  useEffect(() => { if (!draft && draftRef.current) draftRef.current.style.height = '' }, [draft])
  const result = analysis?.score != null ? analysis : null
  const fixes = analysis?.fixes ?? []
  const fixState = analysis?.fixState ?? {}
  const skills = result?.categories?.skills
  const missing = skills?.missing?.filter(item => item.required).map(item => item.term) ?? []
  const roles = result?.categories?.experience?.roles ?? []
  const changes = fixes.filter(fix => fix.kind === 'executable')
  const additions = fixes.filter(fix => fix.kind !== 'executable')
  const levelText = { strong: 'relevant', partial: 'partly relevant', low: 'not related' }
  const stage = busy ? analysis?.stages?.at(-1)?.label : ''

  const submit = event => {
    event.preventDefault()
    if (!busy && available && (draft.trim() || attachedFile)) onAnalyse()
  }

  return <div className={`job-match${dragging ? ' is-dragging' : ''}`}
    onDragOver={event => { if (event.dataTransfer?.types?.includes('Files')) { event.preventDefault(); setDragging(true) } }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
    onDrop={event => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) onAttachFile(file) }}>
    <div className="job-match-scroll">
      {!analysis && <p className="jd-intro">Paste a job description or attach the posting to see how well your resume matches.</p>}
      {error && <p className="jd-error" role="alert">{error}</p>}
      {result && <section className="jd-result">
        <ScoreRing score={analysis.score} runId={analysis.runId} label="Match" size={128} />
        <b className="jd-title">{analysis.jd?.title}{analysis.jd?.company ? ` · ${analysis.jd.company}` : ''}</b>
        {skills && <p className="jd-line"><b>Skills</b> {skills.matched.length ? `${skills.matched.join(', ')} match` : 'None of the required skills found'}{missing.length ? ` · missing ${missing.join(', ')}` : ''}</p>}
        {roles.length > 0 && <ul className="jd-roles">{roles.map(role => <li key={role.label} className={`is-${role.level}`}><span>{role.label}{role.internship ? ' (internship)' : ''}</span><em>{levelText[role.level]}</em></li>)}</ul>}
        <button type="button" className="btn btn-link" onClick={onReset} disabled={busy}>Try another job</button>
      </section>}
      {result && !busy && analysis.fixesDegraded && <p className="jd-error">{analysis.fixesLimited ? 'The AI has reached its usage limit for now, so only basic suggestions are shown. ' : "Couldn't prepare tailored changes this time. "}<button type="button" className="btn btn-link" onClick={onRetry}>Try again</button></p>}
      {changes.length > 0 && <section className="jd-group"><h4>Changes</h4><ul className="jd-fixes">{changes.map(fix => {
        const state = fixState[fix.id]
        const done = state?.status === 'done'
        return <li key={fix.id} className={done ? 'is-done' : ''}>
          <div><b>{fix.title}</b>{fix.why && <span>{fix.why}</span>}</div>
          {done
            ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUndoFix(fix)}>Undo</button>
            : <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => onExecuteFix(fix)}>Execute</button>}
          {state?.error && <small className="jd-error">{state.error}</small>}
        </li>
      })}</ul></section>}
      {additions.length > 0 && <section className="jd-group"><h4>Could also add</h4><ul className="jd-adds">{additions.map(fix => <li key={fix.id}><b>{fix.title}</b>{fix.why && <span>{fix.why}</span>}</li>)}</ul></section>}
    </div>
    {stage && <p className="ai-task" role="status">{stage}</p>}
    {attachedFile && <p className="jd-file"><span>{attachedFile.name}</span><button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClearFile} aria-label="Remove attached file">×</button></p>}
    <form className="nimbus-input" onSubmit={submit}>
      <button type="button" className="jd-attach" onClick={() => fileRef.current?.click()} disabled={busy || !available} aria-label="Attach a job description file" title="Attach PDF, Word or text"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.5 6.5-5.6 5.6a1.6 1.6 0 1 0 2.3 2.3l5.9-5.9a3.2 3.2 0 1 0-4.5-4.5l-6 6a4.8 4.8 0 1 0 6.8 6.8l4.2-4.2" /></svg></button>
      <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onAttachFile(file) }} />
      <textarea ref={draftRef} value={draft} rows={1} maxLength={20000} disabled={!available || busy} placeholder={attachedFile ? 'Press send to analyse…' : 'Paste a job description…'} aria-label="Job description"
        onChange={event => onDraftChange(event.target.value)}
        onInput={event => { const box = event.currentTarget; box.style.height = 'auto'; box.style.height = `${Math.min(box.scrollHeight, 150)}px`; box.classList.toggle('is-scrolling', box.scrollHeight > 150) }}
        onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) submit(event) }} />
      {busy
        ? <button type="button" className="nimbus-send is-stop" onClick={onStop} aria-label="Stop"><span /></button>
        : <button type="submit" className="nimbus-send" disabled={!available || (!draft.trim() && !attachedFile)} aria-label="Analyse"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 15.5v-11M5.5 9 10 4.5 14.5 9" /></svg></button>}
    </form>
  </div>
}
