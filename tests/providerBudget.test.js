import assert from 'node:assert/strict'
import { AIBusyError, createProviderBudget, formatWait } from '../server/ai/providerBudget.js'

const message = chars => [{ role: 'user', content: 'x'.repeat(chars) }]   // ~chars/4 tokens
const busy = (work, check) => assert.throws(work, error => error instanceof AIBusyError && check(error))

// Readable waits.
assert.equal(formatWait(40), '40 s')
assert.equal(formatWait(0.2), '1 s')
assert.equal(formatWait(600), '10 min')
assert.equal(formatWait(5 * 3600), 'about 5 hours')

// Requests per minute: the 4th call within a minute waits for the 1st to leave the window.
let budget = createProviderBudget({ rpm: 3, tpm: 1_000_000, rpd: 1000 })
budget.reserve(message(40), 0)
budget.reserve(message(40), 10_000)
budget.reserve(message(40), 20_000)
busy(() => budget.reserve(message(40), 30_000), error => error.reason === 'requests' && error.retryAfterSeconds === 30 && error.status === 429)
budget.reserve(message(40), 60_000)   // first call has left the window

// Tokens per minute: real usage from settle() replaces the estimate.
budget = createProviderBudget({ rpm: 100, tpm: 1000, rpd: 1000 })
const first = budget.reserve(message(400), 0)        // estimate 100
budget.settle(first, 900)                             // really used 900
busy(() => budget.reserve(message(800), 5_000), error => error.reason === 'tokens' && error.retryAfterSeconds === 55)
budget.reserve(message(800), 60_000)                  // the 900 have expired

// Wait only until just enough old calls expire: 3 calls of 300 tokens, a 500-token request needs two to go.
budget = createProviderBudget({ rpm: 100, tpm: 1000, rpd: 1000 })
for (const at of [0, 10_000, 20_000]) budget.settle(budget.reserve(message(4), at), 300)
busy(() => budget.reserve(message(2000), 25_000), error => error.retryAfterSeconds === 45)   // second call expires at 70 s

// One request larger than the whole minute budget still goes through when the minute is empty.
budget = createProviderBudget({ rpm: 100, tpm: 100, rpd: 1000 })
budget.reserve(message(4000), 0)

// Requests per day, across all users.
budget = createProviderBudget({ rpm: 100, tpm: 1_000_000, rpd: 2 })
budget.reserve(message(4), 0)
budget.reserve(message(4), 1000)
busy(() => budget.reserve(message(4), 2000), error => error.reason === 'daily' && /today's limit/.test(error.message))
budget.reserve(message(4), 86_400_000)                // the first call is a day old

console.log('providerBudget: all checks passed')
