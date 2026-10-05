/** Bottom row of the left rail: GitHub is the only evidence source. */
export function EvidenceDock({ onCompare, canCompare, connected }) {
  return <div className="rail-evidence">
    <svg className="rail-evidence-logo" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
    <span><b>Evidence with GitHub</b><small>{connected ? 'Connected' : 'Not connected'}</small></span>
    <button type="button" className="btn btn-secondary btn-sm" disabled={!canCompare} onClick={onCompare}>Compare</button>
  </div>
}

/** Dock row linking to the Job tailoring page, with the last match score. */
export function TailorDock({ score, onOpen }) {
  return <div className="rail-evidence rail-tailor">
    <svg className="rail-evidence-logo" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m13 7 4-4M17 3h-2.6M17 3v2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    <span><b>Tailor to a job</b><small>{Number.isFinite(score) ? `Last match ${score}%` : 'Match against a job description'}</small></span>
    <button type="button" className="btn btn-secondary btn-sm" onClick={onOpen}>Open</button>
  </div>
}

/** Left container: NIMBUS, with links to Job tailoring and GitHub evidence at the bottom. */
export default function AiRail({ nimbus, docks }) {
  return <div className="ai-rail">
    <div className="ai-rail-body">
      <div className="ai-rail-panel is-nimbus" role="region" aria-label="NIMBUS">{nimbus}</div>
    </div>
    {docks}
  </div>
}
