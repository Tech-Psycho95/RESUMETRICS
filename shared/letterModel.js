// Cover letter model (PLAN-033). Pure and shared: the editor, the NIMBUS validator and the exporters all
// read the same shape. Header facts (name, contact, photo) stay on the resume; the letter holds the rest.
import { stripMarks } from '../src/editor/inlineMarks.js'

export const MAX_PARAGRAPHS = 6
export const MAX_PARAGRAPH_CHARS = 1400
export const BLOCK_LABELS = { opening: 'Opening', proof: 'Proof', fit: 'Fit', closing: 'Closing', body: 'Paragraph' }
// Shown only in the editor while a paragraph is empty (never printed). From the ResumeWay guide.
export const GHOST_HINTS = {
  opening: 'Name the role, where you found it, and your strongest qualification.',
  proof: 'Pick one or two results from your resume that match what the job asks for.',
  fit: 'Say why this company, in one specific sentence.',
  closing: 'Thank them and ask for a conversation.',
  body: 'Add a point that supports your application.'
}
export const SIGNOFFS = ['Sincerely,', 'Yours sincerely,', 'Yours faithfully,', 'Best regards,', 'Kind regards,', 'Respectfully,']
export const PAPER_OPTIONS = [
  { id: 'template', label: 'Template', color: null },
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'warm', label: 'Warm', color: '#f5f2ea' },
  { id: 'stone', label: 'Stone', color: '#e9e9e7' }
]
export const LETTER_FIELDS = ['role', 'date', 'recipientName', 'recipientTitle', 'company', 'address', 'subject', 'salutation', 'signoff']
export const HEADER_FIELDS = ['fullName', 'headline', 'email', 'phone', 'location']

const defaultKinds = count => count <= 1 ? ['opening'] : count === 2 ? ['opening', 'closing'] : count === 3 ? ['opening', 'proof', 'closing']
  : ['opening', 'proof', 'fit', ...Array(Math.max(0, count - 4)).fill('body'), 'closing']

let idCounter = 0
export const newParagraphId = () => `p${Date.now().toString(36)}${(idCounter++).toString(36)}`

export function createLetter(seed = {}) {
  return {
    version: 1,
    role: '',
    date: '',
    dateAuto: true,
    recipient: { name: '', title: '', company: '', address: [] },
    subject: '',
    showSubject: false,
    salutation: '',
    paragraphs: defaultKinds(4).map((kind, index) => ({ id: `p${index + 1}`, kind, text: '' })),
    signoff: '',
    signature: null,
    showPhoto: true,
    presentation: { fontFamily: null, baseSize: null, textColor: null, accentColor: null, paper: 'template', elementOverrides: {} },
    ...seed
  }
}

