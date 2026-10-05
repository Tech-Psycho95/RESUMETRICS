// Keyword-driven job match (PLAN-030). The person picks which job-description keywords matter;
// the score is how well the resume covers them, weighted by importance and where they appear.
// Shared by the client (instant re-score after every executed fix) and the server (fix prompts).
import { resumeTextParts, textHasTerm } from './jdScoring.js'

const list = value => Array.isArray(value) ? value : []
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim()
const stripMarks = value => String(value ?? '').replace(/\[\/?[bius]\]/g, '')
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const KEYWORD_GROUPS = [
  { id: 'hard', label: 'Hard skills' },
  { id: 'keyword', label: 'Other keywords' },
  { id: 'soft', label: 'Soft skills' }
]
export const TARGET_SCORE = 85

/** Literal occurrences of a term in text (case-insensitive, whole term). */
export function countTerm(text, term) {
  const needle = clean(term).toLowerCase()
  if (!needle) return 0
  const matches = String(text ?? '').toLowerCase().match(new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(needle)}(?=$|[^a-z0-9+#])`, 'g'))
  return matches ? matches.length : 0
}

/** The posting's keywords for the picker: key skills first, then the most repeated. */
export function extractJdKeywords(jd = {}, jobText = '') {
  const seen = new Set()
  const rows = []
  const push = (term, group, key = false) => {
    const value = clean(term)
    const id = value.toLowerCase()
    if (!value || seen.has(id)) return
    seen.add(id)
    rows.push({ term: value, group, key, jdCount: Math.max(1, countTerm(jobText, value)), selected: true })
  }
  list(jd.mustHave).forEach(term => push(term, 'hard', true))
  list(jd.niceToHave).forEach(term => push(term, 'hard'))
  list(jd.keywords).forEach(term => push(term, 'keyword'))
  list(jd.softSkills).forEach(term => push(term, 'soft'))
  return rows.sort((a, b) => Number(b.key) - Number(a.key) || b.jdCount - a.jdCount)
}

/** A keyword the person typed themselves (counted in the posting like the rest). */
export function customKeyword(term, jobText = '') {
  const value = clean(term).slice(0, 60)
  return value ? { term: value, group: 'keyword', key: false, jdCount: countTerm(jobText, value), selected: true, custom: true } : null
}

const weightOf = keyword => keyword.key ? 3 : keyword.group === 'soft' ? 1 : 2

/**
 * score: 0–100 over the selected keywords. A found keyword earns 0.7, +0.2 when it is prominent
 * (headline, summary, skills list or the first two bullets of a role), +0.1 when it appears twice or more.
 */
export function scoreKeywords(resume = {}, keywords = []) {
  const parts = resumeTextParts(resume)
  const prominentText = stripMarks([
    resume.headline, resume.summary, parts.skills.join(', '),
    ...list(resume.experience).flatMap(item => list(item?.bullets).slice(0, 2)),
    ...list(resume.projects).flatMap(item => [item?.description, ...list(item?.bullets).slice(0, 1)])
  ].join('\n'))
  const selected = list(keywords).filter(keyword => keyword?.selected !== false)
  const rows = selected.map(keyword => {
    const found = textHasTerm(parts.all, keyword.term)
    const resumeCount = found ? Math.max(1, countTerm(parts.all, keyword.term)) : 0
    const prominent = found && textHasTerm(prominentText, keyword.term)
    const coverage = found ? 0.7 + (prominent ? 0.2 : 0) + (resumeCount >= 2 ? 0.1 : 0) : 0
    return { ...keyword, found, prominent, resumeCount, coverage, weight: weightOf(keyword) }
  })
  const total = rows.reduce((sum, row) => sum + row.weight, 0)
  const score = total ? Math.round(rows.reduce((sum, row) => sum + row.weight * row.coverage, 0) / total * 100) : 0
  return { score, rows, found: rows.filter(row => row.found).length, total: rows.length }
}

export function verdictFor(score) {
  if (score >= TARGET_SCORE) return { id: 'strong', label: 'Strong match', text: 'Your resume covers what this job asks for. Recruiters and ATS filters should rank it well.' }
  if (score >= 75) return { id: 'good', label: 'Good match', text: `A few keywords are missing or buried. Aim for ${TARGET_SCORE} or higher.` }
  if (score >= 50) return { id: 'fair', label: 'Getting there', text: `Your resume is missing important keywords from this job. Aim for ${TARGET_SCORE} or higher.` }
  return { id: 'low', label: 'Needs work', text: `Your resume is not yet targeted to this job and may not pass screening. Aim for ${TARGET_SCORE} or higher.` }
}
