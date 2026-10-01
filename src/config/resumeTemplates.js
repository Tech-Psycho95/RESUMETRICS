import NavyProfessionalTemplate from '../components/templates/NavyProfessionalTemplate.jsx'
import SimpleHipsterTemplate from '../components/templates/SimpleHipsterTemplate.jsx'
import CurveAcademicTemplate from '../components/templates/CurveAcademicTemplate.jsx'
import ReceiveTemplate from '../components/templates/ReceiveTemplate.jsx'
import {
  AzurillTemplate, BronzorTemplate, ChikoritaTemplate, DitgarTemplate, DittoTemplate, GengarTemplate, GlalieTemplate, KakunaTemplate,
  LaprasTemplate, LeafishTemplate, MeowthTemplate, OnyxTemplate, PikachuTemplate, RhyhornTemplate, ScizorTemplate
} from '../components/templates/ReactiveTemplate.jsx'
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

const portrait = shape => ({ source: samplePortrait, width: 80, height: 80, shape, objectFit: 'cover' })
const serif = 'IBM Plex Serif, serif'
const sans = 'IBM Plex Sans, sans-serif'
const reactiveSource = 'Reactive Resume by Amruth Pillai (MIT licence)'

// Reactive Resume templates: names and descriptions from its template gallery; colours and type
// families follow each template's gallery preview. Every accent stays editable in the editor.
const reactive = (id, name, component, { description, layout, tags, accentColor, fontFamily, photoShape = 'rounded' }) => defineTemplate({
  id, name, description, component, layout, tags, collection: 'reactive-resume', source: reactiveSource, supportsPhoto: true,
  defaultTheme: { accentColor, fontFamily, photo: portrait(photoShape) }
})

