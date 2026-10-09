// Skill groups: resumeData.skills is { groupKey: [skill, …] }. The six built-in keys come from AI
// extraction; any other key is a group the person named themselves and is printed exactly as typed.

export const BUILT_IN_SKILL_GROUPS = ['languages', 'frameworks', 'tools', 'databases', 'softSkills', 'other']
export const MAX_SKILL_GROUPS = 12
export const MAX_GROUP_NAME = 40

// How each built-in group prints on a resume (unchanged from earlier releases).
const printLabels = { languages: 'Languages', frameworks: 'Frameworks', tools: 'Tools', databases: 'Databases', softSkills: 'Soft Skills', other: 'Other' }
// Clearer wording for the same groups inside the form.
const formLabels = { languages: 'Programming languages', frameworks: 'Frameworks & libraries', tools: 'Tools & software', databases: 'Databases', softSkills: 'Soft skills', other: 'Key skills' }

export const isBuiltInSkillGroup = key => BUILT_IN_SKILL_GROUPS.includes(key)
export const skillGroupLabel = key => printLabels[key] ?? String(key ?? '').trim()
export const formGroupLabel = key => formLabels[key] ?? String(key ?? '').trim()

/** Trims a typed group name; returns '' when it cannot be used as a key. */
export function sanitizeGroupName(name) {
  return String(name ?? '').replace(/\./g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_GROUP_NAME)
}

/** The key for a new group name, or an error when it is empty or already used (case-insensitive, by key or label). */
export function newGroupKey(name, skills = {}) {
  const clean = sanitizeGroupName(name)
  if (!clean) return { error: 'Type a name for the group.' }
  const existing = Object.keys(skills ?? {})
  if (existing.length >= MAX_SKILL_GROUPS) return { error: `You can have up to ${MAX_SKILL_GROUPS} skill groups.` }
  const lower = clean.toLocaleLowerCase()
  if (existing.some(key => key.toLocaleLowerCase() === lower || formGroupLabel(key).toLocaleLowerCase() === lower || skillGroupLabel(key).toLocaleLowerCase() === lower)) return { error: `“${clean}” already exists.` }
  // A name that matches a built-in group's form wording reuses that key, so AI tools keep understanding it.
  const builtIn = BUILT_IN_SKILL_GROUPS.find(key => formGroupLabel(key).toLocaleLowerCase() === lower)
  return { key: builtIn ?? clean }
}

/** Renames a group in place, keeping its position and skills. */
export function renameSkillGroup(skills = {}, from, toName) {
  const { key, error } = newGroupKey(toName, Object.fromEntries(Object.entries(skills).filter(([name]) => name !== from)))
  if (error) return { skills, error }
  return { skills: Object.fromEntries(Object.entries(skills).map(([name, values]) => [name === from ? key : name, values])) }
}

/** Keeps every group whose name is usable and whose values are strings (server and AI normalisation). */
export function normalizeSkillGroups(source, toList = value => (Array.isArray(value) ? value : []).map(item => String(item ?? '').trim()).filter(Boolean)) {
  const input = source && typeof source === 'object' && !Array.isArray(source) ? source : {}
  const result = Object.fromEntries(BUILT_IN_SKILL_GROUPS.map(key => [key, toList(input[key])]))
  for (const [rawKey, values] of Object.entries(input)) {
    if (isBuiltInSkillGroup(rawKey)) continue
    const key = sanitizeGroupName(rawKey)
    if (!key || key in result || Object.keys(result).length >= BUILT_IN_SKILL_GROUPS.length + MAX_SKILL_GROUPS) continue
    result[key] = toList(values)
  }
  return result
}
