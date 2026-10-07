// NIMBUS letter turns (PLAN-033). Same modes as the resume turn contract (shared/nimbusPlan.js), content only,
// with letter operations. Validated on the server and re-checked on the client before applying.
import { NimbusPlanError, MAX_STEPS, validateNimbusOperation } from './nimbusPlan.js'
import { describeInventedFacts, findInventedFacts } from './factGuard.js'
import { draftProblems } from './letterLint.js'
import { HEADER_FIELDS, LETTER_FIELDS, MAX_PARAGRAPHS, MAX_PARAGRAPH_CHARS } from './letterModel.js'

export const LETTER_MODES = ['edit', 'question', 'conversation', 'refuse']
export const LETTER_OPERATIONS = new Set(['set_letter_field', 'clear_letter_field', 'set_paragraph', 'insert_paragraph', 'remove_paragraph', 'replace_paragraphs', 'move_paragraph', 'set_field'])
// Names, titles and companies are facts: they must come from the resume, the job post, the letter or the user's words.
const SOURCED_FIELDS = new Set(['role', 'recipientName', 'recipientTitle', 'company', 'address'])
const FIELD_LIMITS = { role: 80, date: 40, recipientName: 80, recipientTitle: 80, company: 80, address: 240, subject: 140, salutation: 100, signoff: 40 }

const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : null
const text = (value, field, max, allowEmpty = false) => {
  if (typeof value !== 'string') throw new NimbusPlanError(`${field} must be text.`)
  const cleaned = value.trim()
  if (!allowEmpty && !cleaned) throw new NimbusPlanError(`${field} cannot be empty.`)
  if (cleaned.length > max) throw new NimbusPlanError(`${field} is too long (max ${max} characters).`)
  return cleaned
}
const index = (value, field, max) => {
  if (!Number.isInteger(value) || value < 0 || value >= max) throw new NimbusPlanError(`${field} must be a whole number from 0 to ${Math.max(0, max - 1)}.`)
  return value
}
const unfoldMarks = value => String(value).replace(/\[\/?[bius]\]/g, '')

// Soft-skill words ("teamwork", "communication") are everyday prose in a letter, not claims the guard should block.
// Likewise words that are also ordinary English ("express my interest", "the next step", "excel at") are not skill claims in prose.
const SOFT_SKILLS = new Set(['teamwork', 'communication', 'leadership', 'problem solving', 'stakeholder management', 'next.js', 'express.js', 'cursor', 'excel', 'ruby', 'testing', 'go', 'agile', 'ui/ux', 'responsive design', 'cloud platforms', 'accessibility'])

function checkFacts(values, context, label) {
  const invented = values.flatMap(value => findInventedFacts(value, context.sourceText)).filter(fact => !(fact.kind === 'skill' && SOFT_SKILLS.has(String(fact.value).toLowerCase())))
  if (invented.length) throw new NimbusPlanError(`${label} adds ${describeInventedFacts(invented)}, which is not in the resume, the job post or the request. Only reword known facts or ask the user.`)
}

function checkProblems(texts, context, { replaceAll = false } = {}) {
  const problems = draftProblems({ paragraphs: texts, resumeData: context.resumeData, replaceAll })
  if (problems.length) throw new NimbusPlanError(problems.join(' '))
}

