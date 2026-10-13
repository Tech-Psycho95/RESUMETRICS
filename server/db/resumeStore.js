import { FieldValue } from 'firebase-admin/firestore'
import { getConnectionStore } from '../services/firebaseAdmin.js'

// users/{uid}/resumes/{resumeId}. The browser never talks to Firestore: every read and write comes through
// the Express routes, which verify the Firebase ID token and then only touch users/{thatUid}/...
export const SCHEMA_VERSION = 1
export const MAX_RESUME_BYTES = 500_000
export const MAX_NAME_LENGTH = 120
export const LIST_LIMIT = 50

export class ResumeStoreError extends Error {
  constructor(code, message, extra = {}) {
    super(message)
    this.name = 'ResumeStoreError'
    this.code = code
    Object.assign(this, extra)
  }
}

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

/** Image bytes never go to Firestore (1 MiB document cap): data URLs are dropped, normal URLs are kept. */
function withoutImageBytes(presentation) {
  if (!isPlainObject(presentation)) return {}
  const photo = presentation.photo
  if (!isPlainObject(photo)) return presentation
  const keep = value => (typeof value === 'string' && value.startsWith('data:') ? undefined : value)
  return { ...presentation, photo: { ...photo, source: keep(photo.source), originalSource: keep(photo.originalSource) } }
}

/**
 * The fields a client may set. Anything else in the request is ignored, so a client can't add fields or
 * touch revision, timestamps or ownership. Throws ResumeStoreError('invalid' | 'too_large').
 */
export function validateResumeFields(input) {
  if (!isPlainObject(input)) throw new ResumeStoreError('invalid', 'Resume fields are required.')
  if (!isPlainObject(input.data)) throw new ResumeStoreError('invalid', 'Resume data is required.')
  const templateId = typeof input.templateId === 'string' && input.templateId.trim() ? input.templateId.trim().slice(0, 64) : null
  const fields = {
    name: text(input.name, MAX_NAME_LENGTH) || 'Untitled resume',
    templateId,
    data: input.data,
    presentation: withoutImageBytes(input.presentation),
    confirmedSections: isPlainObject(input.confirmedSections) ? input.confirmedSections : null,
    sourceFileName: text(input.sourceFileName, 255),
    parseMetadata: isPlainObject(input.parseMetadata) ? input.parseMetadata : null
  }
  // JSON round trip drops `undefined` (Firestore rejects it) and anything that isn't plain data.
  const json = JSON.stringify(fields)
  if (Buffer.byteLength(json) > MAX_RESUME_BYTES) throw new ResumeStoreError('too_large', 'This resume is too large to save. Remove large images or very long text and try again.')
  return JSON.parse(json)
}

/** 0–100 for dashboard cards: name, contact, summary, experience or projects, education, skills. */
export function progressOf(data) {
  if (!isPlainObject(data)) return 0
  const filled = value => typeof value === 'string' && value.trim().length > 0
  const list = value => Array.isArray(value) && value.length > 0
  const skills = Object.values(isPlainObject(data.skills) ? data.skills : {}).flat().filter(filled).length
  const checks = [filled(data.fullName), filled(data.email) || filled(data.phone), filled(data.summary), list(data.experience) || list(data.projects), list(data.education), skills > 0]
  return Math.round(checks.filter(Boolean).length / checks.length * 100)
}

const toIso = value => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  return null
}

/**
 * API shape of a stored document. Documents saved before revisions existed (draftContent/title/lastEditedAt,
 * progress.percent) are read as revision 0 and rewritten in the new shape on their next save.
 */
export function toApiResume(id, raw) {
  const legacyContent = raw.draftContent?.resumeData ?? raw.draftContent
  return {
    id,
    name: raw.name ?? raw.title ?? 'Untitled resume',
    templateId: raw.templateId ?? null,
    data: raw.data ?? legacyContent ?? {},
    presentation: raw.presentation ?? null,
    confirmedSections: raw.confirmedSections ?? null,
    sourceFileName: raw.sourceFileName ?? '',
    parseMetadata: raw.parseMetadata ?? null,
    progress: typeof raw.progress === 'number' ? raw.progress : raw.progress?.percent ?? 0,
    revision: Number.isInteger(raw.revision) ? raw.revision : 0,
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt ?? raw.lastEditedAt)
  }
}

