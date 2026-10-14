import assert from 'node:assert/strict'
import { createResumeStore, ResumeStoreError } from '../server/db/resumeStore.js'
import { COUNTED_DELETE_PERCENT, FREE_RESUME_LIMIT, isProPlan } from '../shared/plans.js'
import { resumeCompletion } from '../shared/resumeCompletion.js'
import { publicPlan } from '../server/db/userStore.js'
import { createFakeFirestore } from './helpers/fakeFirestore.js'

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const empty = { name: 'Draft', templateId: 'onyx', data: { fullName: 'Ada' }, presentation: {} }
const complete = {
  name: 'Finished', templateId: 'onyx', presentation: {},
  data: {
    fullName: 'Ada Lovelace', email: 'ada@example.com', phone: '+91 90000 00000', location: 'Pune', headline: 'Software Engineer',
    summary: Array.from({ length: 32 }, (_, i) => `word${i}`).join(' '),
    experience: [{ role: 'Engineer', company: 'Acme', bullets: ['Built things', 'Shipped things'] }],
    education: [{ degree: 'B.Tech' }], skills: { core: ['React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS'] },
    projects: [{ name: 'Engine' }], links: ['https://github.com/ada']
  }
}
const rejectsLimit = async work => {
  try { await work() } catch (error) {
    assert.ok(error instanceof ResumeStoreError)
    assert.equal(error.code, 'plan_limit')
    assert.equal(error.limit, FREE_RESUME_LIMIT)
    return
  }
  assert.fail('expected plan_limit')
}

assert.equal(FREE_RESUME_LIMIT, 2)
assert.equal(resumeCompletion(complete.data), 100)
assert.ok(resumeCompletion(empty.data) < COUNTED_DELETE_PERCENT)
assert.equal(resumeCompletion(null), 0)

// Plans: lifetime has no end; monthly/yearly stop at currentPeriodEnd; anything not active is free.
assert.equal(isProPlan({ tier: 'pro', status: 'active', term: 'lifetime' }), true)
assert.equal(isProPlan({ tier: 'pro', status: 'active', currentPeriodEnd: '2026-01-01T00:00:00Z' }, Date.parse('2026-02-01')), false)
assert.equal(isProPlan({ tier: 'pro', status: 'active', currentPeriodEnd: '2026-03-01T00:00:00Z' }, Date.parse('2026-02-01')), true)
assert.equal(isProPlan({ tier: 'pro', status: 'halted' }), false)
assert.equal(isProPlan(null), false)
assert.deepEqual(publicPlan({ tier: 'pro', status: 'active', term: 'lifetime', source: 'developer', razorpaySubscriptionId: 'sub_x' }), { tier: 'pro', status: 'active', term: 'lifetime', source: 'developer', currentPeriodEnd: null })
assert.equal(publicPlan({ tier: 'enterprise' }).tier, 'free')

const db = createFakeFirestore()
const store = createResumeStore({ getDb: () => db, timestamp: db.timestamp, now: () => new Date('2026-10-14T10:00:00Z'), checkpointMs: Infinity })
const save = (uid, n, fields) => store.saveResume(uid, id(n), { baseRevision: null, fields })

// Free: two resumes, the third is refused and nothing is written.
await save('free', 1, empty)
await save('free', 2, complete)
assert.deepEqual(await store.resumeAllowance('free'), { used: 2, limit: 2 })
await rejectsLimit(() => save('free', 3, empty))
assert.equal(db.read(`users/free/resumes/${id(3)}`), undefined)
// Updating an existing resume never needs a slot.
await store.saveResume('free', id(1), { baseRevision: 1, fields: { ...empty, name: 'Renamed' } })

// Deleting a resume under 75% complete gives the slot back...
await store.deleteResume('free', id(1))
assert.deepEqual(await store.resumeAllowance('free'), { used: 1, limit: 2 })
await store.deleteResume('free', id(1))   // a retried delete doesn't give it back twice
assert.deepEqual(await store.resumeAllowance('free'), { used: 1, limit: 2 })
await save('free', 4, empty)
await rejectsLimit(() => save('free', 5, empty))

// ...a resume at 75% or more keeps counting after it is deleted.
await store.deleteResume('free', id(2))
assert.deepEqual(await store.resumeAllowance('free'), { used: 2, limit: 2 })
await rejectsLimit(() => save('free', 6, empty))

// Duplicating takes a slot too.
const dupDb = createFakeFirestore()
const dupStore = createResumeStore({ getDb: () => dupDb, timestamp: dupDb.timestamp, checkpointMs: Infinity })
await dupStore.saveResume('dup', id(1), { baseRevision: null, fields: empty })
await dupStore.duplicateResume('dup', id(1), id(2))
await rejectsLimit(() => dupStore.duplicateResume('dup', id(1), id(3)))
assert.equal(dupDb.read('users/dup').resumesCounted, 2)

// Accounts from before the counter start at the number of resumes they have; they keep them but can't add more.
db.seed('users/legacy', { plan: { tier: 'free', status: 'active' } })
for (const n of [1, 2, 3]) db.seed(`users/legacy/resumes/${id(n)}`, { name: `Old ${n}`, data: {}, revision: 1 })
assert.deepEqual(await store.resumeAllowance('legacy'), { used: 3, limit: 2 })
await rejectsLimit(() => save('legacy', 4, empty))
await store.deleteResume('legacy', id(1))
assert.equal(db.read('users/legacy').resumesCounted, 2)

// Pro: no limit, but resumes are still counted (so the count is right if the plan ends).
db.seed('users/pro', { plan: { tier: 'pro', status: 'active', term: 'lifetime', source: 'developer' } })
for (const n of [1, 2, 3, 4]) await save('pro', n, empty)
assert.deepEqual(await store.resumeAllowance('pro'), { used: 4, limit: null })

// A lapsed monthly plan is free again.
db.seed('users/lapsed', { plan: { tier: 'pro', status: 'active', term: 'monthly', currentPeriodEnd: '2026-09-01T00:00:00Z' }, resumesCounted: 2 })
await rejectsLimit(() => save('lapsed', 1, empty))

console.log('✓ resumeQuota tests passed')
