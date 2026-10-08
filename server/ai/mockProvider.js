// Offline stand-in for the AI provider: RESUMETRICS_AI_PROVIDER=mock (CI, end-to-end tests, working without a key).
// It recognises each task by its system prompt and answers from the request alone, reordering or reusing facts that
// are already there, so the real validators (operation schemas, fact guard, letter checks) still judge every answer.
// Never use it in production: the answers are canned.
import { extractResumeDataFallback } from '../services/resumeFallback.js'
import { knownSkillsIn } from '../../shared/roleAnalysis.js'

const SKILL_CATEGORIES = ['languages', 'frameworks', 'tools', 'databases', 'softSkills', 'other']

// The prompt builders write each data block as `LABEL:` followed by one line of JSON.
function jsonAfter(prompt, label) {
  const match = String(prompt).match(new RegExp(`${label}:\\s*\\n?(\\{.*\\})[ \\t]*(?:\\n|$)`))
  try { return match ? JSON.parse(match[1]) : null } catch { return null }
}
const requestOf = prompt => String(prompt).match(/USER REQUEST:\s*\n([^\n]*)/)?.[1]?.trim() ?? ''

// Tests can force a NIMBUS mode by starting the request with "mock:question", "mock:conversation" or "mock:refuse".
function forcedMode(prompt) {
  const mode = requestOf(prompt).match(/^mock:(question|conversation|refuse)\b/i)?.[1]?.toLowerCase()
  if (mode === 'question') return { mode, message: 'Mock NIMBUS needs one detail.', question: { text: 'Which part should I work on first?', quickReplies: ['Experience', 'Summary'] } }
  return mode ? { mode, message: `Mock NIMBUS ${mode} reply.` } : null
}

function nimbusTurn(prompt) {
  const forced = forcedMode(prompt)
  if (forced) return forced
  const resume = jsonAfter(prompt, 'RESUME')
  const itemIndex = (resume?.experience ?? []).findIndex(item => (item?.bullets ?? []).length >= 2)
  if (itemIndex < 0) return { mode: 'question', message: 'Mock NIMBUS needs a little more to work with.', question: { text: 'Add a role with two bullets, then ask again.' } }
  const bullets = resume.experience[itemIndex].bullets
  return {
    mode: 'edit',
    message: 'Mock NIMBUS moved your last bullet to the top.',
    steps: [{ title: 'Reorder your bullets', operations: [{ type: 'replace_bullets', section: 'experience', itemIndex, values: [bullets.at(-1), ...bullets.slice(0, -1)] }] }]
  }
}

function letterTurn(prompt) {
  return forcedMode(prompt) ?? {
    mode: 'edit',
    message: 'Mock NIMBUS set a greeting and a sign-off.',
    steps: [{ title: 'Set greeting and sign-off', operations: [
      { type: 'set_letter_field', target: 'salutation', value: 'Dear Hiring Manager,' },
      { type: 'set_letter_field', target: 'signoff', value: 'Kind regards,' }
    ] }]
  }
}

function jobFixes(prompt) {
  const keywords = jsonAfter(prompt, 'KEYWORDS') ?? {}
  const skills = jsonAfter(prompt, 'RESUME')?.skills ?? {}
  const fixes = (keywords.missing ?? []).slice(0, 3).map(term => ({ title: `Add “${term}” if you have used it`, why: `The job asks for ${term}.`, kind: 'add' }))
  const category = SKILL_CATEGORIES.find(name => Array.isArray(skills[name]) && skills[name].length >= 2)
  if (category) fixes.unshift({ title: 'Lead with your most relevant skills', why: 'Puts a different skill first in an existing list.', kind: 'change', operations: [{ type: 'replace_skills', category, values: [...skills[category]].reverse() }] })
  for (const title of ['Add measurable results', 'Link to your portfolio']) if (fixes.length < 2) fixes.push({ title, why: 'Mock suggestion.', kind: 'add' })
  return { fixes }
}

function jobParse(prompt) {
  const text = String(prompt).replace(/^JOB DESCRIPTION:\s*/, '')
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  return {
    title: (lines[0] ?? 'Role').slice(0, 120), company: '', seniority: 'unknown',
    mustHave: knownSkillsIn(text).slice(0, 12), niceToHave: [], yearsExperience: null, education: null,
    keywords: [], responsibilities: lines.slice(1, 4).map(line => line.slice(0, 160)), softSkills: []
  }
}

function resumeExtraction(prompt) {
  const text = String(prompt).match(/\n---\n([\s\S]*)\n---\s*$/)?.[1] ?? String(prompt)
  return { ...extractResumeDataFallback(text), confidenceNotes: ['Read by the offline mock AI provider (RESUMETRICS_AI_PROVIDER=mock).'] }
}

const TASKS = [
  [/^You are NIMBUS, the writing assistant inside the Resumetrics resume editor/, nimbusTurn],
  [/^You are NIMBUS, the writing assistant inside the Resumetrics cover letter editor/, letterTurn],
  [/^You tailor a resume to one job/, jobFixes],
  [/^You read job descriptions/, jobParse],
  [/^You are a precise resume parser/, resumeExtraction]
]

/** Same shape as the provider SDK's chat.completions.create result, including token usage. */
function complete(request) {
  const messages = Array.isArray(request?.messages) ? request.messages : []
  const system = String(messages.find(message => message.role === 'system')?.content ?? '')
  // The first user message is the task; later ones are repair notes added after a rejected answer.
  const prompt = String(messages.find(message => message.role === 'user')?.content ?? '')
  const handler = TASKS.find(([pattern]) => pattern.test(system))?.[1]
  const content = handler ? JSON.stringify(handler(prompt)) : 'OK'
  const promptTokens = Math.ceil(messages.reduce((sum, message) => sum + String(message?.content ?? '').length, 0) / 4)
  const completionTokens = Math.ceil(content.length / 4)
  return {
    id: `mock-${Date.now()}`,
    model: 'mock',
    choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
    usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }
  }
}

export function createMockClient() {
  return { chat: { completions: { create: async request => complete(request) } } }
}
