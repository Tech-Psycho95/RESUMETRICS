import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// All reads and writes go through the Express server (Admin SDK, which ignores rules), so the rules must refuse
// every direct browser access. Reviewing the file keeps that true without the emulator (which needs Java 21).
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '')

const allows = [...rules.matchAll(/allow\s+([^:]+):\s*if\s+([^;]+);/g)]
assert.ok(allows.length > 0, 'the rules file has at least one rule')
for (const [, methods, condition] of allows) assert.equal(condition.trim(), 'false', `allow ${methods.trim()} must be "if false", found "if ${condition.trim()}"`)
assert.equal(/allow[^;]*;/.test(rules.replace(/allow\s+[^:]+:\s*if\s+false\s*;/g, '')), false, 'no allow rule other than "if false"')
assert.match(rules, /match\s+\/\{document=\*\*\}/, 'a catch-all match denies everything not listed')
assert.equal(/request\.auth/.test(rules), false, 'no rule trusts the client sign-in: the server does that')

const config = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url), 'utf8'))
assert.equal(config.firestore.rules, 'firestore.rules')
assert.equal(config.firestore.indexes, 'firestore.indexes.json')
JSON.parse(readFileSync(new URL('../firestore.indexes.json', import.meta.url), 'utf8'))

console.log('✓ firestoreRules tests passed')
