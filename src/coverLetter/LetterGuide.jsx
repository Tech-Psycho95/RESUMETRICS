import { useState } from 'react'

const mark = { pass: '✓', fail: '✕', unknown: '–' }

/** The ResumeWay pre-submission checklist as one headline that opens into the checks (PLAN-033). */
export default function LetterGuide({ result, onFix, busy }) {
  const [open, setOpen] = useState(false)
  const done = result.total > 0 && result.passed === result.total
  return <div className={`letter-guide${open ? ' is-open' : ''}`}>
    {open && <ul className="letter-guide-list" aria-label="Letter checks">
      {result.checks.map(check => <li key={check.id} className={`is-${check.status}`}>
        <span className="letter-guide-mark" aria-hidden="true">{mark[check.status]}</span>
        <span className="letter-guide-text">
          <b>{check.label}</b>
          {check.status !== 'pass' && <small>{check.detail}</small>}
        </span>
        {check.status === 'fail' && check.fix && <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => onFix(check.fix)}>Ask NIMBUS</button>}
      </li>)}
    </ul>}
    <button type="button" className="letter-guide-toggle" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <span className="letter-guide-ring" style={{ '--share': result.total ? result.passed / result.total : 0 }} aria-hidden="true" />
      <span><b>Letter guide</b><small>{result.total ? `${result.passed} of ${result.total} checks${done ? ' — ready to send' : ''}` : 'Start writing to see checks'}</small></span>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d={open ? 'm5 12 5-5 5 5' : 'm5 8 5 5 5-5'} /></svg>
    </button>
  </div>
}
