import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import UserMenu from './components/UserMenu.jsx'
import Login from './pages/Login.jsx'
import LandingPage from './pages/LandingPage.jsx'
import './styles.css'
import './template.css'
import './layout-overrides.css'
import './interaction-overrides.css'
import './resume-flow.css'
import './github-evidence.css'
import './linkedin-evidence.css'
import './ai-assistant.css'
import './resume-builder.css'
import logo from './assets/resumetrics-logo.png'
import ResumeStartOptions, { FileTypeIcon } from './components/ResumeStartOptions.jsx'
import ResumeTemplateSelector from './components/ResumeTemplateSelector.jsx'
import ResumeExtractionReview from './components/ResumeExtractionReview.jsx'
import GitHubEvidenceReview from './components/GitHubEvidenceReview.jsx'
import LinkedInImportDialog from './components/LinkedInImportDialog.jsx'
import LinkedInEvidenceReview from './components/LinkedInEvidenceReview.jsx'
import AIAssistantEditor from './components/AIAssistantEditor.jsx'
import ResumeBuilderForm from './components/ResumeBuilderForm.jsx'
import ProfilePhotoControls from './components/ProfilePhotoControls.jsx'
import { createResumePresentation, getResumeTemplate, resolveResumePresentation, resumeTemplates } from './config/resumeTemplates.js'
import { templatePreviewResumeData } from './data/templatePreviewData.js'
import { createBlankResumeData } from './data/resumeData.js'
import { applyResumeEditPlan } from './utils/applyResumeEditPlan.js'
import { getPathValue } from './editor/resumeEditingEngine.js'
import { buildResumeElementRegistry, ensureResumeElementIds } from './editor/resumeElementRegistry.js'
import { resumeFonts } from './editor/fontRegistry.js'
import { extractResumeDocument } from './utils/extractResumeDocument.js'
import { readProfilePhoto } from './utils/readProfilePhoto.js'
import useAIAnimationState, { EXCLAIM_MS, MIN_PROCESSING_MS, MIN_THINKING_MS, SUCCESS_MS } from './hooks/useAIAnimationState.js'
import { buildSkillAwareRoleAnalysis } from '../shared/roleAnalysis.js'

// Items without a path are planned features shown as "Soon" until their pages exist.
const navSections = [
  { label: 'Main menu', items: [
    ['Dashboard', '/dashboard', 'dashboard'],
    ['Resume builder', '/workspace', 'create'],
    ['Templates', '/templates', 'layout'],
    ['Plan', null, 'crown']
  ] },
  { label: 'Career tools', items: [
    ['Job tailoring', null, 'target'],
    ['Cover letters', null, 'mail'],
    ['Evidence check', '/evaluation', 'evidence'],
    ['Job tracker', null, 'briefcase']
  ] }
]
const navUtilityItems = [
  ['Settings', '/settings', 'settings'],
  ['Help & support', '/help', 'help']
]
const recentProjectColors = ['#7c5cff', '#e0559a', '#1fa37a', '#e59a1a', '#3b82f6']

const safeFileName = value => (value || 'untitled-resume').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled-resume'
const githubResumeSnapshotKey = 'resumetrics:pending-github-evidence-resume'
const githubResumeSnapshotMaxAge = 15 * 60 * 1000
const evidenceComparisonRequestKey = 'resumetrics:evidence-comparison'
const evidenceComparisonRequestMaxAge = 30 * 60 * 1000
const linkedinProfileStorageKey = 'resumetrics:linkedin-profile'
const linkedinProfileStorageMaxAge = 24 * 60 * 60 * 1000
const initialNimbusMessages = [{ role: 'assistant', text: 'Hi, I’m NIMBUS. I can edit this resume, explain suggestions, or chat briefly while we work.' }]
function getResumeEvidenceSkills(resumeData) {
  if (!resumeData) return []
  const values = [
    ...Object.values(resumeData.skills ?? {}).flat(),
    ...(resumeData.projects ?? []).flatMap(project => project.techStack ?? []),
    ...(resumeData.certifications ?? [])
  ]
  return [...new Map(values.filter(value => typeof value === 'string' && value.trim()).map(value => [value.trim().toLocaleLowerCase(), value.trim()])).values()].slice(0, 24)
}

function buildLinkedInResumeComparison(resumeData, linkedinData) {
  const resumeSkills = getResumeEvidenceSkills(resumeData)
  const linkedinSkills = getResumeEvidenceSkills(linkedinData)
  const linkedinKeys = new Set(linkedinSkills.map(skill => skill.toLocaleLowerCase()))
  const overlap = resumeSkills.filter(skill => linkedinKeys.has(skill.toLocaleLowerCase()))
  const resumeOnly = resumeSkills.filter(skill => !linkedinKeys.has(skill.toLocaleLowerCase()))
  const score = resumeSkills.length ? Math.round((overlap.length / resumeSkills.length) * 100) : 0
  return {
    score,
    summary: resumeSkills.length
      ? `${overlap.length} of ${resumeSkills.length} resume skills also appear in the imported LinkedIn profile.`
      : 'Create or import a resume with extracted skills before comparing it with LinkedIn.',
    strengths: overlap,
    missingSkills: resumeOnly,
    comparedResumeSkills: resumeSkills,
    comparedJobSkills: [],
    matchedSkills: overlap,
    profileOverlap: overlap,
    profileOnlySkills: linkedinSkills.filter(skill => !new Set(resumeSkills.map(item => item.toLocaleLowerCase())).has(skill.toLocaleLowerCase())),
    resumeOnlySkills: resumeOnly,
    profileOverlapScore: score,
    analysisMethod: 'resume-overlap'
  }
}

const cleanManualValue = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
const splitManualList = value => cleanManualValue(value).split(/[·,\n]/).map(item => item.trim()).filter(Boolean)

function updateManualResumeData(resumeData, path, value) {
  if (!resumeData || !path) return resumeData
  const next = JSON.parse(JSON.stringify(resumeData))
  const text = cleanManualValue(value)
  const parts = path.split('.')

  if (['fullName', 'headline', 'email', 'phone', 'location', 'summary'].includes(path)) {
    next[path] = text
    return next
  }
  if (path === 'skills') {
    const previousCategories = Object.entries(next.skills ?? {})
    const categoryForSkill = new Map(previousCategories.flatMap(([category, skills]) => (skills ?? []).map(skill => [String(skill).toLocaleLowerCase(), category])))
    const values = splitManualList(text)
    next.skills = Object.fromEntries(previousCategories.map(([category]) => [category, []]))
    values.forEach(skill => {
      const category = categoryForSkill.get(skill.toLocaleLowerCase()) || 'other'
      next.skills[category] ||= []
      if (!next.skills[category].some(item => item.toLocaleLowerCase() === skill.toLocaleLowerCase())) next.skills[category].push(skill)
    })
    return next
  }
  if (parts[0] === 'skills' && parts.length === 2) {
    next.skills ||= {}
    next.skills[parts[1]] = splitManualList(text)
    return next
  }
  if (path === 'languages') {
    next.languages = splitManualList(text)
    return next
  }
  if (parts[0] === 'links' && Number.isInteger(Number(parts[1]))) {
    const index = Number(parts[1])
    // The resume shows a link's label ("LinkedIn"); editing that text renames the link without touching its address.
    if (parts[2] === 'label') next.links[index] = { ...(next.links[index] ?? {}), label: text }
    else next.links[index] = { ...(next.links[index] ?? {}), url: text, label: next.links[index]?.label || text }
    return next
  }
  if (['certifications', 'achievements'].includes(parts[0]) && Number.isInteger(Number(parts[1]))) {
    next[parts[0]][Number(parts[1])] = text
    return next
  }

  const [section, indexText, field, itemIndexText] = parts
  const index = Number(indexText)
  if (!['experience', 'projects', 'education'].includes(section) || !Number.isInteger(index) || !next[section]?.[index]) return next
  const item = next[section][index]
  if (field === 'techStack') {
    item.techStack = splitManualList(text)
    return next
  }
  if (field === 'links') {
    const itemIndex = Number(itemIndexText)
    if (!Number.isInteger(itemIndex)) return next
    item.links ||= []
    item.links[itemIndex] = text
    return next
  }
  if (field === 'bullets' || field === 'details') {
    const itemIndex = Number(itemIndexText)
    if (!Number.isInteger(itemIndex)) return next
    item[field] ||= []
    item[field][itemIndex] = text
    return next
  }
  if (field) item[field] = text
  return next
}

function readLinkedInProfile() {
  try {
    const profile = JSON.parse(sessionStorage.getItem(linkedinProfileStorageKey) || 'null')
    if (profile?.resumeData && Date.now() - profile.savedAt <= linkedinProfileStorageMaxAge) return profile
    sessionStorage.removeItem(linkedinProfileStorageKey)
  } catch {
    sessionStorage.removeItem(linkedinProfileStorageKey)
  }
  return null
}

function storeLinkedInProfile(profile) {
  try { sessionStorage.setItem(linkedinProfileStorageKey, JSON.stringify(profile)) } catch {
    // The comparison still works for this open workspace if browser storage is unavailable.
  }
}

function readQueuedEvidenceComparison() {
  try {
    const request = JSON.parse(sessionStorage.getItem(evidenceComparisonRequestKey) || 'null')
    if (request?.sources && Date.now() - request.savedAt <= evidenceComparisonRequestMaxAge) return request
    sessionStorage.removeItem(evidenceComparisonRequestKey)
  } catch {
    sessionStorage.removeItem(evidenceComparisonRequestKey)
  }
  return null
}

const savedProjectsStorageKey = 'resumetrics:saved-projects'
const placeholderSavedProjects = [
  { id: 'saved-work-1', name: 'Saved work', resumeData: null },
  { id: 'saved-work-2', name: 'Saved work', resumeData: null }
]

