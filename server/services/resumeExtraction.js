import { extractStructuredResumeData } from './resumeAI.js'
import { extractResumeDataFallback } from './resumeFallback.js'
import { createEmptyResumeData, normalizeResumeData } from './resumeData.js'

export const MAX_DOCUMENT_CHARACTERS = 900_000
export const MAX_EXTRACTION_CHUNK_CHARACTERS = 12_000

const basicFields = ['fullName', 'headline', 'email', 'phone', 'location', 'summary']

const asString = value => typeof value === 'string' ? value : ''
const cleanText = value => asString(value)
  .replace(/\u0000/g, '')
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{4,}/g, '\n\n\n')
  .trim()
const uniqueStrings = values => [...new Map(values.filter(value => typeof value === 'string' && value.trim()).map(value => [value.trim().toLocaleLowerCase(), value.trim()])).values()]
const asPositiveInteger = value => Number.isInteger(value) && value > 0 ? value : null
const fieldHasValue = value => Array.isArray(value) ? value.length > 0 : Boolean(value)

function pageNumberFor(page, index) {
  return asPositiveInteger(page?.pageNumber) ?? index + 1
}

function normalizePages(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((page, index) => ({ pageNumber: pageNumberFor(page, index), text: cleanText(page?.text) }))
    .sort((left, right) => left.pageNumber - right.pageNumber)
}

export function normalizeResumeDocument(value) {
  const source = value && typeof value === 'object' ? value : {}
  const metadata = source.metadata && typeof source.metadata === 'object' ? source.metadata : {}
  const suppliedPages = normalizePages(source.pages)
  const suppliedText = cleanText(source.rawText ?? source.resumeText)
  const pages = suppliedPages.length ? suppliedPages : suppliedText ? [{ pageNumber: 1, text: suppliedText }] : []
  const rawText = cleanText(pages.map(page => page.text).join('\n\n'))
  const unreadablePages = pages.filter(page => !page.text).map(page => page.pageNumber)
  const warnings = uniqueStrings([
    ...(Array.isArray(metadata.warnings) ? metadata.warnings : []),
    ...(unreadablePages.length ? [`No readable source text was available on page${unreadablePages.length === 1 ? '' : 's'} ${unreadablePages.join(', ')}.`] : [])
  ])
  const errors = uniqueStrings(Array.isArray(metadata.errors) ? metadata.errors : [])

  return {
    rawText,
    pages,
    metadata: {
      fileName: cleanText(metadata.fileName),
      fileType: cleanText(metadata.fileType) || 'txt',
      totalPages: (asPositiveInteger(metadata.totalPages) ?? pages.length) || null,
      pagesProcessed: asPositiveInteger(metadata.pagesProcessed) ?? pages.length,
      rawCharCount: rawText.length,
      normalizedCharCount: rawText.length,
      extractedSections: [],
      warnings,
      errors,
      isCompleteParse: metadata.isCompleteParse !== false && unreadablePages.length === 0 && errors.length === 0
    }
  }
}

function edgeLineKey(value) {
  const line = cleanText(value).toLocaleLowerCase()
  return line && line.length <= 120 ? line : ''
}

function repeatedPageChrome(pages) {
  const headerCounts = new Map()
  const footerCounts = new Map()
  for (const page of pages) {
    const lines = page.text.split('\n').map(line => line.trim()).filter(Boolean)
    const header = edgeLineKey(lines[0])
    const footer = edgeLineKey(lines.at(-1))
    if (header) headerCounts.set(header, (headerCounts.get(header) ?? 0) + 1)
    if (footer) footerCounts.set(footer, (footerCounts.get(footer) ?? 0) + 1)
  }
  return {
    headers: new Set([...headerCounts].filter(([, count]) => count >= 2).map(([line]) => line)),
    footers: new Set([...footerCounts].filter(([, count]) => count >= 2).map(([line]) => line))
  }
}

function removeRepeatedPageChrome(page, chrome) {
  const lines = page.text.split('\n').map(line => line.trim()).filter(Boolean)
  if (chrome.headers.has(edgeLineKey(lines[0]))) lines.shift()
  if (chrome.footers.has(edgeLineKey(lines.at(-1)))) lines.pop()
  return cleanText(lines.join('\n'))
}

