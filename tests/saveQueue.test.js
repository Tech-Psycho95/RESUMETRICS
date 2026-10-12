import assert from 'node:assert/strict'
import { createSaveQueue } from '../src/db/saveQueue.js'
import { SaveError } from '../src/db/saveError.js'

// A fake clock: timers fire only when the test advances time, and awaited work is flushed between steps.
function createClock() {
  let time = 0
  let nextId = 1
  const timers = new Map()
  return {
    now: () => time,
    setTimer: (callback, wait) => { const id = nextId++; timers.set(id, { at: time + wait, callback }); return id },
    clearTimer: id => { timers.delete(id) },
    pending: () => timers.size,
    async advance(ms) {
      const target = time + ms
      for (;;) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
        if (!due) break
        time = Math.max(time, due[1].at)
        timers.delete(due[0])
        due[1].callback()
        await settle()
      }
      time = target
      await settle()
    }
  }
}
const settle = async () => { for (let index = 0; index < 20; index += 1) await Promise.resolve() }

// A send() whose results the test controls.
function createSender() {
  const calls = []
  let script = []
  const sender = {
    calls,
    script: (...steps) => { script = steps },
    send: async call => {
      calls.push(call)
      const step = script.shift() ?? { revision: (call.baseRevision ?? 0) + 1 }
      const value = typeof step === 'function' ? await step(call) : step
      if (value instanceof Error) throw value
      return value
    }
  }
  return sender
}
const defer = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
const A = { name: 'A', data: { fullName: 'Ada' } }
const B = { name: 'B', data: { fullName: 'Ada L' } }
const C = { name: 'C', data: { fullName: 'Ada Lo' } }

function setup(options = {}) {
  const clock = createClock()
  const sender = createSender()
  const changes = []
  const queue = createSaveQueue({ send: sender.send, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer, onChange: change => changes.push(change), ...options })
  return { clock, sender, changes, queue }
}

// Debounce: nothing is sent until 3 s after the last edit.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1, savedHash: null })
  queue.update(A)
  await clock.advance(2999)
  assert.equal(sender.calls.length, 0)
  queue.update(B)   // another edit restarts the wait
  await clock.advance(2999)
  assert.equal(sender.calls.length, 0)
  await clock.advance(1)
  assert.equal(sender.calls.length, 1)
  assert.deepEqual(sender.calls[0], { id: 'doc-1', baseRevision: 1, fields: B, keepalive: false })
  assert.equal(queue.state.status, 'saved')
  assert.equal(queue.state.revision, 2)
}

// Max wait: constant typing still saves 20 s after the first unsaved edit.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  for (let second = 0; second < 25; second += 1) {
    queue.update({ name: 'A', data: { fullName: `Ada ${second}` } })
    await clock.advance(1000)
  }
  assert.equal(sender.calls.length, 1, 'one save during 25 s of constant typing')
  assert.equal(sender.calls[0].fields.data.fullName, 'Ada 19', 'sent at the 20 s mark with the newest content')
}

// Unchanged content is never sent, even with keys in another order (Firestore doesn't keep key order).
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  queue.update(A)
  await clock.advance(3000)
  assert.equal(sender.calls.length, 1)
  queue.update({ data: { fullName: 'Ada' }, name: 'A' })
  assert.equal(clock.pending(), 0, 'no save is scheduled for identical content')
  await clock.advance(30_000)
  assert.equal(sender.calls.length, 1)
  assert.equal(queue.state.status, 'saved')
}

// Opening a saved resume: its hash is the baseline, so opening it doesn't save it again.
{
  const { clock, sender, queue } = setup()
  const first = setup()
  first.queue.target({ id: 'x', revision: 1 })
  first.queue.update(A)
  await first.clock.advance(3000)
  const { savedHash } = first.queue.state
  queue.target({ id: 'doc-1', revision: 5, savedHash })
  queue.update(A)
  await clock.advance(10_000)
  assert.equal(sender.calls.length, 0)
  queue.update(B)
  await clock.advance(3000)
  assert.equal(sender.calls[0].baseRevision, 5)
}

