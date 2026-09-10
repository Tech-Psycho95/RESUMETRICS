const skillCategories = ['languages', 'frameworks', 'tools', 'databases', 'softSkills', 'other']

const asString = value => typeof value === 'string' ? value.trim() : ''
const asStringList = value => Array.isArray(value) ? value.map(asString).filter(Boolean) : []
const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}

export function createEmptyResumeData() {
  return {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    links: [],
    summary: '',
    skills: Object.fromEntries(skillCategories.map(category => [category, []])),
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    achievements: [],
    missingFields: [],
    confidenceNotes: []
  }
}

export function normalizeResumeData(value) {
  const source = asObject(value)
  const skills = asObject(source.skills)

  return {
    fullName: asString(source.fullName),
    headline: asString(source.headline),
    email: asString(source.email),
    phone: asString(source.phone),
    location: asString(source.location),
    links: Array.isArray(source.links)
      ? source.links.map(asObject).map(link => ({ label: asString(link.label), url: asString(link.url) })).filter(link => link.label || link.url)
      : [],
    summary: asString(source.summary),
    skills: Object.fromEntries(skillCategories.map(category => [category, asStringList(skills[category])])),
    experience: Array.isArray(source.experience)
      ? source.experience.map(asObject).map(item => ({
        role: asString(item.role),
        company: asString(item.company),
        location: asString(item.location),
        startDate: asString(item.startDate),
        endDate: asString(item.endDate),
        bullets: asStringList(item.bullets)
      })).filter(item => item.role || item.company || item.bullets.length)
      : [],
    projects: Array.isArray(source.projects)
      ? source.projects.map(asObject).map(item => ({
        name: asString(item.name),
        techStack: asStringList(item.techStack),
        description: asString(item.description),
        bullets: asStringList(item.bullets),
        links: asStringList(item.links)
      })).filter(item => item.name || item.description || item.techStack.length || item.bullets.length || item.links.length)
      : [],
    education: Array.isArray(source.education)
      ? source.education.map(asObject).map(item => ({
        degree: asString(item.degree),
        institution: asString(item.institution),
        location: asString(item.location),
        startDate: asString(item.startDate),
        endDate: asString(item.endDate),
        details: asStringList(item.details)
      })).filter(item => item.degree || item.institution)
      : [],
    certifications: asStringList(source.certifications),
    achievements: asStringList(source.achievements),
    missingFields: asStringList(source.missingFields),
    confidenceNotes: asStringList(source.confidenceNotes)
  }
}
