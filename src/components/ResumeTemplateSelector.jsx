import { useEffect, useMemo, useState } from 'react'
import { templatePreviewResumeData } from '../data/templatePreviewData.js'

const isTypingTarget = element => ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName) || element?.isContentEditable

export default function ResumeTemplateSelector({ templates, selectedTemplateId, onSelect, onBack, isImported }) {
  const initialIndex = useMemo(() => Math.max(templates.findIndex(template => template.id === selectedTemplateId), 0), [templates, selectedTemplateId])
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const activeTemplate = templates[activeIndex]
  const PreviewComponent = activeTemplate?.component
  const count = templates.length

  useEffect(() => {
    setActiveIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    const onKeyDown = event => {
      if (isTypingTarget(event.target) || !count) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); setActiveIndex(index => (index - 1 + count) % count) }
      if (event.key === 'ArrowRight') { event.preventDefault(); setActiveIndex(index => (index + 1) % count) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [count])

  if (!activeTemplate || !PreviewComponent) return null

  const move = direction => setActiveIndex(index => (index + direction + count) % count)
  const isSelected = selectedTemplateId === activeTemplate.id

  return <section className="resume-template-selector template-carousel" aria-label="Choose a resume template">
    <div className="workspace-state-heading template-selector-heading">
      <div><span className="eyebrow">RESUME TEMPLATES</span><h2>Choose your template.</h2><p>{isImported ? 'Your original file remains unchanged. Compare the same extracted details in each design before creating an editable draft.' : 'Compare each structure using the same realistic resume preview, then continue with your own information.'}</p></div>
      <button className="text-button" onClick={onBack}>Back</button>
    </div>

    <div className="template-carousel-meta" aria-live="polite">
      <span className="template-category">{activeTemplate.category}</span>
      <h3>{activeTemplate.name}</h3>
      <p>{activeTemplate.description}</p>
      {activeTemplate.atsFriendly && <span className="ats-friendly-badge">ATS Friendly</span>}
    </div>

    <div className="template-carousel-stage">
      <button className="template-carousel-arrow previous" type="button" onClick={() => move(-1)} aria-label={`Show previous template, ${templates[(activeIndex - 1 + count) % count].name}`}>‹</button>
      <div className="template-carousel-paper" key={activeTemplate.id}>
        <PreviewComponent resumeData={templatePreviewResumeData} preview />
      </div>
      <button className="template-carousel-arrow next" type="button" onClick={() => move(1)} aria-label={`Show next template, ${templates[(activeIndex + 1) % count].name}`}>›</button>
    </div>

    <div className="template-carousel-actions">
      <button className="primary-button" type="button" disabled={isSelected} onClick={() => !isSelected && onSelect(activeTemplate.id)}>{isSelected ? 'Current Template' : 'Select Template'}</button>
      <span className="template-position" aria-label={`Template ${activeIndex + 1} of ${count}`}>{activeIndex + 1} / {count}</span>
    </div>
  </section>
}
