import assert from 'node:assert/strict'
import { createResumeStore, MAX_VERSIONS, ResumeStoreError } from '../server/db/resumeStore.js'
import { createFakeFirestore } from './helpers/fakeFirestore.js'

const ID = 'a1b2c3d4-e5f6-4789-8abc-def012345678'
const HOUR = 3_600_000
const rejects = async (work, code) => {
  try { await work() } catch (error) {
    assert.ok(error instanceof ResumeStoreError, `expected ResumeStoreError, got ${error}`)
    assert.equal(error.code, code)
    return
  }
  assert.fail(`expected ${code}`)
}
const fields = (name, summary = name) => ({ name, templateId: 'onyx', data: { fullName: 'Ada Lovelace', summary }, presentation: {} })

// The clock is ours: timestamps are ISO strings from it, so "four hours later" is exact.
let clock = Date.UTC(2026, 9, 11, 10, 0, 0)
const tick = ms => { clock += ms }
const db = createFakeFirestore()
const store = createResumeStore({ getDb: () => db, now: () => new Date(clock), timestamp: () => new Date(clock).toISOString() })
const versionKeys = () => [...db.docs.keys()].filter(key => key.startsWith(`users/alice/resumes/${ID}/versions/`))

// A resume with no history has no versions, and quick saves don't create any.
await store.saveResume('alice', ID, { baseRevision: null, fields: fields('First draft') })
assert.deepEqual(await store.listVersions('alice', ID), [])
tick(HOUR)
await store.saveResume('alice', ID, { baseRevision: 1, fields: fields('Second draft') })
assert.deepEqual(await store.listVersions('alice', ID), [], 'one hour is too soon for a checkpoint')

// Once the newest version is four hours old, a save keeps the state it replaces as a checkpoint.
tick(4 * HOUR)
await store.saveResume('alice', ID, { baseRevision: 2, fields: fields('Third draft') })
let versions = await store.listVersions('alice', ID)
assert.equal(versions.length, 1)
assert.equal(versions[0].reason, 'auto')
assert.equal(versions[0].name, 'Second draft', 'the checkpoint holds the replaced state')
assert.equal(versions[0].revision, 2)
assert.equal('data' in versions[0], false, 'the list carries no content')
tick(60_000)
await store.saveResume('alice', ID, { baseRevision: 3, fields: fields('Fourth draft') })
assert.equal((await store.listVersions('alice', ID)).length, 1, 'no second checkpoint right away')

// A manual version snapshots the stored resume; asking again with nothing new is a no-op that touches nothing.
tick(60_000)
const manual = await store.createVersion('alice', ID)
assert.equal(manual.reason, 'manual')
assert.equal(manual.name, 'Fourth draft')
assert.equal(manual.revision, 4)
assert.match(manual.createdAt, /^2026-/)
const writes = db.stats.writes
assert.equal(await store.createVersion('alice', ID), null)
assert.equal(db.stats.writes, writes, 'nothing changed, nothing written')
assert.equal((await store.getResume('alice', ID)).revision, 4, 'versions never bump the revision')
tick(1000)
await store.saveResume('alice', ID, { baseRevision: 4, fields: fields('Fifth draft') })   // baseRevision 4 still valid
assert.equal((await store.createVersion('alice', ID)).name, 'Fifth draft')
tick(60_000)
versions = await store.listVersions('alice', ID)
assert.deepEqual(versions.map(version => version.name), ['Fifth draft', 'Fourth draft', 'Second draft'], 'newest first')

// Restore: the old content comes back as a new revision, and what it replaced is kept first.
tick(60_000)
const target = versions.find(version => version.name === 'Second draft')
await store.saveResume('alice', ID, { baseRevision: 5, fields: fields('Sixth draft, not versioned yet') })
tick(60_000)
const restored = await store.restoreVersion('alice', ID, target.id)
assert.equal(restored.revision, 7)
const now = await store.getResume('alice', ID)
assert.equal(now.name, 'Second draft')
assert.equal(now.data.summary, 'Second draft')
assert.equal(now.revision, 7)
versions = await store.listVersions('alice', ID)
const backup = versions.find(version => version.reason === 'before-restore')
assert.equal(backup.name, 'Sixth draft, not versioned yet')
// Undoing the restore is the same operation.
tick(60_000)
await store.restoreVersion('alice', ID, backup.id)
assert.equal((await store.getResume('alice', ID)).name, 'Sixth draft, not versioned yet')
// Restoring while the current state is already a version adds no extra backup.
tick(60_000)
const manualAgain = await store.createVersion('alice', ID)
const before = (await store.listVersions('alice', ID)).length
tick(60_000)
await store.restoreVersion('alice', ID, target.id)
assert.equal((await store.listVersions('alice', ID)).length, before, 'current state was already saved as a version')
assert.ok(manualAgain)

// Refusals: another user's resume, a missing resume, a missing version.
await rejects(() => store.createVersion('bob', ID), 'not_found')
await rejects(() => store.createVersion('alice', 'f'.repeat(20)), 'not_found')
await rejects(() => store.restoreVersion('alice', ID, 'does-not-exist'), 'not_found')
await rejects(() => store.restoreVersion('bob', ID, target.id), 'not_found')
assert.deepEqual(await store.listVersions('bob', ID), [])

// Only the newest MAX_VERSIONS are kept.
for (let index = 0; index < MAX_VERSIONS + 8; index += 1) {
  tick(60_000)
  const { revision } = await store.getResume('alice', ID)
  await store.saveResume('alice', ID, { baseRevision: revision, fields: fields(`Edit ${index}`) })
  tick(1000)
  await store.createVersion('alice', ID)
}
versions = await store.listVersions('alice', ID)
assert.equal(versions.length, MAX_VERSIONS)
assert.equal(versions[0].name, `Edit ${MAX_VERSIONS + 7}`)
assert.equal(versionKeys().length, MAX_VERSIONS, 'older versions are deleted, not just hidden')

// Deleting the resume deletes its versions.
await store.deleteResume('alice', ID)
assert.equal(versionKeys().length, 0)

console.log('✓ resumeVersions tests passed')
