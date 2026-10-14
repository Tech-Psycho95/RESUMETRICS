import { useCallback, useEffect, useRef, useState } from 'react'
import { listVersions, restoreVersion, saveVersion } from '../utils/userApi.js'

const REASONS = {
  manual: 'Saved by you',
  auto: 'Automatic checkpoint',
  'before-restore': 'Before a restore'
}

function whenLabel(iso) {
  const time = Date.parse(iso)
  if (!time) return ''
  return new Date(time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Version history for the open resume: save a version now, or go back to an earlier one.
 *
 * resumeId:   the cloud id of the open resume
 * enabled:    false until the resume has been saved once (there is nothing to version before that)
 * onBeforeChange: () => Promise, sends unsaved edits first so they are part of what gets versioned or replaced
 * onRestored: () => Promise, reloads the resume the server now holds
 */
export function VersionHistory({ resumeId, enabled, onBeforeChange, onRestored }) {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState(null)   // null = not loaded
  const [busy, setBusy] = useState('')              // '' | 'load' | 'save' | a version id being restored
  const [confirmId, setConfirmId] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const wrapRef = useRef(null)

  const load = useCallback(async () => {
    setBusy('load')
    setError('')
    try {
      setVersions(await listVersions(resumeId))
    } catch (failure) {
      setError(failure?.message || 'Could not load the history.')
    } finally {
      setBusy('')
    }
  }, [resumeId])

  // A different resume is a different history.
  useEffect(() => { setVersions(null); setConfirmId(null); setNotice(''); setError('') }, [resumeId])
  useEffect(() => { if (open && enabled && versions === null) load() }, [open, enabled, versions, load])

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = event => { if (!wrapRef.current?.contains(event.target)) setOpen(false) }
    const closeEscape = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  const saveNow = async () => {
    setBusy('save')
    setNotice('')
    setError('')
    try {
      await onBeforeChange()
      const created = await saveVersion(resumeId)
      setNotice(created ? 'Version saved.' : 'Nothing has changed since the last version.')
      setVersions(await listVersions(resumeId))
    } catch (failure) {
      setError(failure?.message || 'Could not save a version.')
    } finally {
      setBusy('')
    }
  }

  const restore = async version => {
    setBusy(version.id)
    setNotice('')
    setError('')
    try {
      await onBeforeChange()
      await restoreVersion(resumeId, version.id)
      await onRestored()
      setConfirmId(null)
      setOpen(false)
      setVersions(null)
    } catch (failure) {
      setError(failure?.message || 'Could not restore this version.')
    } finally {
      setBusy('')
    }
  }

  return <span className="canvas-export-wrap version-history" ref={wrapRef}>
    <button className="btn btn-ghost" type="button" disabled={!enabled} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(current => !current)} title={enabled ? 'Version history' : 'Available once your resume is saved'}>History</button>
    {open && <div className="version-panel" role="dialog" aria-label="Version history">
      <div className="version-panel-head">
        <b>Version history</b>
        <button className="btn btn-secondary btn-sm" type="button" disabled={Boolean(busy)} onClick={saveNow}>{busy === 'save' ? 'Saving…' : 'Save a version now'}</button>
      </div>
      {notice && <p className="version-notice" role="status">{notice}</p>}
      {error && <p className="version-notice is-bad" role="alert">{error}</p>}
      {busy === 'load' && !versions && <p className="version-empty">Loading…</p>}
      {versions && versions.length === 0 && <p className="version-empty">No versions yet. One is kept automatically while you edit, and you can save one yourself at any time.</p>}
      {versions && versions.length > 0 && <ul className="version-list">
        {versions.map(version => <li key={version.id}>
          <span className="version-info">
            <b>{whenLabel(version.createdAt)}</b>
            <small>{REASONS[version.reason] ?? 'Version'} · {version.progress}% complete</small>
          </span>
          {confirmId === version.id
            ? <span className="version-confirm">
              <button className="btn btn-primary btn-sm" type="button" disabled={Boolean(busy)} onClick={() => restore(version)}>{busy === version.id ? 'Restoring…' : 'Restore'}</button>
              <button className="btn btn-ghost btn-sm" type="button" disabled={Boolean(busy)} onClick={() => setConfirmId(null)}>Cancel</button>
            </span>
            : <button className="btn btn-ghost btn-sm" type="button" disabled={Boolean(busy)} onClick={() => setConfirmId(version.id)}>Restore…</button>}
        </li>)}
      </ul>}
      <p className="version-foot">Restoring keeps your current resume as a version, so you can change your mind.</p>
    </div>}
  </span>
}
