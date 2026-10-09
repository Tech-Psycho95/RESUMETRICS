// Deterministic checks for a cover letter, taken from the ResumeWay guide's pre-submission list.
// Used by the Letter guide in the editor and by the NIMBUS server to reject weak drafts.
import { stripMarks } from '../src/editor/inlineMarks.js'
import { countWords } from './letterModel.js'

export const WORD_RANGE = { min: 150, ideal: [250, 400], max: 450 }

const GENERIC_OPENERS = [
  /^\s*to whom it may concern/i,
  /^\s*i am writing (to|in regard|in response|with reference)/i,
  /^\s*i would like to (apply|express)/i,
  /^\s*i am (writing )?(to )?(apply|submit|express)/i,
  /^\s*my name is\b/i,
  /^\s*(please accept|enclosed (is|please find)|attached (is|please find))/i,
  /^\s*i am (a|an) .{0,60} (looking|seeking) for\b/i
]
const HOLLOW_PHRASES = /\b(i really need this job|hard[- ]working|team player|go-getter|think outside the box|self[- ]starter|results[- ]driven|passionate about everything)\b/i
const CALL_TO_ACTION = /\b(discuss|conversation|interview|speak with|talk (with|about)|meet (with|you)|hear from you|look forward|follow up|opportunity to (discuss|meet|speak|talk))\b/i
const MEASURE = /(\d[\d,.]*\s?(%|x|k|m|\+|percent|users|clients|customers|people|students|hours|days|weeks|months|years)\b)|([$€£₹]\s?\d)|(\b\d{2,}\b)/i
const STOP = new Set('a an and are as at be by for from has have in into is it its of on or that the their this to was were with we you your our i my me not but also can will would'.split(' '))

export const isGenericOpener = text => GENERIC_OPENERS.some(pattern => pattern.test(stripMarks(text)))

const words = text => stripMarks(text).toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(word => !STOP.has(word)) ?? []
const sentences = text => stripMarks(text).split(/(?<=[.!?])\s+|\n+/).map(item => item.trim()).filter(Boolean)

/** Resume sentences worth comparing: bullets, summary and project/role descriptions of 8+ words. */
export function resumeSentences(resumeData = {}) {
  const parts = [resumeData.summary, ...(resumeData.experience ?? []).flatMap(item => [item.description, ...(item.bullets ?? [])]), ...(resumeData.projects ?? []).flatMap(item => [item.description, ...(item.bullets ?? [])]), ...(resumeData.education ?? []).flatMap(item => item.details ?? [])]
  return parts.filter(value => typeof value === 'string').flatMap(sentences).filter(sentence => words(sentence).length >= 6)
}

/**
 * Resume sentences that the letter repeats: one letter sentence holds most of the resume sentence's words AND adds
 * little of its own. Citing a result with new context ("…which gave agents answers sooner") is what a letter should do.
 */
export function copiedFromResume(text, resumeSentenceList) {
  const letterSentences = sentences(text).map(sentence => words(sentence))
  const copied = []
  for (const source of resumeSentenceList) {
    const needed = words(source)
    if (needed.length < 6) continue
    const wanted = new Set(needed)
    const repeats = letterSentences.some(letterWords => {
      if (!letterWords.length) return false
      const shared = letterWords.filter(word => wanted.has(word)).length
      return needed.filter(word => letterWords.includes(word)).length / needed.length >= 0.75 && shared / letterWords.length >= 0.7
    })
    if (repeats) copied.push(source)
  }
  return copied
}

const includes = (text, phrase) => Boolean(phrase) && stripMarks(text).toLowerCase().includes(String(phrase).trim().toLowerCase())

/**
 * input: { paragraphs: [{ kind, text }], recipient: { name, company }, role, company, resumeData }
 * Returns { checks: [{ id, label, status: 'pass'|'fail'|'unknown', detail, fix }], passed, total }.
 * `fix` is the sentence the Letter guide sends to NIMBUS when the user presses the button.
 */
