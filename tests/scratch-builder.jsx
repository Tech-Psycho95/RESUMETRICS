// Fixture for /workspace/build without sign-in: section form on the left, live read-only resume in the middle.
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/template.css'
import '../src/layout-overrides.css'
import '../src/resume-flow.css'
import '../src/ai-assistant.css'
import '../src/resume-builder.css'
import '../src/editor-studio.css'
import '../src/section-form.css'
import SectionForm from '../src/components/form/SectionForm.jsx'
import { createBlankResumeData } from '../src/data/resumeData.js'
import { getResumeTemplate, resolveResumePresentation } from '../src/config/resumeTemplates.js'

const templateId = new URLSearchParams(window.location.search).get('template') || 'azurill'

function ScratchBuilderCheck() {
  const template = getResumeTemplate(templateId)
  const Template = template.component
  const [resumeData, setResumeData] = useState(createBlankResumeData)
  const [confirmed, setConfirmed] = useState({})
  const [active, setActive] = useState(null)
  const [continued, setContinued] = useState(false)
  return <div className="app-shell editor-shell studio-shell"><main><div className="studio">
    <header className="studio-topbar editor-toolbar"><div className="studio-topbar-start"><b>Fixture · {template.name}</b>{continued && <span data-testid="continued"> — would open the editor</span>}</div></header>
    <div className="build-grid">
      <section className="editor-pane build-form-pane">
        <SectionForm template={template} resumeData={resumeData} onChange={setResumeData} supportsPhoto={template.supportsPhoto} hasPhoto={false}
          onPhotoUpload={() => {}} onPhotoRemove={() => {}} confirmed={confirmed} onConfirm={id => setConfirmed(current => ({ ...current, [id]: true }))}
          activeSection={active} onActiveSectionChange={setActive} onContinue={() => setContinued(true)} />
      </section>
      <section className="editor-pane editor-pane-centre"><div className="studio-canvas">
        <Template resumeData={resumeData} presentation={{ ...resolveResumePresentation(template, {}), photo: { uploadPlaceholder: true, width: 72, height: 72 } }} readOnly blankPreview focusSectionId={active} />
      </div></section>
    </div>
  </div></main></div>
}

createRoot(document.getElementById('root')).render(<ScratchBuilderCheck />)
