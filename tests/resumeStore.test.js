import assert from 'node:assert/strict'
import { createResumeStore, MAX_RESUME_BYTES, progressOf, ResumeStoreError, toApiResume, validateResumeFields } from '../server/db/resumeStore.js'
import { createFakeFirestore } from './helpers/fakeFirestore.js'

const ID = 'a1b2c3d4-e5f6-4789-8abc-def012345678'
const ID_2 = '11111111-2222-4333-8444-555555555555'
const fields = (overrides = {}) => ({ name: 'My resume', templateId: 'onyx', data: { fullName: 'Ada Lovelace', email: 'ada@example.com' }, presentation: {}, ...overrides })
const rejects = async (work, code, check = () => {}) => {
  try { await work() } catch (error) {
    assert.ok(error instanceof ResumeStoreError, `expected ResumeStoreError, got ${error}`)
    assert.equal(error.code, code)
    check(error)
    return
  }
  assert.fail(`expected ${code}`)
}

const db = createFakeFirestore()
const store = createResumeStore({ getDb: () => db, timestamp: db.timestamp, now: () => new Date('2026-10-11T10:00:00Z') })

// Create: revision 1, server-side fields set, progress computed.
const created = await store.saveResume('alice', ID, { baseRevision: null, fields: fields() })
assert.deepEqual(created, { id: ID, revision: 1, updatedAt: '2026-10-11T10:00:00.000Z' })
const stored = db.read(`users/alice/resumes/${ID}`)
assert.equal(stored.revision, 1)
assert.equal(stored.schemaVersion, 1)
assert.equal(stored.progress, 33)   // name and contact filled: 2 of 6 checks
assert.ok(stored.createdAt.__ts && stored.updatedAt.__ts)

// Update with the revision the client saw: +1, createdAt kept, updatedAt moves.
const createdAt = stored.createdAt.__ts
const updated = await store.saveResume('alice', ID, { baseRevision: 1, fields: fields({ name: 'Renamed' }) })
assert.equal(updated.revision, 2)
assert.equal(db.read(`users/alice/resumes/${ID}`).name, 'Renamed')
assert.equal(db.read(`users/alice/resumes/${ID}`).createdAt.__ts, createdAt)
assert.ok(db.read(`users/alice/resumes/${ID}`).updatedAt.__ts > createdAt)

// A stale revision writes nothing and says what the server has.
await rejects(() => store.saveResume('alice', ID, { baseRevision: 1, fields: fields({ name: 'Stale' }) }), 'conflict', error => assert.equal(error.serverRevision, 2))
assert.equal(db.read(`users/alice/resumes/${ID}`).name, 'Renamed')
// Creating over an existing id is a conflict too (a retried first save lands here; the client then adopts the revision).
await rejects(() => store.saveResume('alice', ID, { baseRevision: null, fields: fields() }), 'conflict', error => assert.equal(error.serverRevision, 2))
// Updating something deleted elsewhere is not_found, not a silent re-create.
await rejects(() => store.saveResume('alice', ID_2, { baseRevision: 4, fields: fields() }), 'not_found')
assert.equal(db.read(`users/alice/resumes/${ID_2}`), undefined)

// Clients can only set the allowed fields: revision, plan, ownership and timestamps in the request are ignored.
await store.saveResume('alice', ID_2, { baseRevision: null, fields: { ...fields(), revision: 99, plan: 'pro', uid: 'bob', createdAt: 'x', progress: 100, schemaVersion: 7 } })
const guarded = db.read(`users/alice/resumes/${ID_2}`)
assert.equal(guarded.revision, 1)
assert.equal(guarded.plan, undefined)
assert.equal(guarded.uid, undefined)
assert.equal(guarded.schemaVersion, 1)
assert.notEqual(guarded.progress, 100)

// Validation.
await rejects(() => store.saveResume('alice', ID, { baseRevision: 2, fields: { name: 'x' } }), 'invalid')
await rejects(() => store.saveResume('alice', ID, { baseRevision: 2, fields: null }), 'invalid')
await rejects(() => store.saveResume('alice', ID, { baseRevision: 'two', fields: fields() }), 'invalid')
await rejects(() => store.saveResume('alice', ID, { baseRevision: 2, fields: fields({ data: { notes: 'x'.repeat(MAX_RESUME_BYTES) } }) }), 'too_large')
const trimmed = validateResumeFields(fields({ name: `  ${'n'.repeat(300)}  `, templateId: '  ', sourceFileName: 42, parseMetadata: [1] }))
assert.equal(trimmed.name.length, 120)
assert.equal(trimmed.templateId, null)
assert.equal(trimmed.sourceFileName, '')
assert.equal(trimmed.parseMetadata, null)
assert.equal(validateResumeFields(fields({ name: '   ' })).name, 'Untitled resume')
// `undefined` (which Firestore rejects) is dropped.
assert.equal('gap' in validateResumeFields(fields({ data: { fullName: 'A', gap: undefined } })).data, false)

