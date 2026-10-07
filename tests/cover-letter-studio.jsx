// Fixture for PLAN-033: the real letter studio (shell, NIMBUS chat, Letter guide, Details/Format, signature)
// without sign-in. The NIMBUS endpoint is stubbed with a short streamed turn. Serve with npm run dev, open
// /tests/cover-letter-studio.html  ?template=<id>  ?state=empty|written  ?view=editor (resume editor with the letter as page 1)
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/template.css'
import '../src/layout-overrides.css'
import '../src/resume-flow.css'
import '../src/ai-assistant.css'
import '../src/editor-studio.css'
import '../src/print.css'
import '../src/buttons.css'
import '../src/format-panel.css'
import '../src/nimbus-chat.css'
import '../src/cover-letter.css'
import LetterStudio, { initialLetterMessages } from '../src/coverLetter/LetterStudio.jsx'
import CoverLetterPage from '../src/coverLetter/CoverLetterPage.jsx'
import { getResumeTemplate, resolveResumePresentation } from '../src/config/resumeTemplates.js'
import { templatePreviewResumeData } from '../src/data/templatePreviewData.js'
import { ensureResumeElementIds } from '../src/editor/resumeElementRegistry.js'
import { applyLetterEdit, createLetter, replaceParagraphs } from '../shared/letterModel.js'

const params = new URLSearchParams(location.search)
const template = getResumeTemplate(params.get('template') || 'ditgar')
const written = params.get('state') !== 'empty'

const paragraphs = [
  'Your Software Engineer opening at Northwind caught my eye because your team builds the tools that support agents rely on every day, and I have spent the last year building exactly that kind of dashboard with React and Node.js.',
  'At Google I cut response time by 30% through caching and query tuning, and I built the monitoring dashboards the team now uses to spot slow services before users do.',
  'Northwind’s decision to publish its accessibility audits is why I am applying to you and not to a larger firm.',
  'Thank you for reading. I would welcome a conversation about how I can help your dashboard team.'
]
let seed = createLetter()
if (written) {
  seed = replaceParagraphs(seed, paragraphs)
  seed = applyLetterEdit(seed, 'letter.recipient.name', 'Priya Shah')
  seed = applyLetterEdit(seed, 'letter.recipient.company', 'Northwind Systems')
}

// A streamed NIMBUS turn: think, plan one step, apply a paragraph rewrite, answer.
const realFetch = window.fetch.bind(window)
window.fetch = (url, options) => {
  if (!String(url).includes('/api/nimbus/turn')) return realFetch(url, options)
  const events = [
    { type: 'thinking', text: 'Reading your letter…' },
    { type: 'plan', steps: [{ id: 's1', title: 'Strengthen your closing' }] },
    { type: 'step', id: 's1', title: 'Strengthen your closing', operations: [{ type: 'set_paragraph', index: 3, text: 'Thank you for your time. I would welcome a conversation about how I can help Northwind’s dashboard team, and I look forward to hearing from you.' }] },
    { type: 'message', text: 'I rewrote the closing to thank them and ask for a conversation.' },
    { type: 'done' }
  ]
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (const event of events) { controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); await new Promise(resolve => setTimeout(resolve, 350)) }
      controller.close()
    }
  })
  return Promise.resolve(new Response(stream, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } }))
}

function Check() {
  const [resumeData, setResumeData] = useState(() => ensureResumeElementIds(templatePreviewResumeData))
  const [letter, setLetter] = useState(seed)
  const [messages, setMessages] = useState(initialLetterMessages)
  const [jobText, setJobText] = useState(params.get('job') ? 'Software Engineer at Northwind Systems\nBuild React and Node.js dashboards for support teams.' : '')
  const [included, setIncluded] = useState(false)
  const presentation = resolveResumePresentation(template, {})
  if (params.get('view') === 'editor') {
    return <div className="studio-canvas" style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <section className="letter-in-editor"><div className="letter-bar"><b>Cover letter</b><span>The first page of your document</span><button className="btn btn-secondary btn-sm">Edit letter</button><button className="btn btn-ghost btn-sm">Remove</button></div>
        <CoverLetterPage template={template} resumeData={resumeData} letter={letter} presentation={presentation} readOnly /></section>
    </div>
  }
  return <LetterStudio
    resumeData={resumeData} onResumeChange={setResumeData} resumeName="John Doe" template={template} presentation={presentation}
    letter={letter} onLetterChange={setLetter} messages={messages} setMessages={setMessages} jobText={jobText} onJobTextChange={setJobText}
    included={included} onAddToResume={() => setIncluded(true)} onRemoveFromResume={() => setIncluded(false)} onBackToResume={() => {}} onBack={() => {}} onOpenTailor={() => {}} />
}

createRoot(document.getElementById('root')).render(<Check />)
