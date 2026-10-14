import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './plan.css'

/**
 * "This needs Pro" pop-up, in the same frame as the resume picker (resume-gate.css). reason: what was refused, e.g.
 * { title: 'You’ve used your 2 free resumes', text: '…' }. "See plans" opens the plan page.
 */
export default function UpgradeDialog({ title, text, onClose }) {
  const navigate = useNavigate()
  const dialogRef = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.querySelector('.btn-primary')?.focus()
    const onKey = event => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true); previous?.focus?.() }
  }, [onClose])

  return <div className="gate-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="gate-dialog upgrade-dialog" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" aria-describedby="upgrade-text" ref={dialogRef}>
      <button type="button" className="gate-close btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 5.5 9 9m0-9-9 9" /></svg></button>
      <span className="upgrade-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 7 4.5 4L12 5l4.5 6L21 7l-2 11H5L3 7Z" /></svg></span>
      <h2 id="upgrade-title">{title}</h2>
      <p id="upgrade-text" className="gate-text">{text}</p>
      <div className="gate-actions">
        <button type="button" className="btn btn-primary" onClick={() => { onClose(); navigate('/plan') }}>See plans</button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Not now</button>
      </div>
    </section>
  </div>
}
