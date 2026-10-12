import { hashFields } from './resumeFields.js'

// Decides when the draft is saved to the cloud, one request at a time, without any React or network code
// so it can be tested with a fake clock. The React hook (src/hooks/useResumeAutosave.js) wraps it.
//
//  - Waits `delayMs` after the last edit, but never longer than `maxWaitMs` after the first unsaved edit.
//  - Skips a save when the content is identical to what is already saved.
//  - One request in flight; edits made meanwhile are saved right after, newest content only.
//  - Every save carries the revision it was based on; a 409 stops autosave ('conflict') instead of overwriting.
//  - Network and server errors keep the draft dirty and retry with a growing delay.

export const SAVE_STATUS = Object.freeze({ idle: 'idle', dirty: 'dirty', saving: 'saving', saved: 'saved', offline: 'offline', error: 'error', conflict: 'conflict' })

const RETRY_DELAYS = [2000, 5000, 15000, 60000]

export function createSaveQueue({ send, shouldSave = () => true, delayMs = 3000, maxWaitMs = 20000, setTimer = setTimeout, clearTimer = clearTimeout, now = Date.now, onChange = () => {} }) {
  let id = null
  let revision = null
  let savedHash = null
  let blockedHash = null     // content the server refused (too large, invalid): not retried until it changes
  let latest = null
  let latestHash = null
  let firstDirtyAt = null
  let timer = null
  let running = null
  let generation = 0
  let attempts = 0
  let createUncertain = false  // a first save may have reached the server even though we saw an error
  let disposed = false
  let state = { status: SAVE_STATUS.idle, error: null, lastSavedAt: null }

  const emit = (patch = {}) => {
    state = { ...state, ...patch }
    onChange({ ...state, id, revision, savedHash })
  }
  const clearScheduled = () => { if (timer !== null) { clearTimer(timer); timer = null } }
  const isDirty = () => latest !== null && latestHash !== savedHash && latestHash !== blockedHash && (revision !== null || shouldSave(latest))

  function schedule(wait) {
    clearScheduled()
    if (disposed) return
    timer = setTimer(() => { timer = null; drain().catch(() => {}) }, Math.max(0, wait))
  }

  // One request at a time. Automatic saves stop after each success and wait out the debounce again if more edits
  // arrived meanwhile; `chain` (manual Save, leaving the editor) keeps going until nothing is left unsaved.
  function drain({ keepalive = false, chain = false } = {}) {
    if (running) return running
    const run = (async () => {
      while (isDirty() && state.status !== SAVE_STATUS.conflict) {
        const job = { id, generation, baseRevision: revision, fields: latest, hash: latestHash }
        emit({ status: SAVE_STATUS.saving, error: null })
        try {
          const result = await send({ id: job.id, baseRevision: job.baseRevision, fields: job.fields, keepalive })
          if (job.generation !== generation) return   // the draft was switched while this was in flight
          revision = result.revision
          savedHash = job.hash
          createUncertain = false
          attempts = 0
          blockedHash = null
          if (isDirty() && !chain) {
            firstDirtyAt = now()
            emit({ status: SAVE_STATUS.dirty, error: null, lastSavedAt: now() })
            schedule(delayMs)
            return
          }
          firstDirtyAt = null
          emit({ status: isDirty() ? SAVE_STATUS.dirty : SAVE_STATUS.saved, error: null, lastSavedAt: now() })
        } catch (error) {
          if (job.generation !== generation) return
          handleFailure(error, job)
          if (state.status !== SAVE_STATUS.dirty) throw error   // stop the loop; manual saves see the failure
        }
      }
    })()
    running = run
    const clear = () => { if (running === run) running = null }
    run.then(clear, clear)
    return run
  }

  // Sets state for a failed save; leaves status 'dirty' when the loop should simply go round again.
  function handleFailure(error, job) {
    const kind = error?.kind
    if (kind === 'conflict' && createUncertain && Number.isInteger(error.serverRevision)) {
      // Our own first save probably landed before the connection dropped: carry on from the revision it made.
      revision = error.serverRevision
      createUncertain = false
      emit({ status: SAVE_STATUS.dirty, error: null })
      return
    }
    if (kind === 'conflict' || kind === 'not_found') {
      emit({ status: SAVE_STATUS.conflict, error })
      return
    }
    if (kind === 'too_large' || kind === 'invalid') {
      blockedHash = job.hash
      emit({ status: SAVE_STATUS.error, error })
      return
    }
    if (kind === 'network' || kind === 'server' || kind === 'busy') {
      if (revision === null) createUncertain = true
      emit({ status: kind === 'network' ? SAVE_STATUS.offline : SAVE_STATUS.error, error })
      schedule(RETRY_DELAYS[Math.min(attempts, RETRY_DELAYS.length - 1)])
      attempts += 1
      return
    }
    emit({ status: SAVE_STATUS.error, error })   // auth and anything unexpected: the next edit tries again
  }

  return {
    /** Start tracking a draft. `savedHash` is the hash of what the cloud already holds (null: unknown or new). */
    target({ id: nextId, revision: nextRevision = null, savedHash: nextHash = null }) {
      clearScheduled()
      generation += 1
      id = nextId
      revision = nextRevision
      savedHash = nextHash
      blockedHash = null
      latest = null
      latestHash = null
      firstDirtyAt = null
      attempts = 0
      createUncertain = false
      running = null
      emit({ status: SAVE_STATUS.idle, error: null, lastSavedAt: null })
    },

    /** The editor's current content. Cheap to call on every change. */
    update(fields) {
      if (!id || disposed) return
      latest = fields
      latestHash = hashFields(fields)
      if (state.status === SAVE_STATUS.conflict) return
      if (!isDirty()) {
        if (latestHash === savedHash) { clearScheduled(); firstDirtyAt = null; if (state.status === SAVE_STATUS.dirty || state.status === SAVE_STATUS.error || state.status === SAVE_STATUS.offline) emit({ status: savedHash ? SAVE_STATUS.saved : SAVE_STATUS.idle, error: null }) }
        return
      }
      if (running) return   // the loop picks up the newest content when the current request ends
      firstDirtyAt ??= now()
      if (state.status !== SAVE_STATUS.dirty) emit({ status: SAVE_STATUS.dirty, error: null })
      schedule(Math.min(delayMs, firstDirtyAt + maxWaitMs - now()))
    },

    /** Save now (manual Save, tab hidden, leaving the editor). Rejects with the SaveError when it fails. */
    async flush({ keepalive = false } = {}) {
      clearScheduled()
      if (running) { try { await running } catch { /* reported below if still dirty */ } }
      if (state.status === SAVE_STATUS.conflict && latest !== null) throw state.error
      await drain({ keepalive, chain: true })
    },

    /** Keep my version: save over the newer server copy, or recreate the resume if it was deleted elsewhere. */
    keepMine() {
      if (state.status !== SAVE_STATUS.conflict) return Promise.resolve()
      if (state.error?.kind === 'not_found') revision = null
      else if (Number.isInteger(state.error?.serverRevision)) revision = state.error.serverRevision
      emit({ status: SAVE_STATUS.dirty, error: null })
      return drain({ chain: true })
    },

    /** Cancel any scheduled save or retry (leaving the editor). A later update() schedules again. */
    stop: clearScheduled,

    get state() { return { ...state, id, revision, savedHash } },
    dispose() { disposed = true; clearScheduled() }
  }
}