export function createResumeStore({ getDb = getConnectionStore, timestamp = () => FieldValue.serverTimestamp(), now = () => new Date() } = {}) {
  const collectionFor = uid => getDb().collection('users').doc(uid).collection('resumes')

  /**
   * Create (baseRevision null) or update (baseRevision = the revision the client last saw) in one transaction.
   * A stale baseRevision throws 'conflict' and writes nothing, so two tabs or devices can't silently overwrite each other.
   */
  async function saveResume(uid, id, { baseRevision = null, fields }) {
    const clean = validateResumeFields(fields)
    if (baseRevision !== null && !Number.isInteger(baseRevision)) throw new ResumeStoreError('invalid', 'baseRevision must be a whole number or null.')
    const ref = collectionFor(uid).doc(id)
    return getDb().runTransaction(async transaction => {
      const snapshot = await transaction.get(ref)
      const document = { ...clean, progress: progressOf(clean.data), schemaVersion: SCHEMA_VERSION }
      if (!snapshot.exists) {
        // Someone deleted it elsewhere: tell the client rather than quietly bringing it back.
        if (baseRevision !== null) throw new ResumeStoreError('not_found', 'This resume was deleted somewhere else.')
        transaction.set(ref, { ...document, revision: 1, createdAt: timestamp(), updatedAt: timestamp() })
        return { id, revision: 1, updatedAt: now().toISOString() }
      }
      const existing = snapshot.data()
      const current = Number.isInteger(existing.revision) ? existing.revision : 0
      if (baseRevision !== current) throw new ResumeStoreError('conflict', 'This resume was changed somewhere else.', { serverRevision: current })
      // A full replace (not merge) also drops fields from the pre-revision format.
      transaction.set(ref, { ...document, revision: current + 1, createdAt: existing.createdAt ?? timestamp(), updatedAt: timestamp() })
      return { id, revision: current + 1, updatedAt: now().toISOString() }
    })
  }

  /**
   * Renames in one transaction. Counts as a change (revision + 1), so an editor still open on the old revision
   * gets a conflict instead of silently putting the old name back.
   */
  async function renameResume(uid, id, name) {
    const clean = text(name, MAX_NAME_LENGTH)
    if (!clean) throw new ResumeStoreError('invalid', 'A resume name is required.')
    const ref = collectionFor(uid).doc(id)
    return getDb().runTransaction(async transaction => {
      const snapshot = await transaction.get(ref)
      if (!snapshot.exists) throw new ResumeStoreError('not_found', 'Resume not found.')
      const existing = snapshot.data()
      const revision = (Number.isInteger(existing.revision) ? existing.revision : 0) + 1
      transaction.update(ref, { name: clean, revision, updatedAt: timestamp() })
      return { id, name: clean, revision, updatedAt: now().toISOString() }
    })
  }

  /**
   * Copies a resume to a new id chosen by the client, so a retried request can't make two copies: when the
   * new id already exists it is returned as is. The copy starts at revision 1 and is named "<name> (copy)".
   */
  async function duplicateResume(uid, id, newId) {
    if (newId === id) throw new ResumeStoreError('invalid', 'The copy needs its own id.')
    const sourceRef = collectionFor(uid).doc(id)
    const copyRef = collectionFor(uid).doc(newId)
    return getDb().runTransaction(async transaction => {
      const [source, copy] = await Promise.all([transaction.get(sourceRef), transaction.get(copyRef)])
      if (copy.exists) return toApiResume(newId, copy.data())
      if (!source.exists) throw new ResumeStoreError('not_found', 'Resume not found.')
      const original = toApiResume(id, source.data())
      const suffix = ' (copy)'
      const fields = validateResumeFields({ ...original, name: `${original.name.slice(0, MAX_NAME_LENGTH - suffix.length)}${suffix}` })
      const stamp = now().toISOString()
      transaction.set(copyRef, { ...fields, progress: progressOf(fields.data), schemaVersion: SCHEMA_VERSION, revision: 1, createdAt: timestamp(), updatedAt: timestamp() })
      return toApiResume(newId, { ...fields, progress: progressOf(fields.data), revision: 1, createdAt: stamp, updatedAt: stamp })
    })
  }

  async function listResumes(uid, { limit = LIST_LIMIT } = {}) {
    const snapshot = await collectionFor(uid).orderBy('updatedAt', 'desc').limit(Math.min(limit, LIST_LIMIT)).get()
    return snapshot.docs.map(doc => toApiResume(doc.id, doc.data()))
  }

  async function getResume(uid, id) {
    const snapshot = await collectionFor(uid).doc(id).get()
    if (!snapshot.exists) throw new ResumeStoreError('not_found', 'Resume not found.')
    return toApiResume(snapshot.id, snapshot.data())
  }

  /** Deleting twice is fine (a retried request must not fail). Also removes the versions subcollection. */
  async function deleteResume(uid, id) {
    await getDb().recursiveDelete(collectionFor(uid).doc(id))
  }

  return { saveResume, renameResume, duplicateResume, listResumes, getResume, deleteResume }
}

export const resumeStore = createResumeStore()