// One request at a time. Edits during a request wait out the debounce again, then save only the newest content.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  const gate = defer()
  sender.script(async () => { await gate.promise; return { revision: 2 } })
  queue.update(A)
  await clock.advance(3000)
  assert.equal(queue.state.status, 'saving')
  queue.update(B)
  queue.update(C)
  await clock.advance(10_000)
  assert.equal(sender.calls.length, 1, 'nothing overlaps')
  gate.resolve()
  await settle()
  assert.equal(sender.calls.length, 1, 'no instant second request: the debounce applies again')
  assert.equal(queue.state.status, 'dirty')
  await clock.advance(3000)
  assert.equal(sender.calls.length, 2)
  assert.deepEqual(sender.calls[1].fields, C)
  assert.equal(sender.calls[1].baseRevision, 2, 'the next save is based on the revision the first one made')
  assert.equal(queue.state.revision, 3)
}

// A new document starts at revision null, and a blank one is not worth saving yet.
{
  const { clock, sender, queue } = setup({ shouldSave: fields => Boolean(fields.data.fullName) })
  queue.target({ id: 'new-doc', revision: null })
  queue.update({ name: 'Untitled', data: { fullName: '' } })
  await clock.advance(30_000)
  assert.equal(sender.calls.length, 0)
  queue.update(A)
  await clock.advance(3000)
  assert.equal(sender.calls.length, 1)
  assert.equal(sender.calls[0].baseRevision, null)
  assert.equal(queue.state.revision, 1)
  // Once it exists, a blank version is saved too (the person cleared it on purpose).
  queue.update({ name: 'Untitled', data: { fullName: '' } })
  await clock.advance(3000)
  assert.equal(sender.calls.length, 2)
}

// Conflict: autosave stops instead of overwriting; Keep mine saves over the server's revision.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  sender.script(new SaveError('conflict', 'changed', { serverRevision: 4 }))
  queue.update(A)
  await clock.advance(3000)
  assert.equal(queue.state.status, 'conflict')
  queue.update(B)
  await clock.advance(60_000)
  assert.equal(sender.calls.length, 1, 'no more requests while in conflict')
  await assert.rejects(() => queue.flush(), error => error.kind === 'conflict')
  assert.equal(sender.calls.length, 1)
  await queue.keepMine()
  assert.equal(sender.calls.length, 2)
  assert.deepEqual(sender.calls[1], { id: 'doc-1', baseRevision: 4, fields: B, keepalive: false })
  assert.equal(queue.state.status, 'saved')
  assert.equal(queue.state.revision, 5)
}

// Deleted on another device: Keep mine recreates it.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 3 })
  sender.script(new SaveError('not_found', 'gone'))
  queue.update(A)
  await clock.advance(3000)
  assert.equal(queue.state.status, 'conflict')
  await queue.keepMine()
  assert.equal(sender.calls[1].baseRevision, null)
  assert.equal(queue.state.revision, 1)
}

// Offline: the draft stays dirty, retries after 2 s then 5 s, and ends up saved.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  sender.script(new SaveError('network', 'offline'), new SaveError('network', 'offline'), { revision: 2 })
  queue.update(A)
  await clock.advance(3000)
  assert.equal(sender.calls.length, 1)
  assert.equal(queue.state.status, 'offline')
  await clock.advance(1999)
  assert.equal(sender.calls.length, 1)
  await clock.advance(1)
  assert.equal(sender.calls.length, 2)
  assert.equal(queue.state.status, 'offline')
  await clock.advance(4999)
  assert.equal(sender.calls.length, 2)
  await clock.advance(1)
  assert.equal(sender.calls.length, 3)
  assert.equal(queue.state.status, 'saved')
  assert.deepEqual(sender.calls.map(call => call.baseRevision), [1, 1, 1], 'a failed save never advances the revision')
}

