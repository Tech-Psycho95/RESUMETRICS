import { useEffect, useRef } from 'react'
import './resume-gate.css'

// The career tools work on one resume. Clicking one in the sidebar opens this pop-up over whatever page is open,
// with the page blurred behind it (PLAN-033). Until saved resumes exist it asks you to start or import a resume
// (and lists the one in this session); when storage is integrated only the `resumes` array changes.
export const gateTools = {
  tailor: { title: 'Job tailoring', route: '/workspace/tailor', what: 'Match your resume to a job post and apply the changes that raise your score.' },
  letter: { title: 'Cover letters', route: '/workspace/letter', what: 'Write a letter in the same design as your resume, with your signature.' },
  evidence: { title: 'Evidence check', route: '/workspace/evidence', what: 'Check the skills on your resume against the code in your GitHub repositories.' }
}

export function ResumePicker({ resumes, onPick, actionLabel, onStart, onImport }) {
  if (!resumes.length) {
    return <section className="gate-empty" aria-label="No resume yet">
      <h3>No resume yet</h3>
      <p>Create one from a template or import a file, then open this tool from the sidebar.</p>
      <div className="gate-actions">
        <button type="button" className="btn btn-primary" onClick={onStart}>Start a resume</button>
        <button type="button" className="btn btn-secondary" onClick={onImport}>Import a resume</button>
      </div>
    </section>
  }
  return <ul className="gate-list" aria-label="Your resumes">
    {resumes.map(resume => <li key={resume.id}>
      <span className="gate-mark" aria-hidden="true">{(resume.name || 'R').trim().charAt(0).toUpperCase()}</span>
      <span className="gate-info"><b>{resume.name}</b><small>{[resume.templateName, resume.note].filter(Boolean).join(' · ')}</small></span>
      <button type="button" className="btn btn-primary" onClick={() => onPick(resume)}>{actionLabel}</button>
    </li>)}
  </ul>
}

/** Modal over the current page. Esc, the close button or a click outside closes it; focus goes in and returns. */
export default function ResumeGateDialog({ tool, resumes, onPick, onStart, onImport, onClose }) {
  const meta = gateTools[tool] ?? gateTools.tailor
  const dialogRef = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.querySelector('button.btn-primary')?.focus()
    const onKey = event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); return }
      if (event.key !== 'Tab') return
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled)')]
      if (!focusable.length) return
      const first = focusable[0]; const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true); previous?.focus?.() }
  }, [onClose])

  return <div className="gate-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="gate-dialog" role="dialog" aria-modal="true" aria-labelledby="gate-title" aria-describedby="gate-text" ref={dialogRef}>
      <button type="button" className="gate-close btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 5.5 9 9m0-9-9 9" /></svg></button>
      <h2 id="gate-title">Select a resume first</h2>
      <p id="gate-text" className="gate-text"><b>{meta.title}</b> works on one resume. {meta.what}</p>
      <ResumePicker resumes={resumes} onPick={onPick} actionLabel={`Open ${meta.title}`} onStart={onStart} onImport={onImport} />
    </section>
  </div>
}