// Photos: base64 data URLs never reach Firestore; ordinary URLs stay.
const withPhotos = validateResumeFields(fields({ presentation: { accentColor: '#123456', photo: { source: 'data:image/png;base64,AAAA', originalSource: 'data:image/png;base64,BBBB', shape: 'circle' } } }))
assert.equal(withPhotos.presentation.photo.source, undefined)
assert.equal(withPhotos.presentation.photo.originalSource, undefined)
assert.equal(withPhotos.presentation.photo.shape, 'circle')
assert.equal(withPhotos.presentation.accentColor, '#123456')
assert.equal(validateResumeFields(fields({ presentation: { photo: { source: 'https://cdn.example.com/me.png' } } })).presentation.photo.source, 'https://cdn.example.com/me.png')

// Progress counts name, contact, summary, experience or projects, education and skills.
assert.equal(progressOf(null), 0)
assert.equal(progressOf({}), 0)
assert.equal(progressOf({ fullName: 'A', email: 'a@b.c', summary: 's', experience: [{}], education: [{}], skills: { languages: ['JS'] } }), 100)
assert.equal(progressOf({ fullName: 'A', skills: { languages: [], tools: [''] } }), 17)   // empty skill groups don't count
assert.equal(progressOf({ projects: [{}] }), 17)
assert.equal(db.read(`users/alice/resumes/${ID}`).progress, 33)

// Reading and listing return the API shape, newest first, with content.
const got = await store.getResume('alice', ID)
assert.equal(got.name, 'Renamed')
assert.equal(got.revision, 2)
assert.equal(got.data.fullName, 'Ada Lovelace')
assert.match(got.updatedAt, /^\d{4}-\d{2}-\d{2}T/)
assert.deepEqual((await store.listResumes('alice')).map(item => item.id), [ID_2, ID])   // ID_2 was written last
await store.saveResume('alice', ID, { baseRevision: 2, fields: fields({ name: 'Renamed' }) })
assert.deepEqual((await store.listResumes('alice')).map(item => item.id), [ID, ID_2])   // saving moves a resume to the top
assert.equal((await store.listResumes('alice', { limit: 1 })).length, 1)

// Ownership comes from the path: another user can't read, list or delete a resume by guessing its id.
await rejects(() => store.getResume('bob', ID), 'not_found')
assert.deepEqual(await store.listResumes('bob'), [])
await store.deleteResume('bob', ID)
assert.ok(db.read(`users/alice/resumes/${ID}`))
// And saving as bob never touches alice's document, even with alice's id.
await store.saveResume('bob', ID, { baseRevision: null, fields: fields({ name: 'Bob' }) })
assert.equal(db.read(`users/alice/resumes/${ID}`).name, 'Renamed')
assert.equal(db.read(`users/bob/resumes/${ID}`).name, 'Bob')

// Documents saved by the first version of the feature are read as revision 0 and upgraded on their next save.
const LEGACY = 'LegacyAutoId1234567890'.slice(0, 20)
db.seed(`users/alice/resumes/${LEGACY}`, { type: 'resume', title: 'Old one', status: 'draft', templateId: 'onyx', draftContent: { fullName: 'Grace' }, extractedData: {}, progress: { percent: 40 }, createdAt: '2026-10-09T10:00:00.000Z', updatedAt: '2026-10-09T11:00:00.000Z', lastEditedAt: '2026-10-09T11:00:00.000Z' })
const legacy = await store.getResume('alice', LEGACY)
assert.equal(legacy.name, 'Old one')
assert.equal(legacy.data.fullName, 'Grace')
assert.equal(legacy.progress, 40)
assert.equal(legacy.revision, 0)
assert.equal(legacy.updatedAt, '2026-10-09T11:00:00.000Z')
assert.equal(toApiResume('x', { draftContent: { resumeData: { fullName: 'Nested' } } }).data.fullName, 'Nested')   // the very first version wrapped it
await rejects(() => store.saveResume('alice', LEGACY, { baseRevision: null, fields: fields() }), 'conflict', error => assert.equal(error.serverRevision, 0))
await store.saveResume('alice', LEGACY, { baseRevision: 0, fields: fields({ name: 'Upgraded' }) })
const upgraded = db.read(`users/alice/resumes/${LEGACY}`)
assert.equal(upgraded.revision, 1)
assert.equal(upgraded.name, 'Upgraded')
for (const old of ['title', 'draftContent', 'lastEditedAt', 'status', 'type', 'extractedData']) assert.equal(old in upgraded, false, `${old} should be gone`)
assert.equal(upgraded.createdAt, '2026-10-09T10:00:00.000Z')

