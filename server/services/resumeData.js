const skillCategories = ['languages', 'frameworks', 'tools', 'databases', 'softSkills', 'other']

// Human (spoken) languages. Programming languages belong in skills.languages; these belong in resumeData.languages.
const spokenLanguages = new Set([
  'afrikaans', 'albanian', 'amharic', 'arabic', 'armenian', 'assamese', 'azerbaijani', 'basque', 'belarusian', 'bengali', 'bangla', 'bosnian',
  'bulgarian', 'burmese', 'cantonese', 'catalan', 'chinese', 'croatian', 'czech', 'danish', 'dutch', 'english', 'estonian', 'farsi', 'filipino',
  'finnish', 'french', 'georgian', 'german', 'greek', 'gujarati', 'hausa', 'hebrew', 'hindi', 'hungarian', 'icelandic', 'igbo', 'indonesian',
  'irish', 'italian', 'japanese', 'kannada', 'kazakh', 'khmer', 'konkani', 'korean', 'kurdish', 'lao', 'latvian', 'lithuanian', 'macedonian',
  'maithili', 'malay', 'malayalam', 'maltese', 'mandarin', 'marathi', 'mongolian', 'nepali', 'norwegian', 'odia', 'oriya', 'pashto', 'persian',
  'polish', 'portuguese', 'punjabi', 'romanian', 'russian', 'sanskrit', 'serbian', 'sindhi', 'sinhala', 'slovak', 'slovenian', 'somali',
  'spanish', 'swahili', 'swedish', 'tagalog', 'tamil', 'telugu', 'thai', 'tibetan', 'turkish', 'ukrainian', 'urdu', 'uzbek', 'vietnamese',
  'welsh', 'xhosa', 'yoruba', 'zulu', 'sign language', 'american sign language', 'british sign language', 'indian sign language'
])

const asString = value => typeof value === 'string' ? value.trim() : ''
const asStringList = value => Array.isArray(value) ? value.map(asString).filter(Boolean) : []
const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const uniqueStrings = values => [...new Map(values.filter(Boolean).map(value => [value.toLocaleLowerCase(), value])).values()]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Only clear links: a scheme, "www.", or a domain followed by a path. Bare names such as "ASP.NET" or "Socket.IO" stay skills.
const urlPattern = /^(https?:\/\/|www\.)\S+$|^[a-z0-9-]+(\.[a-z0-9-]+)+\/\S*$/i

const isAddress = value => typeof value === 'string' && (/^(https?:|mailto:|tel:)/i.test(value.trim()) || /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]\S*)?$/i.test(value.trim()))

function isSpokenLanguage(value) {
  // Accept "English", "English (Fluent)", "Hindi - native", "Spanish: B2".
  const name = value.toLocaleLowerCase().split(/\s*[(\-–—:,]\s*/)[0].trim()
  return spokenLanguages.has(name)
}

// Known destinations are always labelled by the site the link leads to.
const knownLinkSites = [
  ['linkedin.', 'LinkedIn'], ['github.', 'GitHub'], ['gitlab.', 'GitLab'], ['bitbucket.', 'Bitbucket'],
  ['leetcode.', 'LeetCode'], ['hackerrank.', 'HackerRank'], ['codechef.', 'CodeChef'], ['codeforces.', 'Codeforces'], ['geeksforgeeks.', 'GeeksforGeeks'],
  ['kaggle.', 'Kaggle'], ['stackoverflow.', 'Stack Overflow'], ['medium.', 'Medium'], ['dev.to', 'DEV'], ['hashnode.', 'Hashnode'],
  ['behance.', 'Behance'], ['dribbble.', 'Dribbble'], ['figma.', 'Figma'], ['notion.', 'Notion'], ['youtube.', 'YouTube'], ['youtu.be', 'YouTube'],
  ['twitter.', 'X (Twitter)'], ['x.com', 'X (Twitter)'], ['instagram.', 'Instagram'], ['facebook.', 'Facebook'],
  ['scholar.google.', 'Google Scholar'], ['orcid.', 'ORCID'], ['researchgate.', 'ResearchGate'], ['credly.', 'Credly'], ['coursera.', 'Coursera'],
  ['udemy.', 'Udemy'], ['drive.google.', 'Google Drive'], ['docs.google.', 'Google Docs']
]
// Hosting services (*.vercel.app, *.netlify.app, *.github.io) are the person's own sites, so they keep
// the resume's wording such as "Portfolio" or fall back to the site's domain.

const hostForUrl = url => url.replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].toLocaleLowerCase()
export const linkKey = url => String(url ?? '').trim().toLocaleLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').replace(/[/?#]+$/, '')

