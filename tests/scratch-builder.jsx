import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/template.css'
import '../src/layout-overrides.css'
import '../src/resume-flow.css'
import '../src/ai-assistant.css'
import '../src/resume-builder.css'
import ResumeBuilderForm from '../src/components/ResumeBuilderForm.jsx'
import { createBlankResumeData } from '../src/data/resumeData.js'
import NavyProfessionalTemplate from '../src/components/templates/NavyProfessionalTemplate.jsx'
import { resumeFonts } from '../src/editor/fontRegistry.js'

function ScratchBuilderCheck() {
  const [resumeData, setResumeData] = useState(createBlankResumeData)
  const [fontFamily, setFontFamily] = useState('Roboto, sans-serif')
  const setFont = family => setFontFamily(family)
  return <main style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 24, padding: 24, alignItems: 'start' }}>
    <ResumeBuilderForm resumeData={resumeData} onChange={setResumeData} fonts={resumeFonts} fontFamily={fontFamily} onFontChange={setFont} />
    <section aria-label="Live resume preview" style={{ minWidth: 0 }}>
      <NavyProfessionalTemplate resumeData={resumeData} presentation={{ fontFamily }} editorStyle={{ fontSize: '13.333px' }} blankPreview />
    </section>
  </main>
}

createRoot(document.getElementById('root')).render(<ScratchBuilderCheck />)
