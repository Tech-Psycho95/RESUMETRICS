import assert from 'node:assert/strict'
import { createMemoryUsageStore } from '../server/ai/usage.js'
import { createFirestoreUsageStore, createResilientUsageStore } from '../server/ai/usageStore.js'
import { createFakeFirestore } from './helpers/fakeFirestore.js'

const db = createFakeFirestore()
const store = createFirestoreUsageStore({ getDb: () => db, increment: db.increment, timestamp: db.timestamp })

// Empty until something is recorded; one document per user per day.
assert.deepEqual(await store.get('alice', '2026-10-13'), { calls: 0, tokensIn: 0, tokensOut: 0, limitedCalls: 0 })
assert.equal(db.read('users/alice/usage/2026-10-13'), undefined)

// Counters add up, and overlapping writes don't lose counts.
await store.add('alice', '2026-10-13', { calls: 1, tokensIn: 100, tokensOut: 40 })
const totals = await store.add('alice', '2026-10-13', { calls: 1, tokensIn: 10, tokensOut: 5 })
assert.deepEqual(totals, { calls: 2, tokensIn: 110, tokensOut: 45, limitedCalls: 0 })
await Promise.all(Array.from({ length: 20 }, () => store.add('alice', '2026-10-13', { calls: 1, tokensIn: 1 })))
assert.deepEqual(await store.get('alice', '2026-10-13'), { calls: 22, tokensIn: 130, tokensOut: 45, limitedCalls: 0 })
await store.add('alice', '2026-10-13', { limitedCalls: 1 })
assert.equal((await store.get('alice', '2026-10-13')).limitedCalls, 1)
assert.ok(db.read('users/alice/usage/2026-10-13').updatedAt, 'stamped with the last update time')

// A new day, and another user, start from zero.
assert.equal((await store.get('alice', '2026-10-14')).calls, 0)
assert.equal((await store.get('bob', '2026-10-13')).calls, 0)
assert.equal(db.read('users/bob/usage/2026-10-13'), undefined)

// Only counters are written (a delta of zero adds nothing).
await store.add('carol', '2026-10-13', { calls: 1, tokensIn: 0 })
const carol = db.read('users/carol/usage/2026-10-13')
assert.equal(carol.calls, 1)
assert.equal('tokensIn' in carol, false)

// Cost: recording is one write and one read.
const before = { ...db.stats }
await store.add('alice', '2026-10-13', { calls: 1 })
assert.deepEqual({ reads: db.stats.reads - before.reads, writes: db.stats.writes - before.writes }, { reads: 1, writes: 1 })

// When the database is down the in-memory store takes over, loudly but only once a minute.
const broken = { get: async () => { throw new Error('Firestore down') }, add: async () => { throw new Error('Firestore down') } }
let clock = 1_000_000
const resilient = createResilientUsageStore(broken, createMemoryUsageStore(), { now: () => clock })
const errors = []
const original = console.error
console.error = (...args) => errors.push(args.join(' '))
try {
  assert.equal((await resilient.add('dave', '2026-10-13', { calls: 1, tokensIn: 7 })).tokensIn, 7)
  assert.equal((await resilient.add('dave', '2026-10-13', { calls: 1, tokensIn: 3 })).tokensIn, 10)
  assert.equal((await resilient.get('dave', '2026-10-13')).calls, 2)
  assert.equal(errors.length, 1, 'logged once, not on every call')
  clock += 61_000
  await resilient.get('dave', '2026-10-13')
  assert.equal(errors.length, 2)
} finally {
  console.error = original
}
// A healthy primary is used as is.
const healthy = createResilientUsageStore(store, createMemoryUsageStore())
assert.equal((await healthy.add('erin', '2026-10-13', { calls: 1 })).calls, 1)
assert.equal(db.read('users/erin/usage/2026-10-13').calls, 1)

console.log('✓ usageStore tests passed')
