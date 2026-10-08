import assert from 'node:assert/strict'
import express from 'express'
import { createIpLimiter, createUserAiLimits } from '../server/middleware/limits.js'

// The real limiters in a throwaway app on a random port. A stub stands in for requireUser: the uid comes
// from a test header, since verifying real Firebase tokens isn't this test's job.
function startApp({ ipPerMinute, perMinute, perDay }) {
  const app = express()
  const stubUser = (request, _response, next) => { request.firebaseUser = { uid: request.get('x-test-user') }; next() }
  app.use('/api', createIpLimiter({ perMinute: ipPerMinute }))
  app.use('/api/ai', stubUser, createUserAiLimits({ perMinute, perDay }), (_request, response) => response.json({ ok: true }))
  return new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server))
  })
}
const call = (server, user) => fetch(`http://127.0.0.1:${server.address().port}/api/ai`, { headers: { 'x-test-user': user } })

// Per user per minute: the 3rd call is refused with a readable message and Retry-After; other users are unaffected.
let server = await startApp({ ipPerMinute: 100, perMinute: 2, perDay: 100 })
assert.equal((await call(server, 'alice')).status, 200)
assert.equal((await call(server, 'alice')).status, 200)
let refused = await call(server, 'alice')
assert.equal(refused.status, 429)
assert.ok(Number(refused.headers.get('retry-after')) > 0 && Number(refused.headers.get('retry-after')) <= 60)
let body = await refused.json()
assert.equal(body.ok, false)
assert.match(body.error, /too quickly\. Try again in \d+ s\./)
assert.equal((await call(server, 'bob')).status, 200)
server.close()

// Per user per day.
server = await startApp({ ipPerMinute: 100, perMinute: 100, perDay: 3 })
for (let i = 0; i < 3; i += 1) assert.equal((await call(server, 'alice')).status, 200)
refused = await call(server, 'alice')
body = await refused.json()
assert.equal(refused.status, 429)
assert.match(body.error, /today’s 3 AI actions/)
assert.ok(body.retryAfterSeconds > 23 * 3600)
server.close()

// Per IP, counted before anything else: it caps everyone behind one address.
server = await startApp({ ipPerMinute: 2, perMinute: 100, perDay: 100 })
await call(server, 'alice')
await call(server, 'bob')
refused = await call(server, 'carol')
assert.equal(refused.status, 429)
assert.match((await refused.json()).error, /from your network/)
server.close()

console.log('limits: all checks passed')
