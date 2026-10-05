// Fixture for PLAN-027: each LaTeX clone as real A4 editor pages beside the sample it copies,
// plus a long-content run and a containment check. Serve with npm run dev, open /tests/latex-templates.html.
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/template.css'
import '../src/layout-overrides.css'
import '../src/resume-flow.css'
import { getResumeTemplate, resolveResumePresentation } from '../src/config/resumeTemplates.js'
import { templatePreviewResumeData as sample } from '../src/data/templatePreviewData.js'
import minimalAcademic from '../.planning/phases/27-latex-templates/reference/minimal-academic.png'
import libreCv from '../.planning/phases/27-latex-templates/reference/libre-cv.png'
import simpleHipster from '../.planning/phases/27-latex-templates/reference/simple-hipster.png'
import keywordsCv from '../.planning/phases/27-latex-templates/reference/keywords-cv.webp'
import elegantResume from '../.planning/phases/27-latex-templates/reference/elegant-resume.png'
import developerCv from '../.planning/phases/27-latex-templates/reference/developer-cv.png'

const references = { 'minimal-academic': minimalAcademic, 'libre-cv': libreCv, 'simple-hipster': simpleHipster, 'keywords-cv': keywordsCv, 'elegant-resume': elegantResume, 'developer-cv': developerCv }
const data = {
  ...sample,
  skills: { languages: ['Python', 'C++', 'JavaScript'], tools: ['Docker', 'Git', 'Linux'], 'Patient care': ['Triage', 'Wound care'] },
  languages: ['English', 'French', 'Spanish'],
  achievements: ['Top-ranked team, Some Contest (2018)', 'Bronze Medal, Some Contest (2016)'],
  customSections: [{ title: 'Interests', content: 'Cycling, hiking and community radio.' }]
}
const long = { ...data, experience: Array.from({ length: 9 }, (_, i) => ({ ...data.experience[i % data.experience.length], role: `Role ${i + 1}` })) }

// ?t=<id> shows one template; &view=app or &view=ref shows only that side (for full-size screenshots).
const params = new URLSearchParams(location.search)
const only = params.get('t')
const view = params.get('view')

function Row({ id, resume }) {
  const template = getResumeTemplate(id)
  const Template = template.component
  return <section id={id} style={{ margin: '0 0 48px' }}>
    <h2 style={{ font: '600 18px system-ui' }}>{template.name}</h2>
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      {view !== 'ref' && <div style={{ width: 826 }}><Template resumeData={resume} presentation={resolveResumePresentation(template, {})} readOnly pageWidthOverride={794} /></div>}
      {view !== 'app' && <img src={references[id]} alt={`${template.name} reference`} style={{ width: 794, border: '1px solid #ccc' }} />}
    </div>
  </section>
}

function App() {
  const [isLong, setLong] = useState(params.get('long') === '1')
  const [result, setResult] = useState('')
  const resume = isLong ? long : data
  const check = () => {
    const failures = []
    for (const id of Object.keys(references).filter(id => !only || id === only)) {
      const host = document.getElementById(id)
      const pages = [...host.querySelectorAll('.resume-page-document .resume-a4-page')]
      for (const page of pages) {
        const rect = page.getBoundingClientRect()
        for (const block of page.querySelectorAll('.resume-page-block, .generated-resume-header')) {
          const box = block.getBoundingClientRect()
          if (box.bottom > rect.bottom + 1 || box.right > rect.right + 1 || box.left < rect.left - 1) failures.push(`${id}: content outside page ${pages.indexOf(page) + 1}`)
        }
      }
      const roles = host.querySelectorAll('.resume-page-document [data-resume-path$=".role"]').length
      if (roles !== resume.experience.length) failures.push(`${id}: ${roles} of ${resume.experience.length} roles shown`)
    }
    setResult(failures.length ? [...new Set(failures)].join('\n') : `PASS (${isLong ? 'long' : 'sample'} resume)`)
  }
  // &check=1 runs the checks once the pages have settled (used by headless runs that read the DOM).
  useEffect(() => { if (params.get('check') === '1') setTimeout(check, 2500) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return <main style={{ padding: 24, background: '#f3f4f8' }}>
    <h1 style={{ font: '600 22px system-ui' }}>LaTeX template clones: app (left) vs sample (right)</h1>
    <button onClick={() => setLong(!isLong)}>{isLong ? 'Use sample resume' : 'Use long resume'}</button> <button onClick={check}>Run checks</button>
    <pre role="status">{result}</pre>
    <style>{'.resume-page-scroller { max-height: none !important; padding: 0 !important; }'}</style>
    {Object.keys(references).filter(id => !only || id === only).map(id => <Row id={id} resume={resume} key={id} />)}
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
