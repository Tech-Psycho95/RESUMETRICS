import { useCallback, useEffect, useRef, useState } from 'react'
import { createSaveQueue } from '../db/saveQueue.js'
import { hasContent } from '../db/resumeFields.js'
import { saveResume } from '../utils/userApi.js'

/**
 * Saves the open draft to the cloud: 3 s after the last edit (at most 20 s after the first unsaved one), when the
 * tab is hidden or closed, when the editor unmounts and when the connection returns. See src/db/saveQueue.js.
 *
 * cloud:         { id, revision, savedHash } of the open draft (null until it has an id). The caller owns it so it
 *                survives a refresh; this hook reports changes through onCloudChange.
 * fields:        the current saved shape of the draft (src/db/resumeFields.js buildResumeFields), memoised.
 * enabled:       signed in and the editor is showing a draft.
 * Returns { status, error, lastSavedAt, saveNow, keepMine }.
 */
export function useResumeAutosave({ cloud, onCloudChange, fields, enabled }) {
  const [info, setInfo] = useState({ status: 'idle', error: null, lastSavedAt: null })
  const notifyRef = useRef(onCloudChange)
  notifyRef.current = onCloudChange
  const knownCloudRef = useRef(cloud)
  knownCloudRef.current = cloud
  const queueRef = useRef(null)

  if (!queueRef.current) {
    queueRef.current = createSaveQueue({
      send: ({ id, baseRevision, fields: payload, keepalive }) => saveResume(id, baseRevision, payload, { keepalive }),
      // A just-started blank template isn't worth a cloud document until something is typed.
      shouldSave: payload => hasContent(payload.data),
      onChange: ({ status, error, lastSavedAt, id, revision, savedHash }) => {
        setInfo({ status, error, lastSavedAt })
        const known = knownCloudRef.current
        if (id && (known?.id !== id || known.revision !== revision || known.savedHash !== savedHash)) notifyRef.current?.({ id, revision, savedHash })
      }
    })
  }
  const queue = queueRef.current

  // Declared before the update effect: when a draft gets its id, the queue must be pointed at it first.
  useEffect(() => {
    if ((cloud?.id ?? null) !== queue.state.id) queue.target(cloud?.id ? cloud : { id: null })
  }, [cloud, queue])

  useEffect(() => {
    if (enabled && cloud?.id && fields) queue.update(fields)
  }, [enabled, cloud?.id, fields, queue])

  useEffect(() => {
    const flush = () => { queue.flush({ keepalive: true }).catch(() => {}) }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    const onOnline = () => { queue.flush().catch(() => {}) }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('online', onOnline)
      // Leaving the editor: send what is unsaved, then stop retrying in the background.
      flush()
      queue.stop()
    }
  }, [queue])

  const saveNow = useCallback(() => queue.flush(), [queue])
  const keepMine = useCallback(() => queue.keepMine().catch(() => {}), [queue])
  return { ...info, saveNow, keepMine }
}