function splitOversizedText(text, maxCharacters) {
  const chunks = []
  let remaining = cleanText(text)
  while (remaining.length > maxCharacters) {
    const minimumBreakpoint = Math.floor(maxCharacters * 0.55)
    const candidates = [
      remaining.lastIndexOf('\n', maxCharacters),
      remaining.lastIndexOf('. ', maxCharacters) + 1,
      remaining.lastIndexOf('; ', maxCharacters) + 1,
      remaining.lastIndexOf(' ', maxCharacters)
    ]
    const breakpoint = candidates.find(value => value >= minimumBreakpoint) ?? maxCharacters
    chunks.push(remaining.slice(0, breakpoint).trim())
    remaining = remaining.slice(breakpoint).trim()
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

function chunkPageText(text, maxCharacters) {
  const paragraphs = cleanText(text).split(/\n{2,}/).map(paragraph => paragraph.trim()).filter(Boolean)
  const chunks = []
  let current = ''

  const pushCurrent = () => {
    if (current) chunks.push(current)
    current = ''
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxCharacters) {
      pushCurrent()
      chunks.push(...splitOversizedText(paragraph, maxCharacters))
      continue
    }
    const next = current ? `${current}\n\n${paragraph}` : paragraph
    if (next.length > maxCharacters) {
      pushCurrent()
      current = paragraph
    } else current = next
  }
  pushCurrent()
  return chunks
}

export function buildResumeExtractionChunks(document, maxCharacters = MAX_EXTRACTION_CHUNK_CHARACTERS) {
  const chrome = repeatedPageChrome(document.pages)
  const chunks = []
  for (const page of document.pages) {
    const text = removeRepeatedPageChrome(page, chrome)
    for (const chunkText of chunkPageText(text, maxCharacters)) {
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        pageNumbers: [page.pageNumber],
        text: chunkText
      })
    }
  }
  return chunks
}

