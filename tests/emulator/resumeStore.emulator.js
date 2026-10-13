// Runs server/db/resumeStore.js against the real Firestore emulator, which the in-memory fake in
// tests/helpers/fakeFirestore.js can't stand in for: real transactions under contention, server timestamps,
// ordering, and recursiveDelete over subcollections.
//
//   npm run test:emulator        (needs the Firebase CLI and Java 21+; it starts and stops the emulator)
//
// Not part of `npm test`: without FIRESTORE_EMULATOR_HOST it exits 0 with a notice, so it can't hit production.
import assert from 'node:assert/strict'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createResumeStore, ResumeStoreError } from '../../server/db/resumeStore.js'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('- resumeStore emulator tests skipped (run `npm run test:emulator`)')
  process.exit(0)
}

const db = getFirestore(initializeApp({ projectId: 'demo-resumetrics' }, 'emulator-test'))
const store = createResumeStore({ getDb: () => db })
const uid = `user-${Date.now()}`
const id = n => `emulator-test-resume-${String(n).padStart(4, '0')}`
const fields = (overrides = {}) => ({ name: 'Emulator resume', templateId: 'onyx', data: { fullName: 'Ada Lovelace', email: 'ada@example.com' }, presentation: {}, ...overrides })
const rejects = async (work, code) => {
  try { await work() } catch (error) {
    assert.ok(error instanceof ResumeStoreError, `expected ResumeStoreError, got ${error}`)
    assert.equal(error.code, code)
    return error
  }
  assert.fail(`expected ${code}`)
}

// Create, update, stale write.
assert.equal((await store.saveResume(uid, id(1), { baseRevision: null, fields: fields() })).revision, 1)
assert.equal((await store.saveResume(uid, id(1), { baseRevision: 1, fields: fields({ name: 'Second' }) })).revision, 2)
assert.equal((await rejects(() => store.saveResume(uid, id(1), { baseRevision: 1, fields: fields() }), 'conflict')).serverRevision, 2)

// Two devices save from the same revision at once: exactly one wins, the other is told to reload.
const racers = await Promise.allSettled([
  store.saveResume(uid, id(1), { baseRevision: 2, fields: fields({ name: 'Device A' }) }),
  store.saveResume(uid, id(1), { baseRevision: 2, fields: fields({ name: 'Device B' }) })
])
assert.equal(racers.filter(result => result.status === 'fulfilled').length, 1, 'exactly one concurrent save wins')
const loser = racers.find(result => result.status === 'rejected')
assert.equal(loser.reason.code, 'conflict')
assert.equal((await store.getResume(uid, id(1))).revision, 3)

// Server timestamps come back as ISO strings; list is newest first and a rename moves a resume to the top.
await store.saveResume(uid, id(2), { baseRevision: null, fields: fields({ name: 'Newer' }) })
let list = await store.listResumes(uid)
assert.deepEqual(list.map(resume => resume.id), [id(2), id(1)])
assert.match(list[0].updatedAt, /^\d{4}-\d{2}-\d{2}T/)
const renamed = await store.renameResume(uid, id(1), 'Renamed')
assert.equal(renamed.revision, 4)
list = await store.listResumes(uid)
assert.deepEqual(list.map(resume => resume.id), [id(1), id(2)])
assert.equal(list[0].name, 'Renamed')

// Duplicate, including a repeated request with the same new id.
const copy = await store.duplicateResume(uid, id(1), id(3))
assert.equal(copy.name, 'Renamed (copy)')
assert.equal(copy.revision, 1)
assert.equal((await store.duplicateResume(uid, id(1), id(3))).id, id(3))
assert.equal((await store.listResumes(uid)).length, 3)

// Another user's namespace is untouched.
assert.equal((await store.listResumes(`${uid}-other`)).length, 0)
await rejects(() => store.renameResume(`${uid}-other`, id(1), 'Nope'), 'not_found')

// Delete removes subcollections too, and repeating it is fine.
await db.doc(`users/${uid}/resumes/${id(1)}/versions/v1`).set({ reason: 'manual' })
await store.deleteResume(uid, id(1))
assert.equal((await db.doc(`users/${uid}/resumes/${id(1)}/versions/v1`).get()).exists, false)
await store.deleteResume(uid, id(1))
await store.deleteResume(uid, id(2))
await store.deleteResume(uid, id(3))
assert.equal((await store.listResumes(uid)).length, 0)

console.log('✓ resumeStore emulator tests passed')