export const resumeTemplates = [
  defineTemplate({ id: 'navy-professional', name: 'Navy Professional', description: 'Formal navy headings, centered identity, and an education-first single column.', source: 'Christian Maria Giannetti — supplied resume.cls example', component: NavyProfessionalTemplate, layout: 'single-column', tags: ['Formal', 'Education first'], collection: 'classic', supportsPhoto: true, defaultTheme: { accentColor: '#294a69', fontFamily: 'Roboto, sans-serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),
  defineTemplate({ id: 'simple-hipster', name: 'Simple Hipster', description: 'Dark identity band, clear headings, and a readable experience timeline.', source: 'LaTeX Ninja — supplied simplehipstercv example', component: SimpleHipsterTemplate, layout: 'two-column', tags: ['Identity band', 'Timeline'], collection: 'classic', supportsPhoto: true, defaultTheme: { accentColor: '#397b69', fontFamily: 'Montserrat, sans-serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),
  defineTemplate({ id: 'curve-academic', name: 'CurVe Academic', description: 'Academic typography, section rules, and clearly dated entries.', source: 'LianTze Lim — supplied CurVe example (2024)', component: CurveAcademicTemplate, layout: 'single-column', tags: ['Academic', 'Section rules'], collection: 'classic', supportsPhoto: true, defaultTheme: { accentColor: '#62774a', fontFamily: 'Roboto Slab, serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),
  defineTemplate({ id: 'receive', name: 'ReCeiVe', description: 'Engineering CV with a profile header, clear dates, and soft copper accents.', source: 'Ged Lex — supplied ReCeiVe 1.12.0 example', component: ReceiveTemplate, layout: 'two-column', tags: ['Engineering', 'Profile header'], collection: 'classic', supportsPhoto: true, defaultTheme: { accentColor: '#a45c35', fontFamily: 'Roboto, sans-serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),

  reactive('azurill', 'Azurill', AzurillTemplate, { layout: 'two-column', accentColor: '#1f6fb8', fontFamily: serif, tags: ['Two-column', 'Timeline', 'Tech'], description: 'Two-column with a centred header, accent headings and a timeline; great for creative or tech roles where visual flair is welcome.' }),
  reactive('bronzor', 'Bronzor', BronzorTemplate, { layout: 'single-column', accentColor: '#111111', fontFamily: serif, tags: ['Clean', 'Corporate', 'Section dividers'], description: 'Clean and professional with ruled sections and side headings; suits corporate, finance, or consulting positions.' }),
  reactive('chikorita', 'Chikorita', ChikoritaTemplate, { layout: 'two-column', accentColor: '#2f6a46', fontFamily: serif, photoShape: 'circle', tags: ['Two-column', 'Colour sidebar', 'Client-facing'], description: 'Two-column with a full-height colour sidebar and circular profile photo; ideal for marketing, HR, or client-facing roles.' }),
  reactive('ditgar', 'Ditgar', DitgarTemplate, { layout: 'two-column', accentColor: '#2f7fd6', fontFamily: serif, tags: ['Two-column', 'Developer', 'Data science'], description: 'Two-column with a tinted sidebar, solid header block and accent-marked roles; modern feel for developers, data scientists, or technical PMs.' }),
  reactive('ditto', 'Ditto', DittoTemplate, { layout: 'two-column', accentColor: '#c2185b', fontFamily: serif, tags: ['Two-column', 'ATS friendly', 'Header band'], description: 'Two-column with a bold header band and a text-dense layout; perfect for traditional industries or ATS-heavy applications.' }),
  reactive('gengar', 'Gengar', GengarTemplate, { layout: 'two-column', accentColor: '#6d3fd1', fontFamily: sans, tags: ['Two-column', 'Featured summary', 'Operations'], description: 'Two-column with accent colours, a featured summary and clean typography; balanced choice for business analysts or operations roles.' }),
  reactive('glalie', 'Glalie', GlalieTemplate, { layout: 'two-column', accentColor: '#4f6f8f', fontFamily: serif, tags: ['Two-column', 'Understated', 'Executive'], description: 'Two-column, minimal with a light tinted sidebar and boxed contact details; understated for legal, finance, or executive roles.' }),
  reactive('kakuna', 'Kakuna', KakunaTemplate, { layout: 'single-column', accentColor: '#a8790f', fontFamily: serif, tags: ['Single-column', 'ATS friendly', 'Centred'], description: 'Single-column, centred and compact with ruled headings; efficient for entry-level or internship applications.' }),
  reactive('lapras', 'Lapras', LaprasTemplate, { layout: 'single-column', accentColor: '#2563eb', fontFamily: sans, tags: ['Single-column', 'ATS friendly', 'Card sections'], description: 'Single-column of outlined cards; polished and serious for senior or enterprise-level positions.' }),
  reactive('leafish', 'Leafish', LeafishTemplate, { layout: 'two-column', accentColor: '#5b9a1b', fontFamily: sans, tags: ['Two-column', 'Tinted header', 'Healthcare'], description: 'Two-column with tinted header bands and a right sidebar; earthy and calm, suits sustainability, healthcare, or nonprofit sectors.' }),
  reactive('meowth', 'Meowth', MeowthTemplate, { layout: 'single-column', accentColor: '#4f46e5', fontFamily: serif, tags: ['Single-column', 'ATS friendly', 'Inline headers'], description: 'Single-column with one-line entry headers (position · organisation · period); compact and well-suited to CN/JP/KR resume conventions.' }),
  reactive('onyx', 'Onyx', OnyxTemplate, { layout: 'single-column', accentColor: '#1f2937', fontFamily: serif, tags: ['Single-column', 'ATS friendly', 'Versatile'], description: 'Single-column with a ruled header and clean layout; versatile for any professional or technical role.' }),
  reactive('pikachu', 'Pikachu', PikachuTemplate, { layout: 'two-column', accentColor: '#9a8233', fontFamily: serif, tags: ['Two-column', 'Header block', 'Creative'], description: 'Two-column with a photo-topped sidebar and solid header block; simple and approachable for creative, editorial, or junior roles.' }),
  reactive('rhyhorn', 'Rhyhorn', RhyhornTemplate, { layout: 'single-column', accentColor: '#374151', fontFamily: sans, tags: ['Single-column', 'ATS friendly', 'Whitespace'], description: 'Single-column with a minimal top header and lots of whitespace; clean and modern for designers or content creators.' }),
  reactive('scizor', 'Scizor', ScizorTemplate, { layout: 'single-column', accentColor: '#2563eb', fontFamily: sans, tags: ['Single-column', 'ATS friendly', 'Uppercase headings'], description: 'Single-column with uppercase section headings and an accent rule across the top of every page; polished for executive, consulting, or startup resumes.' })
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
