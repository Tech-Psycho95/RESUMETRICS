import NavyProfessionalTemplate from '../components/templates/NavyProfessionalTemplate.jsx'
import { DeveloperCvTemplate, ElegantResumeTemplate, KeywordsCvTemplate, LibreCvTemplate, MinimalAcademicTemplate, SimpleHipsterTemplate } from '../components/templates/LatexTemplates.jsx'
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
// One-line pitch shown in the template preview window; unique for every template.
const templateSummaries = {
  'navy-professional': 'Formal and education-first with navy headings — a safe choice for graduates and public-sector roles.',
  'simple-hipster': 'A dark name band, a grey sidebar with your photo and a dated timeline, cloned from simplehipstercv.',
  'minimal-academic': 'Spaced-out name, section labels in the margin and quiet grey text, for academic and research CVs.',
  'libre-cv': 'Centred name, small-caps ruled headings and a slim right column, set in Libertinus Sans.',
  'keywords-cv': 'Outlined name, icon headings and two dense columns that fit a full career on one page.',
  'elegant-resume': 'Tracked capitals, blue rules and icon details, built for long professional histories.',
  'developer-cv': 'Dates in the margin, a side-by-side summary and skills, and a compact entry list.',
  'curve-academic': 'Academic CV styling with ruled sections and clear dates for research and teaching posts.',
  receive: 'An engineering CV with a profile header and warm copper accents for technical specialists.',
  azurill: 'A centred header and a timeline of roles beside a skills sidebar — bright and visual.',
  bronzor: 'Ruled sections with headings set in the margin — calm, corporate and easy to scan.',
  chikorita: 'A bold green sidebar and round photo made for people-facing roles.',
  ditgar: 'A blue header block and highlighted summary built for developers and data roles.',
  ditto: 'A magenta name band over a dense two-column layout that still reads cleanly.',
  gengar: 'A purple sidebar header with a featured summary panel — balanced and modern.',
  glalie: 'A quiet tinted sidebar with boxed contact details for formal industries.',
  kakuna: 'Centred and compact on a single column, ideal for internships and first jobs.',
  lapras: 'Every section in its own outlined card — polished for senior roles.',
  leafish: 'Soft green header bands and a right-hand sidebar — calm and approachable.',
  meowth: 'One-line entry headers and capitalised headings — dense and efficient.',
  onyx: 'A clean ruled header and plain headings that suit almost any role.',
  pikachu: 'A photo-topped sidebar and solid header block for creative and junior roles.',
  rhyhorn: 'A minimal header and generous whitespace for designers and writers.',
  scizor: 'An accent rule on every page and capitalised headings for executive resumes.'
}
const defineTemplate = definition => Object.freeze({
  supportedFeatures, category: 'Resume template',
  summary: templateSummaries[definition.id] ?? definition.description,
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

// LaTeX clones (PLAN-027): colours and type families follow each supplied sample; accents stay editable.
const latex = (id, name, component, { description, layout, tags, accentColor, fontFamily, source, supportsPhoto = false, photo }) => defineTemplate({
  id, name, description, component, layout, tags, collection: 'latex', source, supportsPhoto,
  defaultTheme: { accentColor, fontFamily, ...(photo ? { photo } : {}) }
})

export const resumeTemplates = [
  defineTemplate({ id: 'navy-professional', name: 'Navy Professional', description: 'Formal navy headings, centered identity, and an education-first single column.', source: 'Christian Maria Giannetti — supplied resume.cls example', component: NavyProfessionalTemplate, layout: 'single-column', tags: ['Formal', 'Education first'], collection: 'classic', supportsPhoto: true, defaultTheme: { accentColor: '#294a69', fontFamily: 'Roboto, sans-serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),
  latex('minimal-academic', 'Minimal Academic', MinimalAcademicTemplate, { accentColor: '#6b7d8f', fontFamily: 'Nunito Sans, sans-serif', layout: 'single-column', tags: ['Academic', 'Margin labels', 'Minimal'], description: 'Spaced name, uppercase section labels in a left margin column and grey body text.', source: 'Minimal Academic CV (Overleaf), supplied source' }),
  latex('libre-cv', 'Libre CV', LibreCvTemplate, { accentColor: '#111111', fontFamily: 'Libertinus Sans, sans-serif', layout: 'two-column', tags: ['Two-column', 'Small caps', 'Classic'], description: 'paracol two-column CV with small-caps ruled sections and an identity card.', source: 'Libre CV (Overleaf), supplied source' }),
  latex('simple-hipster', 'Simple Hipster', SimpleHipsterTemplate, { accentColor: '#30a8d8', fontFamily: 'Raleway, sans-serif', layout: 'two-column', tags: ['Two-column', 'Photo', 'Timeline'], description: 'Dark header band, grey photo sidebar with tag labels and a dated timeline.', source: 'LaTeX Ninja, simplehipstercv (lighthipster), supplied source', supportsPhoto: true, photo: { source: samplePortrait, width: 120, height: 120, shape: 'circle', objectFit: 'cover' } }),
  latex('keywords-cv', 'Single-page Keywords', KeywordsCvTemplate, { accentColor: '#4b9fd5', fontFamily: 'Raleway, sans-serif', layout: 'two-column', tags: ['Two-column', 'Icons', 'One page'], description: 'Outlined surname, icon section headings and two columns under a full-width summary.', source: 'Sample single page resume with keywords (my_cv class), supplied source' }),
  latex('elegant-resume', 'Elegant Resume', ElegantResumeTemplate, { accentColor: '#4a7bd6', fontFamily: 'Lato, sans-serif', layout: 'single-column', tags: ['Single-column', 'Icons', 'Senior'], description: 'Centred tracked capitals, blue rules, icon contact line and dashed dividers.', source: 'Harikrishnan B. Kurup, cvhari class, supplied source' }),
  latex('developer-cv', 'Developer CV', DeveloperCvTemplate, { accentColor: '#111111', fontFamily: 'Raleway, sans-serif', layout: 'single-column', tags: ['Compact', 'Dated entries', 'Icons'], description: 'Icon contact grid, summary beside skills and an entry list with dates in the margin.', source: 'Developer CV v2 (LaTeXTemplates.com, MIT), supplied source' }),
  defineTemplate({ id: 'curve-academic', name: 'CurVe Academic', description: 'Academic typography, section rules, and clearly dated entries.', source: 'LianTze Lim — supplied CurVe example (2024)', component: CurveAcademicTemplate, layout: 'single-column', tags: ['Academic', 'Section rules'], collection: 'classic', supportsPhoto: true, defaultTheme: { accentColor: '#62774a', fontFamily: 'Roboto Slab, serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),
  defineTemplate({ id: 'receive', name: 'ReCeiVe', description: 'Engineering CV with a profile header, clear dates, and soft copper accents.', source: 'Ged Lex — supplied ReCeiVe 1.12.0 example', component: ReceiveTemplate, layout: 'single-column', tags: ['Engineering', 'Profile header'], collection: 'classic', supportsPhoto: true, defaultTheme: { accentColor: '#a45c35', fontFamily: 'Roboto, sans-serif', photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' } } }),

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
