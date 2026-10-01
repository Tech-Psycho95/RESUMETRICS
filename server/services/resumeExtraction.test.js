import assert from 'node:assert/strict'
import test from 'node:test'
import { buildResumeExtractionChunks, mergePartialResumeData, normalizeResumeDocument } from './resumeExtraction.js'
import { attachDocumentLinks, classifyResumeData } from './resumeData.js'

test('uses embedded hyperlinks and labels them by destination', () => {
  const extracted = mergePartialResumeData([{
    fullName: 'Jane Doe',
    links: [{ label: 'GitHub', url: '' }, { label: '', url: 'linkedin.com/in/janedoe' }, { label: 'Portfolio', url: '' }],
    projects: [{ name: 'Evidence Tracker', description: 'Tracks proof.' }]
  }])
  const linked = classifyResumeData(attachDocumentLinks(extracted, [
    { url: 'mailto:jane@example.com', text: 'Email' },
    { url: 'tel:+15550100', text: '+1 555 0100' },
    { url: 'https://github.com/janedoe', text: 'GitHub' },
    { url: 'https://www.linkedin.com/in/janedoe/', text: 'LinkedIn' },
    { url: 'https://github.com/janedoe/evidence-tracker', text: 'Source' },
    { url: 'https://janedoe.dev', text: 'Portfolio' },
    { url: 'https://scholar.google.com/citations?user=abc', text: 'Publications' }
  ]))

  assert.equal(linked.email, 'jane@example.com')
  assert.equal(linked.phone, '+1 555 0100')
  assert.deepEqual(linked.projects[0].links, ['https://github.com/janedoe/evidence-tracker'])
  assert.deepEqual(linked.links, [
    { url: 'https://github.com/janedoe', label: 'GitHub' },
    { url: 'https://www.linkedin.com/in/janedoe/', label: 'LinkedIn' },
    { url: 'https://janedoe.dev', label: 'Portfolio' },
    { url: 'https://scholar.google.com/citations?user=abc', label: 'Google Scholar' }
  ])
})

test('lists each link once when the AI returns words instead of addresses', () => {
  const extracted = mergePartialResumeData([{
    fullName: 'Prathick Dhanes R',
    links: ['linkedin', 'github', 'leetcode', 'youtube', 'wca profile', 'cineblock', 'classdrop', 'portfolio']
      .map(word => ({ label: word, url: word.replace(/\b\w/g, letter => letter.toUpperCase()) })),
    projects: [{ name: 'CineBlock', description: 'Movie app' }, { name: 'ClassDrop', description: 'Class notes' }]
  }])
  const linked = classifyResumeData(attachDocumentLinks(extracted, [
    { url: 'https://www.linkedin.com/in/prathick-dhanes', text: 'LinkedIn' },
    { url: 'https://github.com/peterish8', text: 'GitHub' },
    { url: 'https://LeetCode.com/u/5Evtayd87W/', text: 'LeetCode' },
    { url: 'https://www.worldcubeassociation.org/persons/2022RPRA01', text: 'WCA Profile' },
    { url: 'https://prathick.vercel.app', text: 'Portfolio' },
    { url: 'https://youtube.com/@prathick', text: 'YouTube' },
    { url: 'https://cineblock.vercel.app', text: 'CineBlock' },
    { url: 'https://github.com/peterish8/classdrop', text: 'Source' },
    { url: 'https://github.com/PETERISH8', text: 'github' }
  ]))

  assert.deepEqual(linked.links.map(link => link.label), ['LinkedIn', 'GitHub', 'LeetCode', 'YouTube', 'WCA Profile', 'Portfolio'])
  assert.equal(new Set(linked.links.map(link => link.url.toLowerCase())).size, linked.links.length)
  assert.deepEqual(linked.projects.map(project => project.links), [['https://cineblock.vercel.app'], ['https://github.com/peterish8/classdrop']])
})

test('keeps hyperlinks supplied with the document', () => {
  const document = normalizeResumeDocument({
    pages: [{ pageNumber: 1, text: 'Jane Doe' }],
    links: [{ url: 'https://github.com/janedoe', text: 'GitHub', pageNumber: 1 }, { url: 'javascript:alert(1)', text: 'bad' }]
  })
  assert.deepEqual(document.links, [{ url: 'https://github.com/janedoe', text: 'GitHub', pageNumber: 1 }])
})

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

test('files misplaced details into the right sections', () => {
  const merged = mergePartialResumeData([{
    fullName: 'Ana Ruiz',
    skills: {
      languages: ['English', 'Spanish (Fluent)', 'Python', 'Italian'],
      frameworks: ['ASP.NET', 'Socket.IO', 'React'],
      softSkills: ['Investigation skills', 'React'],
      other: ['https://github.com/anaruiz', 'ana@example.com']
    },
    links: [{ label: 'linkedin.com/in/anaruiz', url: '' }, { label: '', url: 'mailto:ana@example.com' }],
    customSections: [{ title: 'Interests', items: ['Chess', 'Hiking'] }]
  }])

  assert.deepEqual(merged.languages, ['English', 'Spanish (Fluent)', 'Italian'])
  assert.deepEqual(merged.skills.languages, ['Python'])
  assert.deepEqual(merged.skills.frameworks, ['ASP.NET', 'Socket.IO', 'React'])
  assert.deepEqual(merged.skills.softSkills, ['Investigation skills'])
  assert.deepEqual(merged.skills.other, [])
  assert.equal(merged.email, 'ana@example.com')
  assert.deepEqual(merged.links.map(link => link.label), ['LinkedIn', 'GitHub'])
  assert.deepEqual(merged.customSections, [{ title: 'Interests', content: 'Chess\nHiking' }])
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
