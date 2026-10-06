import assert from 'node:assert/strict'
import { addedWords, describeFixChanges } from '../src/jd/fixPreview.js'

const resume = { summary: 'Security guard.', skills: { tools: ['CCTV'] }, experience: [{ role: 'Guard', company: 'ADT', bullets: ['Wrote reports', 'Handled [b]incident reporting[/b]'] }] }
const [summary] = describeFixChanges(resume, [{ type: 'set_field', target: 'summary', value: 'Security officer skilled in incident reporting.' }])
assert.deepEqual(summary, { label: 'Summary', kind: 'text', before: 'Security guard.', after: 'Security officer skilled in incident reporting.' })
const [bullets] = describeFixChanges(resume, [{ type: 'replace_bullets', section: 'experience', itemIndex: 0, values: ['Handled incident reporting', 'Wrote reports'] }])
assert.equal(bullets.label, 'Guard at ADT · bullets')
assert.deepEqual(bullets.before, ['Wrote reports', 'Handled incident reporting'])
const [skills] = describeFixChanges(resume, [{ type: 'append_skills', category: 'tools', values: ['CCTV', 'Access control'] }])
assert.deepEqual(skills, { label: 'Skills · Tools', kind: 'added', before: [], after: ['Access control'] })
assert.deepEqual(describeFixChanges(resume, [{ type: 'set_element_style', target: 'summary', changes: {} }]), [])
assert.ok(addedWords('Security guard.', 'Security officer skilled in incident reporting').has('incident'))
console.log('fixPreview: all checks passed')
