import assert from 'node:assert/strict'
import { copiedFromResume, draftProblems, isGenericOpener, lintLetter, resumeSentences } from '../shared/letterLint.js'

const resume = {
  summary: 'Frontend developer who builds accessible dashboards with React and TypeScript for support teams.',
  experience: [{ role: 'Intern', company: 'Acme', bullets: ['Reduced page load time by 40% by caching API responses and splitting bundles', 'Led a team'] }],
  projects: [], education: []
}
assert.equal(resumeSentences(resume).length, 2, 'short bullets are not compared')
assert.equal(isGenericOpener('I am writing to apply for the role.'), true)
assert.equal(isGenericOpener('To whom it may concern, hello'), true)
assert.equal(isGenericOpener('Your team’s work on accessible dashboards is why I am applying for the Frontend Developer role.'), false)

// Copying a resume bullet is caught; rewording around the job is not.
assert.equal(copiedFromResume('Reduced page load time by 40% by caching API responses and splitting bundles.', resumeSentences(resume)).length, 1)
assert.equal(copiedFromResume('At Acme a 40% faster page load came from caching; that is the kind of result I would bring to your checkout flow.', resumeSentences(resume)).length, 0)

const good = [
  { kind: 'opening', text: 'Your Frontend Developer opening at Northwind caught my eye because your team ships accessible dashboards, and I have built exactly that with React during an internship at Acme.' },
  { kind: 'proof', text: 'At Acme I cut a slow dashboard’s load time by 40% by caching responses, which gave support agents answers sooner. I would bring the same habit of measuring before changing things to your product teams every single week.' },
  { kind: 'fit', text: 'Northwind’s focus on tools for support teams matches the work I enjoyed most, because quick, readable screens decide whether a hard day goes well for the people using them.' },
  { kind: 'closing', text: 'Thank you for your time. I would welcome a conversation about how I can help Northwind’s dashboard team, and I look forward to hearing from you.' }
]
const filler = ' ' + 'Every release I check the numbers with the people who use the screens so that the next change targets a real problem.'.repeat(4)
const wordy = good.map((item, i) => i === 1 ? { ...item, text: item.text + filler } : item)
const ok = lintLetter({ paragraphs: wordy, recipient: { name: 'Ms. Rao', company: 'Northwind' }, role: 'Frontend Developer', resumeData: resume })
const byId = Object.fromEntries(ok.checks.map(check => [check.id, check.status]))
assert.equal(byId.role, 'pass'); assert.equal(byId.company, 'pass'); assert.equal(byId.person, 'pass')
assert.equal(byId.opening, 'pass'); assert.equal(byId.result, 'pass'); assert.equal(byId.why, 'pass'); assert.equal(byId.action, 'pass')
assert.equal(byId.original, 'pass')
assert.ok(ok.words > 150)

// Empty and weak letters fail the right checks; unknown inputs are not counted against the writer.
const empty = lintLetter({ paragraphs: [{ kind: 'opening', text: '' }], recipient: {}, role: '', resumeData: resume })
assert.equal(empty.checks.find(check => check.id === 'role').status, 'unknown')
assert.equal(empty.checks.find(check => check.id === 'length').status, 'fail')
assert.ok(empty.total < empty.checks.length)
const weak = lintLetter({ paragraphs: [{ kind: 'opening', text: 'I am writing to apply for the job. ' + 'word '.repeat(20) }, { kind: 'closing', text: 'Thanks.' }], recipient: {}, role: 'Frontend Developer', company: 'Northwind', resumeData: resume })
assert.equal(weak.checks.find(check => check.id === 'opening').status, 'fail')
assert.equal(weak.checks.find(check => check.id === 'action').status, 'fail')
assert.equal(weak.checks.find(check => check.id === 'person').status, 'fail')

// Draft guard for NIMBUS.
assert.ok(draftProblems({ paragraphs: ['I am writing to apply for the job at your firm today.'], resumeData: resume, replaceAll: true }).some(text => /generic opener/.test(text)))
assert.ok(draftProblems({ paragraphs: ['word '.repeat(460)], resumeData: resume, replaceAll: true }).some(text => /words/.test(text)))
assert.ok(draftProblems({ paragraphs: ['Reduced page load time by 40% by caching API responses and splitting bundles.'], resumeData: resume }).some(text => /repeat the resume/.test(text)))
assert.ok(draftProblems({ paragraphs: ['I am a hard-working team player.'], resumeData: resume }).some(text => /hollow/.test(text)))
assert.deepEqual(draftProblems({ paragraphs: [good[0].text], resumeData: resume, replaceAll: true }), [])
console.log('letterLint ok')