const hostingSuffixes = ['github.io', 'vercel.app', 'netlify.app', 'pages.dev', 'web.app', 'firebaseapp.com', 'onrender.com', 'herokuapp.com']

export function siteNameForUrl(url) {
  const host = hostForUrl(url)
  if (hostingSuffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) return ''
  return knownLinkSites.find(([pattern]) => host === pattern || host.endsWith(`.${pattern}`) || host.includes(pattern))?.[1] ?? ''
}

function labelForUrl(url, currentLabel = '') {
  const siteName = siteNameForUrl(url)
  if (siteName) return siteName
  const label = currentLabel.trim()
  // A meaningful label from the document (for example "Portfolio") is kept; a bare URL is reduced to its domain.
  if (label && !urlPattern.test(label) && linkKey(label) !== linkKey(url)) return label
  return hostForUrl(url) || url
}

function normalizeCustomSections(value) {
  if (!Array.isArray(value)) return []
  const sections = new Map()
  for (const item of value.map(asObject)) {
    const title = asString(item.title)
    const content = asString(item.content) || asStringList(item.items).join('\n')
    if (!title || !content) continue
    const key = title.toLocaleLowerCase()
    const existing = sections.get(key)
    if (existing) existing.content = uniqueStrings([...existing.content.split('\n'), ...content.split('\n')]).join('\n')
    else sections.set(key, { title, content })
  }
  return [...sections.values()]
}

export function createEmptyResumeData() {
  return {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    links: [],
    summary: '',
    skills: Object.fromEntries(skillCategories.map(category => [category, []])),
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    achievements: [],
    languages: [],
    customSections: [],
    missingFields: [],
    confidenceNotes: []
  }
}

/**
 * Puts misfiled details where they belong so every resume ends up in one consistent shape,
 * whatever headings or layout the source document used.
 */
export function classifyResumeData(resumeData, { keepUnlinkedLabels = false } = {}) {
  const data = structuredClone(resumeData)
  const languages = [...data.languages]
  const links = [...data.links]
  const seenSkills = new Set()

  for (const category of skillCategories) {
    data.skills[category] = data.skills[category].filter(skill => {
      if (isSpokenLanguage(skill)) { languages.push(skill); return false }
      if (emailPattern.test(skill)) { data.email ||= skill; return false }
      if (urlPattern.test(skill)) { links.push({ label: '', url: skill }); return false }
      const key = skill.toLocaleLowerCase()
      if (seenSkills.has(key)) return false
      seenSkills.add(key)
      return true
    })
  }

  data.languages = uniqueStrings(languages)
  const seenLinks = new Set()
  data.links = links
    // The AI sometimes writes a word ("LinkedIn") as the address or swaps label and address.
    // Only a real address counts as one; a word becomes a label waiting for its embedded hyperlink.
    .map(link => {
      if (isAddress(link.url)) return link
      if (isAddress(link.label)) return { url: link.label, label: link.url }
      return { url: '', label: link.label || link.url }
    })
    .map(link => ({ ...link, url: link.url && !/^[a-z]+:/i.test(link.url) && /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]\S*)?$/i.test(link.url) ? `https://${link.url}` : link.url }))
    .map(link => ({ url: link.url, label: link.url ? labelForUrl(link.url, link.label) : link.label }))
    .filter(link => {
      const key = link.url ? linkKey(link.url) : `label:${link.label.toLocaleLowerCase()}`
      if (!key || seenLinks.has(key)) return false
      seenLinks.add(key)
      return true
    })
  if (!data.email) {
    const mailLink = data.links.find(link => /^mailto:/i.test(link.url) || emailPattern.test(link.url))
    if (mailLink) data.email = mailLink.url.replace(/^mailto:/i, '')
  }
  // A link without a destination (for example the bare word "Portfolio") cannot be opened, so it is dropped.
  // Label-only links are kept while merging so embedded hyperlinks can still fill in their destination.
  data.links = data.links.filter(link => (link.url || keepUnlinkedLabels) && !/^mailto:/i.test(link.url) && !emailPattern.test(link.url))
  return data
}

