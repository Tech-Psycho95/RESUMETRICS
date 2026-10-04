import assert from 'node:assert/strict'
import { applyNimbusOperations, optionToOperations, resolveTarget } from '../src/nimbus/applyNimbusOperations.js'

const ids = ['resume.header.name', 'section.experience.heading', 'section.skills.heading', 'experience.e1.role', 'experience.e1.bullets.0', 'experience.e1.startDate', 'summary']
assert.deepEqual(resolveTarget('group:headings', ids), ['section.experience.heading', 'section.skills.heading'])
assert.deepEqual(resolveTarget('group:job-titles', ids), ['experience.e1.role'])
assert.deepEqual(resolveTarget('summary', ids), ['summary'])
assert.deepEqual(resolveTarget('missing', ids), [])

const resumeData = {
  fullName: 'Asha', headline: '', email: '', phone: '', location: '', summary: 'Engineer.', links: [],
  skills: { languages: [], frameworks: [], tools: [], databases: [], softSkills: [], other: [] },
  experience: [{ role: 'Intern', company: 'Acme', location: '', startDate: '', endDate: '', bullets: ['Cut load time by 40%'] }],
  projects: [], education: [], certifications: [], achievements: []
}
const result = applyNimbusOperations({ resumeData }, [
  { type: 'apply_marks', path: 'experience.0.bullets.0', text: '40%', mark: 'b' },
  { type: 'set_element_style', target: 'group:headings', changes: { color: '#1f3a5f', fontId: 'lora' } },
  { type: 'set_field', target: 'summary', value: 'Software engineer.' },
  { type: 'set_resume_style', fontId: 'inter', baseSize: 13, lineHeight: 1.3 },
  { type: 'set_accent', hex: '#0f766e' },
  { type: 'fit_one_page' }
], { elementIds: ids, fontFamilyForId: id => `${id}-family` })
assert.equal(result.resumeData.experience[0].bullets[0], 'Cut load time by [b]40%[/b]')
assert.equal(result.resumeData.summary, 'Software engineer.')
assert.deepEqual(result.presentationOps.map(op => op.target), ['section.experience.heading', 'section.skills.heading', 'resume'])
assert.equal(result.presentationOps[0].changes.fontFamily, 'lora-family')
assert.deepEqual(result.global, { fontFamily: 'inter-family', baseSize: 13, accent: '#0f766e' })
assert.equal(result.fitOnePage, true)
// Marking an already-bold phrase does not un-bold it.
assert.equal(applyNimbusOperations({ resumeData: result.resumeData }, [{ type: 'apply_marks', path: 'experience.0.bullets.0', text: '40%', mark: 'b' }]).resumeData.experience[0].bullets[0], 'Cut load time by [b]40%[/b]')
// Option cards become operations.
assert.deepEqual(optionToOperations({ kind: 'font', target: 'resume' }, { fontId: 'lora' }), [{ type: 'set_resume_style', fontId: 'lora' }])
assert.equal(optionToOperations({ kind: 'colour', target: 'headings' }, { hex: '#111111' })[0].target, 'group:headings')
assert.equal(optionToOperations({ kind: 'palette', target: 'resume' }, { heading: '#1', accent: '#2', text: '#3' }).length, 3)
console.log('applyNimbusOperations: all checks passed')