const clean = value => String(value ?? '').trim()
export const countWords = text => (stripMarks(text).match(/[\p{L}\p{N}][\p{L}\p{N}'’.%$+-]*/gu) ?? []).length
export const letterWordCount = letter => letter.paragraphs.reduce((total, paragraph) => total + countWords(paragraph.text), 0)

/** Today's date as people write it on a letter ("October 6, 2026"). */
export const formatLetterDate = (now = new Date(), locale = undefined) => now.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
export const dateOf = (letter, now = new Date(), locale = undefined) => letter.dateAuto || !clean(letter.date) ? formatLetterDate(now, locale) : letter.date

export const roleOf = (letter, resumeData) => clean(letter.role) || clean(resumeData?.headline)
export const salutationOf = letter => clean(letter.salutation) || (clean(letter.recipient?.name) ? `Dear ${clean(letter.recipient.name)},` : 'Dear Hiring Manager,')
// The article's rule: "sincerely" for a named person, "faithfully" for a generic greeting.
export const signoffOf = letter => clean(letter.signoff) || (clean(letter.recipient?.name) ? 'Yours sincerely,' : 'Yours faithfully,')
export const addressLines = letter => (letter.recipient?.address ?? []).map(clean).filter(Boolean)
export const isLetterEmpty = letter => letter.paragraphs.every(paragraph => !clean(paragraph.text))

/** Read model for the format panel and NIMBUS: every editable value reachable by its dotted path. */
export function letterReadModel(letter, resumeData, now = new Date()) {
  return {
    ...resumeData,
    headline: roleOf(letter, resumeData),
    letter: {
      role: roleOf(letter, resumeData),
      date: dateOf(letter, now),
      subject: letter.subject,
      salutation: salutationOf(letter),
      signoff: signoffOf(letter),
      recipient: { name: letter.recipient.name, title: letter.recipient.title, company: letter.recipient.company, address: addressLines(letter) },
      paragraph: Object.fromEntries(letter.paragraphs.map(paragraph => [paragraph.id, paragraph.text]))
    }
  }
}

const setRecipient = (letter, key, value) => ({ ...letter, recipient: { ...letter.recipient, [key]: value } })

/** Apply an inline or panel edit addressed by element path (`letter.paragraph.p1`, `letter.recipient.name`…). */
export function applyLetterEdit(letter, path, value) {
  const parts = String(path).split('.')
  if (parts[0] !== 'letter') return letter
  const text = typeof value === 'string' ? value : String(value ?? '')
  const [, group, key, index] = parts
  if (group === 'role') return { ...letter, role: text }
  if (group === 'date') return { ...letter, date: text, dateAuto: !clean(text) }
  if (group === 'subject') return { ...letter, subject: text, showSubject: letter.showSubject || Boolean(clean(text)) }
  if (group === 'salutation') return { ...letter, salutation: text }
  if (group === 'signoff') return { ...letter, signoff: text }
  if (group === 'recipient' && ['name', 'title', 'company'].includes(key) && index === undefined) return setRecipient(letter, key, text)
  if (group === 'recipient' && key === 'address') {
    const lines = [...(letter.recipient.address ?? [])]
    if (index === undefined) return setRecipient(letter, 'address', text.split(/\r?\n/).map(line => line.trim()).filter(Boolean))
    // The page shows only non-blank lines, so its index maps onto the n-th non-blank line here.
    const real = lines.map((line, position) => clean(line) ? position : -1).filter(position => position >= 0)
    lines[real[Number(index)] ?? lines.length] = text
    return setRecipient(letter, 'address', lines)
  }
  if (group === 'paragraph') {
    const id = parts.slice(2).join('.')
    return { ...letter, paragraphs: letter.paragraphs.map(paragraph => paragraph.id === id ? { ...paragraph, text } : paragraph) }
  }
  return letter
}

const fieldPath = { role: 'letter.role', date: 'letter.date', subject: 'letter.subject', salutation: 'letter.salutation', signoff: 'letter.signoff', recipientName: 'letter.recipient.name', recipientTitle: 'letter.recipient.title', company: 'letter.recipient.company', address: 'letter.recipient.address' }

function reassignKinds(paragraphs) {
  // Keep the structure honest after inserts and removals: first is the opening, last the closing.
  const kinds = defaultKinds(paragraphs.length)
  return paragraphs.map((paragraph, index) => ({ ...paragraph, kind: kinds[index] }))
}

export function insertParagraph(letter, index, text = '', kind) {
  if (letter.paragraphs.length >= MAX_PARAGRAPHS) return letter
  const at = Math.max(0, Math.min(letter.paragraphs.length, Number.isInteger(index) ? index : letter.paragraphs.length))
  const next = [...letter.paragraphs]
  next.splice(at, 0, { id: newParagraphId(), kind: kind || 'body', text })
  return { ...letter, paragraphs: reassignKinds(next) }
}

export function removeParagraph(letter, index) {
  if (letter.paragraphs.length <= 1 || !letter.paragraphs[index]) return letter
  return { ...letter, paragraphs: reassignKinds(letter.paragraphs.filter((_, position) => position !== index)) }
}

export function moveParagraph(letter, from, to) {
  const count = letter.paragraphs.length
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= count || to >= count || from === to) return letter
  const next = [...letter.paragraphs]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return { ...letter, paragraphs: reassignKinds(next) }
}

export function replaceParagraphs(letter, values) {
  const texts = values.slice(0, MAX_PARAGRAPHS)
  const kinds = defaultKinds(texts.length)
  return { ...letter, paragraphs: texts.map((text, index) => ({ id: letter.paragraphs[index]?.id ?? newParagraphId(), kind: kinds[index], text })) }
}

/**
 * Apply validated NIMBUS letter operations. Returns { letter, resumeData, changed }.
 * `set_field` edits the shared header facts (they print on the letter), so it returns a new resume too.
 */
export function applyLetterOperations(state, operations) {
  let letter = state.letter
  let resumeData = state.resumeData
  for (const operation of operations) {
    if (operation.type === 'set_letter_field') {
      if (operation.target === 'address') letter = applyLetterEdit(letter, fieldPath.address, Array.isArray(operation.value) ? operation.value.join('\n') : String(operation.value))
      else if (fieldPath[operation.target]) letter = applyLetterEdit(letter, fieldPath[operation.target], operation.value)
    } else if (operation.type === 'clear_letter_field') {
      if (operation.target === 'date') letter = { ...letter, date: '', dateAuto: true }
      else if (operation.target === 'subject') letter = { ...letter, subject: '', showSubject: false }
      else if (fieldPath[operation.target]) letter = applyLetterEdit(letter, fieldPath[operation.target], '')
    } else if (operation.type === 'set_paragraph') {
      const paragraph = letter.paragraphs[operation.index]
      if (paragraph) letter = applyLetterEdit(letter, `letter.paragraph.${paragraph.id}`, operation.text)
    } else if (operation.type === 'insert_paragraph') {
      letter = insertParagraph(letter, operation.index, operation.text, operation.kind)
    } else if (operation.type === 'remove_paragraph') {
      letter = removeParagraph(letter, operation.index)
    } else if (operation.type === 'move_paragraph') {
      letter = moveParagraph(letter, operation.from, operation.to)
    } else if (operation.type === 'replace_paragraphs') {
      letter = replaceParagraphs(letter, operation.values)
    } else if (operation.type === 'set_field' && HEADER_FIELDS.includes(operation.target)) {
      resumeData = { ...resumeData, [operation.target]: operation.value }
    }
  }
  return { letter, resumeData, changed: letter !== state.letter || resumeData !== state.resumeData }
}

/** Fill the recipient and subject from a job (title, company) without overwriting what the user typed. */
export function letterFromJob(letter, job = {}) {
  const title = clean(job.title)
  const company = clean(job.company)
  let next = letter
  if (company && !clean(next.recipient.company)) next = setRecipient(next, 'company', company)
  if (title && !clean(next.role)) next = { ...next, role: title }
  if (title && !clean(next.subject)) next = { ...next, subject: `Application for ${title}`, showSubject: next.showSubject }
  return next
}

/** Plain text of the letter, for TXT/DOCX export and the NIMBUS context. */
export function letterToText(letter, resumeData, now = new Date()) {
  const contact = [resumeData?.email, resumeData?.phone, resumeData?.location].map(clean).filter(Boolean).join(' | ')
  const recipient = [letter.recipient.name, letter.recipient.title, letter.recipient.company, ...addressLines(letter)].map(clean).filter(Boolean)
  return [
    [clean(resumeData?.fullName), roleOf(letter, resumeData), contact].filter(Boolean).join('\n'),
    dateOf(letter, now),
    recipient.join('\n'),
    letter.showSubject && clean(letter.subject) ? `Re: ${clean(letter.subject)}` : '',
    salutationOf(letter),
    ...letter.paragraphs.map(paragraph => stripMarks(paragraph.text).trim()).filter(Boolean),
    `${signoffOf(letter)}\n${clean(resumeData?.fullName)}`
  ].filter(Boolean).join('\n\n')
}
