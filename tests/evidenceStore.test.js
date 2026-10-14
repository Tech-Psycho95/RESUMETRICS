import assert from 'node:assert/strict'
import { buildGitHubEvidence, createEvidenceStore, MAX_EVIDENCE_BYTES } from '../server/db/evidenceStore.js'
import { createResumeStore, ResumeStoreError } from '../server/db/resumeStore.js'
import { persistScanResult } from '../server/github/persistScan.js'
import { resumeSkillsOf, skillsAddedSince } from '../shared/githubEvidenceMath.js'
import { scanFromEvidence } from '../src/db/evidenceState.js'
import { createFakeFirestore } from './helpers/fakeFirestore.js'

const ID = 'a1b2c3d4-e5f6-4789-8abc-def012345678'
const db = createFakeFirestore()
const resumes = createResumeStore({ getDb: () => db, timestamp: db.timestamp })
const store = createEvidenceStore({ getDb: () => db, timestamp: db.timestamp })
const rejects = async (work, code) => {
  try { await work() } catch (error) {
    assert.ok(error instanceof ResumeStoreError, `expected ResumeStoreError, got ${error}`)
    assert.equal(error.code, code)
    return
  }
  assert.fail(`expected ${code}`)
}

const repository = (overrides = {}) => ({
  name: 'resumetrics', fullName: 'me/resumetrics', url: 'https://github.com/me/resumetrics', pushedAt: '2026-10-01T00:00:00Z', stars: 3,
  fork: false, archived: false, private: true, languages: { JavaScript: 9000, CSS: 1000 }, manifestSkills: ['React'], readmeSkills: ['Docker'], filesChecked: ['README.md', 'package.json'],
  // Prose and extras that must never be stored:
  description: 'My secret private project about acquiring Initech', topics: ['secret'], readme: 'long text', token: 'ghp_secret', ...overrides
})
const result = (overrides = {}) => ({ type: 'result', scanned: 1, accessible: 4, cap: 25, totalBytes: 10000, summary: 'Most code is JavaScript.', repositories: [repository()], skills: [{ name: 'x' }], languages: [{ name: 'JavaScript' }], ...overrides })

// What is kept: names, languages, skill matches, file names. No descriptions, topics, README text or anything else.
const built = buildGitHubEvidence(result(), ['JavaScript', 'React'])
assert.deepEqual(built.repositories[0], {
  name: 'resumetrics', fullName: 'me/resumetrics', url: 'https://github.com/me/resumetrics', pushedAt: '2026-10-01T00:00:00Z', stars: 3,
  fork: false, archived: false, private: true, languages: { JavaScript: 9000, CSS: 1000 }, manifestSkills: ['React'], readmeSkills: ['Docker'], filesChecked: ['README.md', 'package.json']
})
assert.deepEqual(Object.keys(built).sort(), ['accessible', 'cap', 'repositories', 'resumeSkills', 'scanned', 'schemaVersion', 'summary'])
assert.equal(JSON.stringify(built).includes('Initech'), false)
assert.equal(JSON.stringify(built).includes('ghp_'), false)

// Malformed input is cleaned or refused, never stored as is.
const messy = buildGitHubEvidence(result({ repositories: [null, 5, { name: '' }, repository({ languages: { __bad__: 1, '': 2, Go: -5, Rust: 'x', Python: 12.6 }, stars: -1, fork: 'yes', manifestSkills: ['a', 7, '', '  b  '] })] }), 'not a list')
assert.equal(messy.repositories.length, 1)
assert.deepEqual(messy.repositories[0].languages, { Python: 13 })
assert.equal(messy.repositories[0].stars, 0)
assert.equal(messy.repositories[0].fork, false)
assert.deepEqual(messy.repositories[0].manifestSkills, ['a', 'b'])
assert.deepEqual(messy.resumeSkills, [])
for (const bad of [null, 'x', {}, { repositories: 'no' }]) assert.throws(() => buildGitHubEvidence(bad, []), ResumeStoreError)
const huge = result({ repositories: Array.from({ length: 100 }, (_, index) => repository({ name: `r${index}`, manifestSkills: Array.from({ length: 60 }, (_, skill) => `skill-${skill}-${'x'.repeat(50)}`), readmeSkills: Array.from({ length: 60 }, (_, skill) => `other-${skill}-${'y'.repeat(50)}`) })) })
assert.ok(JSON.stringify(huge).length > MAX_EVIDENCE_BYTES)
assert.throws(() => buildGitHubEvidence(huge, []), error => error.code === 'too_large')

// A normal 25-repository scan is far below the cap.
const typical = buildGitHubEvidence(result({ repositories: Array.from({ length: 25 }, (_, index) => repository({ name: `repo${index}`, languages: Object.fromEntries(Array.from({ length: 8 }, (_, language) => [`Language${language}`, 123456])), manifestSkills: Array.from({ length: 15 }, (_, skill) => `Skill ${skill}`) })) }), Array.from({ length: 40 }, (_, skill) => `Skill ${skill}`))
assert.ok(Buffer.byteLength(JSON.stringify(typical)) < MAX_EVIDENCE_BYTES / 3, 'a typical scan uses a third of the cap at most')

// Saving needs the resume to exist, so evidence can't outlive it or float free.
assert.equal(await store.saveGitHubEvidence('alice', ID, { result: result(), resumeSkills: ['React'] }), false)
assert.equal(db.docs.size, 0)
assert.deepEqual(await store.getEvidence('alice', ID), { github: null })
await resumes.saveResume('alice', ID, { baseRevision: null, fields: { name: 'Mine', templateId: 'onyx', data: { fullName: 'Ada' }, presentation: {} } })
assert.equal(await store.saveGitHubEvidence('alice', ID, { result: result(), resumeSkills: ['React', 'JavaScript'] }), true)
const stored = db.read(`users/alice/resumes/${ID}/evidence/github`)
assert.ok(stored.scannedAt)
assert.equal(JSON.stringify(stored).includes('Initech'), false)