// A first save that failed on the wire may have reached the server: the 409 on retry is adopted, not treated as a conflict.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'new-doc', revision: null })
  sender.script(new SaveError('network', 'dropped'), new SaveError('conflict', 'exists', { serverRevision: 1 }), { revision: 2 })
  queue.update(A)
  await clock.advance(3000)
  await clock.advance(2000)
  assert.equal(queue.state.status, 'saved')
  assert.deepEqual(sender.calls.map(call => call.baseRevision), [null, null, 1])
  assert.equal(queue.state.revision, 2)
}
// …but a 409 on a first save with no earlier uncertainty is a real conflict.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'new-doc', revision: null })
  sender.script(new SaveError('conflict', 'exists', { serverRevision: 1 }))
  queue.update(A)
  await clock.advance(3000)
  assert.equal(queue.state.status, 'conflict')
}

// Too large / invalid: not retried for the same content, tried again once it changes.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  sender.script(new SaveError('too_large', 'too big'))
  queue.update(A)
  await clock.advance(3000)
  assert.equal(queue.state.status, 'error')
  assert.equal(queue.state.error.kind, 'too_large')
  await clock.advance(120_000)
  assert.equal(sender.calls.length, 1)
  queue.update(A)
  await clock.advance(120_000)
  assert.equal(sender.calls.length, 1, 'same content stays blocked')
  queue.update(B)
  await clock.advance(3000)
  assert.equal(sender.calls.length, 2)
  assert.equal(queue.state.status, 'saved')
}

// Manual save and leaving the page: flush sends right away, chains until nothing is left, and reports failure.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  queue.update(A)
  await queue.flush({ keepalive: true })
  assert.equal(sender.calls.length, 1)
  assert.equal(sender.calls[0].keepalive, true)
  assert.equal(clock.pending(), 0, 'the debounce timer was cancelled')

  const gate = defer()
  sender.script(async () => { await gate.promise; return { revision: 3 } })
  queue.update(B)
  const flushing = queue.flush()
  await settle()
  queue.update(C)   // typed while the manual save is in flight
  gate.resolve()
  await flushing
  assert.equal(sender.calls.length, 3, 'flush kept going until the newest content was saved')
  assert.deepEqual(sender.calls[2].fields, C)
  assert.equal(queue.state.status, 'saved')

  sender.script(new SaveError('server', 'boom'))
  queue.update(A)
  await assert.rejects(() => queue.flush(), error => error.kind === 'server')
  assert.equal(queue.state.status, 'error')
  assert.equal(clock.pending(), 1, 'and a retry is scheduled')
}

// Regression: flushing when there is nothing to save must not wedge the queue.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  await queue.flush()
  await queue.flush()
  queue.update(A)
  await clock.advance(3000)
  assert.equal(sender.calls.length, 1)
}

// Switching drafts mid-request: the old result is ignored and the new draft is untouched.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  const gate = defer()
  sender.script(async () => { await gate.promise; return { revision: 2 } })
  queue.update(A)
  await clock.advance(3000)
  queue.target({ id: 'doc-2', revision: 7 })
  gate.resolve()
  await settle()
  assert.equal(queue.state.id, 'doc-2')
  assert.equal(queue.state.revision, 7)
  assert.equal(queue.state.savedHash, null)
  queue.update(B)
  await clock.advance(3000)
  assert.deepEqual(sender.calls[1], { id: 'doc-2', baseRevision: 7, fields: B, keepalive: false })
}

// stop() cancels timers (leaving the editor); the next update schedules again.
{
  const { clock, sender, queue } = setup()
  queue.target({ id: 'doc-1', revision: 1 })
  queue.update(A)
  queue.stop()
  await clock.advance(30_000)
  assert.equal(sender.calls.length, 0)
  queue.update(B)
  await clock.advance(3000)
  assert.equal(sender.calls.length, 1)
}

// Without a document id nothing is sent.
{
  const { clock, sender, queue } = setup()
  queue.update(A)
  await clock.advance(30_000)
  assert.equal(sender.calls.length, 0)
}

console.log('✓ saveQueue tests passed')
