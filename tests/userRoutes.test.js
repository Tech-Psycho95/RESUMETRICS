import assert from 'node:assert/strict'
import express from 'express'
import { createRequireUser } from '../server/services/firebaseAdmin.js'
import { createResumeStore } from '../server/db/resumeStore.js'
import { createUserStore, validateSettingsPatch, SettingsError } from '../server/db/userStore.js'
import { createUserRouter } from '../server/routes/user.routes.js'
import { createEvidenceStore } from '../server/db/evidenceStore.js'
import { createFakeFirestore } from './helpers/fakeFirestore.js'

const ID = 'a1b2c3d4-e5f6-4789-8abc-def012345678'
const db = createFakeFirestore()
let clock = Date.UTC(2026, 9, 11, 10, 0, 0)
const resumes = createResumeStore({ getDb: () => db, timestamp: db.timestamp, checkpointMs: Infinity })
const evidence = createEvidenceStore({ getDb: () => db, timestamp: db.timestamp })
const users = createUserStore({ getDb: () => db, now: () => clock })

// Real sign-in middleware with a fake token check: 'alice-token' → alice, 'bob-token' → bob.
const authenticate = createRequireUser({
  signInMessage: 'Sign in to save.',
  unavailableMessage: 'Unavailable.',
  verify: async token => {
    if (token === 'alice-token') return { uid: 'alice', name: 'Alice', email: 'alice@example.com', picture: 'https://img/alice.png' }
    if (token === 'bob-token') return { uid: 'bob', email: 'bob@example.com' }
    throw Object.assign(new Error('bad'), { code: 'auth/argument-error' })
  }
})
const app = express()
app.set('env', 'test')   // keep Express from logging the intentional 413
app.use('/api/user', express.json({ limit: '600kb' }), createUserRouter({ resumes, users, evidence, authenticate }))
const server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
const call = async (method, path, { token = 'alice-token', body } = {}) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/user${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined || method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(body)
  })
  const raw = await response.text()
  let parsed
  try { parsed = JSON.parse(raw) } catch { parsed = { raw } }   // Express's own 413 page is HTML
  return { status: response.status, body: parsed }
}
const quietly = async work => {
  const original = console.error
  console.error = () => {}
  try { return await work() } finally { console.error = original }
}
const fields = (overrides = {}) => ({ name: 'Mine', templateId: 'onyx', data: { fullName: 'Ada' }, presentation: {}, ...overrides })