function validateLetterOperation(operation, context) {
  const op = asObject(operation)
  if (!op || typeof op.type !== 'string') throw new NimbusPlanError('Every operation needs a type.')
  if (!LETTER_OPERATIONS.has(op.type)) throw new NimbusPlanError(`${op.type} is not a letter operation. Letter operations: ${[...LETTER_OPERATIONS].join(', ')}. Fonts, colours and layout are changed in the Format panel.`)
  const count = context.letter.paragraphs.length
  if (op.type === 'set_field') {
    if (!HEADER_FIELDS.includes(op.target)) throw new NimbusPlanError(`set_field on a letter only changes ${HEADER_FIELDS.join(', ')}.`)
    return validateNimbusOperation(op, { resumeData: context.resumeData, sourceText: context.sourceText, contentOnly: true, elementIds: new Set(), fontIds: new Set(), bodyFontIds: new Set() })
  }
  if (op.type === 'set_letter_field' || op.type === 'clear_letter_field') {
    if (!LETTER_FIELDS.includes(op.target)) throw new NimbusPlanError(`target must be one of ${LETTER_FIELDS.join(', ')}.`)
    if (op.type === 'clear_letter_field') return { type: op.type, target: op.target }
    const raw = Array.isArray(op.value) ? op.value.join('\n') : op.value
    const value = text(raw, 'value', FIELD_LIMITS[op.target])
    if (SOURCED_FIELDS.has(op.target)) {
      const lines = op.target === 'address' ? value.split(/\r?\n/) : [value]
      const missing = lines.map(line => line.trim()).filter(Boolean).find(line => !context.sourceText.includes(line.toLowerCase().replace(/\s+/g, ' ')))
      if (missing) throw new NimbusPlanError(`“${missing}” is not in the resume, the job post or the request. Ask the user instead of guessing a ${op.target}.`)
    } else {
      checkFacts([value], context, op.target)
    }
    return { type: op.type, target: op.target, value: op.target === 'address' ? value.split(/\r?\n/).map(line => line.trim()).filter(Boolean).join('\n') : value }
  }
  if (op.type === 'set_paragraph') {
    const at = index(op.index, 'index', count)
    const value = text(op.text, 'text', MAX_PARAGRAPH_CHARS)
    checkFacts([unfoldMarks(value)], context, 'This paragraph')
    checkProblems([value], context)
    return { type: op.type, index: at, text: value }
  }
  if (op.type === 'insert_paragraph') {
    if (count >= MAX_PARAGRAPHS) throw new NimbusPlanError(`A letter can have at most ${MAX_PARAGRAPHS} paragraphs.`)
    const at = Number.isInteger(op.index) ? Math.max(0, Math.min(count, op.index)) : count
    const value = text(op.text, 'text', MAX_PARAGRAPH_CHARS)
    checkFacts([unfoldMarks(value)], context, 'This paragraph')
    checkProblems([value], context)
    return { type: op.type, index: at, kind: ['opening', 'proof', 'fit', 'closing', 'body'].includes(op.kind) ? op.kind : 'body', text: value }
  }
  if (op.type === 'remove_paragraph') {
    if (count <= 1) throw new NimbusPlanError('A letter needs at least one paragraph.')
    return { type: op.type, index: index(op.index, 'index', count) }
  }
  if (op.type === 'move_paragraph') return { type: op.type, from: index(op.from, 'from', count), to: index(op.to, 'to', count) }
  // replace_paragraphs
  const values = Array.isArray(op.values) ? op.values : []
  if (!values.length || values.length > MAX_PARAGRAPHS) throw new NimbusPlanError(`replace_paragraphs needs 1–${MAX_PARAGRAPHS} paragraphs.`)
  const cleaned = values.map((value, position) => text(value, `values[${position}]`, MAX_PARAGRAPH_CHARS))
  checkFacts(cleaned.map(unfoldMarks), context, 'This letter')
  checkProblems(cleaned, context, { replaceAll: true })
  return { type: op.type, values: cleaned }
}

/**
 * context: { letter, resumeData, sourceText } — sourceText from sourceTextOf(resume, job, user messages, letter fields).
 */
export function validateLetterTurn(value, context) {
  const turn = asObject(value)
  if (!turn || !LETTER_MODES.includes(turn.mode)) throw new NimbusPlanError(`mode must be one of ${LETTER_MODES.join(', ')}.`)
  const message = text(turn.message ?? '', 'message', 900, turn.mode === 'edit')
  if (turn.mode === 'edit') {
    // Flat form for one-step edits: {mode, message, title, operations}. Small models get the nesting wrong less often this way.
    const steps = Array.isArray(turn.steps) ? turn.steps : Array.isArray(turn.operations) ? [{ title: typeof turn.title === 'string' && turn.title.trim() ? turn.title : 'Edit your letter', operations: turn.operations }] : []
    if (!steps.length || steps.length > MAX_STEPS) throw new NimbusPlanError(`An edit needs 1–${MAX_STEPS} steps.`)
    // Each step sees the letter as earlier steps leave it, so paragraph indexes stay honest.
    let simulated = context.letter
    return {
      mode: 'edit',
      message,
      steps: steps.map((step, position) => {
        const item = asObject(step)
        if (!item) throw new NimbusPlanError(`steps[${position}] must be an object.`)
        const operations = Array.isArray(item.operations) ? item.operations : []
        if (!operations.length || operations.length > 12) throw new NimbusPlanError(`steps[${position}] needs 1–12 operations.`)
        const clean = operations.map(operation => {
          const result = validateLetterOperation(operation, { ...context, letter: simulated })
          simulated = context.simulate ? context.simulate(simulated, result) : simulated
          return result
        })
        return { title: text(item.title, `steps[${position}].title`, 120), operations: clean }
      })
    }
  }
  if (turn.mode === 'question') {
    const question = asObject(turn.question) ?? {}
    const quickReplies = Array.isArray(question.quickReplies) ? question.quickReplies.filter(item => typeof item === 'string' && item.trim()).slice(0, 4).map(item => item.trim().slice(0, 60)) : []
    return { mode: 'question', message, question: { text: text(question.text ?? message, 'question.text', 400), quickReplies } }
  }
  if (!message) throw new NimbusPlanError('message cannot be empty.')
  return { mode: turn.mode, message }
}

export const validateLetterOperationOnly = validateLetterOperation