const matchKey = value => String(value ?? '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')

/**
 * Merges the real hyperlinks embedded in the uploaded file (PDF link annotations or DOCX links)
 * into the AI result. Visible resume text often shows only "GitHub" or a project name, so the
 * embedded URL is the only reliable source for where a link actually leads.
 */
export function attachDocumentLinks(resumeData, documentLinks = []) {
  const data = structuredClone(resumeData)
  for (const link of Array.isArray(documentLinks) ? documentLinks : []) {
    const url = asString(link?.url)
    const text = asString(link?.text)
    if (/^mailto:/i.test(url)) {
      const email = decodeURIComponent(url.replace(/^mailto:/i, '').split('?')[0])
      if (emailPattern.test(email)) data.email ||= email
      continue
    }
    if (/^tel:/i.test(url)) {
      data.phone ||= text || decodeURIComponent(url.replace(/^tel:/i, ''))
      continue
    }
    if (!/^https?:\/\//i.test(url)) continue

    const key = linkKey(url)
    const textKey = matchKey(text)
    const urlMatchKey = matchKey(url.replace(/^https?:\/\/[^/]+/i, ''))
    if (data.projects.some(project => project.links.some(existing => linkKey(existing) === key))) continue
    const project = data.projects.find(item => {
      const name = matchKey(item.name)
      return name.length >= 4 && ((textKey && (textKey === name || textKey.includes(name))) || urlMatchKey.includes(name))
    })
    if (project) {
      project.links.push(url)
      continue
    }

    const sameUrl = data.links.find(existing => existing.url && linkKey(existing.url) === key)
    if (sameUrl) {
      sameUrl.url = url
      continue
    }
    const siteKey = matchKey(siteNameForUrl(url))
    const labelOnly = data.links.find(existing => !existing.url && matchKey(existing.label) && (matchKey(existing.label) === textKey || (siteKey && matchKey(existing.label) === siteKey)))
    if (labelOnly) {
      labelOnly.url = url
      // Prefer the wording exactly as it appears in the document ("WCA Profile", not "wca profile").
      if (text && matchKey(text) === matchKey(labelOnly.label)) labelOnly.label = text
      continue
    }
    data.links.push({ label: text, url })
  }
  return data
}

export function normalizeResumeData(value) {
  const source = asObject(value)
  const skills = asObject(source.skills)

  return {
    fullName: asString(source.fullName),
    headline: asString(source.headline),
    email: asString(source.email),
    phone: asString(source.phone),
    location: asString(source.location),
    links: Array.isArray(source.links)
      ? source.links.map(link => typeof link === 'string' ? { label: '', url: link } : asObject(link)).map(link => ({ label: asString(link.label), url: asString(link.url) })).filter(link => link.label || link.url)
      : [],
    summary: asString(source.summary),
    skills: Object.fromEntries(skillCategories.map(category => [category, asStringList(skills[category])])),
    experience: Array.isArray(source.experience)
      ? source.experience.map(asObject).map(item => ({
        role: asString(item.role),
        company: asString(item.company),
        location: asString(item.location),
        startDate: asString(item.startDate),
        endDate: asString(item.endDate),
        bullets: asStringList(item.bullets)
      })).filter(item => item.role || item.company || item.bullets.length)
      : [],
    projects: Array.isArray(source.projects)
      ? source.projects.map(asObject).map(item => ({
        name: asString(item.name),
        techStack: asStringList(item.techStack),
        description: asString(item.description),
        bullets: asStringList(item.bullets),
        links: asStringList(item.links)
      })).filter(item => item.name || item.description || item.techStack.length || item.bullets.length || item.links.length)
      : [],
    education: Array.isArray(source.education)
      ? source.education.map(asObject).map(item => ({
        degree: asString(item.degree),
        institution: asString(item.institution),
        location: asString(item.location),
        startDate: asString(item.startDate),
        endDate: asString(item.endDate),
        details: asStringList(item.details)
      })).filter(item => item.degree || item.institution)
      : [],
    certifications: asStringList(source.certifications),
    achievements: asStringList(source.achievements),
    languages: asStringList(source.languages),
    customSections: normalizeCustomSections(source.customSections),
    missingFields: asStringList(source.missingFields),
    confidenceNotes: asStringList(source.confidenceNotes)
  }
}
