import assert from 'node:assert/strict'
import { countTerm, customKeyword, extractJdKeywords, scoreKeywords, verdictFor } from '../shared/jdKeywords.js'

const jobText = 'Security Officer. Must have incident reporting and access control. Incident reporting daily. CCTV a plus. Teamwork.'
const jd = { mustHave: ['incident reporting', 'access control'], niceToHave: ['CCTV'], keywords: ['patrol'], softSkills: ['Teamwork'] }

assert.equal(countTerm(jobText, 'incident reporting'), 2)
const keywords = extractJdKeywords(jd, jobText)
assert.deepEqual(keywords.map(k => k.term), ['incident reporting', 'access control', 'CCTV', 'patrol', 'Teamwork'])
assert.equal(keywords[0].key, true)
assert.equal(keywords.find(k => k.term === 'patrol').group, 'keyword')
assert.equal(customKeyword('  first aid ', jobText).jdCount, 0)

const resume = { summary: 'Security guard.', skills: { other: ['access control'] }, experience: [{ role: 'Guard', company: 'ADT', bullets: ['Monitored CCTV feeds', 'Wrote reports', 'Handled incident reporting for the site'] }] }
const before = scoreKeywords(resume, keywords)
assert.equal(before.found, 3)
// Moving the incident-reporting bullet to the top makes it prominent, so the score rises.
const reordered = { ...resume, experience: [{ ...resume.experience[0], bullets: ['Handled incident reporting for the site', 'Monitored CCTV feeds', 'Wrote reports'] }] }
assert.ok(scoreKeywords(reordered, keywords).score > before.score, 'reordering a keyword bullet to the top raises the score')
// Adding a missing keyword raises it further; deselected keywords do not count.
const added = { ...reordered, skills: { other: ['access control', 'patrol'] } }
assert.ok(scoreKeywords(added, keywords).score > scoreKeywords(reordered, keywords).score)
assert.equal(scoreKeywords(resume, keywords.map(k => ({ ...k, selected: k.term === 'access control' }))).score, 90)
assert.equal(verdictFor(90).id, 'strong')
assert.equal(verdictFor(40).id, 'low')
console.log('jdKeywords: all checks passed')
