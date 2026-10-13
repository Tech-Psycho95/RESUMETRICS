import { getConnectionStore } from '../services/firebaseAdmin.js'
import { FieldValue } from 'firebase-admin/firestore'
import { ResumeStoreError } from './resumeStore.js'

// users/{uid}/resumes/{id}/evidence/{kind}: the latest evidence result for one resume, one document per kind.
// GitHub evidence is written only by the server, from the scan it just ran for the signed-in user, so the browser
// can never put its own "backed by code" results into a resume's record. Deleting a resume deletes these too.
//
// What is kept is what the evidence screen needs and nothing more: repository names, languages, skill matches and
// file names. Repository descriptions, topics and README text are not stored, so a private repository leaves no
// prose behind in the database.
export const MAX_EVIDENCE_BYTES = 200_000
export const EVIDENCE_KINDS = ['github']
const SCHEMA_VERSION = 1

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const count = value => (Number.isFinite(value) && value >= 0 ? Math.round(value) : 0)
const strings = (value, limit, max) => (Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()).slice(0, limit).map(item => item.trim().slice(0, max)) : [])

// Firestore reserves field names like __x__ and refuses empty ones.
const safeKey = key => key.length > 0 && key.length <= 100 && !/^__.*__$/.test(key)

function cleanRepository(repository) {
  if (!isPlainObject(repository)) return null
  const name = text(repository.name, 120)
  if (!name) return null
  const languages = {}
  if (isPlainObject(repository.languages)) {
    for (const [language, bytes] of Object.entries(repository.languages).slice(0, 40)) {
      if (safeKey(language) && Number.isFinite(bytes) && bytes >= 0) languages[language] = Math.round(bytes)
    }
  }
  return {
    name,
    fullName: text(repository.fullName, 200),
    url: text(repository.url, 300),
    pushedAt: text(repository.pushedAt, 40) || null,
    stars: count(repository.stars),
    fork: repository.fork === true,
    archived: repository.archived === true,
    private: repository.private === true,
    languages,
    manifestSkills: strings(repository.manifestSkills, 60, 60),
    readmeSkills: strings(repository.readmeSkills, 60, 60),
    filesChecked: strings(repository.filesChecked, 20, 120)
  }
}

/** The stored shape of a scan result event (server/github/githubScan.js), or a ResumeStoreError('invalid' | 'too_large'). */
export function buildGitHubEvidence(result, resumeSkills) {
  if (!isPlainObject(result) || !Array.isArray(result.repositories)) throw new ResumeStoreError('invalid', 'A scan result is required.')
  const evidence = {
    schemaVersion: SCHEMA_VERSION,
    resumeSkills: strings(resumeSkills, 40, 80),
    accessible: count(result.accessible),
    cap: count(result.cap),
    scanned: count(result.scanned),
    summary: text(result.summary, 600),
    repositories: result.repositories.slice(0, 100).map(cleanRepository).filter(Boolean)
  }
  if (Buffer.byteLength(JSON.stringify(evidence)) > MAX_EVIDENCE_BYTES) throw new ResumeStoreError('too_large', 'This evidence result is too large to save.')
  return evidence
}

const toIso = value => {
  if (!value) return null
  if (typeof value === 'string') return value
  return typeof value.toDate === 'function' ? value.toDate().toISOString() : null
}

export function createEvidenceStore({ getDb = getConnectionStore, timestamp = () => FieldValue.serverTimestamp() } = {}) {
  const resumeRef = (uid, id) => getDb().collection('users').doc(uid).collection('resumes').doc(id)
  const evidenceRef = (uid, id, kind) => resumeRef(uid, id).collection('evidence').doc(kind)

  /**
   * Keeps a finished scan as this resume's GitHub evidence, replacing the previous one. Resolves false (and writes
   * nothing) when the resume isn't saved yet or was deleted, so evidence never outlives its resume.
   */
  async function saveGitHubEvidence(uid, resumeId, { result, resumeSkills }) {
    const evidence = buildGitHubEvidence(result, resumeSkills)
    return getDb().runTransaction(async transaction => {
      const resume = await transaction.get(resumeRef(uid, resumeId))
      if (!resume.exists) return false
      transaction.set(evidenceRef(uid, resumeId, 'github'), { ...evidence, scannedAt: timestamp() })
      return true
    })
  }

  /** { github: {...} | null }. One read. */
  async function getEvidence(uid, resumeId) {
    const snapshot = await evidenceRef(uid, resumeId, 'github').get()
    if (!snapshot.exists) return { github: null }
    const raw = snapshot.data()
    return {
      github: {
        scannedAt: toIso(raw.scannedAt),
        resumeSkills: raw.resumeSkills ?? [],
        accessible: raw.accessible ?? 0,
        cap: raw.cap ?? 0,
        scanned: raw.scanned ?? 0,
        summary: raw.summary ?? '',
        repositories: raw.repositories ?? []
      }
    }
  }

  /** Forget a saved result. Deleting one that isn't there is fine. */
  async function deleteEvidence(uid, resumeId, kind) {
    if (!EVIDENCE_KINDS.includes(kind)) throw new ResumeStoreError('invalid', 'Unknown evidence type.')
    await evidenceRef(uid, resumeId, kind).delete()
  }

  return { saveGitHubEvidence, getEvidence, deleteEvidence }
}

export const evidenceStore = createEvidenceStore()
