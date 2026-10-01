import NavyProfessionalTemplate from '../components/templates/NavyProfessionalTemplate.jsx'
import SimpleHipsterTemplate from '../components/templates/SimpleHipsterTemplate.jsx'
import CurveAcademicTemplate from '../components/templates/CurveAcademicTemplate.jsx'
import ReceiveTemplate from '../components/templates/ReceiveTemplate.jsx'
import samplePortrait from '../assets/sample-resume-portrait.jpg'

const supportedFeatures = Object.freeze([
  'personal-information', 'summary', 'experience', 'education', 'projects',
  'skills', 'certifications', 'achievements', 'links', 'languages', 'custom-sections'
])
const defineTemplate = definition => Object.freeze({
  supportedFeatures, category: 'Resume template',
  ...definition,
  defaultTheme: { pageSize: 'A4', spacing: 'comfortable', ...definition.defaultTheme }
})

export const resumeTemplates = [
  defineTemplate({ id: 'navy-professional', name: 'Navy Professional', description: 'Formal navy headings, centered identity, and an education-first single column.', source: 'Christian Maria Giannetti — supplied resume.cls example', component: NavyProfessionalTemplate, supportsPhoto: true, defaultTheme: { accentColor: '#294a69', fontFamily: 'Roboto, sans-serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),
  defineTemplate({ id: 'simple-hipster', name: 'Simple Hipster', description: 'Dark identity band, clear headings, and a readable experience timeline.', source: 'LaTeX Ninja — supplied simplehipstercv example', component: SimpleHipsterTemplate, supportsPhoto: true, defaultTheme: { accentColor: '#397b69', fontFamily: 'Montserrat, sans-serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),
  defineTemplate({ id: 'curve-academic', name: 'CurVe Academic', description: 'Academic typography, section rules, and clearly dated entries.', source: 'LianTze Lim — supplied CurVe example (2024)', component: CurveAcademicTemplate, supportsPhoto: true, defaultTheme: { accentColor: '#62774a', fontFamily: 'Roboto Slab, serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),
  defineTemplate({ id: 'receive', name: 'ReCeiVe', description: 'Engineering CV with a profile header, clear dates, and soft copper accents.', source: 'Ged Lex — supplied ReCeiVe 1.12.0 example', component: ReceiveTemplate, supportsPhoto: true, defaultTheme: { accentColor: '#a45c35', fontFamily: 'Roboto, sans-serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } })
]

// Old saved drafts retain their data and resolve to the new default design.
export const getResumeTemplate = templateId => resumeTemplates.find(template => template.id === templateId) || (templateId ? resumeTemplates[0] : undefined)
export const resolveResumePresentation = (template, presentation = {}) => ({
  ...template?.defaultTheme,
  ...Object.fromEntries(Object.entries(presentation).filter(([, value]) => value != null))
})
export const createResumePresentation = (templateId = null) => ({
  template: templateId, accentColor: null, fontFamily: null,
  density: null, spacing: null, pageSize: 'A4'
})
