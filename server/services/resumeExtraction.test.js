import assert from 'node:assert/strict'
import test from 'node:test'
import { buildResumeExtractionChunks, mergePartialResumeData, normalizeResumeDocument } from './resumeExtraction.js'

test('keeps every page in order and flags unreadable pages', () => {
  const document = normalizeResumeDocument({
    pages: [
      { pageNumber: 1, text: 'Jane Doe\nEXPERIENCE\nBuilt APIs.' },
      { pageNumber: 2, text: 'PROJECTS\nEvidence Tracker' },
      { pageNumber: 3, text: '' }
    ],
    metadata: { fileName: 'resume.pdf', fileType: 'pdf', totalPages: 3, pagesProcessed: 3, isCompleteParse: true }
  })

  assert.deepEqual(document.pages.map(page => page.pageNumber), [1, 2, 3])
  assert.equal(document.metadata.isCompleteParse, false)
  assert.match(document.metadata.warnings.join(' '), /page 3/i)
})

test('chunks long content without dropping later-page text', () => {
  const document = normalizeResumeDocument({
    pages: [
      { pageNumber: 1, text: `${'Experience detail. '.repeat(20)}\n\nPROJECTS\nEvidence Tracker` },
      { pageNumber: 2, text: 'SKILLS\nReact, Node.js, Git' }
    ]
  })
  const chunks = buildResumeExtractionChunks(document, 90)

  assert.ok(chunks.length > 2)
  assert.ok(chunks.some(chunk => chunk.text.includes('Evidence Tracker')))
  assert.ok(chunks.some(chunk => chunk.pageNumbers.includes(2) && chunk.text.includes('React')))
})

test('merges structured chunks without losing projects, bullets, skills, or links', () => {
  const merged = mergePartialResumeData([
    {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      experience: [{ role: 'Engineer', company: 'Acme', bullets: ['Built APIs.'] }]
    },
    {
      experience: [{ role: 'Engineer', company: 'Acme', bullets: ['Improved reliability.'] }],
      projects: [{ name: 'Evidence Tracker', techStack: ['React'], links: ['https://example.com/repo'] }]
    },
    { skills: { frameworks: ['React'], tools: ['Git'], other: ['Node.js'] }, certifications: ['AWS Cloud Practitioner'] }
  ])

  assert.equal(merged.experience.length, 1)
  assert.deepEqual(merged.experience[0].bullets, ['Built APIs.', 'Improved reliability.'])
  assert.equal(merged.projects[0].name, 'Evidence Tracker')
  assert.deepEqual(merged.projects[0].links, ['https://example.com/repo'])
  assert.deepEqual(merged.skills.frameworks, ['React'])
  assert.deepEqual(merged.certifications, ['AWS Cloud Practitioner'])
})
