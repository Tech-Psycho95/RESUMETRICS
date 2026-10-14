// How complete a resume is, 0–100. The dashboard shows it on each card, and the server uses it to decide whether a
// deleted resume still counts toward the free plan's limit (shared/plans.js), so both must agree.

const has = value => typeof value === 'string' && value.trim().length > 0
const count = value => (Array.isArray(value) ? value.filter(Boolean).length : 0)

/** Each part from 0 to 1. */
export function resumeCompletionParts(resumeData) {
  const data = resumeData ?? {}
  const skillCount = Object.values(data.skills ?? {}).flat().filter(has).length
  const experience = Array.isArray(data.experience) ? data.experience : []
  const experienceBullets = experience.reduce((total, item) => total + count(item?.bullets), 0)
  const summaryWords = has(data.summary) ? data.summary.trim().split(/\s+/).length : 0
  const contactFields = [data.fullName, data.email, data.phone, data.location].filter(has).length
  return {
    contact: contactFields / 4,
    headline: has(data.headline) ? 1 : 0,
    summary: Math.min(summaryWords / 30, 1),
    experience: experience.length ? .25 + .75 * Math.min(experienceBullets / (experience.length * 2), 1) : 0,
    education: count(data.education) ? 1 : 0,
    skills: Math.min(skillCount / 6, 1),
    projects: count(data.projects) ? 1 : 0,
    links: count(data.links) ? 1 : 0
  }
}

export function resumeCompletion(resumeData) {
  if (!resumeData || typeof resumeData !== 'object') return 0
  const parts = Object.values(resumeCompletionParts(resumeData))
  return Math.round(parts.reduce((total, part) => total + part, 0) / parts.length * 100)
}
