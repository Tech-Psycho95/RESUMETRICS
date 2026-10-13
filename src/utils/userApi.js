import { getAuth } from 'firebase/auth'
import { SaveError, saveErrorKind } from '../db/saveError.js'

export { SaveError }

const API_BASE = import.meta.env.VITE_API_URL || ''

// keepalive requests (sent while the page is closing) are capped at 64 KB by browsers.
const KEEPALIVE_LIMIT = 60_000

async function authenticatedFetch(endpoint, { keepalive = false, ...options } = {}) {
  const user = getAuth().currentUser
  if (!user) throw new SaveError('auth', 'Sign in to save your work.')
  let response
  try {
    const token = await user.getIdToken()
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      keepalive: keepalive && (options.body?.length ?? 0) < KEEPALIVE_LIMIT,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers }
    })
  } catch (error) {
    throw new SaveError('network', 'Couldn’t reach Resumetrics. Check your connection.', { cause: error })
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new SaveError(saveErrorKind(response.status, data.code), data.error || 'Request failed.', { status: response.status, serverRevision: data.serverRevision })
  }
  return data
}

/** Create (baseRevision null) or update a resume; resolves { id, revision, updatedAt }. Rejects with SaveError. */
export async function saveResume(id, baseRevision, fields, { keepalive = false } = {}) {
  const data = await authenticatedFetch(`/api/user/resumes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ baseRevision, fields }),
    keepalive
  })
  return data.resume
}

/** Newest first, including each resume's content for the dashboard preview. */
export async function listResumes() {
  return (await authenticatedFetch('/api/user/resumes')).resumes
}

export async function getResume(id) {
  return (await authenticatedFetch(`/api/user/resumes/${encodeURIComponent(id)}`)).resume
}

export async function renameResume(id, name) {
  return (await authenticatedFetch(`/api/user/resumes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ name }) })).resume
}

/** Copies a resume server-side; resolves the new resume (same shape as getResume). */
export async function duplicateResume(id) {
  const data = await authenticatedFetch(`/api/user/resumes/${encodeURIComponent(id)}/duplicate`, { method: 'POST', body: JSON.stringify({ newId: crypto.randomUUID() }) })
  return data.resume
}

/** Newest first, without content: [{ id, reason: 'manual' | 'auto' | 'before-restore', name, revision, progress, createdAt }]. */
export async function listVersions(id) {
  return (await authenticatedFetch(`/api/user/resumes/${encodeURIComponent(id)}/versions`)).versions
}

/** Saves the stored resume as a version; resolves the version, or null when nothing changed since the last one. */
export async function saveVersion(id) {
  return (await authenticatedFetch(`/api/user/resumes/${encodeURIComponent(id)}/versions`, { method: 'POST' })).version
}

/** Makes a version the current resume (the replaced state is kept as a version). Resolves { id, revision, updatedAt }. */
export async function restoreVersion(id, versionId) {
  return (await authenticatedFetch(`/api/user/resumes/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/restore`, { method: 'POST' })).resume
}

export async function deleteResume(id) {
  await authenticatedFetch(`/api/user/resumes/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function getSettings() {
  return (await authenticatedFetch('/api/user/settings')).settings
}

export async function updateSettings(settings) {
  return (await authenticatedFetch('/api/user/settings', { method: 'PATCH', body: JSON.stringify({ settings }) })).settings
}
