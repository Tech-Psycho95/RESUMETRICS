import ResumeTemplateLayout from './ResumeTemplateLayout.jsx'
import './latex-icons.css'
import './latex-templates.css'

// Clones of six supplied LaTeX résumés (PLAN-027), drawn by the shared layout so editing,
// formatting and pagination work the same as in every other template.
export const createLatexTemplate = variant => function LatexResumeTemplate(props) {
  return <ResumeTemplateLayout {...props} variant={variant} />
}

export const MinimalAcademicTemplate = createLatexTemplate('minimal-academic')
export const LibreCvTemplate = createLatexTemplate('libre-cv')
export const SimpleHipsterTemplate = createLatexTemplate('simple-hipster')
export const KeywordsCvTemplate = createLatexTemplate('keywords-cv')
export const ElegantResumeTemplate = createLatexTemplate('elegant-resume')
export const DeveloperCvTemplate = createLatexTemplate('developer-cv')
