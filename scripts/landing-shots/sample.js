// Demo account data for the landing-page screenshots (scripts/landing-shots/capture.mjs). Everything here is
// fictional: a sample candidate, two resumes and a saved GitHub scan, served by the harness's mock API.

import { landingResumeData } from '../../src/data/sampleResume.js'
import { resumeSkillsOf } from '../../shared/githubEvidenceMath.js'

export const DEMO_USER = {
  uid: 'landing-demo',
  displayName: 'Aarav Mehta',
  email: 'aarav.mehta@example.com'
}

// The same resume the landing page writes in its hero (src/data/sampleResume.js), with the gallery's sample photo.
export const sampleResumeData = { ...landingResumeData, photo: { source: '/src/assets/sample-resume-portrait.jpg', width: 80, height: 80, shape: 'circle', objectFit: 'cover' } }

// An older, unfinished resume, so the dashboard shows more than one project.
const draftData = {
  ...sampleResumeData,
  headline: 'Frontend Developer',
  summary: 'Frontend developer focused on accessible, fast interfaces.',
  experience: sampleResumeData.experience.slice(1),
  projects: [],
  certifications: [],
  achievements: []
}

const iso = daysAgo => new Date(Date.now() - daysAgo * 86_400_000).toISOString()

export const sampleResumes = [
  { id: 'demo-resume-fullstack-0001', name: 'Full stack resume', templateId: 'gengar', data: sampleResumeData, progress: 100, createdAt: iso(20), updatedAt: iso(0) },
  { id: 'demo-resume-frontend-0002', name: 'Frontend internship', templateId: 'onyx', data: draftData, progress: 67, createdAt: iso(40), updatedAt: iso(6) },
  { id: 'demo-resume-product-00003', name: 'Product engineer', templateId: 'kakuna', data: { ...sampleResumeData, headline: 'Product Engineer' }, progress: 83, createdAt: iso(60), updatedAt: iso(12) }
]

const repo = (name, languages, extra = {}) => ({
  name, fullName: `aaravmehta/${name}`, url: `https://github.com/aaravmehta/${name}`, pushedAt: iso(extra.age ?? 3), stars: extra.stars ?? 0,
  fork: false, archived: false, private: false, languages, manifestSkills: extra.manifest ?? [], readmeSkills: extra.readme ?? [], filesChecked: ['package.json', 'README.md']
})

export const sampleEvidence = {
  scannedAt: iso(1),
  resumeSkills: resumeSkillsOf(landingResumeData),
  accessible: 18,
  cap: 25,
  scanned: 18,
  summary: 'Your code strongly backs React, TypeScript and Node.js. Python and Docker show up in a few projects; AWS and Redis are only mentioned.',
  repositories: [
    repo('shelfsense', { JavaScript: 182000, CSS: 24000, Dockerfile: 900 }, { stars: 14, manifest: ['React', 'Express.js', 'MongoDB', 'Docker'] }),
    repo('campusride', { TypeScript: 240000, CSS: 31000, PLpgSQL: 6000 }, { stars: 22, manifest: ['Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'] }),
    repo('analytics-dashboard', { TypeScript: 310000, JavaScript: 42000, CSS: 18000 }, { stars: 9, manifest: ['React', 'Node.js', 'Redis'] }),
    repo('billing-service', { TypeScript: 156000, Dockerfile: 1200 }, { manifest: ['Node.js', 'Express.js', 'PostgreSQL', 'Docker'] }),
    repo('ml-notebooks', { Python: 98000, 'Jupyter Notebook': 120000 }, { age: 30, manifest: ['Python'] }),
    repo('portfolio', { JavaScript: 22000, HTML: 9000, CSS: 14000 }, { age: 45, readme: ['AWS'] }),
    repo('dsa-practice', { Python: 41000, 'C++': 38000 }, { age: 60 }),
    repo('component-kit', { TypeScript: 87000, CSS: 26000 }, { age: 20, stars: 31, manifest: ['React', 'Tailwind CSS'] })
  ]
}
