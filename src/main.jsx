import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import UserMenu from './components/UserMenu.jsx'
import Login from './pages/Login.jsx'
import LandingPage from './pages/LandingPage.jsx'
import mammoth from 'mammoth/mammoth.browser.js'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import './styles.css'
import './template.css'
import './layout-overrides.css'
import './interaction-overrides.css'
import './import-preview.css'
import './resume-flow.css'
import './github-evidence.css'
import logo from './assets/resumetrics-logo.png'
import ResumeStartOptions from './components/ResumeStartOptions.jsx'
import ResumeTemplateSelector from './components/ResumeTemplateSelector.jsx'
import ResumeExtractionReview from './components/ResumeExtractionReview.jsx'
import GitHubEvidenceReview from './components/GitHubEvidenceReview.jsx'
import { resumeTemplates } from './config/resumeTemplates.js'
import { createBlankResumeData } from './data/resumeData.js'
import { buildSkillAwareRoleAnalysis } from '../shared/roleAnalysis.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const navItems = [
  ['Workspace', '/workspace', 'workspace']
]

// Retained only for the legacy prototype below while the existing auxiliary
// routes are kept stable. The active workspace uses resumeTemplates instead.
const templates = [
  { name: 'Clarity', label: 'Single-column', tone: 'violet', initials: 'ALEX MORGAN' },
  { name: 'Signal', label: 'Metrics-forward', tone: 'blue', initials: 'JORDAN LEE' },
  { name: 'Editorial', label: 'Modern split', tone: 'warm', initials: 'SAM TAYLOR' },
  { name: 'Baseline', label: 'Classic', tone: 'slate', initials: 'PRIYA SHAH' }
]

const fontFamilies = [
  ['Inter', 'Inter, sans-serif'],
  ['DM Sans', 'DM Sans, sans-serif'],
  ['Space Grotesk', 'Space Grotesk, sans-serif'],
  ['Merriweather', 'Merriweather, serif'],
  ['Georgia', 'Georgia, serif'],
  ['Arial', 'Arial, sans-serif']
]

const automationColors = {
  black: '#172033', navy: '#172f4e', blue: '#2563eb', purple: '#5d49d8', violet: '#6d42d8', green: '#16745f', gray: '#4b5563', grey: '#4b5563'
}

const safeFileName = value => (value || 'untitled-resume').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled-resume'
const githubResumeSnapshotKey = 'resumetrics:pending-github-evidence-resume'
const githubResumeSnapshotMaxAge = 15 * 60 * 1000
const githubComparisonRequestKey = 'resumetrics:github-evidence-comparison'
const githubComparisonRequestMaxAge = 30 * 60 * 1000

function getResumeEvidenceSkills(resumeData) {
  if (!resumeData) return []
  const values = [
    ...Object.values(resumeData.skills ?? {}).flat(),
    ...(resumeData.projects ?? []).flatMap(project => project.techStack ?? []),
    ...(resumeData.certifications ?? [])
  ]
  return [...new Map(values.filter(value => typeof value === 'string' && value.trim()).map(value => [value.trim().toLocaleLowerCase(), value.trim()])).values()].slice(0, 24)
}

function readQueuedGitHubComparison() {
  try {
    const request = JSON.parse(sessionStorage.getItem(githubComparisonRequestKey) || 'null')
    if (request?.resumeData && Date.now() - request.savedAt <= githubComparisonRequestMaxAge) return request
    sessionStorage.removeItem(githubComparisonRequestKey)
  } catch {
    sessionStorage.removeItem(githubComparisonRequestKey)
  }
  return null
}

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function AnimatedMatchScore({ score, runId }) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    const target = Math.max(0, Math.min(100, Number(score) || 0))
    const duration = 760
    const startedAt = performance.now()
    let frameId

    const animate = now => {
      const progress = Math.min(1, (now - startedAt) / duration)
      setDisplayScore(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frameId = requestAnimationFrame(animate)
    }

    setDisplayScore(0)
    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [score, runId])

  return <strong className="animated-match-score" aria-label={`Role match ${displayScore}%`}>{displayScore}%</strong>
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'workspace') return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
  if (name === 'import') return <svg {...common}><path d="M12 4v10M8 10l4 4 4-4" /><path d="M5 16v3h14v-3" /></svg>
  if (name === 'create') return <svg {...common}><path d="M4 17.5V20h2.5L18.8 7.7l-2.5-2.5L4 17.5Z" /><path d="m14.8 6.2 2.5 2.5M13 20h7" /></svg>
  if (name === 'evidence') return <svg {...common}><path d="M12 3 19 6v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
  if (name === 'download') return <svg {...common}><path d="M12 4v10M8 11l4 4 4-4M5 18v2h14v-2" /></svg>
  if (name === 'trash') return <svg {...common}><path d="M5 7h14M10 4h4l1 3H9l1-3ZM7 7l1 13h8l1-13M10 10v6M14 10v6" /></svg>
  if (name === 'spark') return <svg {...common}><path d="m12 3 1.1 4.1L17 8.5l-3.9 1.4L12 14l-1.1-4.1L7 8.5l3.9-1.4L12 3ZM19 14l.6 2.1L22 17l-2.4.9L19 20l-.6-2.1L16 17l2.4-.9L19 14Z" /></svg>
  if (name === 'appearance') return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
  if (name === 'moon') return <svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" fill="currentColor" stroke="none" /></svg>
  if (name === 'device') return <svg {...common}><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 20h8M12 17v3" /></svg>
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>
  if (name === 'security') return <svg {...common}><path d="M12 3 19 6v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
  if (name === 'notifications') return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
  if (name === 'privacy') return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>
  if (name === 'help') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 4.1 1.7c-1 .8-1.8 1.2-1.8 2.8M12 17h.01" /></svg>
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
  return null
}

function AlignIcon({ alignment }) {
  const common = { width: 17, height: 17, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', 'aria-hidden': true }
  if (alignment === 'left') return <svg {...common}><path d="M3 4h9M3 8h14M3 12h11M3 16h14" /></svg>
  if (alignment === 'center') return <svg {...common}><path d="M5 4h10M3 8h14M4 12h12M3 16h14" /></svg>
  return <svg {...common}><path d="M8 4h9M3 8h14M6 12h11M3 16h14" /></svg>
}

function SourceIcon({ name }) {
  if (name === 'GitHub') return <span className="source-icon github-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.48.09.65-.2.65-.46v-1.68c-2.65.58-3.21-1.12-3.21-1.12-.44-1.1-1.07-1.4-1.07-1.4-.87-.59.07-.58.07-.58.96.07 1.46.99 1.46.99.86 1.46 2.25 1.04 2.8.8.09-.62.34-1.04.61-1.28-2.12-.24-4.35-1.06-4.35-4.7 0-1.04.37-1.9.98-2.57-.1-.24-.43-1.22.09-2.54 0 0 .8-.26 2.62.98A9.1 9.1 0 0 1 12 7.1c.8 0 1.6.11 2.35.34 1.82-1.24 2.62-.98 2.62-.98.52 1.32.19 2.3.09 2.54.61.67.98 1.53.98 2.57 0 3.65-2.23 4.46-4.36 4.7.35.3.65.87.65 1.76v2.6c0 .26.17.56.66.46A9.5 9.5 0 0 0 12 2.5Z" /></svg></span>
  if (name === 'LinkedIn') return <span className="source-icon linkedin-mark" aria-hidden="true">in</span>
  return <span className="source-icon leetcode-mark" aria-hidden="true">&lt;/&gt;</span>
}

function GeneralSettingsPanel() {
  const [appearance, setAppearance] = useState(() => localStorage.getItem('resumetrics-appearance') || 'system')
  const [notice, setNotice] = useState('')
  const settings = [
    ['security', 'Account & Security', 'Login, password & security'],
    ['notifications', 'Notifications & updates', 'Manage alerts and updates'],
    ['privacy', 'Privacy & Data', 'Data storage and permissions'],
    ['help', 'Help & Support', 'Feedback, FAQs and support']
  ]

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolvedTheme = appearance === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : appearance
      root.dataset.resolvedTheme = resolvedTheme
    }
    root.dataset.appearance = appearance
    localStorage.setItem('resumetrics-appearance', appearance)
    applyTheme()
    mediaQuery.addEventListener?.('change', applyTheme)
    return () => mediaQuery.removeEventListener?.('change', applyTheme)
  }, [appearance])

  return <div className="panel section-panel settings-panel">
    <span className="eyebrow">GENERAL SETTINGS</span>
    <h2>Make the workspace yours.</h2>
    <p className="muted">Manage your preferences and account basics.</p>
    <div className="settings-list">
      <div className="setting-row appearance-row">
        <div className="setting-identity"><span className="setting-icon"><Icon name="appearance" size={17} /></span><span><b>Appearance</b><small>Light / Dark / System</small></span></div>
        <div className="appearance-toggle" role="group" aria-label="Appearance">
          <span className={`appearance-toggle-thumb ${appearance}`} aria-hidden="true" />
          {[['light', 'appearance', 'Light'], ['dark', 'moon', 'Dark'], ['system', 'device', 'System']].map(([option, icon, label]) => <button className={appearance === option ? 'active' : ''} type="button" key={option} onClick={() => setAppearance(option)} aria-label={label} title={label} aria-pressed={appearance === option}><Icon name={icon} size={15} /></button>)}
        </div>
      </div>
      {settings.map(([icon, title, description]) => <button className="setting-row setting-button" key={title} type="button" onClick={() => setNotice(`${title} settings will be available in a future update.`)}>
        <span className="setting-identity"><span className="setting-icon"><Icon name={icon} size={17} /></span><span><b>{title}</b><small>{description}</small></span></span><span className="setting-chevron" aria-hidden="true">›</span>
      </button>)}
    </div>
    {notice && <p className="settings-notice" role="status">{notice}</p>}
  </div>
}

