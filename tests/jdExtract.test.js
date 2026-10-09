import assert from 'node:assert/strict'
import { extractJd } from '../shared/jdExtract.js'

const guard = `Security Officer - Sentinel Protection Services
Denver, Colorado

What you will do:
• Patrol the site and monitor CCTV cameras
• Respond to security incidents and complete incident reporting
• Manage access control for staff and visitors

Requirements:
• Must have 2+ years of incident reporting and access control experience
• Valid guard licence required
• Strong communication and attention to detail
Nice to have: first aid certificate`

const jd = extractJd(guard)
assert.equal(jd.title, 'Security Officer')
assert.equal(jd.company, 'Sentinel Protection Services')
const all = [...jd.mustHave, ...jd.niceToHave, ...jd.keywords].map(term => term.toLowerCase())
assert.ok(all.includes('incident reporting'), `incident reporting found: ${all}`)
assert.ok(all.includes('access control'), `access control found: ${all}`)
assert.ok(jd.mustHave.map(term => term.toLowerCase()).includes('incident reporting'), 'requirement phrase is a key requirement')
assert.ok(jd.softSkills.includes('communication') && jd.softSkills.includes('attention to detail'))
assert.deepEqual(jd.niceToHave, ['first aid certificate'])
assert.ok(!jd.keywords.includes('monitor') && !jd.keywords.includes('site'), 'lone verbs and filler nouns are not keywords')

const dev = extractJd(`Full Stack Engineer at Acme Cloud
Must have: React, Node.js, Docker and PostgreSQL.
Nice to have: GraphQL.
You will build microservices and own observability for our microservices.`)
assert.equal(dev.title, 'Full Stack Engineer')
assert.equal(dev.company, 'Acme Cloud')
assert.ok(dev.mustHave.includes('React') && dev.mustHave.includes('Docker'))
assert.ok(dev.niceToHave.includes('GraphQL'))
assert.ok(dev.keywords.concat(dev.mustHave).map(term => term.toLowerCase()).includes('microservices'))
assert.ok(!dev.mustHave.some(term => term.split(' ').length > 2 && term.includes('react')), 'list items are not glued into one phrase')

const started = performance.now()
for (let index = 0; index < 50; index += 1) extractJd(guard.repeat(4))
assert.ok(performance.now() - started < 1500, 'extraction is instant')
console.log('jdExtract: all checks passed')
