// Every template as a real A4 page with the landing-page sample resume, for capture-templates.mjs.
import { createRoot } from 'react-dom/client'
import '../../src/styles.css'
import '../../src/template.css'
import { resolveResumePresentation, resumeTemplates } from '../../src/config/resumeTemplates.js'
import { loadFontsForPresentation } from '../../src/editor/fontRegistry.js'
import { landingResumeData } from '../../src/data/sampleResume.js'

const presentationOf = template => ({ ...resolveResumePresentation(template, {}), photo: template.supportsPhoto ? template.defaultTheme.photo : undefined })

createRoot(document.getElementById('root')).render(<div style={{ display: 'grid', gap: 40, padding: 20, width: 794 }}>
  {resumeTemplates.map(template => {
    const Template = template.component
    return <div key={template.id} id={`tpl-${template.id}`} data-name={template.name} style={{ width: 794, height: 1123, overflow: 'hidden', background: '#fff' }}>
      <Template resumeData={landingResumeData} presentation={presentationOf(template)} preview />
    </div>
  })}
</div>)

Promise.all(resumeTemplates.map(template => loadFontsForPresentation(presentationOf(template))))
  .then(() => document.fonts.ready)
  .then(() => setTimeout(() => { window.__ready = true }, 600))
