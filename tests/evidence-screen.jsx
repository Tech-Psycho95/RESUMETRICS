// Fixture for /workspace/evidence without sign-in: replays a synthetic GitHub scan and a synthetic LinkedIn profile.
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/layout-overrides.css'
import '../src/editor-studio.css'
import '../src/job-match.css'
import '../src/resume-flow.css'
import '../src/job-tailoring.css'
import '../src/evidence.css'
import '../src/buttons.css'
import EvidenceWorkspace from '../src/components/evidence/EvidenceWorkspace.jsx'
import { getResumeTemplate, resolveResumePresentation } from '../src/config/resumeTemplates.js'
import { templatePreviewResumeData } from '../src/data/templatePreviewData.js'

// ?state=connect | ready | scanning | done (default: done, replayed quickly).
const state = new URLSearchParams(window.location.search).get('state') || 'done'
const template = getResumeTemplate('elegant-resume')

const languagesPool = [['TypeScript', 'CSS', 'HTML'], ['Python', 'Jupyter Notebook'], ['JavaScript', 'CSS'], ['Go'], ['Java'], ['TypeScript', 'Shell']]
const repos = Array.from({ length: 25 }, (_, index) => {
  const langs = languagesPool[index % languagesPool.length]
  return {
    name: `project-${String(index + 1).padStart(2, '0')}`, fullName: `me/project-${index + 1}`, url: '#', description: index % 3 ? `Synthetic repository number ${index + 1} for the evidence fixture` : '',
    pushedAt: new Date(Date.now() - index * 9 * 86_400_000).toISOString(), stars: index % 4 ? 0 : index * 2, fork: index === 7, archived: index === 11, private: index % 5 === 0, topics: [],
    languages: Object.fromEntries(langs.map((lang, position) => [lang, (langs.length - position) * (4000 + index * 900) * (lang === 'Go' ? 0.08 : 1)])),
    manifestSkills: langs.includes('TypeScript') ? ['React', 'Node.js', 'Jest'] : langs.includes('Python') ? ['Pandas', 'Flask'] : [],
    readmeSkills: index % 4 === 0 ? ['Docker', 'Kubernetes'] : [],
    filesChecked: ['README.md', 'package.json']
  }
})
const resumeSkills = ['TypeScript', 'JavaScript', 'Python', 'React', 'Go', 'Docker', 'Rust', 'Flask']
const resumeData = {
  skills: { languages: ['TypeScript', 'Python', 'Go'], frameworks: ['React', 'Flask'], tools: ['Docker'], databases: [], softSkills: [], other: [] },
  experience: [
    { company: 'Northwind Technologies', role: 'Software Engineering Intern', startDate: 'Jun 2024', endDate: 'Aug 2024' },
    { company: 'Contoso', role: 'Frontend Developer', startDate: 'Jan 2025', endDate: 'Present' },
    { company: 'Initech', role: 'Data Analyst', startDate: '2023', endDate: '2023' }
  ]
}
function EvidenceCheck() {
  const [scan, setScan] = React.useState(null)
  const timer = useRef(0)
  const runScan = (speed = 120) => {
    window.clearInterval(timer.current)
    let done = 0
    setScan({ status: 'scanning', done: 0, total: 25, accessible: 61, cap: 25, percent: 0, repos: [], resumeSkills, errors: [], startedAt: Date.now() })
    timer.current = window.setInterval(() => {
      done += 1
      const repo = repos[done - 1]
      setScan(current => ({ ...current, done, percent: Math.round(done / 25 * 100), current: repo.name, repos: [...current.repos, repo] }))
      if (done === (state === 'scanning' ? 14 : 25)) {
        window.clearInterval(timer.current)
        if (state !== 'scanning') setScan(current => ({ ...current, status: 'done', current: null }))
      }
    }, speed)
  }
  React.useEffect(() => { if (state === 'done' || state === 'scanning') runScan(state === 'done' ? 10 : 40) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  window.__evidence = { runScan, cancel: () => { window.clearInterval(timer.current); setScan(current => ({ ...current, status: 'cancelled' })) } }
  const Template = template.component
  const canvas = <div className="studio-canvas"><Template resumeData={{ ...templatePreviewResumeData, skills: resumeData.skills }} presentation={resolveResumePresentation(template, {})} readOnly /></div>
  return <div className="app-shell editor-shell studio-shell"><main><div className="studio tailor-page">
    <EvidenceWorkspace github={{ connected: state !== 'connect', connecting: false, login: 'johndoe', onConnect: () => {}, scan, onScan: () => runScan(), onCancel: window.__evidence.cancel }}
      resumeCanvas={canvas} resumeName="John Doe resume" templateName={template.name} onBack={() => {}} onOpenEditor={() => {}} />
  </div></main></div>
}

createRoot(document.getElementById('root')).render(<EvidenceCheck />)
