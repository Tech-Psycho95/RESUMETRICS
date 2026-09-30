import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/layout-overrides.css'
import '../src/resume-flow.css'
import { resumeTemplates, resolveResumePresentation, createResumePresentation, getResumeTemplate } from '../src/config/resumeTemplates.js'
import { templatePreviewResumeData as sample } from '../src/data/templatePreviewData.js'
import { resumeFonts } from '../src/editor/fontRegistry.js'
import ResumeTemplateSelector from '../src/components/ResumeTemplateSelector.jsx'

function Checks() {
  const [long, setLong] = useState(false)
  const [results, setResults] = useState('Run checks after the pages appear.')
  const [selected, setSelected] = useState(null)
  const data = long ? { ...sample, experience: Array.from({ length: 16 }, (_, i) => ({ ...sample.experience[0], role: `Engineer ${i + 1}` })) } : sample
  const check = () => {
    const failures = []
    if (resumeTemplates.length !== 4) failures.push('Catalog must contain exactly four templates')
    if (resumeFonts.length !== 27) failures.push(`Expected 25 resume fonts plus Roboto Slab and Roboto Mono, found ${resumeFonts.length}`)
    if (getResumeTemplate('azurill')?.id !== 'navy-professional') failures.push('Legacy fallback')
    for (const template of resumeTemplates) {
      const theme = resolveResumePresentation(template, createResumePresentation(template.id))
      if (theme.fontFamily !== template.defaultTheme.fontFamily || theme.accentColor !== template.defaultTheme.accentColor) failures.push(`${template.id}: null overrides defaults`)
      const host = document.getElementById(template.id)
      const pages = [...host.querySelectorAll('.resume-page-document .resume-a4-page')]
      if (!pages.length) failures.push(`${template.id}: no editor pages`)
      for (const page of pages) {
        const rect = page.getBoundingClientRect()
        for (const block of page.querySelectorAll('.resume-page-block, .generated-resume-header')) {
          const b = block.getBoundingClientRect()
          if (b.bottom > rect.bottom + 1 || b.right > rect.right + 1 || b.left < rect.left - 1) failures.push(`${template.id}: content outside page`)
        }
      }
      const roles = host.querySelectorAll('.resume-page-document [data-resume-path$=".role"]')
      if (roles.length !== data.experience.length) failures.push(`${template.id}: lost or duplicated experience`)
      const preview = host.querySelector('.template-live-preview')
      if (preview.scrollHeight > preview.clientHeight + 1) failures.push(`${template.id}: preview clipped`)
      const headings = [...preview.querySelectorAll('.resume-section h2')]
      if (headings.some(heading => !heading.textContent.trim() || getComputedStyle(heading).color === getComputedStyle(heading).backgroundColor)) failures.push(`${template.id}: section title is missing or unreadable`)
      if (!preview.querySelector('.generated-resume-photo')?.complete || !preview.querySelector('.generated-resume-photo')?.naturalWidth) failures.push(`${template.id}: sample profile photo did not load`)
    }
    setResults(failures.length ? [...new Set(failures)].join('\n') : `PASS: four templates, default themes, legacy fallback, complete experience, bounded previews and ${long ? 'multi-page' : 'sample'} editors.`)
  }
  return <main style={{ padding: 24 }}>
    <h1>Resume template integration checks</h1>
    <button onClick={() => setLong(!long)}>{long ? 'Use sample resume' : 'Use long resume'}</button>
    <button onClick={check}>Run checks</button><pre role="status">{results}</pre>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, margin: '24px 0' }}>
      {resumeTemplates.map(template => { const Template = template.component; return <div key={template.id}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>{template.name}</h2>
        <div className="template-carousel-paper" style={{ width: '100%' }}><Template resumeData={sample} presentation={{ ...template.defaultTheme, photo: sample.photo }} preview editorStyle={{ fontSize: '6px' }} /></div>
      </div> })}
    </div>
    <ResumeTemplateSelector templates={resumeTemplates} selectedTemplateId={selected} onSelect={setSelected} onBack={() => {}} presentation={createResumePresentation()} />
    <p>Selected: {selected || 'none'}</p>
    {resumeTemplates.map(template => { const Template = template.component; const presentation = resolveResumePresentation(template, createResumePresentation()); return <section id={template.id} key={template.id}>
      <h2>{template.name}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'start' }}>
        <div className="template-carousel-paper" style={{ width: 540 }}><Template resumeData={sample} presentation={{ ...presentation, photo: sample.photo }} preview /></div>
        <div style={{ width: 826, maxWidth: '100%' }}><Template resumeData={data} presentation={presentation} /></div>
      </div>
    </section> })}
  </main>
}
createRoot(document.getElementById('root')).render(<Checks />)
