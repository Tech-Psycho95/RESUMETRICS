// NIMBUS v2 turn contract, validated on the server (and re-checked on the client before applying).
// A turn is one of: edit (ordered steps of operations), options (visual choices), question, conversation, refuse.
import { validateResumeEditPlan } from './resumeEditPlan.js'
import { describeInventedFacts, findInventedFacts } from './factGuard.js'

export class NimbusPlanError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NimbusPlanError'
  }
}

export const MODES = ['edit', 'options', 'question', 'conversation', 'refuse']
export const CONTENT_OPERATIONS = new Set(['set_field', 'clear_field', 'set_item_field', 'append_bullets', 'replace_bullets', 'append_details', 'replace_details', 'append_skills', 'replace_skills', 'append_list', 'replace_list', 'set_link', 'append_link', 'replace_links', 'set_footer', 'clear_footer'])
export const STYLE_OPERATIONS = new Set(['set_element_style', 'apply_marks', 'set_resume_style', 'set_accent', 'reset_style', 'fit_one_page'])
// Named groups the client resolves to element ids on the page (see src/nimbus/elementGroups.js).
export const ELEMENT_GROUPS = ['name', 'headline', 'contact', 'headings', 'summary', 'job-titles', 'companies', 'dates', 'bullets', 'skills', 'education-degrees', 'project-names']
export const STYLE_PROPERTIES = ['fontId', 'fontWeight', 'fontStyle', 'textDecoration', 'color', 'textAlign', 'lineHeight', 'letterSpacing']
export const MIN_READABLE_BASE_SIZE = 12 // px on an A4 page = 9pt
export const MAX_STEPS = 8

