import { createEmptyResumeData } from './resumeData.js'

const sectionHeading = /^(summary|profile|skills|technical skills|core skills|competencies|experience|work experience|employment|projects|education|certifications?|achievements?|awards?)\s*:??$/i
const skillGroups = {
  languages: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'sql', 'html', 'css'],
  frameworks: ['react', 'angular', 'vue', 'next.js', 'nextjs', 'node.js', 'nodejs', 'express', 'django', 'flask', 'spring', 'tailwind'],
  tools: ['git', 'github', 'figma', 'docker', 'aws', 'azure', 'jira', 'postman', 'linux'],
  databases: ['mysql', 'postgresql', 'postgres', 'mongodb', 'sqlite', 'firebase', 'redis'],
  softSkills: ['communication', 'leadership', 'teamwork', 'problem solving', 'stakeholder management'],
  other: []
}

const cleanLine = value => value.replace(/\s+/g, ' ').trim()
const looksLikeName = value => /^[a-z][a-z .'-]{1,70}$/i.test(value) && value.split(' ').length >= 2

function findSkills(lines) {
  const candidates = []
  const start = lines.findIndex(line => /^(skills|technical skills|core skills|competencies)\s*:??$/i.test(line))
  if (start >= 0) {
    for (const line of lines.slice(start + 1, start + 8)) {
      if (sectionHeading.test(line)) break
      candidates.push(...line.split(/[|,;•·]/))
    }
  }

  const normalized = candidates.map(cleanLine).filter(Boolean)
  const result = Object.fromEntries(Object.keys(skillGroups).map(group => [group, []]))
  for (const skill of normalized) {
    const lower = skill.toLowerCase()
    const group = Object.entries(skillGroups).find(([, known]) => known.some(item => lower === item || lower.includes(item)))?.[0] ?? 'other'
    if (!result[group].some(item => item.toLowerCase() === lower)) result[group].push(skill)
  }
  return result
}

/**
 * A conservative availability fallback. It never fabricates experience or
 * metrics; it only preserves plainly recognizable source text.
 */
export function extractResumeDataFallback(resumeText) {
  const lines = String(resumeText).split(/\r?\n/).map(cleanLine).filter(Boolean)
  const data = createEmptyResumeData()
  const email = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
  const phone = resumeText.match(/(?:\+?\d[\d ()-]{7,}\d)/)?.[0]
  const nameLine = lines.find(looksLikeName)

  data.fullName = nameLine ?? ''
  data.email = email ?? ''
  data.phone = phone ? cleanLine(phone) : ''
  data.headline = nameLine ? lines.slice(lines.indexOf(nameLine) + 1, lines.indexOf(nameLine) + 4).find(line => line.length < 90 && !line.includes('@') && !phone?.includes(line) && !sectionHeading.test(line)) ?? '' : ''
  data.skills = findSkills(lines)
  data.missingFields = ['summary', 'experience', 'projects', 'education', 'certifications', 'achievements'].filter(field => !data[field]?.length)
  if (!data.fullName) data.missingFields.unshift('fullName')
  if (!data.email) data.missingFields.unshift('email')
  data.confidenceNotes = ['AI extraction was temporarily unavailable. This source-only fallback captured only clearly recognized details; review before using the draft.']
  return data
}
