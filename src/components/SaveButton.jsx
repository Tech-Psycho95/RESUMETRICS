import { useState } from 'react'

const LABELS = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'All changes saved',
  offline: 'Offline — will retry',
  error: 'Couldn’t save',
  conflict: 'Changed somewhere else'
}

/**
 * Cloud save status plus a manual Save. Autosave runs on its own (useResumeAutosave); this shows what it is
 * doing so a failed save is never silent.
 *
 * status:     idle | dirty | saving | saved | offline | error | conflict
 * onSave:     () => Promise, rejects when saving fails
 * onKeepMine / onUseServer: the two ways out of a conflict
 */
export function SaveButton({ status = 'idle', error = null, onSave, onKeepMine, onUseServer }) {
  const [manualError, setManualError] = useState('')
  const busy = status === 'saving'

  const save = async () => {
    setManualError('')
    try {
      await onSave()
    } catch (failure) {
      setManualError(failure?.message || 'Couldn’t save.')
    }
  }

  if (status === 'conflict') {
    return <span className="save-status is-conflict" role="alert">
      <span>{error?.kind === 'not_found' ? 'Deleted on another device' : LABELS.conflict}</span>
      <button className="btn btn-secondary" type="button" onClick={onKeepMine}>{error?.kind === 'not_found' ? 'Recreate mine' : 'Keep mine'}</button>
      {error?.kind !== 'not_found' && <button className="btn btn-ghost" type="button" onClick={onUseServer}>Use the other</button>}
    </span>
  }

  const label = manualError || (status === 'error' && error?.message) || LABELS[status] || ''
  const bad = Boolean(manualError) || status === 'error' || status === 'offline'
  return <span className={`save-status${bad ? ' is-bad' : ''}`}>
    <span className="save-status-label" role="status" aria-live="polite" title={label}>{label}</span>
    <button className="btn btn-ghost" type="button" disabled={busy} onClick={save} title="Save your resume now">{busy ? 'Saving…' : 'Save'}</button>
  </span>
}
