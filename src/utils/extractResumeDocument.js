import mammoth from 'mammoth/mammoth.browser.js'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MIN_READABLE_PDF_CHARACTERS = 24

function cleanExtractedText(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function createMetadata({ file, fileType, pages, warnings = [], errors = [] }) {
  const rawText = pages.map(page => page.text).join('\n\n')
  const unreadablePages = pages.filter(page => !page.text.trim()).map(page => page.pageNumber)
  const allWarnings = [
    ...warnings,
    ...(unreadablePages.length ? [`No selectable text was found on page${unreadablePages.length === 1 ? '' : 's'} ${unreadablePages.join(', ')}. OCR may be required for those pages.`] : [])
  ]

  return {
    fileName: file.name,
    fileType,
    totalPages: pages.length || null,
    pagesProcessed: pages.length,
    rawCharCount: rawText.length,
    normalizedCharCount: cleanExtractedText(rawText).length,
    extractedSections: [],
    warnings: allWarnings,
    errors,
    isCompleteParse: unreadablePages.length === 0 && errors.length === 0
  }
}

function pageTextFromPdfItems(items) {
  const lines = []
  let line = ''

  for (const item of items) {
    if (typeof item.str !== 'string' || !item.str) continue
    const value = item.str.replace(/\u0000/g, '')
    if (!value) continue
    const needsSpace = line && !/[\s-]$/.test(line) && !/^[,.;:!?%\])}]/.test(value)
    line += `${needsSpace ? ' ' : ''}${value}`
    if (item.hasEOL) {
      lines.push(line)
      line = ''
    }
  }

  if (line) lines.push(line)
  return cleanExtractedText(lines.join('\n'))
}

async function extractPdfDocument(file) {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  try {
    const documentProxy = await loadingTask.promise
    const pages = []
    for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
      const page = await documentProxy.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push({ pageNumber, text: pageTextFromPdfItems(content.items) })
    }

    const rawText = pages.map(page => page.text).join('\n\n')
    if (cleanExtractedText(rawText).length < MIN_READABLE_PDF_CHARACTERS) {
      throw new Error('This PDF appears to be scanned or does not contain enough selectable text. Please upload a text-based PDF or use OCR first.')
    }

    return { rawText, pages, metadata: createMetadata({ file, fileType: 'pdf', pages }) }
  } catch (error) {
    if (error?.name === 'PasswordException') throw new Error('This PDF is password-protected. Please upload an unlocked copy.')
    throw error
  } finally {
    await loadingTask.destroy?.()
  }
}

function inlineText(element) {
  const text = element.textContent?.replace(/\s+/g, ' ').trim() || ''
  const urls = [...element.querySelectorAll?.('a[href]') ?? []]
    .map(link => link.getAttribute('href')?.trim())
    .filter(url => url && !text.includes(url))
  return [text, ...urls].filter(Boolean).join(' ')
}

function htmlToStructuredText(html) {
  const documentFragment = new DOMParser().parseFromString(html, 'text/html')
  const lines = []
  const append = value => {
    const cleaned = cleanExtractedText(value)
    if (cleaned) lines.push(cleaned)
  }
  const visit = element => {
    if (!(element instanceof Element)) return
    const tag = element.tagName.toLowerCase()
    if (tag === 'table') {
      for (const row of element.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr')) {
        const cells = [...row.querySelectorAll(':scope > th, :scope > td')].map(inlineText).filter(Boolean)
        if (cells.length) append(cells.join(' | '))
      }
      return
    }
    if (tag === 'li') {
      append(`• ${inlineText(element)}`)
      return
    }
    if (/^(p|h[1-6]|div|blockquote)$/.test(tag)) {
      const directChildBlocks = [...element.children].some(child => /^(p|h[1-6]|div|ul|ol|table|blockquote)$/.test(child.tagName.toLowerCase()))
      if (!directChildBlocks) append(inlineText(element))
      else [...element.children].forEach(visit)
      return
    }
    if (/^(ul|ol|section|article|main|body)$/.test(tag)) {
      [...element.children].forEach(visit)
    }
  }

  [...documentFragment.body.children].forEach(visit)
  return cleanExtractedText(lines.join('\n'))
}

async function extractDocxDocument(file) {
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
  const text = htmlToStructuredText(result.value)
  if (!text) throw new Error('This DOCX file does not contain readable text.')
  const warnings = result.messages
    .filter(message => message.type === 'warning')
    .map(message => message.message)
    .slice(0, 6)
  const pages = [{ pageNumber: 1, text }]
  return { rawText: text, pages, metadata: createMetadata({ file, fileType: 'docx', pages, warnings }) }
}

async function extractTextDocument(file) {
  const rawText = cleanExtractedText(await file.text())
  if (!rawText) throw new Error('This text file does not contain readable content.')
  const pages = rawText.split(/\f+/).map((text, index) => ({ pageNumber: index + 1, text: cleanExtractedText(text) }))
  return { rawText, pages, metadata: createMetadata({ file, fileType: 'txt', pages }) }
}

export async function extractResumeDocument(file) {
  const fileName = file.name.toLowerCase()
  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) return extractPdfDocument(file)
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) return extractDocxDocument(file)
  if (file.type === 'text/plain' || fileName.endsWith('.txt')) return extractTextDocument(file)
  throw new Error('Could not read this file. Try a text-based PDF, DOCX, or TXT file.')
}
