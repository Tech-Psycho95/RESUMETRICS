// Fixture for PLAN-033: the cover letter on every resume template, next to nothing else (no sign-in needed).
// Serve with npm run dev and open /tests/cover-letter-templates.html.
//   ?t=<template id>      one template at full size        ?paper=warm|stone|white   paper colour
//   ?sig=1                add a processed sample signature   ?empty=1                  empty letter (hints)
//   ?long=1               overlong letter (page 2 warning)  ?w=360                    contact-sheet card width
import React from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/template.css'
import '../src/layout-overrides.css'
import '../src/resume-flow.css'
import '../src/editor-studio.css'
import '../src/cover-letter.css'
import CoverLetterPage from '../src/coverLetter/CoverLetterPage.jsx'
import { letterFamilyFor } from '../src/coverLetter/letterDesigns.js'
import { resumeTemplates, resolveResumePresentation } from '../src/config/resumeTemplates.js'
import { templatePreviewResumeData as sample } from '../src/data/templatePreviewData.js'
import { applyLetterEdit, createLetter, replaceParagraphs } from '../shared/letterModel.js'

const params = new URLSearchParams(location.search)
const only = params.get('t')
const cardWidth = Number(params.get('w')) || 380
const paragraphs = [
  'Your Software Engineer opening at Northwind caught my eye because your team builds the tools that support agents rely on every day, and I have spent the last year building exactly that kind of dashboard with React and Node.js.',
  'At Google I cut response time by 30% through caching and query tuning, and I built the monitoring dashboards the team now uses to spot slow services before users do. I like measuring a problem before changing it, and I explain the result in plain words to product managers and designers.',
  'Northwind’s decision to publish its accessibility audits is why I am applying to you and not to a larger firm. I want my work to be judged by how usable it is for the people who depend on it.',
  'Thank you for reading. I would welcome a conversation about how I can help your dashboard team, and I look forward to hearing from you.'
]
let letter = createLetter()
if (!params.get('empty')) {
  letter = replaceParagraphs(letter, params.get('long') ? [...paragraphs, ...paragraphs, ...paragraphs] : paragraphs)
  letter = applyLetterEdit(letter, 'letter.recipient.name', 'Priya Shah')
  letter = applyLetterEdit(letter, 'letter.recipient.title', 'Engineering Manager')
  letter = applyLetterEdit(letter, 'letter.recipient.company', 'Northwind Systems')
  letter = applyLetterEdit(letter, 'letter.recipient.address', '120 Market Street\nSan Francisco, CA 94105')
  letter = { ...letter, date: '', dateAuto: false }
  letter = applyLetterEdit(letter, 'letter.date', 'October 6, 2026')
}
if (params.get('paper')) letter = { ...letter, presentation: { ...letter.presentation, paper: params.get('paper') } }
if (params.get('sig')) {
  // A small hand-drawn-looking path as an ink-coloured transparent PNG (what the signature pipeline outputs).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><path d="M8 52 C24 6 40 6 38 34 S30 66 52 40 S74 8 80 36 S96 60 118 34 L130 28 C150 50 170 50 182 24 S206 20 232 44" fill="none" stroke="#172033" stroke-width="3.2" stroke-linecap="round"/></svg>`
  letter = { ...letter, signature: { image: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, width: 9, align: 'left' } }
}

const list = only ? resumeTemplates.filter(template => template.id === only) : resumeTemplates

function Card({ template }) {
  const presentation = resolveResumePresentation(template, {})
  const scale = only ? 1 : cardWidth / 794
  return <section id={template.id} style={{ width: only ? 826 : cardWidth, margin: '0 auto' }}>
    <h2 style={{ font: '600 13px system-ui', margin: '0 0 6px', color: '#13203a' }}>{template.name} <small style={{ fontWeight: 400, color: '#6b7489' }}>· {letterFamilyFor(template.id)}</small></h2>
    <div style={{ width: only ? 826 : cardWidth, height: only ? 'auto' : Math.round(1123 * scale), overflow: 'hidden' }}>
      <div style={only ? undefined : { width: 794, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <CoverLetterPage template={template} resumeData={sample} letter={letter} presentation={presentation} readOnly={Boolean(only) ? false : true} pageWidthOverride={794} now={new Date('2026-10-06T10:00:00')} />
      </div>
    </div>
  </section>
}

createRoot(document.getElementById('root')).render(<main style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center', padding: 24 }}>
  {list.map(template => <Card key={template.id} template={template} />)}
</main>)
