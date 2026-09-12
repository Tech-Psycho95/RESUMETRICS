import { countResumeSkills } from '../data/resumeData.js'

export default function ResumeExtractionReview({ resumeData, uploadedFileName, parseMetadata, onContinue, onStartOver }) {
  const details = [
    ['Skills', countResumeSkills(resumeData)],
    ['Experience', resumeData.experience.length],
    ['Projects', resumeData.projects.length],
    ['Education', resumeData.education.length]
  ]
  const totalPages = Number.isInteger(parseMetadata?.totalPages) ? parseMetadata.totalPages : null
  const processedPages = Number.isInteger(parseMetadata?.pagesProcessed) ? parseMetadata.pagesProcessed : null
  const parseWarnings = [...(parseMetadata?.warnings ?? []), ...(parseMetadata?.errors ?? [])].filter(Boolean)
  const parseStatus = totalPages
    ? `Parsed ${processedPages ?? 0} of ${totalPages} page${totalPages === 1 ? '' : 's'}${parseMetadata?.isCompleteParse ? ' successfully.' : '.'}`
    : parseMetadata?.isCompleteParse ? 'Parsed all available document content successfully.' : 'Parsing completed with warnings.'
  return <section className="extraction-review" aria-label="Extracted resume details">
    <div className="workspace-state-heading"><span className="eyebrow">EXTRACTION REVIEW</span><h2>Resume details are ready.</h2><p>We created a separate structured copy from <strong>{uploadedFileName}</strong>. Review the summary, then choose a new template.</p></div>
    <div className="extraction-summary"><div className="profile-review"><span className="profile-monogram">{(resumeData.fullName || 'R').slice(0, 1)}</span><div><strong>{resumeData.fullName || 'Name not found'}</strong><span>{resumeData.headline || 'Headline not found'}</span></div></div><div className="extract-counts">{details.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></div>
    <div className="extraction-notes">{parseMetadata && <div><strong>{parseMetadata.isCompleteParse ? parseStatus : `Parsing needs review — ${parseStatus}`}</strong><p>{parseWarnings.length ? parseWarnings.join(' · ') : 'Every detected page and extracted section was included before this draft was created.'}</p></div>}<div><strong>Missing fields</strong><p>{resumeData.missingFields.length ? resumeData.missingFields.join(' · ') : 'No important fields were flagged as missing.'}</p></div>{resumeData.confidenceNotes.length > 0 && <div><strong>Notes</strong><p>{resumeData.confidenceNotes.join(' · ')}</p></div>}</div>
    <div className="state-actions"><button className="secondary-button" onClick={onStartOver}>Start over</button><button className="primary-button" onClick={onContinue}>Choose template</button></div>
  </section>
}
