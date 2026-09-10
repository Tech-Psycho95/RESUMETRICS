import { useState } from 'react'
import ResumeTemplatePreview from './ResumeTemplatePreview.jsx'

const previewResumeData = {
  fullName: 'Alex Morgan', headline: 'Frontend Developer', email: 'alex@example.com', phone: '+1 555 0100', location: 'New York, NY', links: [{ label: 'Portfolio', url: '' }], summary: 'Product-minded developer who builds accessible, high-quality web experiences.', skills: { languages: ['JavaScript', 'TypeScript'], frameworks: ['React'], tools: ['Git'], databases: [], softSkills: [], other: [] }, experience: [{ role: 'Frontend Developer', company: 'Northstar Studio', location: 'Remote', startDate: '2023', endDate: 'Present', bullets: ['Built responsive customer-facing interfaces.'] }], projects: [], education: [], certifications: [], achievements: [], missingFields: [], confidenceNotes: []
}

export default function ResumeTemplateSelector({ templates, resumeData, selectedTemplateId, onSelect, onBack, isImported }) {
  const [previewTemplateId, setPreviewTemplateId] = useState(null)
  const previewTemplate = templates.find(template => template.id === previewTemplateId)
  const PreviewComponent = previewTemplate?.component

  return <section className="resume-template-selector" aria-label="Choose a resume template">
    <div className="workspace-state-heading template-selector-heading"><div><span className="eyebrow">RESUME TEMPLATES</span><h2>Choose a starting structure.</h2><p>{isImported ? 'Your original file remains unchanged. Preview a design, then create a new editable resume from the extracted details.' : 'Preview a structure, then fill each section with your own experience.'}</p></div><button className="text-button" onClick={onBack}>Back</button></div>
    <div className="resume-template-grid">{templates.map(template => <article className={`resume-template-card ${selectedTemplateId === template.id ? 'selected' : ''}`} key={template.id}><ResumeTemplatePreview template={template} /><div className="template-card-meta"><small>{template.category}</small><strong>{template.name}</strong><em>{template.description}</em><div className="template-card-actions"><button className="text-button" onClick={() => setPreviewTemplateId(template.id)}>Preview</button><button className="primary-button" onClick={() => onSelect(template.id)}>Use template</button></div></div></article>)}</div>
    {PreviewComponent && <div className="template-preview-backdrop" role="presentation" onMouseDown={() => setPreviewTemplateId(null)}><section className="template-preview-modal" role="dialog" aria-modal="true" aria-label={`${previewTemplate.name} template preview`} onMouseDown={event => event.stopPropagation()}><div className="template-preview-modal-header"><div><span className="eyebrow">TEMPLATE PREVIEW</span><h2>{previewTemplate.name}</h2><p>{previewTemplate.description}</p></div><button className="text-button" onClick={() => setPreviewTemplateId(null)}>Close</button></div><div className="template-live-preview-frame"><PreviewComponent resumeData={resumeData || previewResumeData} preview /></div><div className="template-preview-modal-actions"><button className="secondary-button" onClick={() => setPreviewTemplateId(null)}>Keep browsing</button><button className="primary-button" onClick={() => { onSelect(previewTemplate.id); setPreviewTemplateId(null) }}>Use this template</button></div></section></div>}
  </section>
}
