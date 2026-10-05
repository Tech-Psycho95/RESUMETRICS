// Fixture for /workspace/evidence without sign-in: replays a synthetic GitHub scan and a synthetic LinkedIn profile.
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/layout-overrides.css'
import '../src/editor-studio.css'
import '../src/job-match.css'
import '../src/evidence.css'
import '../src/buttons.css'
import EvidenceScreen from '../src/components/evidence/EvidenceScreen.jsx'

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
const linkedinProfile = { savedAt: Date.now(), uploadedFileName: 'Profile.pdf', resumeData: {
  skills: { other: ['TypeScript', 'React.js', 'SQL', 'Figma'] },
  experience: [
    { company: 'Northwind', role: 'Software Engineering Intern', startDate: 'Jun 2024', endDate: 'Nov 2024' },
    { company: 'Contoso Ltd', role: 'Front-end Engineer', startDate: 'Jan 2025', endDate: 'Present' }
  ]
} }
const SourceIcon = ({ name }) => <span style={{ fontWeight: 700 }}>{name[0]}</span>

function EvidenceCheck() {
  const [sources, setSources] = useState({ github: true, linkedin: true })
  const [scan, setScan] = useState(null)
  const [profile, setProfile] = useState(null)
  const [exit, setExit] = useState('')
  const timer = useRef(0)
  const runScan = () => {
    window.clearInterval(timer.current)
    let done = 0
    setScan({ status: 'scanning', done: 0, total: 25, accessible: 61, cap: 25, percent: 0, repos: [], resumeSkills, errors: [] })
    timer.current = window.setInterval(() => {
      done += 1
      const repo = repos[done - 1]
      setScan(current => ({ ...current, done, percent: Math.round(done / 25 * 100), current: repo.name, repos: [...current.repos, repo] }))
      if (done === 25) {
        window.clearInterval(timer.current)
        setScan(current => ({ ...current, status: 'done', current: null, summary: 'Scanned your 25 most recent of 61 repositories. Most code is TypeScript and Python.' }))
      }
    }, 120)
  }
  window.__evidence = { runScan, cancel: () => { window.clearInterval(timer.current); setScan(current => ({ ...current, status: 'cancelled' })) } }
  return <div className="app-shell editor-shell studio-shell"><main><div className="studio">
    <header className="studio-topbar editor-toolbar"><div className="studio-topbar-start"><b>Fixture · Evidence</b>{exit && <span data-testid="exit"> — {exit}</span>}</div></header>
    <EvidenceScreen github={{ connected: true, connecting: false, onConnect: () => {}, scan, onScan: runScan, onCancel: window.__evidence.cancel }}
      onAddEvidence={() => setExit('add evidence → editor')} onContinue={() => setExit('continue → editor')} />
  </div></main></div>
}

createRoot(document.getElementById('root')).render(<EvidenceCheck />)
