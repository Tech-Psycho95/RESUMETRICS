import { countResumeSkills } from '../data/resumeData.js'

export default function ResumeExtractionReview({ resumeData, uploadedFileName, onContinue, onStartOver }) {
  const details = [
    ['Skills', countResumeSkills(resumeData)],
    ['Experience', resumeData.experience.length],
    ['Projects', resumeData.projects.length],
    ['Education', resumeData.education.length]
  ]
  return <section className="extraction-review" aria-label="Extracted resume details">
    <div className="workspace-state-heading"><span className="eyebrow">EXTRACTION REVIEW</span><h2>Resume details are ready.</h2><p>We created a separate structured copy from <strong>{uploadedFileName}</strong>. Review the summary, then choose a new template.</p></div>
    <div className="extraction-summary"><div className="profile-review"><span className="profile-monogram">{(resumeData.fullName || 'R').slice(0, 1)}</span><div><strong>{resumeData.fullName || 'Name not found'}</strong><span>{resumeData.headline || 'Headline not found'}</span></div></div><div className="extract-counts">{details.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></div>
    <div className="extraction-notes"><div><strong>Missing fields</strong><p>{resumeData.missingFields.length ? resumeData.missingFields.join(' · ') : 'No important fields were flagged as missing.'}</p></div>{resumeData.confidenceNotes.length > 0 && <div><strong>Notes</strong><p>{resumeData.confidenceNotes.join(' · ')}</p></div>}</div>
    <div className="state-actions"><button className="secondary-button" onClick={onStartOver}>Start over</button><button className="primary-button" onClick={onContinue}>Choose template</button></div>
  </section>
}