function FileIcon({ type }) {
  return <span className={`file-type-icon file-type-${type.toLowerCase()}`} aria-hidden="true">{type}</span>
}

const DOCX_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const readUint32 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)
const readUint16 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8)

async function readDocxCopy(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let offset = 0
  while (offset + 30 < bytes.length) {
    if (readUint32(bytes, offset) !== 0x04034b50) { offset += 1; continue }
    const method = readUint16(bytes, offset + 8)
    const compressedSize = readUint32(bytes, offset + 18) >>> 0
    const nameLength = readUint16(bytes, offset + 26)
    const extraLength = readUint16(bytes, offset + 28)
    const name = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLength))
    const dataStart = offset + 30 + nameLength + extraLength
    if (name === 'word/document.xml') {
      const compressed = bytes.slice(dataStart, dataStart + compressedSize)
      let xmlBytes = compressed
      if (method === 8) {
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
        xmlBytes = new Uint8Array(await new Response(stream).arrayBuffer())
      }
      const xml = new DOMParser().parseFromString(new TextDecoder().decode(xmlBytes), 'application/xml')
      const paragraphs = Array.from(xml.getElementsByTagNameNS(DOCX_NS, 'p')).map(paragraph => Array.from(paragraph.getElementsByTagNameNS(DOCX_NS, 't')).map(text => text.textContent).join('')).filter(Boolean)
      return paragraphs.length ? paragraphs.map(text => `<p>${text.replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character]))}</p>`).join('') : '<p>This Word document does not contain readable body text.</p>'
    }
    offset = dataStart + compressedSize
  }
  throw new Error('Could not find the Word document body.')
}

const escapeHtml = value => value.replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character]))
const decodePdfLiteral = literal => literal.slice(1, -1).replace(/\\([nrtbf()\\])/g, (_, character) => ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' }[character])).replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
const decodePdfHex = token => {
  const hex = token.slice(1, -1).replace(/\s/g, '')
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < hex.length; index += 2) bytes[index / 2] = parseInt(hex.slice(index, index + 2).padEnd(2, '0'), 16)
  if (bytes[0] === 0xfe && bytes[1] === 0xff) { let value = ''; for (let index = 2; index + 1 < bytes.length; index += 2) value += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]); return value }
  return new TextDecoder('latin1').decode(bytes)
}
const decodePdfToken = token => token.startsWith('(') ? decodePdfLiteral(token) : decodePdfHex(token)
const bytesToBinary = bytes => { let result = ''; for (let offset = 0; offset < bytes.length; offset += 0x8000) result += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); return result }

async function readPdfCopy(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const binary = bytesToBinary(bytes)
  const streams = []
  let searchFrom = 0
  while (true) {
    const marker = binary.indexOf('stream', searchFrom)
    if (marker < 0) break
    const streamStart = binary[marker + 6] === '\r' && binary[marker + 7] === '\n' ? marker + 8 : marker + 7
    const streamEnd = binary.indexOf('endstream', streamStart)
    if (streamEnd < 0) break
    const dictionary = binary.slice(Math.max(0, marker - 500), marker)
    let dataEnd = streamEnd
    while (dataEnd > streamStart && (binary[dataEnd - 1] === '\n' || binary[dataEnd - 1] === '\r')) dataEnd -= 1
    streams.push({ dictionary, data: bytes.slice(streamStart, dataEnd) })
    searchFrom = streamEnd + 9
  }

  const textRuns = []
  for (const stream of streams) {
    let contentBytes = stream.data
    if (/\/FlateDecode/.test(stream.dictionary)) {
      try {
        const inflated = new Blob([contentBytes]).stream().pipeThrough(new DecompressionStream('deflate'))
        contentBytes = new Uint8Array(await new Response(inflated).arrayBuffer())
      } catch { continue }
    }
    const content = new TextDecoder('latin1').decode(contentBytes)
    for (const textBlock of content.matchAll(/BT([\s\S]*?)ET/g)) {
      const operators = textBlock[1].matchAll(/(\((?:\\.|[^\\)])*\)|<[\da-fA-F\s]+>|\[(?:[\s\S]*?)\])\s*(Tj|TJ|'|")/g)
      const parts = []
      for (const operator of operators) {
        const token = operator[1]
        const values = token.startsWith('[') ? [...token.matchAll(/\((?:\\.|[^\\)])*\)|<[\da-fA-F\s]+>/g)].map(match => decodePdfToken(match[0])) : [decodePdfToken(token)]
        const value = values.join('').replace(/\s+/g, ' ').trim()
        if (value) parts.push(value)
      }
      if (parts.length) textRuns.push(parts.join(' '))
    }
  }
  const readableText = [...new Set(textRuns)].filter(Boolean)
  if (!readableText.length) throw new Error('Could not extract readable PDF text.')
  return readableText.map(text => `<p>${escapeHtml(text)}</p>`).join('')
}

function cleanExtractedText(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

async function readDocxText(file) {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  const text = cleanExtractedText(result.value)
  if (!text) throw new Error('This DOCX file does not contain readable text.')
  return text
}

async function readPdfText(file) {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  let documentProxy
  try {
    documentProxy = await loadingTask.promise
    const pages = []
    for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
      const page = await documentProxy.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items
        .filter(item => typeof item.str === 'string')
        .map(item => `${item.str}${item.hasEOL ? '\n' : ' '}`)
        .join('')
      if (pageText.trim()) pages.push(pageText)
    }
    const text = cleanExtractedText(pages.join('\n\n'))
    if (!text) throw new Error('This PDF appears to be scanned or does not contain selectable text.')
    return text
  } catch (error) {
    if (error?.name === 'PasswordException') throw new Error('This PDF is password-protected. Please upload an unlocked copy.')
    throw error
  } finally {
    await loadingTask.destroy?.()
  }
}

function htmlToPlainText(html) {
  const documentFragment = new DOMParser().parseFromString(html.replace(/<\/(p|div|h[1-6]|li)>/gi, '$&\n'), 'text/html')
  return (documentFragment.body.textContent || '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

async function extractResumeText(file) {
  const fileName = file.name.toLowerCase()
  if (file.type === 'text/plain' || fileName.endsWith('.txt')) return (await file.text()).trim()
  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) return readPdfText(file)
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) return readDocxText(file)
  throw new Error('Could not read this file. Try a text-based PDF, DOCX, or TXT file.')
}

