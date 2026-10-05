// Turns scanned repositories into language shares and per-skill evidence. Pure; used by the server while
// streaming and by the client to re-compute when the user excludes markup languages.
import { languageForSkill, MARKUP_LANGUAGES, skillKey } from './skillTaxonomy.js'

export const WEAK_EVIDENCE_PERCENT = 5
export const STRONG_EVIDENCE_PERCENT = 15
const round1 = value => Math.round(value * 10) / 10

/** repos: [{ name, languages: { lang: bytes }, manifestSkills: [], readmeSkills: [] }] */
export function languageTotals(repos, { excludeMarkup = false } = {}) {
  const totals = new Map()
  repos.forEach(repo => Object.entries(repo.languages ?? {}).forEach(([language, bytes]) => {
    if (excludeMarkup && MARKUP_LANGUAGES.has(language)) return
    const entry = totals.get(language) ?? { name: language, bytes: 0, repos: 0, markup: MARKUP_LANGUAGES.has(language) }
    entry.bytes += Number(bytes) || 0
    entry.repos += 1
    totals.set(language, entry)
  }))
  const totalBytes = [...totals.values()].reduce((sum, entry) => sum + entry.bytes, 0)
  const languages = [...totals.values()]
    .map(entry => ({ ...entry, share: totalBytes ? round1(entry.bytes / totalBytes * 100) : 0 }))
    .sort((a, b) => b.bytes - a.bytes)
  return { totalBytes, languages }
}

const repoBytes = (repo, excludeMarkup) => Object.entries(repo.languages ?? {}).reduce((sum, [language, bytes]) => sum + (excludeMarkup && MARKUP_LANGUAGES.has(language) ? 0 : Number(bytes) || 0), 0)

export function evidenceStatus(share, hasSignal, mentionedOnly) {
  if (!hasSignal) return mentionedOnly ? 'mentioned' : 'none'
  if (share < WEAK_EVIDENCE_PERCENT) return 'weak'
  if (share < STRONG_EVIDENCE_PERCENT) return 'moderate'
  return 'strong'
}

/**
 * Evidence for each resume skill:
 *  - a language skill → that language's share of all code bytes;
 *  - a framework/tool found in manifests → share of all code bytes held by the repos that use it;
 *  - only mentioned in READMEs → "mentioned" (not counted as evidence).
 * share < 5% is flagged as too little evidence (weak).
 */
export function skillEvidence(resumeSkills, repos, { excludeMarkup = false } = {}) {
  const { totalBytes, languages } = languageTotals(repos, { excludeMarkup })
  const byLanguage = new Map(languages.map(entry => [entry.name.toLowerCase(), entry]))
  return resumeSkills.map(skill => {
    const language = languageForSkill(skill)
    const key = skillKey(skill)
    if (language && byLanguage.has(language.toLowerCase())) {
      const entry = byLanguage.get(language.toLowerCase())
      const repoNames = repos.filter(repo => Object.hasOwn(repo.languages ?? {}, entry.name)).map(repo => repo.name)
      return { name: skill, share: entry.share, repos: repoNames, source: 'language', status: evidenceStatus(entry.share, true, false) }
    }
    const manifestRepos = repos.filter(repo => (repo.manifestSkills ?? []).some(found => skillKey(found) === key))
    if (manifestRepos.length) {
      const bytes = manifestRepos.reduce((sum, repo) => sum + repoBytes(repo, excludeMarkup), 0)
      const share = totalBytes ? round1(bytes / totalBytes * 100) : 0
      return { name: skill, share, repos: manifestRepos.map(repo => repo.name), source: 'manifest', status: evidenceStatus(share, true, false) }
    }
    const mentioned = repos.filter(repo => (repo.readmeSkills ?? []).some(found => skillKey(found) === key))
    return { name: skill, share: 0, repos: mentioned.map(repo => repo.name), source: mentioned.length ? 'readme' : null, status: evidenceStatus(0, false, mentioned.length > 0) }
  }).sort((a, b) => b.share - a.share || a.name.localeCompare(b.name))
}