function mergeLinks(existing, incoming) {
  const links = [...existing, ...incoming]
  const seen = new Set()
  return links.filter(link => {
    const key = `${link.url.toLocaleLowerCase()}|${link.label.toLocaleLowerCase()}`
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function mergeExperience(existing, incoming) {
  const source = normalizeResumeData({ experience: incoming }).experience
  for (const entry of source) {
    const match = existing.find(item => [item.role, item.company, item.startDate, item.endDate].map(value => value.toLocaleLowerCase()).join('|') === [entry.role, entry.company, entry.startDate, entry.endDate].map(value => value.toLocaleLowerCase()).join('|'))
    if (!match) {
      existing.push(entry)
      continue
    }
    match.location ||= entry.location
    match.bullets = uniqueStrings([...match.bullets, ...entry.bullets])
  }
}

function mergeProjects(existing, incoming) {
  const source = normalizeResumeData({ projects: incoming }).projects
  for (const entry of source) {
    const match = existing.find(item => item.name && item.name.toLocaleLowerCase() === entry.name.toLocaleLowerCase())
    if (!match) {
      existing.push(entry)
      continue
    }
    if (entry.description.length > match.description.length) match.description = entry.description
    match.techStack = uniqueStrings([...match.techStack, ...entry.techStack])
    match.bullets = uniqueStrings([...match.bullets, ...entry.bullets])
    match.links = uniqueStrings([...match.links, ...entry.links])
  }
}

function mergeEducation(existing, incoming) {
  const source = normalizeResumeData({ education: incoming }).education
  for (const entry of source) {
    const match = existing.find(item => `${item.degree}|${item.institution}`.toLocaleLowerCase() === `${entry.degree}|${entry.institution}`.toLocaleLowerCase())
    if (!match) {
      existing.push(entry)
      continue
    }
    match.location ||= entry.location
    match.startDate ||= entry.startDate
    match.endDate ||= entry.endDate
    match.details = uniqueStrings([...match.details, ...entry.details])
  }
}

function missingFieldsFor(resumeData) {
  return [
    ['fullName', resumeData.fullName],
    ['email', resumeData.email],
    ['summary', resumeData.summary],
    ['experience', resumeData.experience],
    ['projects', resumeData.projects],
    ['education', resumeData.education],
    ['certifications', resumeData.certifications],
    ['achievements', resumeData.achievements]
  ].filter(([, value]) => !fieldHasValue(value)).map(([field]) => field)
}

export function getExtractedSections(resumeData) {
  return [
    ['contact', resumeData.fullName || resumeData.email || resumeData.phone || resumeData.location || resumeData.links.length],
    ['summary', resumeData.summary],
    ['experience', resumeData.experience],
    ['projects', resumeData.projects],
    ['education', resumeData.education],
    ['skills', Object.values(resumeData.skills).flat()],
    ['certifications', resumeData.certifications],
    ['achievements', resumeData.achievements]
  ].filter(([, value]) => fieldHasValue(value)).map(([section]) => section)
}

export function mergePartialResumeData(partials) {
  const merged = createEmptyResumeData()
  for (const partial of partials) {
    const data = normalizeResumeData(partial)
    for (const field of basicFields) {
      if (data[field] && (!merged[field] || data[field].length > merged[field].length)) merged[field] = data[field]
    }
    merged.links = mergeLinks(merged.links, data.links)
    for (const category of Object.keys(merged.skills)) merged.skills[category] = uniqueStrings([...merged.skills[category], ...data.skills[category]])
    mergeExperience(merged.experience, data.experience)
    mergeProjects(merged.projects, data.projects)
    mergeEducation(merged.education, data.education)
    merged.certifications = uniqueStrings([...merged.certifications, ...data.certifications])
    merged.achievements = uniqueStrings([...merged.achievements, ...data.achievements])
    merged.confidenceNotes = uniqueStrings([...merged.confidenceNotes, ...data.confidenceNotes])
  }
  merged.missingFields = missingFieldsFor(merged)
  return normalizeResumeData(merged)
}

function hasStructuredContent(resumeData) {
  return getExtractedSections(resumeData).length > 0
}

function createMetadata(document, { chunks, successfulChunks, failedChunks, extractionMethod, extraWarnings = [] }) {
  const successfulPages = new Set(successfulChunks.flatMap(chunk => chunk.pageNumbers))
  const failedPages = uniqueStrings([
    ...failedChunks.flatMap(chunk => chunk.pageNumbers.map(pageNumber => String(pageNumber))),
    ...document.pages.filter(page => !page.text).map(page => String(page.pageNumber))
  ]).map(Number).filter(Number.isFinite)
  const warnings = uniqueStrings([
    ...document.metadata.warnings,
    ...extraWarnings,
    ...(failedChunks.length ? [`Could not parse page${failedPages.length === 1 ? '' : 's'} ${failedPages.join(', ')} completely.`] : []),
    ...(document.pages.length > 1 && ![...successfulPages].some(pageNumber => pageNumber > 1) ? ['Later pages did not contribute readable content. The document is incomplete.'] : []),
    ...(extractionMethod !== 'ai' ? ['AI extraction was unavailable; only a limited source fallback is shown.'] : [])
  ])
  const isCompleteParse = document.metadata.isCompleteParse && failedChunks.length === 0 && successfulPages.size === document.pages.length && extractionMethod === 'ai'

  return {
    ...document.metadata,
    pagesProcessed: successfulPages.size,
    rawCharCount: document.rawText.length,
    normalizedCharCount: cleanText(document.rawText).length,
    extractedSections: [],
    warnings,
    errors: uniqueStrings([...document.metadata.errors, ...failedChunks.map(chunk => chunk.error).filter(Boolean)]),
    failedPages,
    chunkCount: chunks.length,
    chunksProcessed: successfulChunks.length,
    isCompleteParse
  }
}

export async function extractCompleteResumeDocument(sourceDocument) {
  const document = normalizeResumeDocument(sourceDocument)
  if (!document.rawText) throw new Error('The document does not contain readable text.')
  if (document.rawText.length > MAX_DOCUMENT_CHARACTERS) throw new Error(`This document contains more than ${MAX_DOCUMENT_CHARACTERS.toLocaleString()} readable characters. Split it into smaller files and try again.`)

  const chunks = buildResumeExtractionChunks(document)
  if (!chunks.length) throw new Error('No readable document sections were available for extraction.')

  const successfulChunks = []
  const failedChunks = []
  const partials = []
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]
    try {
      const resumeData = await extractStructuredResumeData(chunk.text, {
        chunkIndex: index + 1,
        chunkCount: chunks.length,
        pageNumbers: chunk.pageNumbers
      })
      if (!hasStructuredContent(resumeData)) throw new Error(`Chunk ${index + 1} did not return structured resume details.`)
      successfulChunks.push(chunk)
      partials.push(resumeData)
    } catch (error) {
      failedChunks.push({ ...chunk, error: 'AI parsing failed for this document chunk.', cause: error })
    }
  }

  if (!partials.length) {
    throw failedChunks[0]?.cause ?? new Error('The AI could not extract resume details from this document.')
  }

  const resumeData = mergePartialResumeData(partials)
  const metadata = createMetadata(document, { chunks, successfulChunks, failedChunks, extractionMethod: 'ai' })
  metadata.extractedSections = getExtractedSections(resumeData)
  return { resumeData, metadata, extractionMethod: failedChunks.length ? 'ai-partial' : 'ai' }
}

export function extractSourceFallbackDocument(sourceDocument) {
  const document = normalizeResumeDocument(sourceDocument)
  const resumeData = extractResumeDataFallback(document.rawText)
  const chunks = buildResumeExtractionChunks(document)
  const metadata = createMetadata(document, {
    chunks,
    successfulChunks: [],
    failedChunks: [],
    extractionMethod: 'source-fallback',
    extraWarnings: ['Full AI parsing did not complete, so this draft must be reviewed before use.']
  })
  metadata.extractedSections = getExtractedSections(resumeData)
  return { resumeData, metadata, extractionMethod: 'source-fallback' }
}