try {
  // Everything needs a signed-in user, and nothing is written for a refused request.
  for (const [method, path] of [['GET', '/resumes'], ['GET', `/resumes/${ID}`], ['PUT', `/resumes/${ID}`], ['DELETE', `/resumes/${ID}`], ['GET', '/settings'], ['PATCH', '/settings']]) {
    const refused = await quietly(() => call(method, path, { token: null, body: {} }))
    assert.equal(refused.status, 401, `${method} ${path} without a token`)
    assert.equal(refused.body.error, 'Sign in to save.')
  }
  assert.equal((await quietly(() => call('GET', '/resumes', { token: 'forged' }))).status, 401)
  assert.equal(db.docs.size, 0)

  // Ids must look like ids (a path or a short guess is refused before reaching Firestore).
  for (const id of ['abc', 'has space in it 123456', 'a/b/c/d/e/f/g/h/i/j/k/l', 'dots.are.not.allowed.12345', 'x'.repeat(65)]) {
    const result = await call('GET', `/resumes/${encodeURIComponent(id)}`)
    assert.equal(result.status, 400, `id ${id}`)
    assert.equal(result.body.code, 'invalid')
  }

  // Create → read → update → conflict.
  const created = await call('PUT', `/resumes/${ID}`, { body: { baseRevision: null, fields: fields() } })
  assert.equal(created.status, 200)
  assert.equal(created.body.resume.revision, 1)
  assert.equal((await call('GET', `/resumes/${ID}`)).body.resume.data.fullName, 'Ada')
  assert.equal((await call('PUT', `/resumes/${ID}`, { body: { baseRevision: 1, fields: fields({ name: 'Two' }) } })).body.resume.revision, 2)
  const stale = await call('PUT', `/resumes/${ID}`, { body: { baseRevision: 1, fields: fields({ name: 'Stale' }) } })
  assert.equal(stale.status, 409)
  assert.equal(stale.body.code, 'conflict')
  assert.equal(stale.body.serverRevision, 2)
  assert.equal((await call('GET', `/resumes/${ID}`)).body.resume.name, 'Two')

  // Error codes the browser relies on.
  assert.equal((await call('PUT', `/resumes/${ID}`, { body: { baseRevision: 2 } })).status, 400)
  assert.equal((await call('PUT', `/resumes/${ID}`, { body: { baseRevision: 2, fields: fields({ data: { big: 'x'.repeat(520_000) } }) } })).body.code, 'too_large')
  assert.equal((await call('PUT', `/resumes/${ID}`, { body: { baseRevision: 2, fields: fields({ data: { big: 'x'.repeat(520_000) } }) } })).status, 413)
  assert.equal((await call('PUT', '/resumes/ffffffff-ffff-4fff-8fff-ffffffffffff', { body: { baseRevision: 5, fields: fields() } })).status, 404)
  assert.equal((await call('GET', '/resumes/ffffffff-ffff-4fff-8fff-ffffffffffff')).status, 404)
  // Above the body limit the request is refused by Express before any of our code runs.
  const huge = await quietly(() => call('PUT', `/resumes/${ID}`, { body: { baseRevision: 2, fields: fields({ data: { big: 'x'.repeat(700_000) } }) } }))
  assert.equal(huge.status, 413)

  // The owner comes from the verified token. A uid in the body or the id of someone else's resume changes nothing.
  assert.equal((await call('GET', `/resumes/${ID}`, { token: 'bob-token' })).status, 404)
  const bobSave = await call('PUT', `/resumes/${ID}`, { token: 'bob-token', body: { uid: 'alice', baseRevision: null, fields: { ...fields({ name: 'Bob' }), uid: 'alice' } } })
  assert.equal(bobSave.status, 200)
  assert.equal(db.read(`users/alice/resumes/${ID}`).name, 'Two')
  assert.equal(db.read(`users/bob/resumes/${ID}`).name, 'Bob')
  assert.deepEqual((await call('GET', '/resumes', { token: 'bob-token' })).body.resumes.map(item => item.name), ['Bob'])
  assert.deepEqual((await call('GET', '/resumes')).body.resumes.map(item => item.name), ['Two'])

  // List sends no-store so the dashboard never shows a stale copy.
  const listResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/user/resumes`, { headers: { Authorization: 'Bearer alice-token' } })
  assert.equal(listResponse.headers.get('cache-control'), 'no-store')

  // Delete only removes the caller's own copy, and a repeat is fine.
  assert.equal((await call('DELETE', `/resumes/${ID}`, { token: 'bob-token' })).status, 200)
  assert.ok(db.read(`users/alice/resumes/${ID}`))
  assert.equal(db.read(`users/bob/resumes/${ID}`), undefined)
  assert.equal((await call('DELETE', `/resumes/${ID}`)).status, 200)
  assert.equal((await call('DELETE', `/resumes/${ID}`)).status, 200)
  assert.equal(db.read(`users/alice/resumes/${ID}`), undefined)

  // Rename and duplicate.
  const COPY = '99999999-8888-4777-8666-555555555555'
  assert.equal((await call('PUT', `/resumes/${ID}`, { body: { baseRevision: null, fields: fields({ name: 'Original' }) } })).status, 200)
  const renamed = await call('PATCH', `/resumes/${ID}`, { body: { name: ' Renamed ' } })
  assert.equal(renamed.status, 200)
  assert.equal(renamed.body.resume.name, 'Renamed')
  assert.equal(renamed.body.resume.revision, 2)
  assert.equal((await call('PATCH', `/resumes/${ID}`, { body: { name: '' } })).status, 400)
  assert.equal((await call('PATCH', `/resumes/${ID}`, { body: {} })).status, 400)
  assert.equal((await call('PATCH', `/resumes/${ID}`, { token: 'bob-token', body: { name: 'Stolen' } })).status, 404)
  assert.equal(db.read(`users/alice/resumes/${ID}`).name, 'Renamed')
  assert.equal((await call('PATCH', '/resumes/short', { body: { name: 'x' } })).status, 400)

  const duplicated = await call('POST', `/resumes/${ID}/duplicate`, { body: { newId: COPY } })
  assert.equal(duplicated.status, 201)
  assert.equal(duplicated.body.resume.id, COPY)
  assert.equal(duplicated.body.resume.name, 'Renamed (copy)')
  assert.equal(duplicated.body.resume.revision, 1)
  assert.equal((await call('POST', `/resumes/${ID}/duplicate`, { body: { newId: COPY } })).status, 201, 'a retry is fine')
  assert.equal((await call('POST', `/resumes/${ID}/duplicate`, { body: {} })).status, 400)
  assert.equal((await call('POST', `/resumes/${ID}/duplicate`, { body: { newId: 'a/b' } })).status, 400)
  assert.equal((await call('POST', `/resumes/${ID}/duplicate`, { token: 'bob-token', body: { newId: COPY } })).status, 404)
  assert.equal((await call('POST', `/resumes/${ID}/duplicate`, { token: null, body: { newId: COPY } })).status, 401)
  assert.equal((await call('GET', '/resumes')).body.resumes.length, 2)
  await call('DELETE', `/resumes/${COPY}`)
  await call('DELETE', `/resumes/${ID}`)

  // Version history.
  assert.equal((await call('PUT', `/resumes/${ID}`, { body: { baseRevision: null, fields: fields({ name: 'Draft one' }) } })).status, 200)
  const savedVersion = await call('POST', `/resumes/${ID}/versions`)
  assert.equal(savedVersion.status, 201)
  assert.equal(savedVersion.body.version.reason, 'manual')
  assert.equal(savedVersion.body.version.name, 'Draft one')
  const unchanged = await call('POST', `/resumes/${ID}/versions`)
  assert.equal(unchanged.status, 200)
  assert.equal(unchanged.body.version, null)
  assert.equal((await call('PUT', `/resumes/${ID}`, { body: { baseRevision: 1, fields: fields({ name: 'Draft two' }) } })).status, 200)
  const listed = await call('GET', `/resumes/${ID}/versions`)
  assert.equal(listed.status, 200)
  assert.deepEqual(listed.body.versions.map(version => version.id), [savedVersion.body.version.id])
  assert.equal((await call('GET', `/resumes/${ID}/versions`, { token: 'bob-token' })).body.versions.length, 0)
  assert.equal((await call('POST', `/resumes/${ID}/versions`, { token: 'bob-token' })).status, 404)
  assert.equal((await call('POST', `/resumes/${ID}/versions`, { token: null })).status, 401)
  assert.equal((await call('POST', `/resumes/${ID}/versions/short/restore`)).status, 400)
  assert.equal((await call('POST', `/resumes/${ID}/versions/does-not-exist/restore`)).status, 404)
  assert.equal((await call('POST', `/resumes/${ID}/versions/${savedVersion.body.version.id}/restore`, { token: 'bob-token' })).status, 404)
  const restoredVersion = await call('POST', `/resumes/${ID}/versions/${savedVersion.body.version.id}/restore`)
  assert.equal(restoredVersion.status, 200)
  assert.equal(restoredVersion.body.resume.revision, 3)
  assert.equal((await call('GET', `/resumes/${ID}`)).body.resume.name, 'Draft one')
  assert.equal((await call('GET', `/resumes/${ID}/versions`)).body.versions.length, 2, 'the replaced draft was kept')
  await call('DELETE', `/resumes/${ID}`)

  // Saved evidence: readable and forgettable by its owner; there is deliberately no route to write it.
  assert.equal((await call('PUT', `/resumes/${ID}`, { body: { baseRevision: null, fields: fields() } })).status, 200)
  assert.deepEqual((await call('GET', `/resumes/${ID}/evidence`)).body.evidence, { github: null })
  await evidence.saveGitHubEvidence('alice', ID, { result: { repositories: [{ name: 'app', languages: { Go: 10 } }], scanned: 1, accessible: 1, cap: 25, summary: 'Hi.' }, resumeSkills: ['Go'] })
  const withEvidence = await call('GET', `/resumes/${ID}/evidence`)
  assert.equal(withEvidence.status, 200)
  assert.equal(withEvidence.body.evidence.github.repositories[0].name, 'app')
  assert.equal(withEvidence.body.evidence.github.summary, 'Hi.')
  assert.deepEqual((await call('GET', `/resumes/${ID}/evidence`, { token: 'bob-token' })).body.evidence, { github: null })
  assert.equal((await call('GET', `/resumes/${ID}/evidence`, { token: null })).status, 401)
  assert.equal((await call('PUT', `/resumes/${ID}/evidence/github`, { body: { summary: 'forged' } })).status, 404, 'no way to write evidence from the browser')
  assert.equal((await call('DELETE', `/resumes/${ID}/evidence/jobMatch`)).status, 400)
  assert.equal((await call('DELETE', `/resumes/${ID}/evidence/github`, { token: 'bob-token' })).status, 200)
  assert.ok((await call('GET', `/resumes/${ID}/evidence`)).body.evidence.github, 'bob deleted nothing of alice’s')
  assert.equal((await call('DELETE', `/resumes/${ID}/evidence/github`)).status, 200)
  assert.deepEqual((await call('GET', `/resumes/${ID}/evidence`)).body.evidence, { github: null })
  await call('DELETE', `/resumes/${ID}`)

  // The profile is created on first contact with defaults and a free plan, then left alone.
  const profile = db.read('users/alice')
  assert.equal(profile.profile.displayName, 'Alice')
  assert.equal(profile.profile.email, 'alice@example.com')
  assert.deepEqual(profile.plan, { tier: 'free', status: 'active' })
  assert.deepEqual(profile.settings, { theme: 'system', notifications: { email: true }, defaultTemplateId: null, onboardingComplete: false })
  assert.equal(db.read('users/bob').profile.displayName, 'bob')   // no Google name: falls back to the email name

  // Quota: the profile check costs 1 read + 1 write once, not on every save.
  const before = { ...db.stats }
  for (let index = 0; index < 5; index += 1) await call('GET', '/settings')
  assert.deepEqual({ reads: db.stats.reads - before.reads - 5, writes: db.stats.writes - before.writes }, { reads: 0, writes: 0 }, 'only the 5 settings reads, nothing for the profile')
  // After ten minutes it looks again, and writes only when the Google profile actually changed.
  clock += 11 * 60_000
  const afterQuiet = { ...db.stats }
  await call('GET', '/settings')
  assert.equal(db.stats.writes - afterQuiet.writes, 0)
  clock += 11 * 60_000
  await createUserStore({ getDb: () => db, now: () => clock }).ensureProfile('alice', { uid: 'alice', name: 'Alice Renamed', email: 'alice@example.com', picture: 'https://img/alice.png' })
  assert.equal(db.read('users/alice').profile.displayName, 'Alice Renamed')

  // Settings: type-checked patch, partial merge, nothing outside the whitelist.
  const patched = await call('PATCH', '/settings', { body: { settings: { theme: 'dark', defaultTemplateId: 'onyx' } } })
  assert.equal(patched.status, 200)
  assert.deepEqual(patched.body.settings, { theme: 'dark', notifications: { email: true }, defaultTemplateId: 'onyx', onboardingComplete: false })
  assert.equal((await call('PATCH', '/settings', { body: { settings: { plan: 'pro' } } })).status, 400)
  assert.equal((await call('PATCH', '/settings', { body: { settings: { theme: 'neon' } } })).status, 400)
  assert.equal((await call('PATCH', '/settings', { body: {} })).status, 400)
  assert.deepEqual(db.read('users/alice').plan, { tier: 'free', status: 'active' })
  assert.equal((await call('GET', '/settings')).body.settings.theme, 'dark')
} finally {
  server.closeAllConnections?.()
  server.close()
}

// validateSettingsPatch directly.
assert.deepEqual(validateSettingsPatch({ notifications: { email: false }, onboardingComplete: true }), { notifications: { email: false }, onboardingComplete: true })
assert.deepEqual(validateSettingsPatch({ defaultTemplateId: null }), { defaultTemplateId: null })
for (const bad of [null, [], 'x', { notifications: true }, { notifications: { email: 'yes' } }, { notifications: { email: true, sms: true } }, { onboardingComplete: 'true' }, { defaultTemplateId: '' }, { defaultTemplateId: 5 }, { theme: 'Dark' }, { unknown: 1 }]) {
  assert.throws(() => validateSettingsPatch(bad), SettingsError, JSON.stringify(bad))
}

console.log('✓ userRoutes tests passed')
