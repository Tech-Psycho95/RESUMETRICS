import assert from 'node:assert/strict'
import { createBlankResumeData } from '../src/data/resumeData.js'
import { blockingSections, formSectionsFor, hasStartedForm, percentColour, sectionProgress } from '../src/form/sectionProgress.js'

const blank = createBlankResumeData()
const sections = formSectionsFor({ sections: [{ id: 'summary' }, { id: 'experience' }, { id: 'education' }, { id: 'skills' }] })

// Empty form: personal first, nothing started, required sections block.
assert.equal(sections[0].id, 'personal')
assert.equal(hasStartedForm(sections, blank), false)
assert.deepEqual(blockingSections(sections, blank).map(section => section.id), ['personal', 'summary', 'education', 'skills'])
assert.equal(sectionProgress('experience', blank).valid, true, 'optional section with no entries does not block')
assert.equal(sectionProgress('experience', blank).empty, true)

// Personal: email format matters; optional fields raise the percentage only.
const personal = { ...blank, fullName: 'Asha Rao', email: 'asha@', phone: '+91 98765 43210' }
let progress = sectionProgress('personal', personal)
assert.equal(progress.valid, false)
assert.deepEqual(progress.missing.map(item => item.path), ['email'])
progress = sectionProgress('personal', { ...personal, email: 'asha@example.com' })
assert.equal(progress.valid, true)
assert.equal(progress.percent, 50)

// Summary needs 40 characters.
assert.equal(sectionProgress('summary', { ...blank, summary: 'Short.' }).valid, false)
assert.equal(sectionProgress('summary', { ...blank, summary: 'Final-year engineer who builds reliable web apps.' }).valid, true)

// Experience entries: "Present" counts as an end date; a bullet is required.
const role = { role: 'Intern', company: 'Acme', startDate: 'Jun 2025', endDate: 'Present', bullets: [''] }
progress = sectionProgress('experience', { ...blank, experience: [role] })
assert.equal(progress.valid, false)
assert.deepEqual(progress.missing.map(item => item.path), ['experience.0.bullets'])
assert.equal(sectionProgress('experience', { ...blank, experience: [{ ...role, bullets: ['Shipped search'] }] }).valid, true)

// A blank, untouched entry is ignored: optional sections stay skippable, required ones still need a real entry.
const blankRole = { role: '', company: '', startDate: '', endDate: '', bullets: [''] }
assert.equal(sectionProgress('experience', { ...blank, experience: [blankRole] }).valid, true)
assert.equal(sectionProgress('experience', { ...blank, experience: [blankRole] }).empty, true)
assert.equal(sectionProgress('education', { ...blank, education: [{ degree: '', institution: '' }] }).valid, false)
assert.equal(sectionProgress('personal', { ...blank, fullName: 'A' }).missing[0].message, 'Required')

// Skills count across categories.
assert.equal(sectionProgress('skills', { ...blank, skills: { ...blank.skills, languages: ['JS', 'Python'] } }).percent, 67)
assert.equal(sectionProgress('skills', { ...blank, skills: { ...blank.skills, languages: ['JS', 'Python'], tools: ['Git'] } }).valid, true)

// Started as soon as anything is typed.
assert.equal(hasStartedForm(sections, { ...blank, fullName: 'A' }), true)

// Colour runs red to green.
assert.equal(percentColour(0), 'hsl(0, 72%, 40%)')
assert.equal(percentColour(100), 'hsl(120, 72%, 40%)')
console.log('sectionProgress: all checks passed')
