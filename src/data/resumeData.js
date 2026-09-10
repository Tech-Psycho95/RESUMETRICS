const skillCategories = ['languages', 'frameworks', 'tools', 'databases', 'softSkills', 'other']

export function createBlankResumeData() {
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

export function countResumeSkills(resumeData) {
  return Object.values(resumeData?.skills ?? {}).flat().filter(Boolean).length
}