function describeSavedProject(project) {
  const updatedAt = Number(project.updatedAt)
  return {
    ...project,
    name: project.name || project.resumeData?.fullName || 'Untitled resume',
    templateName: resumeTemplates.find(template => template.id === project.templateId)?.name || '',
    updatedLabel: updatedAt ? `Edited ${new Date(updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Not edited yet'
  }
}

function readSavedProjects() {
  try {
    const stored = JSON.parse(localStorage.getItem(savedProjectsStorageKey) || 'null')
    const projects = Array.isArray(stored) ? stored.filter(project => project?.id) : placeholderSavedProjects
    return projects.map(describeSavedProject)
  } catch {
    return placeholderSavedProjects.map(describeSavedProject)
  }
}

function storeSavedProjects(projects) {
  try {
    localStorage.setItem(savedProjectsStorageKey, JSON.stringify(projects.map(({ id, name, templateId, updatedAt, resumeData, progress }) => ({ id, name, templateId, updatedAt, resumeData, progress }))))
  } catch {
    // The dashboard still updates for this visit if browser storage is unavailable.
  }
}

function getResumeHealth(resumeData) {
  const data = resumeData ?? {}
  const has = value => typeof value === 'string' && value.trim().length > 0
  const count = value => (Array.isArray(value) ? value.filter(Boolean).length : 0)
  const skillCount = Object.values(data.skills ?? {}).flat().filter(has).length
  const experience = Array.isArray(data.experience) ? data.experience : []
  const bulletCount = [...experience, ...(data.projects ?? [])].reduce((total, item) => total + count(item?.bullets), 0)
  const experienceBullets = experience.reduce((total, item) => total + count(item?.bullets), 0)
  const summaryWords = has(data.summary) ? data.summary.trim().split(/\s+/).length : 0
  const contactFields = [data.fullName, data.email, data.phone, data.location].filter(has).length
  const rate = (done, partial) => done ? 'done' : partial ? 'partial' : 'missing'
  const checks = [
    { key: 'contact', label: 'Contact details', weight: 15, status: rate(contactFields === 4, contactFields > 0), detail: `${contactFields} of 4 fields`, tip: 'Complete your name, email, phone and location.' },
    { key: 'headline', label: 'Headline', weight: 8, status: rate(has(data.headline), false), detail: has(data.headline) ? 'Added' : 'Missing', tip: 'Add a headline that names the role you want.' },
    { key: 'summary', label: 'Summary', weight: 15, status: rate(summaryWords >= 30, summaryWords > 0), detail: summaryWords ? `${summaryWords} words` : 'Missing', tip: summaryWords ? 'Expand your summary to at least 30 words.' : 'Write a short professional summary.' },
    { key: 'experience', label: 'Experience', weight: 25, status: rate(experience.length > 0 && experienceBullets >= experience.length * 2, experience.length > 0), detail: experience.length ? `${experience.length} role${experience.length === 1 ? '' : 's'}, ${experienceBullets} bullets` : 'Missing', tip: experience.length ? 'Give each role at least two achievement bullets.' : 'Add your work or internship experience.' },
    { key: 'education', label: 'Education', weight: 12, status: rate(count(data.education) > 0, false), detail: count(data.education) ? `${count(data.education)} entr${count(data.education) === 1 ? 'y' : 'ies'}` : 'Missing', tip: 'Add your education history.' },
    { key: 'skills', label: 'Skills', weight: 13, status: rate(skillCount >= 6, skillCount > 0), detail: skillCount ? `${skillCount} skills` : 'Missing', tip: skillCount ? 'List at least six relevant skills.' : 'Add the skills recruiters search for.' },
    { key: 'projects', label: 'Projects', weight: 7, status: rate(count(data.projects) > 0, false), detail: count(data.projects) ? `${count(data.projects)} project${count(data.projects) === 1 ? '' : 's'}` : 'Missing', tip: 'Showcase a project that proves your skills.' },
    { key: 'links', label: 'Links', weight: 5, status: rate(count(data.links) > 0, false), detail: count(data.links) ? `${count(data.links)} link${count(data.links) === 1 ? '' : 's'}` : 'Missing', tip: 'Link your portfolio, GitHub or LinkedIn.' }
  ]
  const progress = {
    contact: contactFields / 4,
    headline: has(data.headline) ? 1 : 0,
    summary: Math.min(summaryWords / 30, 1),
    experience: experience.length ? .25 + .75 * Math.min(experienceBullets / (experience.length * 2), 1) : 0,
    education: count(data.education) ? 1 : 0,
    skills: Math.min(skillCount / 6, 1),
    projects: count(data.projects) ? 1 : 0,
    links: count(data.links) ? 1 : 0
  }
  checks.forEach(check => { check.progress = resumeData ? progress[check.key] : 0 })
  const completion = resumeData ? Math.round((checks.reduce((total, check) => total + check.progress, 0) / checks.length) * 100) : 0
  const tone = !resumeData ? 'empty' : completion >= 80 ? 'strong' : completion >= 50 ? 'fair' : 'weak'
  return {
    completion,
    tone,
    checks,
    completedSections: checks.filter(check => check.progress >= 1).length,
    missing: checks.filter(check => check.progress < 1).sort((a, b) => b.weight - a.weight)
  }
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
  if (name === 'dashboard') return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>
  if (name === 'folder') return <svg {...common}><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2h7.5A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-12Z" /></svg>
  if (name === 'workspace') return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
  if (name === 'document') return <svg {...common}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h4M9 13h6M9 17h6" /></svg>
  if (name === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.75v2.1M12 19.15v2.1M2.75 12h2.1M19.15 12h2.1M5.46 5.46l1.49 1.49M17.05 17.05l1.49 1.49M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49" /></svg>
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
  if (name === 'rocket') return <svg {...common}><path d="M14.5 4.5c2.6-1 4.8-1 5-1 0 .2 0 2.4-1 5a13 13 0 0 1-6 6.5l-3-3a13 13 0 0 1 5-7.5Z" /><circle cx="15" cy="9" r="1.6" /><path d="m9.5 12-3.3-.7L8.5 8h3.4M12 14.5l.7 3.3L16 15.5v-3.4M6.5 15.5c-1.5.5-2.5 2.5-2.5 4.5 2 0 4-1 4.5-2.5" /></svg>
  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
  if (name === 'layout') return <svg {...common}><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M3.5 9h17M9 9v11.5" /></svg>
  if (name === 'crown') return <svg {...common}><path d="m3 7 4.5 4L12 5l4.5 6L21 7l-2 11H5L3 7Z" /></svg>
  if (name === 'target') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" fill="currentColor" /></svg>
  if (name === 'briefcase') return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12.5h18" /></svg>
  if (name === 'mail') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
  return null
}

function SourceIcon({ name }) {
  if (name === 'GitHub') return <span className="source-icon github-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.48.09.65-.2.65-.46v-1.68c-2.65.58-3.21-1.12-3.21-1.12-.44-1.1-1.07-1.4-1.07-1.4-.87-.59.07-.58.07-.58.96.07 1.46.99 1.46.99.86 1.46 2.25 1.04 2.8.8.09-.62.34-1.04.61-1.28-2.12-.24-4.35-1.06-4.35-4.7 0-1.04.37-1.9.98-2.57-.1-.24-.43-1.22.09-2.54 0 0 .8-.26 2.62.98A9.1 9.1 0 0 1 12 7.1c.8 0 1.6.11 2.35.34 1.82-1.24 2.62-.98 2.62-.98.52 1.32.19 2.3.09 2.54.61.67.98 1.53.98 2.57 0 3.65-2.23 4.46-4.36 4.7.35.3.65.87.65 1.76v2.6c0 .26.17.56.66.46A9.5 9.5 0 0 0 12 2.5Z" /></svg></span>
  if (name === 'LinkedIn') return <span className="source-icon linkedin-mark" aria-hidden="true">in</span>
  return <span className="source-icon leetcode-mark" aria-hidden="true">&lt;/&gt;</span>
}

const profileDetailsStorageKey = 'resumetrics:profile-details'
const settingsTabs = [
  ['account', 'Account', 'user'],
  ['appearance', 'Appearance', 'appearance'],
  ['notifications', 'Notifications', 'notifications'],
  ['privacy', 'Privacy & Data', 'privacy']
]

function readProfileDetails() {
  try {
    const stored = JSON.parse(localStorage.getItem(profileDetailsStorageKey) || 'null')
    return { phone: String(stored?.phone ?? ''), location: String(stored?.location ?? '') }
  } catch {
    return { phone: '', location: '' }
  }
}

const formatAccountDate = value => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
}

function GoogleMark() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8Z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5H2.2v2.8A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.9 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.7-2.8Z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.7 2.8C6.8 7.3 9.2 5.4 12 5.4Z" /></svg>
}

// Accent shades replace the old light/dark/system choice; the interface always stays light.
const accentShadeStorageKey = 'resumetrics-shade'
const accentShades = [
  ['violet', 'Violet', 'The original Resumetrics look', ['#5b45e4', '#6c58f2', '#efecff']],
  ['ocean', 'Ocean', 'Calm, trustworthy blue', ['#2563eb', '#3b82f6', '#e6effe']],
  ['emerald', 'Emerald', 'Fresh and confident green', ['#0e9466', '#16b07c', '#e2f5ec']],
  ['rose', 'Rose', 'Warm and personable', ['#db3f68', '#ec5f84', '#fde8ee']],
  ['sunset', 'Sunset', 'Energetic amber', ['#dd6b12', '#f0862e', '#fdeedf']],
  ['graphite', 'Graphite', 'Neutral and understated', ['#3d4757', '#556076', '#eaecf0']]
]
const readAccentShade = () => {
  try {
    const stored = localStorage.getItem(accentShadeStorageKey)
    return accentShades.some(([id]) => id === stored) ? stored : 'violet'
  } catch {
    return 'violet'
  }
}
function applyAccentShade(shade) {
  const root = document.documentElement
  root.dataset.shade = shade
  root.dataset.resolvedTheme = 'light'
  delete root.dataset.appearance
  try {
    localStorage.setItem(accentShadeStorageKey, shade)
    localStorage.removeItem('resumetrics-appearance')
  } catch {
    // The shade still applies for this visit if browser storage is unavailable.
  }
}
// Apply the saved shade as soon as the app loads, not only after Settings is opened.
if (typeof document !== 'undefined') applyAccentShade(readAccentShade())

function GeneralSettingsPanel() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()
    } catch (logoutError) {
      console.error('Google sign-out failed:', logoutError)
    } finally {
      navigate('/login', { replace: true })
    }
  }
  const [activeTab, setActiveTab] = useState('account')
  const [shade, setShade] = useState(readAccentShade)
  const [savedDetails, setSavedDetails] = useState(readProfileDetails)
  const [details, setDetails] = useState(savedDetails)
  const [detailsNotice, setDetailsNotice] = useState('')
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [privacyNotice, setPrivacyNotice] = useState('')

  useEffect(() => { applyAccentShade(shade) }, [shade])

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'
  const initials = displayName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
  const profilePhoto = currentUser?.photoURL || currentUser?.providerData?.find(provider => provider.providerId === 'google.com')?.photoURL
  const detailsChanged = details.phone.trim() !== savedDetails.phone || details.location.trim() !== savedDetails.location

  const saveDetails = event => {
    event.preventDefault()
    const next = { phone: details.phone.trim(), location: details.location.trim() }
    try {
      localStorage.setItem(profileDetailsStorageKey, JSON.stringify(next))
      setSavedDetails(next)
      setDetails(next)
      setDetailsNotice('Your details were saved on this device.')
    } catch {
      setDetailsNotice('Your browser blocked saving these details.')
    }
  }

  const clearSavedProjects = () => {
    try { localStorage.removeItem(savedProjectsStorageKey) } catch {
      // Nothing to clear if browser storage is unavailable.
    }
    setClearConfirmOpen(false)
    setPrivacyNotice('Saved projects were removed from this browser.')
  }

  return <div className="settings-layout">
    <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
      {settingsTabs.map(([id, label, icon]) => <button key={id} id={`settings-tab-${id}`} className={activeTab === id ? 'active' : ''} type="button" role="tab" aria-selected={activeTab === id} aria-controls="settings-tab-panel" onClick={() => setActiveTab(id)}>
        <Icon name={icon} size={17} /><span>{label}</span>
      </button>)}
    </nav>

    <section className="panel settings-card" id="settings-tab-panel" role="tabpanel" aria-labelledby={`settings-tab-${activeTab}`}>
      {activeTab === 'account' && <>
        <h2>Account</h2>
        <div className="settings-block">
          <span className="settings-block-title">Profile photo</span>
          <div className="settings-avatar-row">
            {profilePhoto ? <img className="settings-avatar" src={profilePhoto} alt="" referrerPolicy="no-referrer" /> : <span className="settings-avatar settings-avatar-placeholder" aria-hidden="true">{initials}</span>}
            <p>Your photo comes from your Google account. Change it in Google to update it here.</p>
          </div>
        </div>
        <div className="settings-block settings-field-grid">
          <label className="settings-field"><span><b>Name</b><small>From Google</small></span><input value={displayName} readOnly aria-readonly="true" /></label>
          <label className="settings-field"><span><b>Email address</b><small>Used to sign in</small></span><input value={currentUser?.email || ''} readOnly aria-readonly="true" /></label>
        </div>
        <form className="settings-block" onSubmit={saveDetails}>
          <div className="settings-field-grid">
            <label className="settings-field"><span><b>Phone number</b><small>Optional</small></span><input type="tel" autoComplete="tel" value={details.phone} placeholder="Add a phone number" onChange={event => { setDetails(current => ({ ...current, phone: event.target.value })); setDetailsNotice('') }} /></label>
            <label className="settings-field"><span><b>Location</b><small>City, country</small></span><input autoComplete="address-level2" value={details.location} placeholder="Add your location" onChange={event => { setDetails(current => ({ ...current, location: event.target.value })); setDetailsNotice('') }} /></label>
          </div>
          <div className="settings-form-footer">
            {detailsNotice ? <span role="status">{detailsNotice}</span> : <span>These are saved on this device only.</span>}
            <button className="primary-button" type="submit" disabled={!detailsChanged}>Save changes</button>
          </div>
        </form>
        <div className="settings-block">
          <span className="settings-block-title">Linked account</span>
          <div className="settings-linked-row">
            <span className="settings-linked-identity"><GoogleMark /><span><b>Google</b><small>{currentUser?.email}</small></span></span>
            <button className="settings-logout-button" type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? 'Logging out…' : 'Log out'}</button>
          </div>
        </div>
        <dl className="settings-meta">
          <div><dt>Member since</dt><dd>{formatAccountDate(currentUser?.metadata?.creationTime)}</dd></div>
          <div><dt>Last sign-in</dt><dd>{formatAccountDate(currentUser?.metadata?.lastSignInTime)}</dd></div>
        </dl>
      </>}

      {activeTab === 'appearance' && <>
        <h2>Appearance</h2>
        <p className="settings-intro">Pick an accent shade for buttons, highlights and menus. Your resume keeps its own template colours.</p>
        <div className="settings-shade-options" role="radiogroup" aria-label="Accent shade">
          {accentShades.map(([id, label, description, colors]) => <button key={id} type="button" role="radio" aria-checked={shade === id} className={shade === id ? 'active' : ''} onClick={() => setShade(id)}>
            <span className="settings-shade-swatch" style={{ '--swatch-a': colors[0], '--swatch-b': colors[1], '--swatch-soft': colors[2] }} aria-hidden="true"><i /><i /><i /></span>
            <span className="settings-shade-text"><b>{label}</b><small>{description}</small></span>
            {shade === id && <span className="settings-shade-check" aria-hidden="true"><Icon name="check" size={14} /></span>}
          </button>)}
        </div>
      </>}

      {activeTab === 'notifications' && <>
        <h2>Notifications</h2>
        <div className="settings-empty">
          <span aria-hidden="true"><Icon name="notifications" size={22} /></span>
          <b>Nothing to set up yet</b>
          <p>Email updates and resume reminders are coming in a future update.</p>
        </div>
      </>}

      {activeTab === 'privacy' && <>
        <h2>Privacy & Data</h2>
        <p className="settings-intro">Resumetrics keeps your projects and preferences in this browser. Your Google password is never seen or stored.</p>
        <div className="settings-block settings-danger-row">
          <span><b>Clear saved projects</b><small>Removes every saved project from this browser. This can't be undone.</small></span>
          {clearConfirmOpen
            ? <span className="settings-confirm"><button type="button" onClick={() => setClearConfirmOpen(false)}>Cancel</button><button className="is-danger" type="button" onClick={clearSavedProjects}>Clear projects</button></span>
            : <button className="settings-danger-button" type="button" onClick={() => { setClearConfirmOpen(true); setPrivacyNotice('') }}>Clear…</button>}
        </div>
        {privacyNotice && <p className="settings-notice" role="status">{privacyNotice}</p>}
      </>}
    </section>
  </div>
}

function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const displayName = currentUser?.displayName?.trim() || currentUser?.email?.split('@')[0] || 'there'
  const projectRailRef = useRef(null)
  const [canAdvanceProjects, setCanAdvanceProjects] = useState(false)

  const updateProjectRail = useCallback(() => {
    const rail = projectRailRef.current
    if (!rail) return
    setCanAdvanceProjects(rail.scrollWidth - rail.clientWidth - rail.scrollLeft > 2)
  }, [])

  useEffect(() => {
    const rail = projectRailRef.current
    if (!rail) return undefined
    updateProjectRail()
    const observer = new ResizeObserver(updateProjectRail)
    observer.observe(rail)
    rail.addEventListener('scroll', updateProjectRail, { passive: true })
    return () => {
      observer.disconnect()
      rail.removeEventListener('scroll', updateProjectRail)
    }
  }, [updateProjectRail])

  const [savedProjects, setSavedProjects] = useState(readSavedProjects)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const selectedProject = savedProjects.find(project => project.id === selectedProjectId) ?? null
  const health = getResumeHealth(selectedProject?.resumeData)
  const previewData = selectedProject?.resumeData ?? null
  const previewSkills = Object.values(previewData?.skills ?? {}).flat().filter(Boolean).slice(0, 6)

  useEffect(() => { updateProjectRail() }, [savedProjects, updateProjectRail])

  // Clicking the logo navigates here again with a new location key; reload the dashboard data in place.
  const location = useLocation()
  const pageRef = useRef(null)
  useEffect(() => {
    setSavedProjects(readSavedProjects())
    setSelectedProjectId(null)
    setConfirmDeleteId(null)
    projectRailRef.current?.scrollTo({ left: 0 })
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) pageRef.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' })
  }, [location.key])

  const selectProject = id => {
    setConfirmDeleteId(null)
    setSelectedProjectId(current => current === id ? null : id)
  }

  const deleteProject = id => {
    const next = savedProjects.filter(project => project.id !== id)
    setSavedProjects(next)
    storeSavedProjects(next)
    setSelectedProjectId(null)
    setConfirmDeleteId(null)
  }

  const progressStages = [
    { key: 'building', label: 'Resume building', icon: 'document', value: health.completion },
    { key: 'tailoring', label: 'Resume tailoring', icon: 'spark', value: Math.round(Number(selectedProject?.progress?.tailoring) || 0) },
    { key: 'cover-letter', label: 'Cover letter', icon: 'mail', value: Math.round(Number(selectedProject?.progress?.coverLetter) || 0) }
  ]

  return <Shell dashboard>
    <div className="dashboard-page" ref={pageRef}>
      <section className={`dashboard-health dashboard-health-${health.tone}`} aria-label="Resume progress" aria-live="polite">
        <div className="dashboard-health-copy">
          <span className="dashboard-health-greeting">Welcome back, {displayName}</span>
          <h1>{selectedProject ? selectedProject.name : 'Your resume progress'}</h1>
          <p>{selectedProject
            ? health.missing.length ? 'A few more details will make this resume ready to send.' : 'This resume is complete. Tailor it for each job you apply to.'
            : 'Select a project below to see its progress.'}</p>
          {selectedProject && health.missing.length > 0 && <span className="dashboard-health-next"><b>Next step</b>{health.missing[0].tip}</span>}
        </div>

        <ul className="dashboard-health-stages" aria-label="Progress">
          {progressStages.map(stage => <li key={stage.key}>
            <span className="dashboard-health-stage-icon" aria-hidden="true"><Icon name={stage.icon} size={18} /></span>
            <span className="dashboard-health-stage-body">
              <span><b>{stage.label}</b><strong>{selectedProject ? `${stage.value}%` : '–'}</strong></span>
              <span className="dashboard-health-stage-bar" role="progressbar" aria-label={stage.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage.value}><span style={{ width: `${stage.value}%` }} /></span>
            </span>
          </li>)}
        </ul>

        <figure className="dashboard-health-preview" aria-hidden="true">
          <div className="dashboard-health-paper">
            {previewData
              ? <>
                <header><strong>{previewData.fullName || selectedProject.name}</strong>{previewData.headline && <span>{previewData.headline}</span>}</header>
                <div className="dashboard-health-paper-cols">
                  <div>
                    <em>Details</em>
                    {[previewData.email, previewData.phone, previewData.location].filter(Boolean).map(value => <span key={value}>{value}</span>)}
                    {previewSkills.length > 0 && <><em>Skills</em>{previewSkills.map(skill => <span key={skill}>{skill}</span>)}</>}
                  </div>
                  <div>
                    {previewData.summary && <><em>Profile</em><p>{previewData.summary}</p></>}
                    {previewData.experience?.length > 0 && <><em>Experience</em>{previewData.experience.slice(0, 3).map((item, index) => <span key={index}><b>{item?.role || 'Role'}</b>{item?.company && ` · ${item.company}`}</span>)}</>}
                    {previewData.education?.length > 0 && <><em>Education</em>{previewData.education.slice(0, 2).map((item, index) => <span key={index}>{item?.degree || item?.institution || 'Education'}</span>)}</>}
                  </div>
                </div>
              </>
              : <div className="dashboard-health-paper-skeleton"><i /><i /><i /><i /><i /><i /><i /></div>}
          </div>
          {selectedProject && <span className="dashboard-health-paper-badge">{health.completion}%</span>}
        </figure>
      </section>

      <div className="dashboard-projects-heading">
        <h2>Your projects</h2>
        <span>{savedProjects.length} saved</span>
      </div>
      <section className="dashboard-project-section" aria-label="Projects">
        <button className="dashboard-project-card is-create" type="button" onClick={() => navigate('/workspace')}>
          <span className="dashboard-project-icon"><Icon name="plus" size={28} /></span>
          <strong>Create new project</strong>
          <small>Start blank or import an existing resume</small>
        </button>
        <div className="dashboard-project-rail" ref={projectRailRef}>
          {savedProjects.length === 0 && <div className="dashboard-project-empty">
            <Icon name="folder" size={22} />
            <p>No saved projects yet. Resumes you save will show up here.</p>
          </div>}
          {savedProjects.map(project => {
            const projectHealth = getResumeHealth(project.resumeData)
            const isSelected = project.id === selectedProjectId
            return <article className={`dashboard-project-card is-saved${isSelected ? ' is-selected' : ''}`} key={project.id}>
              <button className="dashboard-project-select" type="button" aria-pressed={isSelected} onClick={() => selectProject(project.id)}>
                <span className="dashboard-project-paper" aria-hidden="true"><i /><i /><i /><i /><i /></span>
                <span className="dashboard-project-meta">
                  <strong>{project.name}</strong>
                  <small>{project.updatedLabel}</small>
                </span>
                <span className={`dashboard-project-pill is-${projectHealth.tone}`}>{project.resumeData ? `${projectHealth.completion}%` : 'Empty'}</span>
              </button>
              {isSelected && <div className="dashboard-project-actions">
                {confirmDeleteId === project.id
                  ? <>
                    <span>Delete this project?</span>
                    <button className="is-danger" type="button" onClick={() => deleteProject(project.id)}>Delete</button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                  </>
                  : <>
                    <button className="is-primary" type="button" onClick={() => navigate('/workspace', { state: { savedProjectId: project.id } })}><Icon name="create" size={15} />Open</button>
                    <button className="is-danger" type="button" onClick={() => setConfirmDeleteId(project.id)}><Icon name="trash" size={15} />Delete</button>
                  </>}
              </div>}
            </article>
          })}
        </div>
        {canAdvanceProjects && <button className="dashboard-project-arrow" type="button" aria-label="View more projects" onClick={() => projectRailRef.current?.scrollBy({ left: projectRailRef.current.clientWidth * .82, behavior: 'smooth' })}>→</button>}
      </section>
    </div>
  </Shell>
}

function SettingsPage() {
  return <Shell>
    <header className="page-header settings-page-header"><div><h1>Settings</h1><p className="dashboard-subtitle">Manage your account and preferences.</p></div></header>
    <GeneralSettingsPanel />
  </Shell>
}

const helpTopics = [
  { id: 'start', icon: 'rocket', title: 'Getting started', description: 'Create your first resume in a few steps.' },
  { id: 'import', icon: 'import', title: 'Importing a resume', description: 'Bring in an existing PDF, DOCX or TXT file.' },
  { id: 'editing', icon: 'layout', title: 'Templates & editing', description: 'Choose a design and edit any section.' },
  { id: 'nimbus', icon: 'spark', title: 'NIMBUS assistant', description: 'Ask the AI to edit and tailor your resume.' },
  { id: 'evidence', icon: 'evidence', title: 'GitHub & LinkedIn', description: 'Back up your claims with real evidence.' },
  { id: 'export', icon: 'download', title: 'Exporting & saving', description: 'Download your resume and keep your work.' }
]

const helpArticles = [
  { topic: 'start', question: 'How do I create my first resume?', steps: ['Open Resume builder from the sidebar, or select Create new project on the dashboard.', 'Choose to start from a blank resume or import an existing file.', 'Pick a template. You will see a live preview of each design.', 'Fill in or review your sections in the editor, then export it.'] },
  { topic: 'start', question: 'Why do I need to sign in with Google?', answer: 'Signing in keeps your workspace private to you and lets Resumetrics connect services such as GitHub to your account. Your Google password is never seen or stored by Resumetrics.' },
  { topic: 'import', question: 'Which files can I import?', answer: 'You can import PDF, DOCX and TXT files. PDFs exported from a word processor work best. Scanned images or photos of a resume may not contain readable text.' },
  { topic: 'import', question: 'What happens after I upload my resume?', answer: 'Resumetrics reads the text in your file and sorts it into sections such as experience, education and skills. You then get a review screen to check everything before choosing a template. Nothing is added that was not in your file.' },
  { topic: 'editing', question: 'How do I edit text on my resume?', answer: 'In the editor, select any part of the resume to edit it directly. Use the style controls to change the font, text size and colour.' },
  { topic: 'editing', question: 'Can I add a profile photo?', answer: 'Yes, on templates that support a photo. Upload a JPEG image from the editor, then adjust its position and size.' },
  { topic: 'nimbus', question: 'What can NIMBUS do?', answer: 'NIMBUS is the AI assistant in the editor. Ask it to rewrite a section, improve wording or change the style, and it will explain what it changed. It only works with the facts already in your resume and will not invent experience.' },
  { topic: 'nimbus', question: 'How do I tailor my resume to a job?', steps: ['Open your resume in the editor.', 'Paste the job description into the role match panel.', 'Review your match score and the skills the job asks for that your resume is missing.', 'Ask NIMBUS to help you highlight relevant experience you already have.'] },
  { topic: 'evidence', question: 'How do I import my LinkedIn profile?', steps: ['On a desktop browser, open LinkedIn and go to Me → View Profile.', 'In your profile introduction, choose More (or Resources), then Save to PDF.', 'In Resumetrics, choose to import LinkedIn and upload that PDF. A DOCX export is accepted too.'] },
  { topic: 'evidence', question: 'Why connect GitHub?', answer: 'Connecting GitHub lets Resumetrics check your repositories for evidence that supports the skills and projects on your resume. Open Evidence check from the sidebar to compare your sources side by side.' },
  { topic: 'export', question: 'Which formats can I download?', answer: 'Use the Export menu in the editor to download your resume as a PDF, a Word document (DOCX) or plain text (TXT).' },
  { topic: 'export', question: 'Is my resume saved automatically?', answer: 'Not yet. Work in the editor stays available while the tab is open, so export your resume before you close or refresh the page. Automatic saving is coming in a future update.' },
  { topic: 'export', question: 'Where is my data stored, and how do I remove it?', answer: 'Your saved projects and preferences are kept in this browser. You can remove saved projects at any time from Settings → Privacy & Data.' }
]

function HelpPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeTopic, setActiveTopic] = useState(null)
  const articlesRef = useRef(null)
  const searchTerm = query.trim().toLocaleLowerCase()
  const visibleArticles = helpArticles.filter(article => {
    if (searchTerm) return [article.question, article.answer, ...(article.steps ?? [])].join(' ').toLocaleLowerCase().includes(searchTerm)
    return !activeTopic || article.topic === activeTopic
  })
  const activeTopicTitle = helpTopics.find(topic => topic.id === activeTopic)?.title

  const chooseTopic = id => {
    setQuery('')
    setActiveTopic(current => current === id ? null : id)
    window.requestAnimationFrame(() => articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return <Shell>
    <div className="help-page">
      <section className="help-hero">
        <span className="help-hero-eyebrow">Help & support</span>
        <h1>Hi! How can we help you?</h1>
        <form className="help-search" role="search" onSubmit={event => { event.preventDefault(); articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
          <label className="visually-hidden" htmlFor="help-search-input">Search help articles</label>
          <input id="help-search-input" type="search" value={query} placeholder="Ask a question, e.g. how do I export?" onChange={event => { setQuery(event.target.value); setActiveTopic(null) }} />
          <button type="submit" aria-label="Search"><Icon name="search" size={19} /></button>
        </form>
      </section>

      <section className="help-topics" aria-label="Help topics">
        {helpTopics.map(topic => <button key={topic.id} type="button" className={activeTopic === topic.id ? 'active' : ''} aria-pressed={activeTopic === topic.id} onClick={() => chooseTopic(topic.id)}>
          <span className="help-topic-icon" aria-hidden="true"><Icon name={topic.icon} size={24} /></span>
          <b>{topic.title}</b>
          <small>{topic.description}</small>
        </button>)}
      </section>

      <section className="help-articles" ref={articlesRef} aria-labelledby="help-articles-title">
        <div className="help-articles-heading">
          <h2 id="help-articles-title">{searchTerm ? `Results for “${query.trim()}”` : activeTopicTitle || 'Popular questions'}</h2>
          {(searchTerm || activeTopic) && <button type="button" onClick={() => { setQuery(''); setActiveTopic(null) }}>Show all</button>}
        </div>
        {visibleArticles.length
          ? <div className="help-accordion">{visibleArticles.map(article => <details key={article.question}>
            <summary><span>{article.question}</span><span className="help-accordion-icon" aria-hidden="true">›</span></summary>
            <div className="help-answer">
              {article.answer && <p>{article.answer}</p>}
              {article.steps && <ol>{article.steps.map(step => <li key={step}>{step}</li>)}</ol>}
            </div>
          </details>)}</div>
          : <p className="help-no-results">No articles match that search. Try a different word, such as “import” or “export”.</p>}
      </section>

      <section className="help-contact">
        <span className="help-topic-icon" aria-hidden="true"><Icon name="help" size={22} /></span>
        <div><b>Still need help?</b><p>Start with a fresh resume to try things out safely, or review your account and data options in Settings.</p></div>
        <div className="help-contact-actions">
          <button type="button" onClick={() => navigate('/workspace')}>Open resume builder</button>
          <button type="button" className="is-primary" onClick={() => navigate('/settings')}>Go to Settings</button>
        </div>
      </section>
    </div>
  </Shell>
}

const templateGroups = [
  ['single-column', 'Single-column', 'One clean column, read top to bottom. The safest choice for applicant tracking systems and long careers.'],
  ['two-column', 'Two-column', 'A main column with a sidebar for skills and extras. Fits more on a page and gives the design more character.']
]
const TEMPLATE_PAGE_WIDTH = 794

// Large preview of one template over a blurred page, with a brief description and a button to start.
function TemplatePreviewDialog({ template, onClose, onUse }) {
  const paperRef = useRef(null)
  const [scale, setScale] = useState(.6)
  const Preview = template.component

  useEffect(() => {
    const paper = paperRef.current
    if (!paper) return undefined
    const update = () => setScale(paper.clientWidth / TEMPLATE_PAGE_WIDTH || .6)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(paper)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow }
  }, [onClose])

  return <div className="template-preview-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="template-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="template-preview-title">
      <div className="template-preview-paper" ref={paperRef} style={{ '--preview-scale': scale }} aria-hidden="true">
        <span className="template-gallery-sheet template-preview-sheet">
          <Preview resumeData={templatePreviewResumeData} presentation={{ ...resolveResumePresentation(template, {}), photo: template.supportsPhoto ? template.defaultTheme.photo : undefined }} preview />
        </span>
      </div>
      <div className="template-preview-info">
        <button className="template-preview-close" type="button" onClick={onClose} aria-label="Close preview">×</button>
        <span className="template-preview-layout">{template.layout === 'two-column' ? 'Two-column' : 'Single-column'}</span>
        <h2 id="template-preview-title">{template.name}</h2>
        <p>{template.summary}</p>
        <span className="template-gallery-tags">{(template.tags ?? []).filter(tag => !/^(single|two)-column$/i.test(tag)).map(tag => <i key={tag}>{tag}</i>)}</span>
        <button className="template-preview-use" type="button" onClick={onUse} autoFocus>Use this template</button>
        <small className="template-gallery-source">{template.collection === 'reactive-resume' ? 'Adapted from Reactive Resume' : 'Resumetrics classic'}</small>
      </div>
    </div>
  </div>
}

function TemplatesPage() {
  const navigate = useNavigate()
  const galleryRef = useRef(null)
  const [previewScale, setPreviewScale] = useState(.3)

  // Every preview is a real A4 page (794px wide) zoomed down to the card width.
  useEffect(() => {
    const paper = galleryRef.current?.querySelector('.template-gallery-paper')
    if (!paper) return undefined
    const update = () => setPreviewScale(paper.clientWidth / TEMPLATE_PAGE_WIDTH || .3)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(paper)
    return () => observer.disconnect()
  }, [])

  const startWithTemplate = templateId => navigate('/workspace', { state: { dashboardTemplateId: templateId } })
  const [previewId, setPreviewId] = useState(null)
  const previewTemplate = resumeTemplates.find(template => template.id === previewId) ?? null

  return <Shell>
    <header className="page-header templates-page-header"><div><h1>Templates</h1><p className="dashboard-subtitle">Pick a design to start building. You can change colours and fonts in the editor, and switch templates at any time.</p></div></header>
    <div className="templates-gallery" ref={galleryRef} style={{ '--gallery-scale': previewScale }}>
      {templateGroups.map(([layout, title, description]) => {
        const templates = resumeTemplates.filter(template => template.layout === layout)
        return <section className="templates-group" key={layout} aria-labelledby={`templates-${layout}`}>
          <div className="templates-group-heading">
            <h2 id={`templates-${layout}`}>{title} <span>{templates.length}</span></h2>
            <p>{description}</p>
          </div>
          <ul className="templates-grid">{templates.map(template => {
            const Preview = template.component
            return <li key={template.id}>
              <button className="template-gallery-card" type="button" onClick={() => setPreviewId(template.id)} aria-label={`Preview the ${template.name} template`}>
                <span className="template-gallery-paper" aria-hidden="true">
                  <span className="template-gallery-sheet">
                    <Preview resumeData={templatePreviewResumeData} presentation={{ ...resolveResumePresentation(template, {}), photo: template.supportsPhoto ? template.defaultTheme.photo : undefined }} preview />
                  </span>
                </span>
                <span className="template-gallery-info">
                  <b>{template.name}</b>
                  <small>{template.description}</small>
                  <span className="template-gallery-tags">{(template.tags ?? []).filter(tag => !/^(single|two)-column$/i.test(tag)).slice(0, 3).map(tag => <i key={tag}>{tag}</i>)}</span>
                  <span className="template-gallery-source">{template.collection === 'reactive-resume' ? 'Reactive Resume' : 'Resumetrics classic'}</span>
                </span>
              </button>
            </li>
          })}</ul>
        </section>
      })}
    </div>
    {previewTemplate && <TemplatePreviewDialog template={previewTemplate} onClose={() => setPreviewId(null)} onUse={() => startWithTemplate(previewTemplate.id)} />}
  </Shell>
}

function SidebarLink({ label, path, icon }) {
  if (path) return <NavLink className="sidebar-link" to={path}><Icon name={icon} size={18} /><span>{label}</span></NavLink>
  return <span className="sidebar-link is-soon" aria-disabled="true" title={`${label} is coming soon`}><Icon name={icon} size={18} /><span>{label}</span><small>Soon</small></span>
}

function Shell({ children, immersive = false, dashboard = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const recentProjects = useMemo(() => readSavedProjects().filter(project => project.resumeData).slice(0, 3), [location.key])

  return <div className={`app-shell${immersive ? ' editor-shell' : ''}${dashboard ? ' dashboard-shell' : ''}`}>
    {!immersive && <aside className="sidebar">
      <NavLink to="/dashboard" state={{ refresh: true }} className="brand" aria-label="Resumetrics dashboard">
        <img src={logo} alt="Resumetrics" />
      </NavLink>
      <div className="sidebar-scroll">
        {navSections.map(section => <div className="sidebar-section" key={section.label}>
          <span className="sidebar-label">{section.label}</span>
          <nav aria-label={section.label}>{section.items.map(([label, path, icon]) => <SidebarLink key={label} label={label} path={path} icon={icon} />)}</nav>
        </div>)}
        {recentProjects.length > 0 && <div className="sidebar-section sidebar-recent">
          <span className="sidebar-label">Recent resumes</span>
          <ul>{recentProjects.map((project, index) => <li key={project.id}>
            <button type="button" onClick={() => navigate('/dashboard')}>
              <span className="sidebar-recent-mark" style={{ '--recent-color': recentProjectColors[index % recentProjectColors.length] }} aria-hidden="true">{project.name.trim().charAt(0).toUpperCase() || 'R'}</span>
              <span>{project.name}</span>
            </button>
          </li>)}</ul>
        </div>}
      </div>
      <nav className="sidebar-utility" aria-label="Account">{navUtilityItems.map(([label, path, icon]) => <SidebarLink key={label} label={label} path={path} icon={icon} />)}</nav>
      <div className="sidebar-footer">
        <UserMenu />
      </div>
    </aside>}
    <main>{children}</main>
  </div>
}

function MainPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const uploadInputRef = useRef(null)
  const linkedinUploadInputRef = useRef(null)
  const profilePhotoInputRef = useRef(null)
  const editorRef = useRef(null)
  const resumeDataRef = useRef(null)
  const analysisRequestRef = useRef(0)
  const exportMenuRef = useRef(null)
  const assistantInputRef = useRef(null)
  const [description, setDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analysisPreview, setAnalysisPreview] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [githubConnection, setGithubConnection] = useState({ loading: true, connected: false })
  const [githubConnecting, setGithubConnecting] = useState(false)
  const [githubConnectionError, setGithubConnectionError] = useState('')
  const [githubConnectionNotice, setGithubConnectionNotice] = useState('')
  const [githubCompareError, setGithubCompareError] = useState('')
  const [linkedinProfile, setLinkedinProfile] = useState(readLinkedInProfile)
  const [linkedinImportOpen, setLinkedinImportOpen] = useState(false)
  const [linkedinImportStatus, setLinkedinImportStatus] = useState('idle')
  const [linkedinImportError, setLinkedinImportError] = useState('')
  const [linkedinImportNotice, setLinkedinImportNotice] = useState('')
  const [workspaceMode, setWorkspaceMode] = useState('initial')
  const [resumeData, setResumeData] = useState(null)
  const [pendingUploadFile, setPendingUploadFile] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [resumePresentation, setResumePresentation] = useState(() => createResumePresentation())
  const [profilePhotoError, setProfilePhotoError] = useState('')
  const [selectedResumeElement, setSelectedResumeElement] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [parseMetadata, setParseMetadata] = useState(null)
  const [workspaceError, setWorkspaceError] = useState('')
  const [resumeName, setResumeName] = useState('Untitled resume')
  const [editingName, setEditingName] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [fontColor, setFontColor] = useState('#172033')
  const [fontFamily, setFontFamily] = useState(null)
  const [globalFontSize, setGlobalFontSize] = useState(null)
  const [useGlobalTextColor, setUseGlobalTextColor] = useState(false)
  const [footerText, setFooterText] = useState('')
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantFeedback, setAssistantFeedback] = useState(null)
  const [assistantMessages, setAssistantMessages] = useState(initialNimbusMessages)
  const [aiTestLoading, setAiTestLoading] = useState(false)
  const { taskState: assistantAnimationState, beginRun: beginAssistantRun, isCurrentRun: isCurrentAssistantRun, setRunState: setAssistantRunState, finishRun: finishAssistantRun, cancelRun: cancelAssistantRun, wait: waitForAssistantAnimation } = useAIAnimationState()
  const selectedTemplate = getResumeTemplate(selectedTemplateId)
  const resumeElementRegistry = useMemo(() => buildResumeElementRegistry(resumeData ?? {}, resumePresentation), [resumeData, resumePresentation])
  const selectedElementDefinition = selectedResumeElement ? resumeElementRegistry.get(selectedResumeElement.id) : null
  const TemplateComponent = selectedTemplate?.component
  const isEditorReady = workspaceMode === 'editor-ready' && Boolean(TemplateComponent) && Boolean(resumeData)
  const isEditorRoute = location.pathname === '/workspace/editor'
  const isEditorPage = isEditorRoute && isEditorReady
  const isScratchResume = isEditorPage && !uploadedFileName
  const resumeStyle = {
    fontFamily: fontFamily || selectedTemplate?.defaultTheme?.fontFamily || resumeFonts[0].family,
    ...(globalFontSize ? { fontSize: `${globalFontSize}px` } : {}),
    ...(useGlobalTextColor ? { '--resume-text-color': fontColor } : {})
  }
  const resumeEvidenceSkills = getResumeEvidenceSkills(resumeData)
  const linkedinEvidenceSkills = getResumeEvidenceSkills(linkedinProfile?.resumeData)
  const hasLinkedInProfile = Boolean(linkedinProfile?.resumeData)
  const hasConnectedEvidenceSource = githubConnection.connected || hasLinkedInProfile
  const hasImportedResumeSkills = Boolean(uploadedFileName) && resumeEvidenceSkills.length > 0
  const hasWorkspaceResumeSkills = workspaceMode === 'editor-ready' && resumeEvidenceSkills.length > 0

  useEffect(() => {
    const templateId = location.state?.dashboardTemplateId
    if (templateId && workspaceMode !== 'initial') return
    if (!templateId && isEditorRoute && workspaceMode === 'initial') {
      navigate('/workspace', { replace: true })
      return
    }
    if (!templateId || workspaceMode !== 'initial') return
    if (!resumeTemplates.some(template => template.id === templateId)) {
      navigate('/workspace', { replace: true })
      return
    }
    setResumeData(ensureResumeElementIds(createBlankResumeData()))
    setUploadedFileName('')
    setSelectedTemplateId(templateId)
    setResumePresentation(createResumePresentation(templateId))
    setWorkspaceError('')
    setGithubCompareError('')
    setResumeName('Untitled resume')
    setWorkspaceMode('editor-ready')
    navigate('/workspace/editor', { replace: true })
  }, [isEditorRoute, location.state, navigate, workspaceMode])

  useEffect(() => {
    resumeDataRef.current = resumeData
  }, [resumeData])

  useEffect(() => {
    if (!exportMenuOpen && !deleteConfirmOpen) return undefined
    const closeOnOutsideClick = event => {
      if (exportMenuOpen && !exportMenuRef.current?.contains(event.target)) setExportMenuOpen(false)
    }
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return
      setExportMenuOpen(false)
      setDeleteConfirmOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [deleteConfirmOpen, exportMenuOpen])

  const showAssistantError = message => {
    setAssistantFeedback({ tone: 'error', text: message })
  }

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
          setResumeData(ensureResumeElementIds(snapshot.resumeData))
          setResumeName(snapshot.resumeData.fullName || 'Untitled resume')
          setSelectedTemplateId(snapshot.selectedTemplateId || null)
          setResumePresentation(snapshot.resumePresentation || createResumePresentation(snapshot.selectedTemplateId || null))
          setFontFamily(snapshot.resumePresentation?.fontFamily || null)
          setUploadedFileName(snapshot.uploadedFileName || '')
          setParseMetadata(snapshot.parseMetadata || null)
          setWorkspaceMode(snapshot.workspaceMode || 'extraction-review')
          if (snapshot.linkedinProfile?.resumeData) {
            setLinkedinProfile(snapshot.linkedinProfile)
            storeLinkedInProfile(snapshot.linkedinProfile)
          }
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
    setPendingUploadFile(null)
    setSelectedTemplateId(null)
    setResumePresentation(createResumePresentation())
    setProfilePhotoError('')
    setUploadedFileName('')
    setParseMetadata(null)
    setWorkspaceError('')
    setDescription('')
    setResumeName('Untitled resume')
    setEditingName(false)
    setAnalysis(null)
    setAnalysisPreview(null)
    setGithubCompareError('')
    setGlobalFontSize(null)
    setUseGlobalTextColor(false)
    setFooterText('')
    setAssistantInput('')
    setAssistantFeedback(null)
    setAssistantMessages(initialNimbusMessages)
    setAiTestLoading(false)
    cancelAssistantRun()
    editorRef.current = null
    if (location.pathname !== '/workspace') navigate('/workspace', { replace: true })
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
      showAssistantError(`Export failed. Please try again${error?.message ? `: ${error.message}` : '.'}`)
    } finally {
      setExportLoading(false)
    }
  }

  const deleteDraft = () => {
    if (workspaceMode === 'initial') return
    setExportMenuOpen(false)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteDraft = () => {
    setDeleteConfirmOpen(false)
    resetWorkspace()
  }

  const chooseExportFormat = async format => {
    setExportMenuOpen(false)
    await exportDraft(format)
  }

  const handleUpload = event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    selectUploadFile(file)
  }

  const selectUploadFile = file => {
    if (!file) return

    setWorkspaceError('')
    setGithubCompareError('')
    setPendingUploadFile(file)
    setUploadedFileName('')
    setResumeData(null)
    setParseMetadata(null)
    setWorkspaceMode('file-selected')
  }

  const readDocument = async () => {
    const file = pendingUploadFile
    if (!file) return

    setWorkspaceError('')
    setWorkspaceMode('extracting')
    try {
      const extractedDocument = await extractResumeDocument(file)
      if (!extractedDocument.rawText) throw new Error('Could not read this file. Try a text-based PDF, DOCX, or TXT file.')
      const response = await fetch('/api/resume/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: { pages: extractedDocument.pages, links: extractedDocument.links ?? [], metadata: extractedDocument.metadata } })
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      if (!isJson) {
        throw new Error('The AI server is not running. Start the app with npm run dev:all, then try again.')
      }
      const payload = await response.json()
      if (!response.ok || !payload.ok || !payload.resumeData) throw new Error(payload.error || 'Could not extract this resume. Try again.')
      setResumeData(ensureResumeElementIds(payload.resumeData))
      setUploadedFileName(file.name)
      setParseMetadata(payload.metadata ?? extractedDocument.metadata)
      setResumeName(payload.resumeData.fullName || 'Untitled resume')
      setWorkspaceMode('extraction-review')
    } catch (error) {
      const message = error instanceof TypeError && /fetch/i.test(error.message)
        ? 'The AI server is not running. Start the app with npm run dev:all, then try again.'
        : /central directory|zip file/i.test(error.message || '')
          ? 'This DOCX file looks damaged or is not a real Word document. Save it again from Word, or upload it as a PDF.'
          : error.message || 'Could not read this file. Try a text-based PDF, DOCX, or TXT file.'
      setWorkspaceError(message)
      setWorkspaceMode('error')
    }
  }


  const chooseTemplate = templateId => {
    setSelectedTemplateId(templateId)
    const template = getResumeTemplate(templateId)
    setResumePresentation(current => ({ ...current, template: templateId, photo: current.photo?.uploaded ? current.photo : template?.supportsPhoto ? { width: 72, height: 72, shape: 'circle', uploadPlaceholder: true } : { visible: false } }))
    setResumeData(current => current || ensureResumeElementIds(createBlankResumeData()))
    setWorkspaceMode('editor-ready')
    navigate('/workspace/editor')
    requestAnimationFrame(() => editorRef.current?.focus())
  }

  const handleProfilePhotoUpload = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setProfilePhotoError('')
    try {
      const source = await readProfilePhoto(file)
      // The cropper opens straight away; the template's own photo shape (circle or rounded) is kept.
      if (source) setResumePresentation(current => ({ ...current, photo: { source, originalSource: source, cropPending: true, uploaded: true, width: 72, height: 72, shape: selectedTemplate?.defaultTheme?.photo?.shape || 'circle', objectFit: 'cover', objectPosition: '50% 50%' } }))
    } catch (error) {
      setProfilePhotoError(error.message || 'The profile photo could not be loaded.')
    }
  }

  const updateProfilePhoto = photo => setResumePresentation(current => ({ ...current, photo }))

  const openLinkedInImport = () => {
    setLinkedinImportError('')
    setLinkedinImportStatus('idle')
    setLinkedinImportOpen(true)
  }

  const closeLinkedInImport = () => {
    if (linkedinImportStatus === 'reading' || linkedinImportStatus === 'extracting') return
    setLinkedinImportOpen(false)
    setLinkedinImportStatus('idle')
  }

  const handleLinkedInUpload = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setLinkedinImportError('')
    setLinkedinImportNotice('')
    setGithubCompareError('')
    setLinkedinImportStatus('reading')
    try {
      const extractedDocument = await extractResumeDocument(file)
      if (!extractedDocument.rawText) throw new Error('Could not read this file. Please upload a text-based LinkedIn PDF or DOCX export.')
      setLinkedinImportStatus('extracting')
      const response = await fetch('/api/resume/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: { pages: extractedDocument.pages, metadata: { ...extractedDocument.metadata, sourceType: 'linkedin' } } })
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      if (!isJson) throw new Error('The AI server is not running. Start the app with npm run dev:all, then try again.')
      const payload = await response.json()
      if (!response.ok || !payload.ok || !payload.resumeData) throw new Error(payload.error || 'Could not extract this LinkedIn profile. Try again.')

      const profile = {
        savedAt: Date.now(),
        resumeData: payload.resumeData,
        uploadedFileName: file.name,
        parseMetadata: payload.metadata ?? extractedDocument.metadata
      }
      setLinkedinProfile(profile)
      storeLinkedInProfile(profile)
      setLinkedinImportNotice(`Info acquired from ${file.name}. ${getResumeEvidenceSkills(payload.resumeData).length} skills, ${payload.resumeData.experience.length} roles, and ${payload.resumeData.education.length} education entries are ready to compare.`)
      setLinkedinImportOpen(false)
      setLinkedinImportStatus('idle')
    } catch (error) {
      const message = error instanceof TypeError && /fetch/i.test(error.message)
        ? 'The AI server is not running. Start the app with npm run dev:all, then try again.'
        : error.message || 'Could not import this LinkedIn profile. Try a text-based PDF or DOCX export.'
      setLinkedinImportError(message)
      setLinkedinImportStatus('error')
    }
  }

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
          resumePresentation,
          uploadedFileName,
          parseMetadata,
          linkedinProfile
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
    const hasResumeForEvidence = Boolean(resumeData && (hasImportedResumeSkills || hasWorkspaceResumeSkills))
    const githubReady = githubConnection.connected && hasResumeForEvidence
    const linkedinReady = hasLinkedInProfile

    if (!githubReady && !linkedinReady) {
      setGithubCompareError(githubConnection.connected || linkedinReady
        ? 'Create or import a resume with extracted skills before comparing evidence sources.'
        : 'Connect GitHub or upload a LinkedIn profile before comparing.')
      return
    }
    if (linkedinReady && !hasResumeForEvidence) {
      setGithubCompareError('Import or create a resume with extracted skills before comparing LinkedIn information.')
      return
    }
    const request = {
      savedAt: Date.now(),
      sources: { github: githubReady, linkedin: linkedinReady },
      resumeData: (githubReady || linkedinReady) ? resumeData : null,
      linkedinProfile: linkedinReady ? linkedinProfile : null,
      jobDescription: linkedinReady ? description.trim() : ''
    }
    try { sessionStorage.setItem(evidenceComparisonRequestKey, JSON.stringify(request)) } catch {
      setGithubCompareError('Your browser could not prepare the comparison. Please try again.')
      return
    }
    navigate('/evaluation?compare=evidence')
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

  const editorReady = editor => { editorRef.current = editor }
  const handleManualResumeEdit = ({ path, value }) => {
    if (path === 'footerText') {
      setFooterText(cleanManualValue(value))
      return
    }
    const current = resumeDataRef.current ?? resumeData
    const next = updateManualResumeData(current, path, value)
    if (next === current) return
    resumeDataRef.current = next
    setResumeData(next)
    if (path === 'fullName') setResumeName(next.fullName || 'Untitled resume')
  }

  const handleBuilderResumeUpdate = next => {
    resumeDataRef.current = next
    setResumeData(next)
    if (next.fullName !== resumeName) setResumeName(next.fullName || 'Untitled resume')
  }

  const getAssistantWorkspaceContext = () => {
    const currentResumeData = resumeDataRef.current ?? resumeData
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim().slice(0, 600) || ''
    const anchor = selection?.anchorNode
    const anchorElement = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement
    const activeSectionElement = anchorElement?.closest?.('.resume-section')
    const activeEntryElement = anchorElement?.closest?.('.resume-entry')
    const activeSection = activeSectionElement?.querySelector('h2')?.textContent?.trim().toLowerCase() || (anchorElement?.closest?.('.generated-resume-header') ? 'basics' : null)
    const sectionEntries = activeSectionElement ? [...activeSectionElement.querySelectorAll(':scope > .resume-entry')] : []
    const activeItemIndex = activeEntryElement ? sectionEntries.indexOf(activeEntryElement) : -1
    let activeField = null
    if (anchorElement?.closest?.('.generated-resume-header h1')) activeField = 'fullName'
    else if (anchorElement?.closest?.('.generated-resume-header > div > p')) activeField = 'headline'
    else if (anchorElement?.closest?.('.generated-contact')) activeField = 'contact'
    else if (anchorElement?.closest?.('li')) activeField = activeSection === 'education' ? 'details' : 'bullets'
    else if (activeSection === 'summary') activeField = 'summary'
    else if (activeSection === 'skills') activeField = 'skills'

    return {
      resumeData: currentResumeData,
      template: selectedTemplate ? { id: selectedTemplate.id, name: selectedTemplate.name, category: selectedTemplate.category, atsFriendly: selectedTemplate.atsFriendly } : null,
      style: {
        fontFamily: resumeFonts.find(font => font.family === (fontFamily || selectedTemplate?.defaultTheme?.fontFamily))?.name || fontFamily || selectedTemplate?.defaultTheme?.fontFamily,
        fontSize: globalFontSize || fontSize,
        textColor: useGlobalTextColor ? fontColor : null,
        footerText,
        appearance: document.documentElement.dataset.appearance || 'system',
        resolvedTheme: document.documentElement.dataset.resolvedTheme || 'light'
      },
      resumePresentation: {
        ...selectedTemplate?.defaultTheme,
        ...resumePresentation,
        template: selectedTemplateId
      },
      sourceDocument: parseMetadata ? {
        fileName: parseMetadata.fileName || uploadedFileName,
        fileType: parseMetadata.fileType || '',
        totalPages: parseMetadata.totalPages ?? null,
        pagesProcessed: parseMetadata.pagesProcessed ?? null,
        isCompleteParse: parseMetadata.isCompleteParse === true
      } : null,
      editor: { activeTool: 'select', activeSection, activeField, activeItemIndex: activeItemIndex >= 0 ? activeItemIndex : null, selectedText },
      selectedElement: selectedElementDefinition ? {
        ...selectedElementDefinition,
        value: selectedElementDefinition.path ? getPathValue({ content: currentResumeData, presentation: resumePresentation }, selectedElementDefinition.path) : null,
        editableProperties: selectedElementDefinition.capabilities
      } : null,
      availableElementOperations: ['set_content', 'set_style', 'set_theme', 'set_image', 'set_image_style', 'reorder_sections', 'change_template'],
      sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'achievements'],
      itemReferences: {
        experience: (currentResumeData?.experience ?? []).map((item, index) => ({ id: `experience-${index}`, index, label: [item.role, item.company].filter(Boolean).join(' at ') })),
        projects: (currentResumeData?.projects ?? []).map((item, index) => ({ id: `project-${index}`, index, label: item.name || `Project ${index + 1}` })),
        education: (currentResumeData?.education ?? []).map((item, index) => ({ id: `education-${index}`, index, label: [item.degree, item.institution].filter(Boolean).join(' at ') }))
      },
      conversation: assistantMessages.slice(-8),
      editorSnapshot: editorRef.current?.innerText?.slice(0, 18_000) || ''
    }
  }

  const askAssistant = async event => {
    event.preventDefault()
    const message = assistantInput.trim()
    const currentResumeData = resumeDataRef.current ?? resumeData
    if (aiTestLoading) return
    if (!message) {
      showAssistantError('Describe a change before sending it to AI.')
      const runId = beginAssistantRun('exclaim')
      waitForAssistantAnimation(EXCLAIM_MS).then(() => finishAssistantRun(runId))
      requestAnimationFrame(() => assistantInputRef.current?.focus())
      return
    }
    if (!isEditorReady || !currentResumeData) {
      showAssistantError('Open or create a resume first, then I can apply changes to it.')
      const runId = beginAssistantRun('exclaim')
      waitForAssistantAnimation(EXCLAIM_MS).then(() => finishAssistantRun(runId))
      return
    }

    setAssistantMessages(current => [...current, { role: 'user', text: message }].slice(-20))
    setAssistantInput('')
    const runId = beginAssistantRun('thinking')
    setAssistantFeedback({ tone: 'info', text: 'Understanding your request…' })
    setAiTestLoading(true)

    try {
      const planningRequest = fetch('/api/resume/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: message, workspaceContext: getAssistantWorkspaceContext() })
      }).then(async response => {
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.ok || !payload.plan) throw new Error(payload?.error || 'AI edit planning failed.')
        return payload
      }).then(payload => ({ payload, error: null }), error => ({ payload: null, error }))

      await waitForAssistantAnimation(MIN_THINKING_MS)
      if (!isCurrentAssistantRun(runId)) return
      const { payload, error: planningError } = await planningRequest
      if (planningError) throw planningError

      if (payload.plan.status !== 'ready') {
        const isConversation = payload.plan.status === 'conversation'
        setAssistantMessages(current => [...current, { role: 'assistant', text: payload.plan.message }].slice(-20))
        if (isConversation || payload.plan.status === 'no_changes') setAssistantFeedback(null)
        else showAssistantError(payload.plan.message)
        setAssistantRunState(runId, isConversation ? 'curious' : 'exclaim')
        await waitForAssistantAnimation(isConversation ? 320 : EXCLAIM_MS)
        finishAssistantRun(runId)
        requestAnimationFrame(() => assistantInputRef.current?.focus())
        return
      }

      setAssistantRunState(runId, 'processing')
      setAssistantFeedback({ tone: 'info', text: 'Applying changes…' })
      const result = applyResumeEditPlan({ resumeData: currentResumeData, plan: payload.plan })
      setResumeData(ensureResumeElementIds(result.resumeData))
      resumeDataRef.current = result.resumeData
      if (result.resumeData.fullName !== currentResumeData.fullName) setResumeName(result.resumeData.fullName || 'Untitled resume')
      if (result.styleUpdates.fontFamily !== undefined) {
        setFontFamily(result.styleUpdates.fontFamily)
        setResumePresentation(current => ({ ...current, fontFamily: result.styleUpdates.fontFamily }))
      }
      if (result.styleUpdates.fontSize !== undefined) {
        setGlobalFontSize(result.styleUpdates.fontSize)
        setFontSize(result.styleUpdates.fontSize || 14)
      }
      if (result.styleUpdates.textColor !== undefined) {
        setUseGlobalTextColor(Boolean(result.styleUpdates.textColor))
        setFontColor(result.styleUpdates.textColor || '#172033')
      }
      if (result.footerUpdate !== undefined) setFooterText(result.footerUpdate)

      await waitForAssistantAnimation(MIN_PROCESSING_MS)
      if (!isCurrentAssistantRun(runId)) return
      assistantInputRef.current?.blur()
      const successMessage = payload.plan.message || 'Updated your resume.'
      setAssistantMessages(current => [...current, { role: 'assistant', text: successMessage }].slice(-20))
      setAssistantFeedback({ tone: 'success', text: 'Resume updated' })
      setAssistantRunState(runId, 'success')
      await waitForAssistantAnimation(SUCCESS_MS)
      finishAssistantRun(runId)
    } catch (error) {
      if (!isCurrentAssistantRun(runId)) return
      const errorMessage = error.message || 'I could not apply that change.'
      setAssistantMessages(current => [...current, { role: 'assistant', text: errorMessage }].slice(-20))
      showAssistantError(errorMessage)
      setAssistantRunState(runId, 'exclaim')
      await waitForAssistantAnimation(EXCLAIM_MS)
      finishAssistantRun(runId)
    } finally {
      if (isCurrentAssistantRun(runId)) setAiTestLoading(false)
    }
  }

  const activeFontFamily = resumePresentation.fontFamily || selectedTemplate?.defaultTheme?.fontFamily || resumeFonts[0].family
  const editorPresentation = resolveResumePresentation(selectedTemplate, resumePresentation)
  if (isEditorPage && selectedTemplate?.supportsPhoto && !editorPresentation.photo?.uploaded) {
    editorPresentation.photo = { width: 72, height: 72, shape: 'circle', uploadPlaceholder: true }
  }
  const assistantEditor = <AIAssistantEditor
    inputRef={assistantInputRef}
    value={assistantInput}
    busy={aiTestLoading}
    isAvailable={isEditorPage}
    feedback={assistantFeedback}
    messages={assistantMessages}
    animationState={assistantAnimationState}
    onChange={event => {
      setAssistantInput(event.target.value)
      if (assistantFeedback) setAssistantFeedback(null)
      if (!aiTestLoading && assistantAnimationState) cancelAssistantRun()
    }}
    onSubmit={askAssistant}
  />
  return <Shell immersive={isEditorRoute}>
    <header className={`page-header${isEditorRoute ? ' editor-page-header' : ''}`}><div>{isEditorRoute && <button className="editor-back-button" type="button" onClick={() => navigate('/workspace')} aria-label="Back to workspace"><span aria-hidden="true">←</span> Back to workspace</button>}<span className="eyebrow">{isEditorRoute ? 'RESUME EDITOR' : 'WORKSPACE'}</span>{isEditorRoute ? <h1>Build and refine your resume.</h1> : <h1>Start a resume.</h1>}</div></header>
    <div className={`workspace-grid ${isEditorPage ? 'editor-workspace-grid' : 'setup-mode'}`}>
      <section className="resume-canvas panel">
        {isEditorPage && <div className="canvas-top editor-toolbar">
          <div className="editor-toolbar-identity">
            <span className="editor-toolbar-icon" aria-hidden="true"><Icon name="document" size={18} /></span>
            <div className="resume-title-wrap">
              {editingName
                ? <input className="resume-title-input" autoFocus value={resumeName} onChange={event => setResumeName(event.target.value)} onBlur={() => { setResumeName(resumeName.trim() || 'Untitled resume'); setEditingName(false) }} onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()} aria-label="Resume name" />
                : <button className="resume-title-button" type="button" onClick={() => setEditingName(true)} title="Rename this resume">{resumeName}<span className="resume-title-edit" aria-hidden="true"><Icon name="create" size={13} /></span></button>}
              <small className="editor-toolbar-meta">{selectedTemplate?.name}<i aria-hidden="true">·</i>{selectedTemplate?.layout === 'two-column' ? 'Two-column' : 'Single-column'}<i aria-hidden="true">·</i>{uploadedFileName ? `Imported from ${uploadedFileName}` : 'Started from scratch'}</small>
            </div>
          </div>
          <div className="canvas-actions editor-toolbar-actions">
            <button className="canvas-delete-button editor-toolbar-delete" type="button" disabled={workspaceMode === 'initial'} onClick={deleteDraft} aria-label="Delete this draft" title="Delete this draft"><Icon name="trash" size={16} /></button>
            <span className="canvas-export-wrap" ref={exportMenuRef}>
              <button className="canvas-export-button editor-toolbar-export" type="button" disabled={exportLoading} aria-haspopup="menu" aria-expanded={exportMenuOpen} onClick={() => setExportMenuOpen(open => !open)}><Icon name="download" size={15} />{exportLoading ? 'Exporting…' : 'Export'}<span className="export-chevron" aria-hidden="true">▾</span></button>
              {exportMenuOpen && <div className="export-format-menu" role="menu" aria-label="Export format">
                <button type="button" role="menuitem" disabled={exportLoading} onClick={() => chooseExportFormat('PDF')}><FileTypeIcon fileName="resume.pdf" size={26} /><span><b>PDF document</b><small>Best for sending to employers</small></span></button>
                <button type="button" role="menuitem" disabled={exportLoading} onClick={() => chooseExportFormat('DOCX')}><FileTypeIcon fileName="resume.docx" size={26} /><span><b>Word document</b><small>Editable .docx file</small></span></button>
                <button type="button" role="menuitem" disabled={exportLoading} onClick={() => chooseExportFormat('TXT')}><FileTypeIcon fileName="resume.txt" size={26} /><span><b>Plain text</b><small>For online application forms</small></span></button>
              </div>}
            </span>
          </div>
        </div>}
        <input ref={uploadInputRef} className="upload-input" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleUpload} />
        <input ref={linkedinUploadInputRef} className="upload-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleLinkedInUpload} />
        {isEditorPage && selectedTemplate?.supportsPhoto && <input ref={profilePhotoInputRef} className="upload-input" type="file" accept="image/jpeg,.jpg,.jpeg" aria-label="Choose JPEG profile photo" onChange={handleProfilePhotoUpload} />}
        {(workspaceMode === 'initial' || workspaceMode === 'file-selected' || (!isEditorRoute && workspaceMode === 'editor-ready')) && <ResumeStartOptions onImport={() => uploadInputRef.current?.click()} onFile={selectUploadFile} onCreate={() => navigate('/templates')} selectedFile={workspaceMode === 'file-selected' ? pendingUploadFile : null} onRead={readDocument} />}
        {workspaceMode === 'extracting' && <div className="flow-loading" aria-live="polite"><div className="flow-loading-card"><DotLottieReact className="flow-loading-animation" src="/loading.lottie" loop autoplay mode="bounce" speed={2} aria-label="Extracting resume data" /><h2>Extracting resume details…</h2>{pendingUploadFile && <p className="flow-loading-name">{pendingUploadFile.name}</p>}</div></div>}
        {workspaceMode === 'extraction-review' && resumeData && <ResumeExtractionReview resumeData={resumeData} uploadedFileName={uploadedFileName} parseMetadata={parseMetadata} onContinue={() => setWorkspaceMode('template-selection')} onStartOver={resetWorkspace} />}
        {workspaceMode === 'template-selection' && <ResumeTemplateSelector templates={resumeTemplates} editorStyle={resumeStyle} presentation={resumePresentation} useGlobalTextColor={useGlobalTextColor} footerText={footerText} selectedTemplateId={selectedTemplateId} onSelect={chooseTemplate} onBack={() => uploadedFileName ? setWorkspaceMode('extraction-review') : resetWorkspace()} isImported={Boolean(uploadedFileName)} />}
        {workspaceMode === 'error' && <div className="flow-error" role="alert"><span className="flow-error-icon" aria-hidden="true">!</span><h3>We could not import that resume.</h3><p>{workspaceError}</p><div className="state-actions"><button className="secondary-button" onClick={resetWorkspace}>Start over</button><button className="primary-button" onClick={() => uploadInputRef.current?.click()}>Try another file</button></div></div>}
        {isEditorPage && <TemplateComponent resumeData={resumeData} editorRef={editorReady} editorStyle={resumeStyle} useGlobalTextColor={useGlobalTextColor} footerText={footerText} onManualEdit={handleManualResumeEdit} onElementSelect={setSelectedResumeElement} presentation={editorPresentation} onProfilePhotoClick={() => profilePhotoInputRef.current?.click()} blankPreview={isScratchResume} />}
      </section>
      {isEditorPage && <div className="right-rail">
        {!isScratchResume && <aside className="analysis-panel panel">
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
        </aside>}
        <div className="editor-tools-rail">
          {isScratchResume ? <ResumeBuilderForm
            template={selectedTemplate}
            resumeData={resumeData}
            onChange={handleBuilderResumeUpdate}
            fonts={resumeFonts}
            fontFamily={activeFontFamily}
            photo={resumePresentation.photo}
            onPhotoChange={updateProfilePhoto}
            photoError={profilePhotoError}
            onFontChange={family => {
              setFontFamily(family)
              setResumePresentation(current => ({ ...current, fontFamily: family }))
            }}
          /> : <>
          {assistantEditor}
          <aside className="panel section-panel editor-font-panel">
            <span className="eyebrow">TYPE</span>
            <h2>Resume font</h2>
            <p className="muted">Choose a clear, professional typeface. It updates the full resume and stays with this draft.</p>
            <label className="editor-font-label" htmlFor="resume-font-family">Font family</label>
            <select id="resume-font-family" className="editor-font-select" value={activeFontFamily} onChange={event => {
              const nextFamily = event.target.value
              setFontFamily(nextFamily)
              setResumePresentation(current => ({ ...current, fontFamily: nextFamily }))
            }}>
              {[...new Set(resumeFonts.map(font => font.category))].map(category => <optgroup label={category} key={category}>
                {resumeFonts.filter(font => font.category === category).map(font => <option value={font.family} key={font.name}>{font.name}</option>)}
              </optgroup>)}
            </select>
            <p className="editor-font-preview" style={{ fontFamily: activeFontFamily }}>Aa — Clear type keeps your experience easy to scan.</p>
          </aside>
          <ProfilePhotoControls photo={resumePresentation.photo} onChange={updateProfilePhoto} error={profilePhotoError} />
          </>}
        </div>
      </div>}
    </div>
    {isEditorPage && <section className="lower-grid workspace-lower-grid"><div className="panel section-panel evidence-panel"><div className="evidence-panel-heading"><div><span className="eyebrow">EVIDENCE SOURCES</span><h2>Verify the work behind the words.</h2><p className="muted">Connect GitHub or import a LinkedIn profile to surface credible proof for skills, experience, and education.</p></div><button className="primary-button compare-evidence-button" type="button" disabled={!hasConnectedEvidenceSource} onClick={compareEvidence}>Compare</button></div><div className="sources">
      <div className="source"><div className="source-identity"><SourceIcon name="GitHub" /><span><b>GitHub</b><small className={githubConnectionError ? 'source-error' : ''}>{githubConnection.loading ? 'Checking connection…' : githubConnection.connected ? `Connected as @${githubConnection.githubLogin || 'GitHub user'}` : githubConnection.message || githubConnectionError || 'Available to connect'}</small></span></div><button className="text-button" disabled={githubConnection.loading || githubConnecting || githubConnection.connected} onClick={startGitHubConnection}>{githubConnecting ? 'Connecting…' : githubConnection.connected ? 'Connected' : 'Connect'}</button></div>
      <div className="source linkedin-source"><div className="source-identity"><SourceIcon name="LinkedIn" /><span><b>LinkedIn</b><small>{hasLinkedInProfile ? `Info acquired · ${linkedinEvidenceSkills.length} skills, ${linkedinProfile.resumeData.experience.length} roles, ${linkedinProfile.resumeData.education.length} education entries` : 'Upload your LinkedIn PDF or DOCX export'}</small></span></div><button className="text-button" type="button" onClick={openLinkedInImport}>{hasLinkedInProfile ? 'Replace file' : 'Upload profile'}</button></div>
    </div>{githubConnectionNotice && <p className="source-notice" role="status">{githubConnectionNotice}</p>}{linkedinImportNotice && <p className="source-notice" role="status">{linkedinImportNotice}</p>}{githubCompareError && <p className="source-error" role="alert">{githubCompareError}</p>}</div></section>}
    {deleteConfirmOpen && <div className="linkedin-import-backdrop delete-draft-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDeleteConfirmOpen(false) }}>
      <section className="linkedin-import-dialog delete-draft-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-draft-title" aria-describedby="delete-draft-description">
        <span className="delete-draft-warning"><Icon name="trash" size={15} /> Draft deletion</span>
        <h2 id="delete-draft-title">Delete this draft?</h2>
        <p id="delete-draft-description">Your resume and its edits will be removed. This action cannot be undone.</p>
        <div className="linkedin-import-actions"><button className="secondary-button" type="button" onClick={() => setDeleteConfirmOpen(false)}>Keep draft</button><button className="delete-confirm-button" type="button" onClick={confirmDeleteDraft}>Delete draft</button></div>
      </section>
    </div>}
    {linkedinImportOpen && <LinkedInImportDialog status={linkedinImportStatus} error={linkedinImportError} onClose={closeLinkedInImport} onChooseFile={() => linkedinUploadInputRef.current?.click()} />}
  </Shell>
}

function EvaluationPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [comparisonRequest] = useState(readQueuedEvidenceComparison)
  const [connection, setConnection] = useState({ loading: false, connected: false })
  const [githubAnalysis, setGithubAnalysis] = useState(null)
  const [linkedinAnalysis, setLinkedinAnalysis] = useState(null)
  const [githubLoading, setGithubLoading] = useState(false)
  const [linkedinLoading, setLinkedinLoading] = useState(false)
  const [githubError, setGithubError] = useState('')
  const [linkedinError, setLinkedinError] = useState('')
  const [activeStage, setActiveStage] = useState('')
  const comparisonStarted = useRef(false)
  const sources = comparisonRequest?.sources ?? {}
  const resumeData = comparisonRequest?.resumeData ?? null
  const linkedinProfile = sources.linkedin ? comparisonRequest?.linkedinProfile ?? null : null
  const jobDescription = sources.linkedin ? comparisonRequest?.jobDescription ?? '' : ''
  const resumeSkills = getResumeEvidenceSkills(resumeData)
  const linkedinSkills = getResumeEvidenceSkills(linkedinProfile?.resumeData)
  const requestedStages = [
    ...(sources.github ? [{ id: 'github', title: 'GitHub', detail: 'Repository evidence' }] : []),
    ...(sources.linkedin ? [{ id: 'linkedin', title: 'LinkedIn', detail: 'Profile and job fit' }] : [])
  ]

  const runComparison = useCallback(async () => {
    setGithubAnalysis(null)
    setLinkedinAnalysis(null)
    setGithubError('')
    setLinkedinError('')

    if (sources.github) {
      setActiveStage('github')
      setGithubLoading(true)
      if (!currentUser || !resumeData || !resumeSkills.length) {
        setGithubError('Return to the workspace with a resume that has extracted skills before comparing GitHub evidence.')
      } else {
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
          setGithubAnalysis(payload.analysis)
        } catch (requestError) {
          setGithubError(requestError instanceof TypeError
            ? 'GitHub evidence service is not running. Start the app with npm run dev:all.'
            : requestError.message || 'Could not analyse GitHub evidence.')
        }
      }
      setGithubLoading(false)
    }

    if (sources.linkedin) {
      setActiveStage('linkedin')
      setLinkedinLoading(true)
      if (!linkedinProfile?.resumeData || !resumeData || !resumeSkills.length) {
        setLinkedinError('Return to the workspace with both an extracted resume and a LinkedIn profile before comparing.')
      } else {
        const profileComparison = buildLinkedInResumeComparison(resumeData, linkedinProfile.resumeData)
        if (!jobDescription.trim()) setLinkedinAnalysis(profileComparison)
        else try {
          const response = await fetch('/api/resume/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeData, jobDescription, evidenceScope: 'linkedin-profile' })
          })
          const payload = await response.json().catch(() => null)
          if (!response.ok || !payload?.ok || !payload.analysis) throw new Error(payload?.error || 'The role analysis service is temporarily unavailable.')
          setLinkedinAnalysis({ ...profileComparison, ...payload.analysis, profileOverlap: profileComparison.profileOverlap, profileOnlySkills: profileComparison.profileOnlySkills, resumeOnlySkills: profileComparison.resumeOnlySkills, profileOverlapScore: profileComparison.profileOverlapScore, analysisMethod: payload.analysisMethod || 'ai' })
        } catch {
          setLinkedinAnalysis({ ...profileComparison, ...buildSkillAwareRoleAnalysis(resumeData, jobDescription), profileOverlap: profileComparison.profileOverlap, profileOnlySkills: profileComparison.profileOnlySkills, resumeOnlySkills: profileComparison.resumeOnlySkills, profileOverlapScore: profileComparison.profileOverlapScore, analysisMethod: 'browser-fallback' })
        }
      }
      setLinkedinLoading(false)
    }
    setActiveStage('complete')
  }, [currentUser, jobDescription, linkedinProfile, resumeData, resumeSkills.length, sources.github, sources.linkedin])

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search)
    if (parameters.get('compare') !== 'evidence' || comparisonStarted.current) return
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
      <div className="panel section-panel"><h2>Comparison scope</h2><div className="readiness"><strong>{sources.linkedin ? linkedinSkills.length : resumeSkills.length || '—'}</strong><span>{sources.linkedin ? `LinkedIn is being compared with the extracted resume${jobDescription.trim() ? ' and the selected job description' : ' only'}${sources.github ? ' after GitHub repository evidence.' : '.'}` : resumeSkills.length ? `Extracted resume skills queued for GitHub verification${connection.connected ? ` with @${connection.githubLogin || 'GitHub'}` : ''}.` : 'Use Compare from the workspace to bring evidence here.'}</span></div></div>
      <div className="panel section-panel"><h2>What we assess</h2><ul>{sources.github && <li>Skills supported by accessible repositories, languages, and project files</li>}{sources.linkedin && <li>LinkedIn skills, work history, education, and certifications against the resume{jobDescription.trim() ? ' and JD compatibility' : ''}</li>}{!requestedStages.length && <li>Return to the workspace and select at least one evidence source.</li>}</ul></div>
    </section>
    <section className="panel section-panel comparison-journey" aria-label="Comparison progress"><span className="eyebrow">COMPARISON JOURNEY</span><h2>We review every connected source in order.</h2><div className="comparison-journey-steps">{requestedStages.map((stage, index) => {
      const isLoading = stage.id === 'github' ? githubLoading : linkedinLoading
      const hasError = stage.id === 'github' ? Boolean(githubError) : Boolean(linkedinError)
      const isDone = stage.id === 'github' ? Boolean(githubAnalysis) : Boolean(linkedinAnalysis)
      return <div className={`comparison-journey-step ${activeStage === stage.id && isLoading ? 'is-active' : ''} ${isDone ? 'is-complete' : ''} ${hasError ? 'has-error' : ''}`} key={stage.id}><span>{isDone ? '✓' : index + 1}</span><div><strong>{stage.title}</strong><small>{hasError ? 'Needs attention' : isLoading ? 'Comparing now…' : isDone ? 'Comparison complete' : stage.detail}</small></div></div>
    })}</div>{!requestedStages.length && <p className="source-error">No comparison was queued. Return to the workspace and choose Compare.</p>}</section>
    {sources.github && <GitHubEvidenceReview analysis={githubAnalysis} isLoading={githubLoading} error={githubError} resumeSkills={resumeSkills} onRetry={runComparison} />}
    {sources.linkedin && <LinkedInEvidenceReview profile={linkedinProfile?.resumeData} resumeData={resumeData} hasJobDescription={Boolean(jobDescription.trim())} analysis={linkedinAnalysis} isLoading={linkedinLoading} error={linkedinError} onRetry={runComparison} />}
  </Shell>
}

function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/workspace/*" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
    <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
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