// Cost: a save is one read and one write (the old route did two of each).
const before = { ...db.stats }
await store.saveResume('alice', ID, { baseRevision: 3, fields: fields({ name: 'Cost check' }) })
assert.deepEqual({ reads: db.stats.reads - before.reads, writes: db.stats.writes - before.writes }, { reads: 1, writes: 1 })

// Rename: trimmed, counts as a change (revision + 1), refuses blanks, other users' resumes and deleted ones.
const renamed = await store.renameResume('alice', ID, '  Backend roles  ')
assert.deepEqual(renamed, { id: ID, name: 'Backend roles', revision: 5, updatedAt: '2026-10-11T10:00:00.000Z' })
assert.equal(db.read(`users/alice/resumes/${ID}`).name, 'Backend roles')
assert.equal(db.read(`users/alice/resumes/${ID}`).data.fullName, 'Ada Lovelace', 'rename leaves the content alone')
await rejects(() => store.saveResume('alice', ID, { baseRevision: 4, fields: fields() }), 'conflict', error => assert.equal(error.serverRevision, 5))
await rejects(() => store.renameResume('alice', ID, '   '), 'invalid')
await rejects(() => store.renameResume('alice', ID, 42), 'invalid')
await rejects(() => store.renameResume('carol', ID, 'Mine now'), 'not_found')
await rejects(() => store.renameResume('alice', 'f'.repeat(20), 'Nope'), 'not_found')
assert.equal((await store.renameResume('alice', ID, 'x'.repeat(500))).name.length, 120)

// Duplicate: a fresh document at revision 1, same content, "(copy)" name, the original untouched.
const COPY = '99999999-8888-4777-8666-555555555555'
const original = db.read(`users/alice/resumes/${ID}`)
const copy = await store.duplicateResume('alice', ID, COPY)
assert.equal(copy.id, COPY)
assert.equal(copy.revision, 1)
assert.equal(copy.name, `${'x'.repeat(120 - ' (copy)'.length)} (copy)`)
assert.equal(copy.data.fullName, 'Ada Lovelace')
const copied = db.read(`users/alice/resumes/${COPY}`)
assert.equal(copied.revision, 1)
assert.equal(copied.progress, original.progress)
assert.deepEqual(copied.data, original.data)
assert.deepEqual(db.read(`users/alice/resumes/${ID}`), original)
// Retrying with the same new id returns the same copy instead of making another or failing.
const writesBefore = db.stats.writes
assert.equal((await store.duplicateResume('alice', ID, COPY)).id, COPY)
assert.equal(db.stats.writes, writesBefore)
await rejects(() => store.duplicateResume('alice', ID, ID), 'invalid')
await rejects(() => store.duplicateResume('alice', 'e'.repeat(20), '0'.repeat(20)), 'not_found')
await rejects(() => store.duplicateResume('carol', ID, '1'.repeat(20)), 'not_found')
assert.equal(db.read(`users/carol/resumes/${'1'.repeat(20)}`), undefined)
await store.deleteResume('alice', COPY)
await store.renameResume('alice', ID, 'Cost check')

// Delete removes the resume and everything under it, and is safe to repeat.
db.seed(`users/alice/resumes/${ID}/versions/v1`, { reason: 'manual' })
await store.deleteResume('alice', ID)
assert.equal(db.read(`users/alice/resumes/${ID}`), undefined)
assert.equal(db.read(`users/alice/resumes/${ID}/versions/v1`), undefined)
await store.deleteResume('alice', ID)
assert.ok(db.read(`users/alice/resumes/${ID_2}`))

console.log('✓ resumeStore tests passed')
