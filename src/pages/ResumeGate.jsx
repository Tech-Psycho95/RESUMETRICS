import { useEffect, useRef } from 'react'
import ResumeMiniature from '../components/ResumeMiniature.jsx'
import './resume-gate.css'

// The career tools work on one resume. Clicking one in the sidebar opens this pop-up over whatever page is open,
// with the page blurred behind it (PLAN-033). It lists the saved resumes from the dashboard; picking one opens the tool on it.
export const gateTools = {
  tailor: { title: 'Job tailoring', route: '/workspace/tailor', what: 'Match your resume to a job post and apply the changes that raise your score.' },
  letter: { title: 'Cover letters', route: '/workspace/letter', what: 'Write a letter in the same design as your resume, with your signature.' },
  evidence: { title: 'Evidence check', route: '/workspace/evidence', what: 'Check the skills on your resume against the code in your GitHub repositories.' }
}

export function ResumePicker({ resumes, onPick, actionLabel, onCreate }) {
  if (resumes === null) return <p className="gate-text" role="status">Loading your resumes…</p>
  if (!resumes.length) {
    return <section className="gate-empty" aria-label="No saved resumes">
      <h3>No saved resumes yet</h3>
      <p>Create a resume on your dashboard and it will show up here.</p>
      <div className="gate-actions">
        <button type="button" className="btn btn-primary" onClick={onCreate}>Go to dashboard</button>
      </div>
    </section>
  }
  return <ul className="gate-cards" aria-label="Your resumes">
    {resumes.map(resume => <li key={resume.id}>
      <button type="button" className="gate-card" onClick={() => onPick(resume)} aria-label={`${actionLabel}: ${resume.name}`}>
        <span className="gate-card-paper" aria-hidden="true">{resume.resumeData ? <ResumeMiniature project={resume} /> : <i />}</span>
        <span className="gate-card-meta"><b>{resume.name}</b><small>{[resume.templateName, resume.updatedLabel].filter(Boolean).join(' · ')}</small></span>
      </button>
    </li>)}
  </ul>
}

/** Modal over the current page. Esc, the close button or a click outside closes it; focus goes in and returns. */
export default function ResumeGateDialog({ tool, resumes, onPick, onCreate, onClose }) {
  const meta = gateTools[tool] ?? gateTools.tailor
  const dialogRef = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.querySelector('button.btn-primary, .gate-card')?.focus()
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
      <h2 id="gate-title">Choose a resume</h2>
      <p id="gate-text" className="gate-text"><b>{meta.title}</b> works on one of your saved resumes. {meta.what}</p>
      <ResumePicker resumes={resumes} onPick={onPick} actionLabel={`Open ${meta.title} with`} onCreate={onCreate} />
    </section>
  </div>
}
