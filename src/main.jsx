import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import UserMenu from './components/UserMenu'
import Login from './pages/Login'
import './styles.css'
import './template.css'
import './layout-overrides.css'
import './interaction-overrides.css'
import logo from './assets/resumetrics-logo.png'

const navItems = [
  ['Workspace', '/', 'workspace']
]

const templates = [
  { name: 'Clarity', label: 'Single-column', tone: 'violet', initials: 'ALEX MORGAN' },
  { name: 'Signal', label: 'Metrics-forward', tone: 'blue', initials: 'JORDAN LEE' },
  { name: 'Editorial', label: 'Modern split', tone: 'warm', initials: 'SAM TAYLOR' },
  { name: 'Baseline', label: 'Classic', tone: 'slate', initials: 'PRIYA SHAH' }
]

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'workspace') return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
  if (name === 'import') return <svg {...common}><path d="M12 4v10M8 10l4 4 4-4" /><path d="M5 16v3h14v-3" /></svg>
  if (name === 'create') return <svg {...common}><path d="M4 17.5V20h2.5L18.8 7.7l-2.5-2.5L4 17.5Z" /><path d="m14.8 6.2 2.5 2.5M13 20h7" /></svg>
  if (name === 'evidence') return <svg {...common}><path d="M12 3 19 6v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
  if (name === 'download') return <svg {...common}><path d="M12 4v10M8 11l4 4 4-4M5 18v2h14v-2" /></svg>
  if (name === 'trash') return <svg {...common}><path d="M5 7h14M10 4h4l1 3H9l1-3ZM7 7l1 13h8l1-13M10 10v6M14 10v6" /></svg>
  if (name === 'spark') return <svg {...common}><path d="m12 3 1.1 4.1L17 8.5l-3.9 1.4L12 14l-1.1-4.1L7 8.5l3.9-1.4L12 3ZM19 14l.6 2.1L22 17l-2.4.9L19 20l-.6-2.1L16 17l2.4-.9L19 14Z" /></svg>
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
  return null
}

function SourceIcon({ name }) {
  if (name === 'GitHub') return <span className="source-icon github-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.48.09.65-.2.65-.46v-1.68c-2.65.58-3.21-1.12-3.21-1.12-.44-1.1-1.07-1.4-1.07-1.4-.87-.59.07-.58.07-.58.96.07 1.46.99 1.46.99.86 1.46 2.25 1.04 2.8.8.09-.62.34-1.04.61-1.28-2.12-.24-4.35-1.06-4.35-4.7 0-1.04.37-1.9.98-2.57-.1-.24-.43-1.22.09-2.54 0 0 .8-.26 2.62.98A9.1 9.1 0 0 1 12 7.1c.8 0 1.6.11 2.35.34 1.82-1.24 2.62-.98 2.62-.98.52 1.32.19 2.3.09 2.54.61.67.98 1.53.98 2.57 0 3.65-2.23 4.46-4.36 4.7.35.3.65.87.65 1.76v2.6c0 .26.17.56.66.46A9.5 9.5 0 0 0 12 2.5Z" /></svg></span>
  if (name === 'LinkedIn') return <span className="source-icon linkedin-mark" aria-hidden="true">in</span>
  return <span className="source-icon leetcode-mark" aria-hidden="true">&lt;/&gt;</span>
}

function FileIcon({ type }) {
  return <span className={`file-type-icon file-type-${type.toLowerCase()}`} aria-hidden="true">{type}</span>
}

