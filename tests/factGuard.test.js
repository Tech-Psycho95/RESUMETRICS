import assert from 'node:assert/strict'
import { findInventedFacts, sourceTextOf } from '../shared/factGuard.js'

const resume = {
  summary: 'Engineer who built search for 2M users.',
  experience: [{ role: 'Intern', company: 'Acme', startDate: 'Jun 2024', bullets: ['Cut page load time by 40% using React and Redis'] }],
  skills: { languages: ['JavaScript', 'Python'] }
}
const source = sourceTextOf(resume, 'Make it sound stronger')

// Rewording with the same facts passes.
assert.deepEqual(findInventedFacts('Reduced page load time 40% with [b]React[/b] and Redis caching', source), [])
assert.deepEqual(findInventedFacts('Built search used by 2M people', source), [])
// New metrics, years and skills are caught.
assert.deepEqual(findInventedFacts('Cut load time by 60% for 5,000 users', source).map(f => f.value), ['60%', '5,000'])
assert.deepEqual(findInventedFacts('Led migration to Kubernetes in 2021', source).map(f => `${f.kind}:${f.value}`), ['number:2021', 'skill:Kubernetes'])
// Facts the user supplies in their request are allowed.
const withRequest = sourceTextOf(resume, 'Add that I mentored 3 interns and used Docker')
assert.deepEqual(findInventedFacts('Mentored 3 interns; containerised services with Docker', withRequest), [])
// Links must exist somewhere.
assert.equal(findInventedFacts('See https://example.com/demo', source)[0].kind, 'link')
console.log('factGuard: all checks passed')