const loaded = await store.getEvidence('alice', ID)
assert.equal(loaded.github.repositories.length, 1)
assert.equal(loaded.github.summary, 'Most code is JavaScript.')
assert.deepEqual(loaded.github.resumeSkills, ['React', 'JavaScript'])
assert.match(loaded.github.scannedAt, /^20\d\d-/)

// A newer scan replaces the old one; other users and other resumes see nothing.
await store.saveGitHubEvidence('alice', ID, { result: result({ summary: 'Newer.', repositories: [] }), resumeSkills: [] })
assert.equal((await store.getEvidence('alice', ID)).github.summary, 'Newer.')
assert.deepEqual(await store.getEvidence('bob', ID), { github: null })
assert.equal(await store.saveGitHubEvidence('bob', ID, { result: result(), resumeSkills: [] }), false, 'not bob’s resume')

// Forgetting it, and the resume taking it along when deleted.
await rejects(() => store.deleteEvidence('alice', ID, 'jobMatch'), 'invalid')
await store.deleteEvidence('alice', ID, 'github')
await store.deleteEvidence('alice', ID, 'github')
assert.deepEqual(await store.getEvidence('alice', ID), { github: null })
await store.saveGitHubEvidence('alice', ID, { result: result(), resumeSkills: [] })
await resumes.deleteResume('alice', ID)
assert.deepEqual([...db.docs.keys()], ['users/alice'], 'deleting the resume deleted its evidence (only the account’s resume count is left)')

// The scan wrapper: events pass through unchanged, the result is kept for a saved resume, failures never break the scan.
const events = [{ type: 'start', total: 1, resumeSkills: ['React'] }, { type: 'repo', done: 1 }, result()]
const collect = async (source, options) => { const seen = []; for await (const event of persistScanResult(source, options)) seen.push(event); return seen }
const generator = items => (async function * () { yield * items })()
const saved = []
const recordingStore = { saveGitHubEvidence: async (uid, id, payload) => { saved.push({ uid, id, payload }); return true } }
assert.deepEqual(await collect(generator(events), { uid: 'alice', resumeId: ID, store: recordingStore }), events)
assert.equal(saved.length, 1)
assert.deepEqual([saved[0].uid, saved[0].id], ['alice', ID])
assert.deepEqual(saved[0].payload.resumeSkills, ['React'], 'the skills the scan checked travel with the result')
assert.equal(saved[0].payload.result.summary, 'Most code is JavaScript.')
saved.length = 0
await collect(generator(events), { uid: 'alice', resumeId: null, store: recordingStore })
assert.equal(saved.length, 0, 'an unsaved resume keeps nothing')
await collect(generator(events.slice(0, 2)), { uid: 'alice', resumeId: ID, store: recordingStore })
assert.equal(saved.length, 0, 'a scan without a result keeps nothing')
const original = console.error
console.error = () => {}
try {
  const failing = { saveGitHubEvidence: async () => { throw Object.assign(new Error('Firestore down'), { code: 14 }) } }
  assert.deepEqual(await collect(generator(events), { uid: 'alice', resumeId: ID, store: failing }), events, 'the scan still completes')
} finally {
  console.error = original
}

// Staleness: only skills added to the resume since the scan count; removing one doesn't.
const resume = { skills: { languages: ['JavaScript', 'Go'], frameworks: ['React'], tools: [], databases: [], softSkills: [], other: [] }, projects: [{ techStack: ['Docker'] }] }
const checked = resumeSkillsOf(resume)
assert.ok(['JavaScript', 'Go', 'React', 'Docker'].every(skill => checked.includes(skill)))
assert.deepEqual(skillsAddedSince(checked, resume), [])
assert.deepEqual(skillsAddedSince(checked.map(skill => skill.toUpperCase()), resume), [], 'case does not matter')
assert.deepEqual(skillsAddedSince(['JavaScript'], resume).sort(), checked.filter(skill => skill !== 'JavaScript').sort())
assert.deepEqual(skillsAddedSince(checked, { ...resume, skills: { ...resume.skills, tools: ['Kubernetes'] } }), ['Kubernetes'])
assert.deepEqual(skillsAddedSince(checked, { skills: { languages: ['Go'] } }), [], 'removed skills never make a scan stale')
assert.deepEqual(skillsAddedSince(null, { skills: { languages: ['Go'] } }), ['Go'])
assert.deepEqual(skillsAddedSince(['Go'], null), [])

// A saved report becomes the scan state the evidence screen shows.
assert.equal(scanFromEvidence(null), null)
const restoredScan = scanFromEvidence({ scannedAt: '2026-10-01T10:00:00.000Z', resumeSkills: ['Go'], accessible: 4, cap: 25, scanned: 3, summary: 'Hi.', repositories: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] })
assert.equal(restoredScan.status, 'done')
assert.equal(restoredScan.done, 3)
assert.equal(restoredScan.percent, 100)
assert.deepEqual(restoredScan.resumeSkills, ['Go'])
assert.equal(restoredScan.repos.length, 3)
assert.equal(restoredScan.startedAt, Date.parse('2026-10-01T10:00:00.000Z'))
assert.equal(restoredScan.scannedAt, '2026-10-01T10:00:00.000Z')
assert.deepEqual(restoredScan.errors, [])
assert.equal(scanFromEvidence({ repositories: [] }).repos.length, 0)

console.log('✓ evidenceStore tests passed')