function Shell({ children }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/" className="brand" aria-label="Resumetrics home">
        <img src={logo} alt="Resumetrics" />
      </NavLink>
      <nav>{navItems.map(([label, path, icon]) => <NavLink end={path === '/'} key={path} to={path}><Icon name={icon} size={17} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-footer">
        <UserMenu />
      </div>
    </aside>
    <main>{children}</main>
  </div>
}

function MainPage() {
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [connected, setConnected] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [resumeName, setResumeName] = useState('Untitled resume')
  const [editingName, setEditingName] = useState(false)
  const [importedFile, setImportedFile] = useState(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [templateConfirmOpen, setTemplateConfirmOpen] = useState(false)
  const [activeTool, setActiveTool] = useState('select')
  const [fontSize, setFontSize] = useState(14)
  const [fontColor, setFontColor] = useState('#172033')
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantMessages, setAssistantMessages] = useState([])
  const [draftDeleted, setDraftDeleted] = useState(false)
  const exportDraft = (format = 'TXT') => {
    const content = `${resumeName}\n${selectedTemplate.initials}\n${selectedTemplate.label} resume · ${selectedTemplate.name}\n\nTemplate loaded in Resumetrics.`
    const extensions = { PDF: 'pdf', DOCX: 'docx', PPTX: 'pptx', TXT: 'txt' }
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' })); link.download = `resumetrics-${resumeName.toLowerCase().replace(/\s+/g, '-')}.${extensions[format] || 'txt'}`; link.click(); URL.revokeObjectURL(link.href); setExportMenuOpen(false)
  }
  const deleteDraft = () => {
    if (window.confirm('Delete this draft? This will clear the current template from the workspace.')) { setTemplateLoaded(false); setDraftDeleted(true); setResumeName('Untitled resume'); setSelectedTemplate(templates[0]) }
  }
  const createTemplate = () => {
    if (templateLoaded) return
    setTemplateConfirmOpen(true)
  }
  const confirmTemplate = () => {
    setTemplateLoaded(true); setDraftDeleted(false); setTemplateConfirmOpen(false)
  }
  const handleImport = (event) => {
    const file = event.target.files?.[0]
    if (file) { setImportedFile(file); setDraftDeleted(false) }
  }
  const askAssistant = (event) => {
    event.preventDefault(); if (!assistantInput.trim()) return
    setAssistantMessages(current => [...current, { role: 'user', text: assistantInput.trim() }, { role: 'assistant', text: 'I’ll use that direction when editing the selected template.' }]); setAssistantInput('')
  }
  const toggleSource = (source) => setConnected(current => current.includes(source) ? current.filter(x => x !== source) : [...current, source])
  const analyse = () => {
    if (!description.trim()) return
    setAnalysis({ score: Math.min(92, 58 + Math.floor(description.length / 18)), skills: ['Stakeholder communication', 'Data analysis', 'Project delivery'] })
  }
  return <Shell>
    <header className="page-header"><div><span className="eyebrow">RESUME WORKSPACE</span></div><div className="header-actions"><div className="draft-actions"><div className="export-wrap"><button className="quiet-button" onClick={() => setExportMenuOpen(current => !current)}><Icon name="download" size={15} />Export draft</button>{exportMenuOpen && <div className="export-menu"><span>Export as</span><button onClick={() => exportDraft('PDF')}><FileIcon type="PDF" />PDF</button><button onClick={() => exportDraft('DOCX')}><FileIcon type="DOCX" />Word</button><button onClick={() => exportDraft('PPTX')}><FileIcon type="PPTX" />PowerPoint</button></div>}</div><button className="danger-button" onClick={deleteDraft}><Icon name="trash" size={15} />Delete draft</button></div></div></header>
    <div className="workspace-grid">
      <aside className="editor-toolbar panel" aria-label="Resume editing tools"><span className="toolbar-label">EDIT</span><button className={activeTool === 'select' ? 'tool active' : 'tool'} onClick={() => setActiveTool('select')}>Select</button><button className={activeTool === 'text' ? 'tool active' : 'tool'} onClick={() => setActiveTool('text')}>Text</button><button className={activeTool === 'bold' ? 'tool active' : 'tool'} onClick={() => setActiveTool('bold')}><strong>B</strong></button><label className="color-tool" title="Text colour"><input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} /><span style={{ backgroundColor: fontColor }} /></label><label className="font-size-tool">{fontSize}<select value={fontSize} onChange={e => setFontSize(Number(e.target.value))} aria-label="Font size"><option value="12">12</option><option value="14">14</option><option value="16">16</option><option value="18">18</option></select></label><button className="tool" onClick={() => setActiveTool('align')}>Align</button></aside>
      <section className="resume-canvas panel">
        <div className="canvas-top"><div className="resume-title-wrap">{editingName ? <input className="resume-title-input" autoFocus value={resumeName} onChange={e => setResumeName(e.target.value)} onBlur={() => { setResumeName(resumeName.trim() || 'Untitled resume'); setEditingName(false) }} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} aria-label="Resume name" /> : <button className="resume-title-button" onClick={() => setEditingName(true)}>{resumeName}</button>}</div><span className="status-dot">{templateLoaded ? 'Template locked' : 'Draft'}</span></div>
        {templateLoaded ? <div className={`resume-preview loaded-${selectedTemplate.tone}`} style={{ color: fontColor, fontSize: `${fontSize}px` }}><div className="preview-name">{selectedTemplate.initials}</div><div className="preview-role">{selectedTemplate.label} resume · {selectedTemplate.name}</div><div className="preview-rule" /><div className="preview-columns"><div><span /><span /><span /><span /></div><div><span /><span /><span /></div></div><div className="preview-footer">Template loaded · Ready to edit</div></div> : <label className="canvas-empty import-drop-target"><input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt" onChange={handleImport} /><div className="document-mark plus-mark"><Icon name="plus" size={26} /></div><p>{importedFile ? `${importedFile.name} ready to import` : 'Click to import your resume'}</p><small>PDF, PowerPoint, Word, or TXT</small></label>}
      </section>
      <div className="right-rail">
      <aside className="analysis-panel panel">
        <div><span className="eyebrow">ROLE ALIGNMENT</span><h2>Job description</h2><p className="muted">Add a target role to uncover what your resume proves—and what it does not.</p></div>
        <textarea value={description} maxLength="5000" onChange={e => setDescription(e.target.value)} placeholder="Paste the job description here…" />
        <div className="char-count">{description.length} / 5000</div>
        <button className="primary-button full-width" onClick={analyse} disabled={!description.trim()}>Analyse alignment</button>
        <div className="score-card">
          <div><span>Role match</span><strong>{analysis ? `${analysis.score}%` : '—'}</strong></div>
          <p>{analysis ? 'Initial estimate based on the supplied job description.' : 'Waiting for a job description.'}</p>
          {analysis && <div className="skill-tags">{analysis.skills.map(skill => <span key={skill}>{skill}</span>)}</div>}
        </div>
      </aside>
      <section className="ai-panel panel"><div className="ai-heading"><div><span className="eyebrow">EDIT WITH AI</span><h2>Shape the draft.</h2><p className="muted">Ask for a rewrite or a stronger connection to the role.</p></div><Icon name="spark" size={20} /></div><div className="assistant-body"><div className="assistant-messages">{assistantMessages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}</div><form className="assistant-form" onSubmit={askAssistant}><input value={assistantInput} onChange={e => setAssistantInput(e.target.value)} placeholder="Tell AI what to improve…" aria-label="Tell AI what to improve" /><button className="arrow-button" aria-label="Send" title="Send" type="submit">→</button></form></div></section>
      </div>
    </div>
    <section className="lower-grid">
      <div className={`panel section-panel templates-panel ${templateLoaded ? 'templates-locked' : ''}`}><div className="templates-heading"><div><span className="eyebrow">TEMPLATES</span><h2>Choose a structure that fits your story.</h2><p className="muted">{templateLoaded ? 'Template locked. Delete the draft to start with a different design.' : 'Preview a layout, then load it into your workspace to begin editing.'}</p></div>{templateLoaded && <span className="lock-label">Locked</span>}</div><div className="template-scroll">{templates.map(template => <button disabled={templateLoaded} className={`template-option ${selectedTemplate.name === template.name ? 'selected' : ''}`} key={template.name} onClick={() => setSelectedTemplate(template)}><div className={`template-thumbnail ${template.tone}`}><strong>{template.initials}</strong><small>{template.label}</small><div className="thumbnail-lines"><i /><i /><i /><i /><i /></div></div><span>{template.name}</span></button>)}</div><button className="primary-button create-template-button" disabled={templateLoaded} onClick={createTemplate}>{templateLoaded ? 'Template locked' : 'Create template'}</button></div>
      <div className="panel section-panel evidence-panel"><span className="eyebrow">EVIDENCE SOURCES</span><h2>Verify the work behind the words.</h2><p className="muted">Connect a source to surface credible proof for projects, skills, and outcomes.</p><div className="sources">{['GitHub', 'LinkedIn', 'LeetCode'].map(source => <div className="source" key={source}><div className="source-identity"><SourceIcon name={source} /><span><b>{source}</b><small>{connected.includes(source) ? 'Connected for review' : 'Available to connect'}</small></span></div><button className="text-button" onClick={() => toggleSource(source)}>{connected.includes(source) ? 'Connected' : 'Connect'}</button></div>)}</div><button className="quiet-button evidence-review-panel-button" onClick={() => navigate('/evaluation')}>View evidence review</button></div>
    </section>
    {templateConfirmOpen && <div className="modal-backdrop" role="presentation"><section className="confirm-modal" role="dialog" aria-modal="true" aria-label="Template lock confirmation"><div className="modal-kicker">TEMPLATE LOCK</div><p>Once created, this template will be locked and cannot be switched. Delete the draft if you want to start again with a different design.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setTemplateConfirmOpen(false)}>Cancel</button><button className="primary-button" onClick={confirmTemplate}>Create and lock</button></div></section></div>}
  </Shell>
}