const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : null
const text = (value, field, max = 600, allowEmpty = false) => {
  if (typeof value !== 'string') throw new NimbusPlanError(`${field} must be text.`)
  const cleaned = value.trim()
  if (!allowEmpty && !cleaned) throw new NimbusPlanError(`${field} cannot be empty.`)
  if (cleaned.length > max) throw new NimbusPlanError(`${field} is too long.`)
  return cleaned
}
const isHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim())
const luminance = hex => {
  const channel = value => { const c = value / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const [r, g, b] = [1, 3, 5].map(index => channel(parseInt(hex.slice(index, index + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrastOnWhite = hex => 1.05 / (luminance(hex) + 0.05)

function textValuesOf(operation) {
  const values = []
  if (typeof operation.value === 'string') values.push(operation.value)
  if (Array.isArray(operation.values)) values.push(...operation.values.filter(item => typeof item === 'string'))
  if (operation.value && typeof operation.value === 'object') values.push(operation.value.url ?? '', operation.value.label ?? '')
  if (Array.isArray(operation.values)) operation.values.forEach(item => { if (item && typeof item === 'object') values.push(item.url ?? '', item.label ?? '') })
  return values.filter(Boolean)
}

function validateStyleChanges(changes, { fontIds, headingLike }) {
  const input = asObject(changes)
  if (!input) throw new NimbusPlanError('changes must be an object.')
  const output = {}
  for (const [key, value] of Object.entries(input)) {
    if (!STYLE_PROPERTIES.includes(key)) throw new NimbusPlanError(`Unsupported style property ${key}. Font size is whole-resume only (set_resume_style.baseSize).`)
    if (value === null) { output[key] = null; continue }
    if (key === 'fontId' && !fontIds.has(value)) throw new NimbusPlanError(`Unknown fontId ${value}; use an id from the font catalogue.`)
    if (key === 'fontWeight' && ![300, 400, 500, 600, 700, 800].includes(value)) throw new NimbusPlanError('fontWeight must be 300–800 in steps of 100.')
    if (key === 'fontStyle' && !['normal', 'italic'].includes(value)) throw new NimbusPlanError('fontStyle must be normal or italic.')
    if (key === 'textDecoration' && !['none', 'underline', 'line-through', 'underline line-through'].includes(value)) throw new NimbusPlanError('Invalid textDecoration.')
    if (key === 'textAlign' && !['left', 'center', 'right', 'justify'].includes(value)) throw new NimbusPlanError('Invalid textAlign.')
    if (key === 'lineHeight' && !(Number.isFinite(value) && value >= 0.9 && value <= 2.5)) throw new NimbusPlanError('lineHeight must be between 0.9 and 2.5.')
    if (key === 'letterSpacing' && !(Number.isFinite(value) && value >= -1 && value <= 4)) throw new NimbusPlanError('letterSpacing must be between -1 and 4 px.')
    if (key === 'color') {
      if (!isHex(value)) throw new NimbusPlanError('color must be #rrggbb.')
      const needed = headingLike ? 3 : 4.5
      if (contrastOnWhite(value) < needed) throw new NimbusPlanError(`Colour ${value} is too light to read (contrast ${contrastOnWhite(value).toFixed(1)}:1, needs ${needed}:1).`)
    }
    output[key] = value
  }
  if (!Object.keys(output).length) throw new NimbusPlanError('changes cannot be empty.')
  return output
}

function validateOperation(operation, context) {
  const op = asObject(operation)
  if (!op || typeof op.type !== 'string') throw new NimbusPlanError('Every operation needs a type.')
  if (context.contentOnly && !CONTENT_OPERATIONS.has(op.type)) throw new NimbusPlanError(`${op.type} changes design; NIMBUS only edits content. Answer in conversation mode and point the user to the Format panel.`)
  if (CONTENT_OPERATIONS.has(op.type)) {
    const [clean] = validateResumeEditPlan({ status: 'ready', message: 'step', operations: [op] }, context.resumeData).operations
    const invented = textValuesOf(clean).flatMap(value => findInventedFacts(value, context.sourceText))
    if (invented.length) throw new NimbusPlanError(`This change adds ${describeInventedFacts(invented)}, which is not in the resume or the request. Only reword existing facts or ask the user.`)
    return clean
  }
  if (op.type === 'set_element_style') {
    const target = text(op.target, 'target', 200)
    const isGroup = target.startsWith('group:')
    if (isGroup && !ELEMENT_GROUPS.includes(target.slice(6))) throw new NimbusPlanError(`Unknown element group ${target}.`)
    if (!isGroup && !context.elementIds.has(target)) throw new NimbusPlanError(`Element ${target} is not on the resume.`)
    const headingLike = /heading|name|headline|job-titles|project-names|education-degrees/.test(target)
    return { type: op.type, target, changes: validateStyleChanges(op.changes, { fontIds: context.fontIds, headingLike }) }
  }
  if (op.type === 'apply_marks') {
    const path = text(op.path, 'path', 200)
    const value = String(path).split('.').reduce((current, key) => current?.[/^\d+$/.test(key) ? Number(key) : key], context.resumeData)
    if (typeof value !== 'string') throw new NimbusPlanError(`apply_marks path ${path} must point to a text field.`)
    const phrase = text(op.text, 'text', 300)
    if (!value.replace(/\[\/?[bius]\]/g, '').includes(phrase)) throw new NimbusPlanError(`"${phrase}" does not appear in ${path}.`)
    if (!['b', 'i', 'u', 's'].includes(op.mark)) throw new NimbusPlanError('mark must be b, i, u or s.')
    return { type: op.type, path, text: phrase, mark: op.mark }
  }
  if (op.type === 'set_resume_style') {
    const output = {}
    if (op.fontId != null) { if (!context.fontIds.has(op.fontId) || !context.bodyFontIds.has(op.fontId)) throw new NimbusPlanError(`fontId ${op.fontId} is not a body font in the catalogue.`); output.fontId = op.fontId }
    if (op.baseSize != null) {
      if (!Number.isFinite(op.baseSize) || op.baseSize > 18) throw new NimbusPlanError('baseSize must be a number up to 18 (px; 13.33px = 10pt).')
      if (op.baseSize < MIN_READABLE_BASE_SIZE) throw new NimbusPlanError(`baseSize below ${MIN_READABLE_BASE_SIZE}px is too small to read; keep it at or above that and tell the user.`)
      output.baseSize = Math.round(op.baseSize * 2) / 2
    }
    if (op.textColor != null) {
      if (!isHex(op.textColor) || contrastOnWhite(op.textColor) < 4.5) throw new NimbusPlanError('textColor must be a dark #rrggbb with at least 4.5:1 contrast.')
      output.textColor = op.textColor
    }
    if (op.lineHeight != null) { if (!(op.lineHeight >= 0.9 && op.lineHeight <= 2.5)) throw new NimbusPlanError('lineHeight must be between 0.9 and 2.5.'); output.lineHeight = op.lineHeight }
    if (op.letterSpacing != null) { if (!(op.letterSpacing >= -1 && op.letterSpacing <= 4)) throw new NimbusPlanError('letterSpacing must be between -1 and 4.'); output.letterSpacing = op.letterSpacing }
    if (!Object.keys(output).length) throw new NimbusPlanError('set_resume_style needs at least one change.')
    return { type: op.type, ...output }
  }
  if (op.type === 'set_accent') {
    if (!isHex(op.hex) || contrastOnWhite(op.hex) < 3) throw new NimbusPlanError('Accent must be #rrggbb with at least 3:1 contrast on white.')
    return { type: op.type, hex: op.hex }
  }
  if (op.type === 'reset_style') {
    const scope = op.scope === 'element' ? 'element' : 'all'
    if (scope === 'element' && !context.elementIds.has(op.target) && !String(op.target ?? '').startsWith('group:')) throw new NimbusPlanError('reset_style element target is not on the resume.')
    return scope === 'element' ? { type: op.type, scope, target: op.target } : { type: op.type, scope }
  }
  if (op.type === 'fit_one_page') return { type: op.type }
  throw new NimbusPlanError(`Unsupported operation ${op.type}.`)
}

function validateOptions(options, context) {
  const input = asObject(options)
  if (!input) throw new NimbusPlanError('options must be an object.')
  const kind = input.kind
  if (!['font', 'colour', 'palette'].includes(kind)) throw new NimbusPlanError('options.kind must be font, colour or palette.')
  const target = text(input.target ?? 'resume', 'options.target', 120)
  const choices = Array.isArray(input.choices) ? input.choices : []
  if (choices.length < 3 || choices.length > 6) throw new NimbusPlanError('Give between 3 and 6 choices.')
  const cleanChoices = choices.map((choice, index) => {
    const item = asObject(choice)
    if (!item) throw new NimbusPlanError(`choices[${index}] must be an object.`)
    const why = text(item.why ?? '', `choices[${index}].why`, 160, true)
    if (kind === 'font') {
      if (!context.fontIds.has(item.fontId)) throw new NimbusPlanError(`choices[${index}].fontId ${item.fontId} is not in the font catalogue.`)
      if (target === 'resume' && !context.bodyFontIds.has(item.fontId)) throw new NimbusPlanError(`${item.fontId} is a display font; offer body fonts for the whole resume.`)
      if (item.fontId === context.currentFontId) throw new NimbusPlanError('Do not offer the font that is already in use.')
      return { fontId: item.fontId, why }
    }
    if (kind === 'colour') {
      if (!isHex(item.hex)) throw new NimbusPlanError(`choices[${index}].hex must be #rrggbb.`)
      const needed = /text|body|resume/.test(target) ? 4.5 : 3
      if (contrastOnWhite(item.hex) < needed) throw new NimbusPlanError(`choices[${index}] ${item.hex} is too light for ${target}.`)
      return { hex: item.hex.toLowerCase(), name: text(item.name ?? item.hex, `choices[${index}].name`, 40), why }
    }
    for (const key of ['heading', 'accent', 'text']) if (!isHex(item[key])) throw new NimbusPlanError(`choices[${index}].${key} must be #rrggbb.`)
    if (contrastOnWhite(item.text) < 4.5 || contrastOnWhite(item.heading) < 3 || contrastOnWhite(item.accent) < 3) throw new NimbusPlanError(`choices[${index}] has a colour that is too light.`)
    return { heading: item.heading, accent: item.accent, text: item.text, name: text(item.name ?? 'Palette', `choices[${index}].name`, 40), why }
  })
  const keys = cleanChoices.map(choice => choice.fontId ?? choice.hex ?? `${choice.heading}${choice.accent}${choice.text}`)
  if (new Set(keys).size !== keys.length) throw new NimbusPlanError('Choices must all be different.')
  return { kind, target, prompt: text(input.prompt ?? 'Pick one to apply.', 'options.prompt', 200), choices: cleanChoices }
}

/**
 * context: { resumeData, sourceText, elementIds:Set, fontIds:Set, bodyFontIds:Set, currentFontId }
 */
export function validateNimbusTurn(value, context) {
  const turn = asObject(value)
  if (!turn || !MODES.includes(turn.mode)) throw new NimbusPlanError(`mode must be one of ${MODES.join(', ')}.`)
  const message = text(turn.message ?? '', 'message', 900, turn.mode === 'edit')
  if (turn.mode === 'edit') {
    const steps = Array.isArray(turn.steps) ? turn.steps : []
    if (!steps.length || steps.length > MAX_STEPS) throw new NimbusPlanError(`An edit needs 1–${MAX_STEPS} steps.`)
    return {
      mode: 'edit',
      message,
      steps: steps.map((step, index) => {
        const item = asObject(step)
        if (!item) throw new NimbusPlanError(`steps[${index}] must be an object.`)
        const operations = Array.isArray(item.operations) ? item.operations : []
        if (!operations.length || operations.length > 20) throw new NimbusPlanError(`steps[${index}] needs 1–20 operations.`)
        return { title: text(item.title, `steps[${index}].title`, 120), operations: operations.map(operation => validateOperation(operation, context)) }
      })
    }
  }
  if (turn.mode === 'options') {
    if (context.contentOnly) throw new NimbusPlanError('Design options are not offered; use conversation mode and point to the Format panel.')
    return { mode: 'options', message, options: validateOptions(turn.options, context) }
  }
  if (turn.mode === 'question') {
    const question = asObject(turn.question) ?? {}
    const quickReplies = Array.isArray(question.quickReplies) ? question.quickReplies.filter(item => typeof item === 'string' && item.trim()).slice(0, 4).map(item => item.trim().slice(0, 60)) : []
    return { mode: 'question', message, question: { text: text(question.text ?? message, 'question.text', 400), quickReplies } }
  }
  if (!message) throw new NimbusPlanError('message cannot be empty.')
  return { mode: turn.mode, message }
}

/** Validate one operation outside a turn (JD fixes reuse NIMBUS operations). */
export const validateNimbusOperation = validateOperation
