import GitHubEvidencePanel from './GitHubEvidencePanel.jsx'

/** GitHub evidence page; both buttons return to the editor (attaching evidence to lines comes later). */
export default function EvidenceScreen({ github, onAddEvidence, onContinue }) {
  return <div className="ev-screen">
    <div className="ev-scroll">
      <GitHubEvidencePanel scan={github.scan} connected={github.connected} connecting={github.connecting} onConnect={github.onConnect} onScan={github.onScan} onCancel={github.onCancel} />
    </div>
    <footer className="ev-footer">
      <button type="button" className="btn btn-secondary" onClick={onContinue}>Continue without evidence</button>
      <button type="button" className="btn btn-primary" onClick={onAddEvidence}>Add evidence</button>
    </footer>
  </div>
}