function ImportPage() {
  const navigate = useNavigate(); const [file, setFile] = useState(null)
  return <Shell><header className="page-header"><div><span className="eyebrow">IMPORT RESUME</span><h1>Bring your current resume into focus.</h1></div></header><section className="panel route-card"><label className="drop-zone"><input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} /><span className="document-mark">R</span><h2>{file ? file.name : 'Choose a resume to import'}</h2><p>{file ? 'Ready to prepare for evidence review.' : 'Supported formats: PDF, DOCX, and TXT.'}</p><span className="secondary-button">Select file</span></label>{file && <button className="primary-button" onClick={() => navigate('/evaluation')}>Continue to evidence review</button>}</section></Shell>
}

function CreatePage() {
  const navigate = useNavigate(); const [title, setTitle] = useState(''); const [summary, setSummary] = useState('')
  return <Shell><header className="page-header"><div><span className="eyebrow">CREATE RESUME</span><h1>Begin with the essentials.</h1></div></header><section className="panel form-card"><label>Target role<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Product analyst" /></label><label>Professional summary<textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Describe the work you want your resume to show." /></label><button className="primary-button" disabled={!title.trim()} onClick={() => navigate('/evaluation')}>Continue to evidence review</button></section></Shell>
}

function EvaluationPage() {
  return <Shell><header className="page-header"><div><span className="eyebrow">EVIDENCE REVIEW</span><h1>Make each claim defensible.</h1></div></header><section className="evaluation-grid"><div className="panel section-panel"><h2>Evidence readiness</h2><div className="readiness"><strong>0%</strong><span>Connect a source or import a resume to begin scoring.</span></div></div><div className="panel section-panel"><h2>What we will assess</h2><ul><li>Skills supported by projects or outcomes</li><li>Experience claims with measurable impact</li><li>Job-description alignment beyond keywords</li></ul></div></section></Shell>
}

function App() { 
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
      <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
      <Route path="/evaluation" element={<ProtectedRoute><EvaluationPage /></ProtectedRoute>} />
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