export function lintLetter({ paragraphs = [], recipient = {}, role = '', company = '', resumeData = {} }) {
  const filled = paragraphs.filter(paragraph => stripMarks(paragraph.text).trim())
  const all = filled.map(paragraph => stripMarks(paragraph.text)).join('\n')
  const opening = filled[0]?.text ?? ''
  const rest = filled.slice(1).map(paragraph => paragraph.text).join('\n')
  const closing = filled.at(-1)?.text ?? ''
  const fit = filled.filter(paragraph => paragraph.kind === 'fit').map(paragraph => paragraph.text).join(' ')
  const total = filled.reduce((sum, paragraph) => sum + countWords(paragraph.text), 0)
  const companyName = String(company || recipient.company || '').trim()
  const roleName = String(role || '').trim()
  const copied = copiedFromResume(all, resumeSentences(resumeData))
  const status = (known, pass) => known ? (pass ? 'pass' : 'fail') : 'unknown'
  const hasText = filled.length > 0

  const checks = [
    { id: 'role', label: 'Names the role you want', status: !roleName ? 'unknown' : status(true, hasText && includes(all, roleName)), detail: roleName ? `Mention “${roleName}” in your opening.` : 'Add the job title in Details.', fix: `Name the ${roleName || 'role'} in my opening paragraph.` },
    { id: 'company', label: 'Names the company', status: !companyName ? 'unknown' : status(true, hasText && includes(all, companyName)), detail: companyName ? `Mention ${companyName} by name.` : 'Add the company in Details.', fix: `Mention ${companyName || 'the company'} by name in the letter.` },
    { id: 'person', label: 'Addressed to a person', status: status(true, Boolean(String(recipient.name ?? '').trim())), detail: 'Find the hiring manager’s name, or keep “Dear Hiring Manager,”.', fix: '' },
    { id: 'opening', label: 'Opens with something specific', status: !hasText ? 'fail' : status(true, !isGenericOpener(opening) && countWords(opening) >= 15), detail: 'Skip “I am writing to apply…”. Say the role and your strongest qualification.', fix: 'Rewrite my opening so it names the role and my strongest qualification, without a generic opener.' },
    { id: 'result', label: 'Includes a measurable result', status: !hasText ? 'fail' : status(true, MEASURE.test(rest)), detail: 'Add one result with a number from your resume.', fix: 'Add one measurable result from my resume to the proof paragraph.' },
    { id: 'why', label: 'Says why this company', status: !hasText ? 'fail' : status(true, countWords(fit) >= 12 || (Boolean(companyName) && includes(rest, companyName) && filled.length > 2)), detail: 'One specific sentence on why you chose them.', fix: `Add a short paragraph on why I want to work at ${companyName || 'this company'}.` },
    { id: 'action', label: 'Ends with a call to action', status: !hasText ? 'fail' : status(true, CALL_TO_ACTION.test(stripMarks(closing))), detail: 'Thank them and ask for a conversation.', fix: 'Rewrite my closing paragraph to thank them and ask for a conversation.' },
    { id: 'length', label: 'Fits one page (150–450 words)', status: !hasText ? 'fail' : status(true, total >= WORD_RANGE.min && total <= WORD_RANGE.max), detail: `${total} words. Aim for 250–400.`, fix: total > WORD_RANGE.max ? 'Shorten the letter to about 350 words.' : 'Expand the letter to about 300 words using details from my resume.' },
    { id: 'original', label: 'Adds to your resume, not repeats it', status: !hasText ? 'unknown' : status(true, copied.length === 0 && !HOLLOW_PHRASES.test(all)), detail: copied.length ? 'Some sentences repeat your resume. Say why they matter for this job.' : 'Drop hollow phrases like “team player”.', fix: 'Reword sentences that repeat my resume so they explain why the result matters for this job.' }
  ]
  const counted = checks.filter(check => check.status !== 'unknown')
  return { checks, passed: counted.filter(check => check.status === 'pass').length, total: counted.length, words: total }
}

/** Reasons to reject a drafted paragraph list before it reaches the editor. Empty array = fine. */
export function draftProblems({ paragraphs = [], resumeData = {}, replaceAll = false }) {
  const problems = []
  const texts = paragraphs.map(item => (typeof item === 'string' ? item : item.text)).filter(Boolean)
  if (replaceAll && texts[0] && isGenericOpener(texts[0])) problems.push('The opening is a generic opener. Start with the role and one specific qualification.')
  const total = texts.reduce((sum, text) => sum + countWords(text), 0)
  if (replaceAll && total > WORD_RANGE.max) problems.push(`The letter is ${total} words; keep it under ${WORD_RANGE.max} so it fits one page.`)
  const copied = copiedFromResume(texts.join('\n'), resumeSentences(resumeData))
  if (copied.length) problems.push(`These sentences repeat the resume instead of adding to it: ${copied.slice(0, 2).map(item => `“${item.slice(0, 70)}”`).join(', ')}. Reword them around the job.`)
  if (HOLLOW_PHRASES.test(texts.join(' '))) problems.push('Remove hollow phrases such as “team player” or “hard-working”.')
  return problems
}
