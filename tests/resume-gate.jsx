// Fixture for PLAN-033: the "Select a resume first" pop-up over a page, with the page blurred behind it.
// ?state=none|draft  ?tool=tailor|letter|evidence
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import '../src/layout-overrides.css'
import '../src/buttons.css'
import '../src/editor-studio.css'
import ResumeGateDialog from '../src/pages/ResumeGate.jsx'

const params = new URLSearchParams(location.search)
const resumes = params.get('state') === 'draft' ? [{ id: 'session', name: 'John Doe', templateName: 'Ditgar', note: 'Open in this session' }] : []

function Page() {
  const [open, setOpen] = useState(true)
  return <div className="app-shell">
    <aside className="sidebar"><div className="sidebar-scroll"><div className="sidebar-section"><nav>
      <a className="sidebar-link active" href="#">Dashboard</a>
      <button type="button" className="sidebar-link" onClick={() => setOpen(true)}>Cover letters</button>
    </nav></div></div></aside>
    <main><h1>Dashboard</h1><p>Your resumes and recent activity live here.</p></main>
    {open && <ResumeGateDialog tool={params.get('tool') || 'letter'} resumes={resumes} onClose={() => setOpen(false)}
      onPick={() => alert('open tool')} onStart={() => alert('start')} onImport={() => alert('import')} />}
  </div>
}
createRoot(document.getElementById('root')).render(<Page />)