function ImportedDocument({ file, fontSize, fontColor, fontFamily = fontFamilies[0][1], activeTool, onEditorReady }) {
  const [copyHtml, setCopyHtml] = useState('<p>Preparing editable copy…</p>')
  const [status, setStatus] = useState('Preparing document…')
  const editorRef = useRef(null)
  const isDocx = file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  useEffect(() => {
    let active = true
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    setStatus(isPdf ? 'Reading PDF document…' : isDocx ? 'Reading Word document…' : 'Unsupported Word format')
    const read = isPdf ? readPdfCopy(file) : isDocx ? readDocxCopy(file) : Promise.reject(new Error('Legacy Word format'))
    read.then(html => { if (active) { setCopyHtml(html); setStatus(isPdf ? 'Editable PDF copy ready' : 'Editable Word copy ready') } }).catch(() => { if (active) { const message = isPdf ? `<h2>Editable copy of ${escapeHtml(file.name)}</h2><p>Text extraction was not available for this PDF, but you can type or paste the resume content into this editable copy.</p>` : isDocx ? '<p>This Word document could not be parsed in the browser. Try saving it as DOCX and import again.</p>' : `<h2>${escapeHtml(file.name)}</h2><p>Legacy Word files are not directly readable in the browser. Save the document as DOCX for an editable copy.</p>`; setCopyHtml(message); setStatus(isPdf ? 'Edit manually' : isDocx ? 'Needs a DOCX file' : 'Save as DOCX to edit') } })
    return () => { active = false }
  }, [file, isDocx])
  useEffect(() => { onEditorReady?.(editorRef.current) }, [onEditorReady, copyHtml])
  return <div className="imported-document"><div className="imported-document-grid"><div ref={editorRef} className={`editable-copy document-page editor-mode-${activeTool}`} contentEditable role="textbox" aria-multiline="true" aria-label={`Editable copy of ${file.name}`} spellCheck suppressContentEditableWarning style={{ fontSize: `${fontSize}px`, color: fontColor, fontFamily }} dangerouslySetInnerHTML={{ __html: copyHtml }} /></div><span className="editor-status" aria-live="polite">{status}</span></div>
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

function LegacyWorkspacePrototype() {
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
  const editorRef = useRef(null)
  const selectionRef = useRef(null)
  const [activeTool, setActiveTool] = useState('select')
  const [fontSize, setFontSize] = useState(14)
  const [fontColor, setFontColor] = useState('#172033')
  const [fontFamily, setFontFamily] = useState(fontFamilies[0][1])
  const [hasSelection, setHasSelection] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantMessages, setAssistantMessages] = useState([])
  const [aiTestLoading, setAiTestLoading] = useState(false)
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
    if (file) { setImportedFile(file); setTemplateLoaded(false); setDraftDeleted(false) }
  }
  const askAssistant = async (event) => {
    event.preventDefault()
    const message = assistantInput.trim()
    if (!message || aiTestLoading) return

    setAssistantInput('')
    setAiTestLoading(true)
    setAssistantMessages(current => [...current, { role: 'user', text: message }, { role: 'assistant', text: 'Testing the AI backend…' }])

    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'AI backend request failed.')
      setAssistantMessages(current => [...current.slice(0, -1), { role: 'assistant', text: payload.result }])
    } catch (error) {
      setAssistantMessages(current => [...current.slice(0, -1), { role: 'assistant', text: error.message || 'AI backend request failed.' }])
    } finally {
      setAiTestLoading(false)
    }
  }
  const toggleSource = (source) => setConnected(current => current.includes(source) ? current.filter(x => x !== source) : [...current, source])
  const analyse = () => {
    if (!description.trim()) return
    setAnalysis({ score: Math.min(92, 58 + Math.floor(description.length / 18)), skills: ['Stakeholder communication', 'Data analysis', 'Project delivery'] })
  }
  const rememberSelection = () => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!selection?.rangeCount || !editor) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
      setHasSelection(!selection.isCollapsed)
    }
  }
  useEffect(() => {
    document.addEventListener('selectionchange', rememberSelection)
    return () => document.removeEventListener('selectionchange', rememberSelection)
  }, [])
  const restoreSelection = () => {
    const selection = window.getSelection()
    if (!selection || !selectionRef.current) return
    selection.removeAllRanges(); selection.addRange(selectionRef.current)
  }
  const applyFormat = (command, value) => {
    const editor = editorRef.current
    if (!editor || activeTool !== 'select') return
    editor.focus(); restoreSelection()
    document.execCommand('styleWithCSS', false, true)
    document.execCommand(command, false, value)
    if (command === 'fontSize') editor.querySelectorAll('font[size="7"]').forEach(node => { node.removeAttribute('size'); node.style.fontSize = `${value}px` })
    if (command === 'fontName') editor.querySelectorAll('font[face]').forEach(node => { node.style.fontFamily = value; node.removeAttribute('face') })
    rememberSelection()
  }
  const selectFont = value => { setFontFamily(value); applyFormat('fontName', value) }
  const selectSize = value => { const numericSize = Number(value); setFontSize(numericSize); applyFormat('fontSize', numericSize) }
  const focusTextTool = () => { setActiveTool('text'); requestAnimationFrame(() => editorRef.current?.focus()) }
  const editorReady = editor => { editorRef.current = editor }
  return <Shell>
    <header className="page-header"><div><span className="eyebrow">RESUME WORKSPACE</span></div><div className="header-actions"><div className="draft-actions"><div className="export-wrap"><button className="quiet-button" onClick={() => setExportMenuOpen(current => !current)}><Icon name="download" size={15} />Export draft</button>{exportMenuOpen && <div className="export-menu"><span>Export as</span><button onClick={() => exportDraft('PDF')}><FileIcon type="PDF" />PDF</button><button onClick={() => exportDraft('DOCX')}><FileIcon type="DOCX" />Word</button><button onClick={() => exportDraft('PPTX')}><FileIcon type="PPTX" />PowerPoint</button></div>}</div><button className="danger-button" onClick={deleteDraft}><Icon name="trash" size={15} />Delete draft</button></div></div></header>
    <div className="workspace-grid">
      <aside className="editor-toolbar panel" aria-label="Resume editing tools">
        <span className="toolbar-label">EDIT</span>
        <div className="tool-group mode-tools"><button className={activeTool === 'select' ? 'tool active' : 'tool'} onClick={() => setActiveTool('select')}>Select</button><button className={activeTool === 'text' ? 'tool active' : 'tool'} onClick={focusTextTool}>Text</button></div>
        <span className="tool-divider" />
        <div className="tool-group formatting-tools" aria-label="Text formatting">
          <button className="tool icon-tool" disabled={!importedFile || activeTool !== 'select'} onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('bold')} aria-label="Bold" title="Bold"><strong>B</strong></button>
          <button className="tool icon-tool italic-tool" disabled={!importedFile || activeTool !== 'select'} onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('italic')} aria-label="Italic" title="Italic"><em>I</em></button>
          <button className="tool icon-tool underline-tool" disabled={!importedFile || activeTool !== 'select'} onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('underline')} aria-label="Underline" title="Underline"><u>U</u></button>
          <label className={`color-tool ${!importedFile || activeTool !== 'select' ? 'disabled' : ''}`} title="Text colour"><input type="color" value={fontColor} disabled={!importedFile || activeTool !== 'select'} onChange={e => { setFontColor(e.target.value); applyFormat('foreColor', e.target.value) }} aria-label="Text colour" /><span style={{ backgroundColor: fontColor }} /></label>
          <label className={`font-size-tool ${!importedFile || activeTool !== 'select' ? 'disabled' : ''}`}><span>{fontSize}</span><select value={fontSize} disabled={!importedFile || activeTool !== 'select'} onChange={e => selectSize(e.target.value)} aria-label="Font size"><option value="12">12</option><option value="14">14</option><option value="16">16</option><option value="18">18</option><option value="20">20</option><option value="24">24</option></select><small>px</small></label>
          <label className={`font-family-tool ${!importedFile || activeTool !== 'select' ? 'disabled' : ''}`}><select value={fontFamily} disabled={!importedFile || activeTool !== 'select'} onChange={e => selectFont(e.target.value)} aria-label="Font family">{fontFamilies.map(([name, value]) => <option value={value} key={name}>{name}</option>)}</select></label>
        </div>
        <span className="tool-divider" />
        <div className="tool-group align-tools" aria-label="Text alignment">
          <span className="toolbar-sublabel">ALIGN</span>
          <div className="align-buttons"><button className="tool icon-tool" disabled={!importedFile || activeTool !== 'select'} onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('justifyLeft')} aria-label="Align left" title="Align left">≡</button><button className="tool icon-tool" disabled={!importedFile || activeTool !== 'select'} onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('justifyCenter')} aria-label="Align center" title="Align center">≡</button><button className="tool icon-tool" disabled={!importedFile || activeTool !== 'select'} onMouseDown={e => e.preventDefault()} onClick={() => applyFormat('justifyRight')} aria-label="Align right" title="Align right">≡</button></div>
        </div>
        {importedFile && <span className="selection-hint">{hasSelection ? 'Text selected' : 'Select text to format'}</span>}
      </aside>
      <section className="resume-canvas panel">
        <div className="canvas-top"><div className="resume-title-wrap">{editingName ? <input className="resume-title-input" autoFocus value={resumeName} onChange={e => setResumeName(e.target.value)} onBlur={() => { setResumeName(resumeName.trim() || 'Untitled resume'); setEditingName(false) }} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} aria-label="Resume name" /> : <button className="resume-title-button" onClick={() => setEditingName(true)}>{resumeName}</button>}</div><span className="status-dot">{templateLoaded ? 'Template locked' : 'Draft'}</span></div>
        <input id="workspace-import-input" className="visually-hidden-file-input" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt" onChange={handleImport} />
        {templateLoaded ? <div className={`resume-preview loaded-${selectedTemplate.tone}`} style={{ color: fontColor, fontSize: `${fontSize}px`, fontFamily }}><div className="preview-name">{selectedTemplate.initials}</div><div className="preview-role">{selectedTemplate.label} resume · {selectedTemplate.name}</div><div className="preview-rule" /><div className="preview-columns"><div><span /><span /><span /><span /></div><div><span /><span /><span /></div></div><div className="preview-footer">Template loaded · Ready to edit</div></div> : importedFile ? <ImportedDocument file={importedFile} fontSize={fontSize} fontColor={fontColor} fontFamily={fontFamily} activeTool={activeTool} onEditorReady={editorReady} /> : <label htmlFor="workspace-import-input" className="canvas-empty import-drop-target"><div className="document-mark plus-mark"><Icon name="plus" size={26} /></div><p>Click to import your resume</p><small>PDF, PowerPoint, Word, or TXT</small></label>}
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
      <section className="ai-panel panel"><div className="ai-heading"><div><span className="eyebrow">EDIT WITH AI</span><h2>Shape the draft.</h2><p className="muted">Temporary backend test: ask for a rewrite or stronger connection to the role.</p></div><Icon name="spark" size={20} /></div><div className="assistant-body"><div className="assistant-messages" aria-live="polite">{assistantMessages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}</div><form className="assistant-form" onSubmit={askAssistant}><input value={assistantInput} maxLength="2000" disabled={aiTestLoading} onChange={e => setAssistantInput(e.target.value)} placeholder="Test the AI backend…" aria-label="Test the AI backend" /><button className="arrow-button" disabled={aiTestLoading} aria-label="Send" title="Send" type="submit">{aiTestLoading ? '…' : '→'}</button></form></div></section>
      </div>
    </div>
    <section className="lower-grid">
      <div className={`panel section-panel templates-panel ${templateLoaded ? 'templates-locked' : ''}`}><div className="templates-heading"><div><span className="eyebrow">TEMPLATES</span><h2>Choose a structure that fits your story.</h2><p className="muted">{templateLoaded ? 'Template locked. Delete the draft to start with a different design.' : 'Preview a layout, then load it into your workspace to begin editing.'}</p></div>{templateLoaded && <span className="lock-label">Locked</span>}</div><div className="template-scroll">{templates.map(template => <button disabled={templateLoaded} className={`template-option ${selectedTemplate.name === template.name ? 'selected' : ''}`} key={template.name} onClick={() => setSelectedTemplate(template)}><div className={`template-thumbnail ${template.tone}`}><strong>{template.initials}</strong><small>{template.label}</small><div className="thumbnail-lines"><i /><i /><i /><i /><i /></div></div><span>{template.name}</span></button>)}</div><button className="primary-button create-template-button" disabled={templateLoaded} onClick={createTemplate}>{templateLoaded ? 'Template locked' : 'Create template'}</button></div>
      <div className="panel section-panel evidence-panel"><span className="eyebrow">EVIDENCE SOURCES</span><h2>Verify the work behind the words.</h2><p className="muted">Connect a source to surface credible proof for projects, skills, and outcomes.</p><div className="sources">{['GitHub', 'LinkedIn', 'LeetCode'].map(source => <div className="source" key={source}><div className="source-identity"><SourceIcon name={source} /><span><b>{source}</b><small>{connected.includes(source) ? 'Connected for review' : 'Available to connect'}</small></span></div><button className="text-button" onClick={() => toggleSource(source)}>{connected.includes(source) ? 'Connected' : 'Connect'}</button></div>)}</div><button className="quiet-button evidence-review-panel-button" onClick={() => navigate('/evaluation')}>View evidence review</button></div>
    </section>
    {templateConfirmOpen && <div className="modal-backdrop" role="presentation"><section className="confirm-modal" role="dialog" aria-modal="true" aria-label="Template lock confirmation"><div className="modal-kicker">TEMPLATE LOCK</div><p>Once created, this template will be locked and cannot be switched. Delete the draft if you want to start again with a different design.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setTemplateConfirmOpen(false)}>Cancel</button><button className="primary-button" onClick={confirmTemplate}>Create and lock</button></div></section></div>}
  </Shell>
}

function MainPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const uploadInputRef = useRef(null)
  const editorRef = useRef(null)
  const selectionRef = useRef(null)
  const analysisRequestRef = useRef(0)
  const [description, setDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analysisPreview, setAnalysisPreview] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [connected, setConnected] = useState([])
  const [githubConnection, setGithubConnection] = useState({ loading: true, connected: false })
  const [githubConnecting, setGithubConnecting] = useState(false)
  const [githubConnectionError, setGithubConnectionError] = useState('')
  const [githubConnectionNotice, setGithubConnectionNotice] = useState('')
  const [githubCompareError, setGithubCompareError] = useState('')
  const [workspaceMode, setWorkspaceMode] = useState('initial')
  const [resumeData, setResumeData] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [resumeName, setResumeName] = useState('Untitled resume')
  const [editingName, setEditingName] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [activeTool, setActiveTool] = useState('select')
  const [fontSize, setFontSize] = useState(14)
  const [fontColor, setFontColor] = useState('#172033')
  const [fontFamily, setFontFamily] = useState(fontFamilies[0][1])
  const [globalFontSize, setGlobalFontSize] = useState(null)
  const [useGlobalTextColor, setUseGlobalTextColor] = useState(false)
  const [footerText, setFooterText] = useState('')
  const [hasSelection, setHasSelection] = useState(false)
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantMessages, setAssistantMessages] = useState([{ role: 'assistant', text: 'I can make safe changes to this draft. Try “change name to Maya Patel”, “add footer: Portfolio · maya.dev”, or “use Merriweather font”.' }])
  const [aiTestLoading, setAiTestLoading] = useState(false)
  const selectedTemplate = resumeTemplates.find(template => template.id === selectedTemplateId)
  const TemplateComponent = selectedTemplate?.component
  const isEditorReady = workspaceMode === 'editor-ready' && Boolean(TemplateComponent) && Boolean(resumeData)
  const resumeStyle = {
    fontFamily,
    ...(globalFontSize ? { fontSize: `${globalFontSize}px` } : {}),
    ...(useGlobalTextColor ? { '--resume-text-color': fontColor } : {})
  }
  const resumeEvidenceSkills = getResumeEvidenceSkills(resumeData)
  const hasConnectedEvidenceSource = githubConnection.connected || connected.length > 0
  const hasImportedResumeSkills = Boolean(uploadedFileName) && resumeEvidenceSkills.length > 0
  const hasWorkspaceResumeSkills = workspaceMode === 'editor-ready' && resumeEvidenceSkills.length > 0

  useEffect(() => {
    let isCurrent = true
    const loadGitHubStatus = async () => {
      if (!currentUser) {
        if (isCurrent) setGithubConnection({ loading: false, connected: false })
        return
      }
      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch('/api/github/status', { headers: { Authorization: `Bearer ${idToken}` } })
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Could not check GitHub connection status.')
        if (isCurrent) {
          setGithubConnection({ loading: false, ...(payload.connection ?? { connected: false }) })
          setGithubConnectionError('')
        }
      } catch (error) {
        if (isCurrent) {
          setGithubConnection({ loading: false, connected: false })
          setGithubConnectionError(error instanceof TypeError ? 'GitHub service is not running. Start the app with npm run dev:all.' : error.message || 'Could not check GitHub connection status.')
        }
      }
    }
    loadGitHubStatus()
    const refreshWhenFocused = () => loadGitHubStatus()
    const refreshInterval = window.setInterval(loadGitHubStatus, 60_000)
    window.addEventListener('focus', refreshWhenFocused)
    return () => {
      isCurrent = false
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', refreshWhenFocused)
    }
  }, [currentUser])

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search)
    const result = parameters.get('github')
    const installationId = parameters.get('installation_id')
    const authorizationCode = parameters.get('code')
    const authorizationState = parameters.get('state')
    if (!result && !installationId && !authorizationCode) return

    const restorePendingResume = () => {
      try {
        const snapshot = JSON.parse(sessionStorage.getItem(githubResumeSnapshotKey) || 'null')
        if (snapshot?.resumeData && Date.now() - snapshot.savedAt <= githubResumeSnapshotMaxAge) {
          setResumeData(snapshot.resumeData)
          setResumeName(snapshot.resumeData.fullName || 'Untitled resume')
          setSelectedTemplateId(snapshot.selectedTemplateId || null)
          setUploadedFileName(snapshot.uploadedFileName || '')
          setWorkspaceMode(snapshot.workspaceMode || 'extraction-review')
        }
      } catch {
        // The connection itself should still succeed if browser storage is unavailable.
      } finally {
        sessionStorage.removeItem(githubResumeSnapshotKey)
      }
    }

    const finishSetupInstallation = async () => {
      if (!currentUser || !installationId) return
      setGithubConnecting(true)
      setGithubConnectionError('')
      setGithubConnectionNotice('Finishing GitHub connection…')
      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch('/api/github/complete-installation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ installationId })
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'GitHub could not be connected.')
        setGithubConnection({ loading: false, ...(payload.connection ?? { connected: true }) })
        setGithubConnectionNotice('GitHub connected successfully.')
        restorePendingResume()
      } catch (error) {
        setGithubConnectionError(error instanceof TypeError ? 'GitHub service is not running. Start the app with npm run dev:all.' : error.message || 'GitHub could not be connected.')
      } finally {
        setGithubConnecting(false)
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
      }
    }

    const finishGitHubAuthorization = async () => {
      if (!currentUser || !authorizationCode || !authorizationState) return
      setGithubConnecting(true)
      setGithubConnectionError('')
      setGithubConnectionNotice('Finishing GitHub connection…')
      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch('/api/github/complete-authorization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ code: authorizationCode, state: authorizationState, ...(installationId ? { installationId } : {}) })
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'GitHub could not be connected.')
        setGithubConnection({ loading: false, ...(payload.connection ?? { connected: true }) })
        setGithubConnectionNotice('GitHub connected successfully.')
        restorePendingResume()
      } catch (error) {
        setGithubConnectionError(error instanceof TypeError ? 'GitHub service is not running. Start the app with npm run dev:all.' : error.message || 'GitHub could not be connected.')
      } finally {
        setGithubConnecting(false)
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
      }
    }

    if (authorizationCode) {
      if (authorizationState) finishGitHubAuthorization()
      else {
        setGithubConnectionError('GitHub returned an authorization response without a valid connection state. Start the connection again from Resumetrics.')
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
      }
      return
    }

    if (installationId && (!result || result === 'installation-pending')) {
      finishSetupInstallation()
      return
    }

    const messages = {
      connected: ['notice', 'GitHub connected successfully.'],
      cancelled: ['error', 'GitHub connection was cancelled before installation finished.'],
      'invalid-state': ['error', 'This GitHub connection link expired. Please try connecting again.'],
      'configuration-error': ['error', 'GitHub connection needs server configuration before it can finish.'],
      'storage-unavailable': ['error', 'GitHub could not be saved because Cloud Firestore is not enabled yet. Create a Cloud Firestore database, then reconnect GitHub.'],
      'connection-failed': ['error', 'GitHub could not be connected. Check the app installation and try again.']
    }
    const [type, message] = messages[result] ?? ['error', 'GitHub connection could not be completed. Please try again.']
    if (type === 'notice') {
      setGithubConnectionNotice(message)
      restorePendingResume()
    } else setGithubConnectionError(message)
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
  }, [currentUser])

  const resetWorkspace = () => {
    setWorkspaceMode('initial')
    setResumeData(null)
    setSelectedTemplateId(null)
    setUploadedFileName('')
    setWorkspaceError('')
    setDescription('')
    setResumeName('Untitled resume')
    setEditingName(false)
    setExportMenuOpen(false)
    setHasSelection(false)
    setAnalysis(null)
    setAnalysisPreview(null)
    setGithubCompareError('')
    setGlobalFontSize(null)
    setUseGlobalTextColor(false)
    setFooterText('')
    editorRef.current = null
  }

  const exportDraft = async (format = 'TXT') => {
    if (!isEditorReady || exportLoading) return
    const content = `${resumeName}\n${resumeData?.headline || ''}\n${selectedTemplate?.name || 'Resumetrics draft'}\n\n${editorRef.current?.innerText || resumeData?.summary || 'Start editing your resume in Resumetrics.'}`
    const baseName = `resumetrics-${safeFileName(resumeName)}`
    setExportLoading(true)
    try {
      if (format === 'TXT') {
        downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), `${baseName}.txt`)
      } else if (format === 'PDF') {
        const { jsPDF } = await import('jspdf')
        const documentPdf = new jsPDF({ unit: 'pt', format: 'a4' })
        const margin = 42
        const pageWidth = documentPdf.internal.pageSize.getWidth()
        const pageHeight = documentPdf.internal.pageSize.getHeight()
        const lines = documentPdf.splitTextToSize(content, pageWidth - (margin * 2))
        let y = margin
        lines.forEach(line => {
          if (y > pageHeight - margin) { documentPdf.addPage(); y = margin }
          documentPdf.text(line, margin, y)
          y += 15
        })
        documentPdf.save(`${baseName}.pdf`)
      } else if (format === 'DOCX') {
        const { Document, Packer, Paragraph, TextRun } = await import('docx')
        const documentDocx = new Document({ sections: [{ children: content.split(/\r?\n/).map(line => new Paragraph({ children: [new TextRun(line || ' ')] })) }] })
        downloadBlob(await Packer.toBlob(documentDocx), `${baseName}.docx`)
      } else if (format === 'PPTX') {
        const module = await import('pptxgenjs')
        const PptxGenJS = module.default || module
        const presentation = new PptxGenJS()
        presentation.layout = 'LAYOUT_WIDE'
        const slide = presentation.addSlide()
        slide.background = { color: 'FFFFFF' }
        slide.addText(resumeName, { x: 0.6, y: 0.45, w: 12.1, h: 0.4, fontSize: 24, bold: true, color: '172033' })
        slide.addText(content, { x: 0.6, y: 1.1, w: 12.1, h: 5.8, fontSize: 11, color: '26314A', fit: 'shrink', breakLine: false })
        await presentation.writeFile({ fileName: `${baseName}.pptx` })
      }
    } catch (error) {
      setAssistantMessages(current => [...current, { role: 'assistant', text: `Export failed. Please try again${error?.message ? `: ${error.message}` : '.'}` }])
    } finally {
      setExportLoading(false)
      setExportMenuOpen(false)
    }
  }

  const deleteDraft = () => {
    if (workspaceMode === 'initial') return
    if (window.confirm('Delete this generated draft and return to the start options?')) resetWorkspace()
  }

  const handleUpload = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setWorkspaceError('')
    setGithubCompareError('')
    setUploadedFileName(file.name)
    setWorkspaceMode('importing')
    try {
      const resumeText = await extractResumeText(file)
      if (!resumeText) throw new Error('Could not read this file. Try a text-based PDF, DOCX, or TXT file.')
      setWorkspaceMode('extracting')
      const response = await fetch('/api/resume/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      if (!isJson) {
        throw new Error('The AI server is not running. Start the app with npm run dev:all, then try again.')
      }
      const payload = await response.json()
      if (!response.ok || !payload.ok || !payload.resumeData) throw new Error(payload.error || 'Could not extract this resume. Try again.')
      setResumeData(payload.resumeData)
      setResumeName(payload.resumeData.fullName || 'Untitled resume')
      setWorkspaceMode('extraction-review')
    } catch (error) {
      const message = error instanceof TypeError && /fetch/i.test(error.message)
        ? 'The AI server is not running. Start the app with npm run dev:all, then try again.'
        : error.message || 'Could not read this file. Try a text-based PDF, DOCX, or TXT file.'
      setWorkspaceError(message)
      setWorkspaceMode('error')
    }
  }

  const startCreate = () => {
    setResumeData(createBlankResumeData())
    setUploadedFileName('')
    setSelectedTemplateId(null)
    setWorkspaceError('')
    setGithubCompareError('')
    setResumeName('Untitled resume')
    setWorkspaceMode('template-selection')
  }

  const chooseTemplate = templateId => {
    setSelectedTemplateId(templateId)
    setResumeData(current => current || createBlankResumeData())
    setWorkspaceMode('editor-ready')
    requestAnimationFrame(() => editorRef.current?.focus())
  }

  const toggleSource = source => setConnected(current => current.includes(source) ? current.filter(item => item !== source) : [...current, source])
  const startGitHubConnection = async () => {
    if (!currentUser || githubConnecting || githubConnection.connected) return
    setGithubConnecting(true)
    setGithubConnectionError('')
    setGithubConnectionNotice('')
    try {
      if (resumeData) {
        sessionStorage.setItem(githubResumeSnapshotKey, JSON.stringify({
          savedAt: Date.now(),
          resumeData,
          workspaceMode,
          selectedTemplateId,
          uploadedFileName
        }))
      }
      const idToken = await currentUser.getIdToken()
      const response = await fetch('/api/github/connect', { headers: { Authorization: `Bearer ${idToken}` } })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok || !payload.authorizationUrl) throw new Error(payload?.error || 'Could not start the GitHub connection.')
      window.location.assign(payload.authorizationUrl)
    } catch (error) {
      setGithubConnectionError(error instanceof TypeError ? 'GitHub service is not running. Start the app with npm run dev:all.' : error.message || 'Could not start the GitHub connection.')
      setGithubConnecting(false)
    }
  }

  const compareEvidence = () => {
    setGithubCompareError('')
    if (!hasConnectedEvidenceSource) {
      setGithubCompareError('Connect at least one evidence source before comparing skills.')
      return
    }
    if (hasImportedResumeSkills) {
      if (!githubConnection.connected) {
        setGithubCompareError('GitHub is the only evidence source ready for comparison right now. Connect GitHub to continue.')
        return
      }
    } else if (!hasWorkspaceResumeSkills) {
      setGithubCompareError(uploadedFileName
        ? 'Resume skills are still being extracted. Wait for extraction to finish before comparing evidence.'
        : 'Create a resume in the workspace and add skills before comparing it against connected evidence.')
      return
    } else if (!githubConnection.connected) {
      setGithubCompareError('GitHub is the only evidence source ready for comparison right now. Connect GitHub to continue.')
      return
    }
    sessionStorage.setItem(githubComparisonRequestKey, JSON.stringify({ savedAt: Date.now(), resumeData }))
    navigate('/evaluation?compare=github')
  }

  const analyse = async () => {
    const jobDescription = description.trim()
    if (!jobDescription || !resumeData || analysisLoading) return
    const requestId = analysisRequestRef.current + 1
    analysisRequestRef.current = requestId
    const skillPreview = buildSkillAwareRoleAnalysis(resumeData, jobDescription)
    const startedAt = performance.now()
    setAnalysis(null)
    setAnalysisPreview(skillPreview)
    setAnalysisLoading(true)
    let nextAnalysis
    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDescription })
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload.ok || !payload.analysis) throw new Error(payload.error || 'The role analysis service is temporarily unavailable.')
      nextAnalysis = { ...payload.analysis, analysisMethod: payload.analysisMethod || 'ai' }
    } catch (error) {
      nextAnalysis = { ...skillPreview, analysisMethod: 'browser-fallback' }
    } finally {
      const remainingDelay = Math.max(0, 800 - (performance.now() - startedAt))
      if (remainingDelay) await new Promise(resolve => window.setTimeout(resolve, remainingDelay))
      if (requestId !== analysisRequestRef.current) return
      setAnalysis({ ...nextAnalysis, runId: `${requestId}-${Date.now()}` })
      setAnalysisPreview(null)
      setAnalysisLoading(false)
    }
  }

  const rememberSelection = () => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!selection?.rangeCount || !editor) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
      setHasSelection(!selection.isCollapsed)
    }
  }

  useEffect(() => {
    document.addEventListener('selectionchange', rememberSelection)
    return () => document.removeEventListener('selectionchange', rememberSelection)
  }, [])

  const restoreSelection = () => {
    const selection = window.getSelection()
    if (!selection || !selectionRef.current) return
    selection.removeAllRanges()
    selection.addRange(selectionRef.current)
  }

  const applyFormat = (command, value) => {
    const editor = editorRef.current
    if (!editor || !isEditorReady || activeTool !== 'select') return
    editor.focus()
    restoreSelection()
    document.execCommand('styleWithCSS', false, true)
    document.execCommand(command, false, value)
    if (command === 'fontSize') editor.querySelectorAll('font[size="7"]').forEach(node => { node.removeAttribute('size'); node.style.fontSize = `${value}px` })
    if (command === 'fontName') editor.querySelectorAll('font[face]').forEach(node => { node.style.fontFamily = value; node.removeAttribute('face') })
    rememberSelection()
  }

  const selectFont = value => { setFontFamily(value); applyFormat('fontName', value) }
  const selectSize = value => { const numericSize = Number(value); setFontSize(numericSize); applyFormat('fontSize', numericSize) }
  const focusTextTool = () => { setActiveTool('text'); requestAnimationFrame(() => editorRef.current?.focus()) }
  const editorReady = editor => { editorRef.current = editor }

  const rewriteSelectedBullet = async () => {
    const selectedText = window.getSelection()?.toString().trim() || ''
    if (!selectedText || rewriteLoading) return
    setRewriteLoading(true)
    try {
      const response = await fetch('/api/resume/rewrite-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet: selectedText, targetRole: resumeData?.headline || '', tone: 'professional' })
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Could not rewrite the selected bullet.')
      editorRef.current?.focus()
      restoreSelection()
      document.execCommand('insertText', false, payload.rewrittenBullet)
      rememberSelection()
    } catch (error) {
      setAssistantMessages(current => [...current, { role: 'assistant', text: error.message || 'Could not rewrite the selected bullet.' }])
    } finally {
      setRewriteLoading(false)
    }
  }

  const applyAssistantAutomation = message => {
    const command = message.trim()
    const lower = command.toLowerCase()
    if (!isEditorReady) return 'Open or create a resume first, then I can apply changes to it.'

    const nameMatch = command.match(/(?:change|set|rename)\s+(?:my\s+|the\s+)?name\s+(?:to\s+)?["“']?(.+?)["”']?$/i)
    if (nameMatch?.[1]) {
      const fullName = nameMatch[1].trim().replace(/[.!]$/, '')
      if (!fullName) return null
      setResumeData(current => ({ ...current, fullName }))
      setResumeName(fullName)
      return `Changed the resume name to ${fullName}.`
    }

    const footerMatch = command.match(/(?:add|set)\s+(?:a\s+)?footer(?:\s*(?:to|:))?\s*(.+)$/i)
    if (footerMatch?.[1]) {
      const footer = footerMatch[1].trim().replace(/[.!]$/, '')
      setFooterText(footer)
      return 'Added that footer to the current resume.'
    }
    if (/\b(remove|delete|clear)\s+(?:the\s+)?footer\b/i.test(command)) {
      setFooterText('')
      return 'Removed the resume footer.'
    }

    const requestedFont = fontFamilies.find(([name]) => lower.includes(name.toLowerCase()))
    if (requestedFont && /\b(font|typeface)\b/i.test(command)) {
      setFontFamily(requestedFont[1])
      return `Applied ${requestedFont[0]} to the whole resume.`
    }

    const hex = command.match(/#[0-9a-f]{6}\b/i)?.[0]
    const namedColor = Object.entries(automationColors).find(([name]) => new RegExp(`\\b${name}\\b`, 'i').test(command))?.[1]
    if ((hex || namedColor) && /\b(text|font|colour|color|resume|document)\b/i.test(command)) {
      setFontColor(hex || namedColor)
      setUseGlobalTextColor(true)
      return `Applied ${hex || namedColor} to all resume text.`
    }
    if (/\b(reset|restore)\s+(?:the\s+)?(?:text\s+)?colou?r\b/i.test(command)) {
      setUseGlobalTextColor(false)
      setFontColor('#172033')
      return 'Restored the template’s default text colours.'
    }

    const size = Number(command.match(/\b(?:text|font|resume)\s+(?:size\s+)?(?:to\s+)?(12|14|16|18|20|24)\b/i)?.[1])
    if (size) {
      setGlobalFontSize(size)
      return `Applied ${size}px text sizing to the whole resume.`
    }
    return null
  }

  const askAssistant = async event => {
    event.preventDefault()
    const message = assistantInput.trim()
    if (!message || aiTestLoading) return
    setAssistantInput('')

    const automationResult = applyAssistantAutomation(message)
    if (automationResult) {
      setAssistantMessages(current => [...current, { role: 'user', text: message }, { role: 'assistant', text: automationResult }])
      return
    }

    const improveSummary = /\b(improve|rewrite|shorten|strengthen)\b.*\bsummary\b/i.test(message) && Boolean(resumeData?.summary)
    const aiPrompt = improveSummary
      ? `Rewrite this resume summary in a concise professional tone. Preserve facts and return only the revised summary:\n\n${resumeData.summary}`
      : message
    setAiTestLoading(true)
    setAssistantMessages(current => [...current, { role: 'user', text: message }, { role: 'assistant', text: 'Working on it…' }])
    try {
      const response = await fetch('/api/ai/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: aiPrompt }) })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'AI backend request failed.')
      if (improveSummary) setResumeData(current => ({ ...current, summary: payload.result }))
      setAssistantMessages(current => [...current.slice(0, -1), { role: 'assistant', text: improveSummary ? 'Updated the summary in your draft.' : payload.result }])
    } catch (error) {
      setAssistantMessages(current => [...current.slice(0, -1), { role: 'assistant', text: error.message || 'AI backend request failed.' }])
    } finally {
      setAiTestLoading(false)
    }
  }

  const canvasHeading = {
    initial: 'Start a resume',
    importing: 'Preparing your resume',
    extracting: 'Extracting resume details',
    'extraction-review': 'Review extracted details',
    'template-selection': 'Choose a template',
    error: 'Import resume skills'
  }[workspaceMode] || resumeName

  return <Shell>
    <header className="page-header"><div><span className="eyebrow">RESUME WORKSPACE</span></div><div className="header-actions"><div className="draft-actions"><div className="export-wrap"><button className="quiet-button" disabled={!isEditorReady || exportLoading} onClick={() => setExportMenuOpen(current => !current)}><Icon name="download" size={15} />{exportLoading ? 'Exporting…' : 'Export draft'}</button>{exportMenuOpen && <div className="export-menu"><span>Export as</span><button onClick={() => exportDraft('PDF')}><FileIcon type="PDF" />PDF</button><button onClick={() => exportDraft('DOCX')}><FileIcon type="DOCX" />Word</button><button onClick={() => exportDraft('PPTX')}><FileIcon type="PPTX" />PowerPoint</button><button onClick={() => exportDraft('TXT')}><FileIcon type="TXT" />Plain text</button></div>}</div><button className="danger-button" disabled={workspaceMode === 'initial'} onClick={deleteDraft}><Icon name="trash" size={15} />Delete draft</button></div></div></header>
    <div className={`workspace-grid ${isEditorReady ? '' : 'setup-mode'}`}>
      {isEditorReady && <aside className="editor-toolbar panel" aria-label="Resume editing tools">
        <span className="toolbar-label">EDIT</span>
        <div className="tool-group mode-tools"><button className={activeTool === 'select' ? 'tool active' : 'tool'} onClick={() => setActiveTool('select')}>Select</button><button className={activeTool === 'text' ? 'tool active' : 'tool'} onClick={focusTextTool}>Text</button></div>
        <span className="tool-divider" />
        <div className="tool-group formatting-tools" aria-label="Text formatting">
          <button className="tool icon-tool" disabled={activeTool !== 'select'} onMouseDown={event => event.preventDefault()} onClick={() => applyFormat('bold')} aria-label="Bold" title="Bold"><strong>B</strong></button><button className="tool icon-tool italic-tool" disabled={activeTool !== 'select'} onMouseDown={event => event.preventDefault()} onClick={() => applyFormat('italic')} aria-label="Italic" title="Italic"><em>I</em></button><button className="tool icon-tool underline-tool" disabled={activeTool !== 'select'} onMouseDown={event => event.preventDefault()} onClick={() => applyFormat('underline')} aria-label="Underline" title="Underline"><u>U</u></button>
          <label className={`color-tool ${activeTool !== 'select' ? 'disabled' : ''}`} title="Text colour"><input type="color" value={fontColor} disabled={activeTool !== 'select'} onChange={event => { setFontColor(event.target.value); applyFormat('foreColor', event.target.value) }} aria-label="Text colour" /><span style={{ backgroundColor: fontColor }} /></label>
          <label className={`font-size-tool ${activeTool !== 'select' ? 'disabled' : ''}`}><span>{fontSize}</span><select value={fontSize} disabled={activeTool !== 'select'} onChange={event => selectSize(event.target.value)} aria-label="Font size"><option value="12">12</option><option value="14">14</option><option value="16">16</option><option value="18">18</option><option value="20">20</option><option value="24">24</option></select><small>px</small></label>
          <label className={`font-family-tool ${activeTool !== 'select' ? 'disabled' : ''}`}><select value={fontFamily} style={{ fontFamily }} disabled={activeTool !== 'select'} onChange={event => selectFont(event.target.value)} aria-label="Font family">{fontFamilies.map(([name, value]) => <option value={value} style={{ fontFamily: value }} key={name}>{name}</option>)}</select></label>
        </div>
        <span className="tool-divider" />
        <div className="tool-group align-tools" aria-label="Text alignment"><span className="toolbar-sublabel">ALIGN</span><div className="align-buttons"><button className="tool icon-tool" disabled={activeTool !== 'select'} onMouseDown={event => event.preventDefault()} onClick={() => applyFormat('justifyLeft')} aria-label="Align left" title="Align left"><AlignIcon alignment="left" /></button><button className="tool icon-tool" disabled={activeTool !== 'select'} onMouseDown={event => event.preventDefault()} onClick={() => applyFormat('justifyCenter')} aria-label="Align center" title="Align center"><AlignIcon alignment="center" /></button><button className="tool icon-tool" disabled={activeTool !== 'select'} onMouseDown={event => event.preventDefault()} onClick={() => applyFormat('justifyRight')} aria-label="Align right" title="Align right"><AlignIcon alignment="right" /></button></div></div>
        <button className="secondary-button ai-rewrite-button" disabled={!hasSelection || rewriteLoading} onMouseDown={event => event.preventDefault()} onClick={rewriteSelectedBullet}>{rewriteLoading ? 'Rewriting…' : 'AI Rewrite Bullet'}</button>
        <span className="selection-hint">{hasSelection ? 'Text selected' : 'Select text to format'}</span>
      </aside>}
      <section className="resume-canvas panel">
        <div className="canvas-top"><div className="resume-title-wrap">{isEditorReady && editingName ? <input className="resume-title-input" autoFocus value={resumeName} onChange={event => setResumeName(event.target.value)} onBlur={() => { setResumeName(resumeName.trim() || 'Untitled resume'); setEditingName(false) }} onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()} aria-label="Resume name" /> : isEditorReady ? <button className="resume-title-button" onClick={() => setEditingName(true)}>{resumeName}</button> : <strong>{canvasHeading}</strong>}</div><div className="canvas-actions">{isEditorReady && <button className="text-button" onClick={() => setWorkspaceMode('template-selection')}>Change template</button>}<span className="status-dot">{isEditorReady ? 'Editable draft' : workspaceMode === 'extracting' ? 'AI working' : 'Draft'}</span></div></div>
        <input ref={uploadInputRef} className="upload-input" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleUpload} />
        {workspaceMode === 'initial' && <ResumeStartOptions onImport={() => uploadInputRef.current?.click()} onCreate={startCreate} />}
        {workspaceMode === 'importing' && <div className="flow-loading"><div className="flow-spinner" /><h2>Reading your resume…</h2><p>Preparing a separate copy for AI extraction.</p></div>}
        {workspaceMode === 'extracting' && <div className="flow-loading"><div className="flow-spinner" /><h2>Extracting resume details with AI…</h2><p>Identifying only the information present in your source file.</p></div>}
        {workspaceMode === 'extraction-review' && resumeData && <ResumeExtractionReview resumeData={resumeData} uploadedFileName={uploadedFileName} onContinue={() => setWorkspaceMode('template-selection')} onStartOver={resetWorkspace} />}
        {workspaceMode === 'template-selection' && <ResumeTemplateSelector templates={resumeTemplates} resumeData={resumeData} selectedTemplateId={selectedTemplateId} onSelect={chooseTemplate} onBack={() => uploadedFileName ? setWorkspaceMode('extraction-review') : resetWorkspace()} isImported={Boolean(uploadedFileName)} />}
        {workspaceMode === 'error' && <div className="flow-error"><h3>We could not import that resume.</h3><p>{workspaceError}</p><div className="state-actions"><button className="secondary-button" onClick={resetWorkspace}>Start over</button><button className="primary-button" onClick={() => uploadInputRef.current?.click()}>Try another file</button></div></div>}
        {isEditorReady && <TemplateComponent resumeData={resumeData} editorRef={editorReady} editorStyle={resumeStyle} useGlobalTextColor={useGlobalTextColor} footerText={footerText} />}
      </section>
      <div className="right-rail">
        <aside className="analysis-panel panel">
          <div><span className="eyebrow">ROLE ALIGNMENT</span><h2>Job description</h2><p className="muted">Add a target role to uncover what your resume proves—and what it does not.</p></div>
          <textarea value={description} maxLength="5000" onChange={event => { analysisRequestRef.current += 1; setDescription(event.target.value); setAnalysis(null); setAnalysisPreview(null); setAnalysisLoading(false) }} placeholder="Paste the job description here…" />
          <div className="char-count">{description.length} / 5000</div>
          <button className="primary-button full-width" onClick={analyse} disabled={!description.trim() || !resumeData || analysisLoading}>{analysisLoading ? 'Comparing skills…' : 'Analyse alignment'}</button>
          <div className={`score-card ${analysisLoading ? 'is-loading' : ''}`}>
            <div><span>Role match</span>{analysisLoading ? <strong className="analysis-pending-score">…</strong> : analysis ? <AnimatedMatchScore score={analysis.score} runId={analysis.runId} /> : <strong>—</strong>}</div>
            {analysisLoading && analysisPreview ? <div className="skill-comparison-progress" aria-live="polite">
              <p>Comparing your extracted resume skills with the job requirements…</p>
              <div className="comparison-skill-group"><strong>Resume skills being checked</strong><div className="skill-tags compared-resume-skills">{analysisPreview.comparedResumeSkills.length ? analysisPreview.comparedResumeSkills.slice(0, 12).map(skill => <span key={skill}>{skill}</span>) : <small>No extracted skills found</small>}</div></div>
              <div className="comparison-skill-group"><strong>Job skills being checked</strong><div className="skill-tags compared-job-skills">{analysisPreview.comparedJobSkills.length ? analysisPreview.comparedJobSkills.slice(0, 12).map(skill => <span key={skill}>{skill}</span>) : <small>Reading the job requirements…</small>}</div></div>
            </div> : analysis ? <>
              <p className="match-review">{analysis.summary}</p>
              {analysis.analysisMethod !== 'ai' && <small className="analysis-note">Skill-based comparison used while AI is unavailable.</small>}
              {analysis.strengths?.length > 0 && <div className="analysis-result-section"><strong>Matched skills</strong><div className="skill-tags">{analysis.strengths.map(skill => <span key={skill}>{skill}</span>)}</div></div>}
              {analysis.missingSkills?.length > 0 && <div className="analysis-result-section missing-skills"><strong>Skills to review</strong><div className="skill-tags">{analysis.missingSkills.map(skill => <span key={skill}>{skill}</span>)}</div></div>}
              {analysis.recommendations?.length > 0 && <div className="analysis-result-section"><strong>Next step</strong><ul>{analysis.recommendations.map(item => <li key={item}>{item}</li>)}</ul></div>}
            </> : <p>{!resumeData ? 'Create or import a resume before analysing a role.' : 'Waiting for a job description.'}</p>}
          </div>
        </aside>
        <section className="ai-panel panel"><div className="ai-heading"><div><span className="eyebrow">EDIT WITH AI</span><h2>Automate the draft.</h2><p className="muted">Describe a change and I will apply it, or ask for help improving the writing.</p></div><Icon name="spark" size={20} /></div><div className="assistant-body"><div className="ai-action-chips" aria-label="Suggested AI actions">{['Change name to Maya Patel', 'Add footer: Portfolio · maya.dev', 'Use Merriweather font', 'Set purple text', 'Improve summary'].map(prompt => <button key={prompt} type="button" onClick={() => setAssistantInput(prompt)}>{prompt}</button>)}</div><div className="assistant-messages" aria-live="polite">{assistantMessages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}</div><form className="assistant-form automation-composer" onSubmit={askAssistant}><input value={assistantInput} maxLength="2000" disabled={aiTestLoading} onChange={event => setAssistantInput(event.target.value)} placeholder="Describe a change to your resume…" aria-label="Describe a resume change" /><button className="arrow-button" disabled={aiTestLoading} aria-label="Apply change" title="Apply change" type="submit">{aiTestLoading ? '…' : '→'}</button></form></div></section>
      </div>
    </div>
    <section className="lower-grid"><div className="panel section-panel evidence-panel"><div className="evidence-panel-heading"><div><span className="eyebrow">EVIDENCE SOURCES</span><h2>Verify the work behind the words.</h2><p className="muted">Connect a source to surface credible proof for projects, skills, and outcomes.</p></div><button className="primary-button compare-evidence-button" type="button" disabled={!hasConnectedEvidenceSource} onClick={compareEvidence}>Compare</button></div><div className="sources">{['GitHub', 'LinkedIn', 'LeetCode'].map(source => {
      const isGitHub = source === 'GitHub'
      const sourceConnected = isGitHub ? githubConnection.connected : connected.includes(source)
      const sourceDescription = isGitHub
        ? githubConnection.loading
          ? 'Checking connection…'
          : githubConnection.connected
            ? `Connected as @${githubConnection.githubLogin || 'GitHub user'}`
            : githubConnection.message || githubConnectionError || 'Available to connect'
        : connected.includes(source) ? 'Connected for review' : 'Available to connect'
      return <div className="source" key={source}><div className="source-identity"><SourceIcon name={source} /><span><b>{source}</b><small className={isGitHub && githubConnectionError ? 'source-error' : ''}>{sourceDescription}</small></span></div><button className="text-button" disabled={isGitHub && (githubConnection.loading || githubConnecting || sourceConnected)} onClick={() => isGitHub ? startGitHubConnection() : toggleSource(source)}>{isGitHub && githubConnecting ? 'Connecting…' : sourceConnected ? 'Connected' : 'Connect'}</button></div>
    })}</div>{githubConnectionNotice && <p className="source-notice" role="status">{githubConnectionNotice}</p>}{githubCompareError && <p className="source-error" role="alert">{githubCompareError}</p>}</div><GeneralSettingsPanel /></section>
  </Shell>
}

function ImportPage() {
  const navigate = useNavigate(); const [file, setFile] = useState(null); const [fontSize, setFontSize] = useState(14); const [fontColor, setFontColor] = useState('#172033')
  return <Shell><header className="page-header"><div><span className="eyebrow">IMPORT RESUME</span><h1>Bring your current resume into focus.</h1></div></header><section className="panel route-card"><input className="visually-hidden-file-input" id="import-route-input" type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} />{file ? <ImportedDocument file={file} fontSize={fontSize} fontColor={fontColor} activeTool="select" onReplace={() => document.getElementById('import-route-input')?.click()} /> : <label className="drop-zone" htmlFor="import-route-input"><span className="document-mark plus-mark"><Icon name="plus" size={26} /></span><h2>Choose a resume to import</h2><p>Supported formats: PDF, DOCX, and TXT.</p><span className="secondary-button">Select file</span></label>}{file && <button className="primary-button" onClick={() => navigate('/evaluation')}>Continue to evidence review</button>}</section></Shell>
}

function CreatePage() {
  const navigate = useNavigate(); const [title, setTitle] = useState(''); const [summary, setSummary] = useState('')
  return <Shell><header className="page-header"><div><span className="eyebrow">CREATE RESUME</span><h1>Begin with the essentials.</h1></div></header><section className="panel form-card"><label>Target role<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Product analyst" /></label><label>Professional summary<textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Describe the work you want your resume to show." /></label><button className="primary-button" disabled={!title.trim()} onClick={() => navigate('/evaluation')}>Continue to evidence review</button></section></Shell>
}

function EvaluationPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [comparisonRequest] = useState(readQueuedGitHubComparison)
  const [connection, setConnection] = useState({ loading: false, connected: false })
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const comparisonStarted = useRef(false)
  const resumeData = comparisonRequest?.resumeData ?? null
  const resumeSkills = getResumeEvidenceSkills(resumeData)

  const runComparison = useCallback(async () => {
    if (!currentUser) return
    if (!resumeData) {
      setError('Return to the workspace, then choose Compare after creating or importing a resume.')
      return
    }
    if (!resumeSkills.length) {
      setError('This resume does not have extracted skills to compare yet. Return to the workspace and finish the resume first.')
      return
    }

    setIsLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const idToken = await currentUser.getIdToken()
      const statusResponse = await fetch('/api/github/status', { headers: { Authorization: `Bearer ${idToken}` } })
      const statusPayload = await statusResponse.json().catch(() => null)
      if (!statusResponse.ok || !statusPayload?.ok) throw new Error(statusPayload?.error || 'Could not verify the GitHub connection.')
      setConnection({ loading: false, ...(statusPayload.connection ?? { connected: false }) })
      if (!statusPayload.connection?.connected) throw new Error('Connect GitHub in the workspace before starting an evidence comparison.')

      const response = await fetch('/api/github/evidence-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ resumeData })
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok || !payload.analysis) throw new Error(payload?.error || 'Could not analyse GitHub evidence.')
      setAnalysis(payload.analysis)
    } catch (requestError) {
      setError(requestError instanceof TypeError
        ? 'GitHub evidence service is not running. Start the app with npm run dev:all.'
        : requestError.message || 'Could not analyse GitHub evidence.')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, resumeData, resumeSkills.length])

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search)
    if (parameters.get('compare') !== 'github' || comparisonStarted.current) return
    comparisonStarted.current = true
    navigate('/evaluation', { replace: true })
    runComparison()
  }, [navigate, runComparison])

  return <Shell>
    <header className="page-header">
      <div><span className="eyebrow">EVIDENCE REVIEW</span><h1>Make each claim defensible.</h1></div>
      <button className="quiet-button" type="button" onClick={() => navigate('/workspace')}>Back to workspace</button>
    </header>
    <section className="evaluation-grid">
      <div className="panel section-panel"><h2>Comparison scope</h2><div className="readiness"><strong>{resumeSkills.length || '—'}</strong><span>{resumeSkills.length ? `Extracted resume skills queued for GitHub verification${connection.connected ? ` with @${connection.githubLogin || 'GitHub'}` : ''}.` : 'Use Compare from the workspace to bring your resume here.'}</span></div></div>
      <div className="panel section-panel"><h2>What we assess</h2><ul><li>Skills supported by repositories, languages, and project files</li><li>Evidence that can be verified from accessible GitHub metadata</li><li>Gaps between the resume and the connected work</li></ul></div>
    </section>
    <GitHubEvidenceReview analysis={analysis} isLoading={isLoading} error={error} resumeSkills={resumeSkills} onRetry={runComparison} />
  </Shell>
}

function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/workspace" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
    <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
    <Route path="/create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
    <Route path="/evaluation" element={<ProtectedRoute><EvaluationPage /></ProtectedRoute>} />
  </Routes>
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
