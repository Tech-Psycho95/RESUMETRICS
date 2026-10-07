import assert from 'node:assert/strict'
import { validateLetterTurn } from '../shared/letterPlan.js'
import { applyLetterOperations, applyLetterEdit, createLetter } from '../shared/letterModel.js'
import { sourceTextOf } from '../shared/factGuard.js'

const resumeData = {
  fullName: 'Asha Rao', headline: 'Frontend Developer', email: 'asha@mail.co', phone: '', location: 'Pune', summary: 'Frontend developer who builds accessible dashboards with React.', links: [],
  skills: { languages: ['JavaScript'], frameworks: ['React'], tools: [], databases: [], softSkills: [], other: [] },
  experience: [{ role: 'Intern', company: 'Acme', location: '', startDate: 'Jun 2024', endDate: 'Aug 2024', bullets: ['Reduced page load time by 40% by caching API responses and splitting bundles'] }],
  projects: [], education: [], certifications: [], achievements: [], languages: [], customSections: []
}
let letter = createLetter()
letter = applyLetterEdit(letter, 'letter.recipient.company', 'Northwind')
const ctx = (instruction = '', job = '') => ({ letter, resumeData, sourceText: sourceTextOf(resumeData, instruction, job, letter.recipient), simulate: (current, op) => applyLetterOperations({ letter: current, resumeData }, [op]).letter })
const turn = (operations, instruction) => validateLetterTurn({ mode: 'edit', message: 'Done', steps: [{ title: 'Edit', operations }] }, ctx(instruction))
const throwsMatching = (fn, pattern) => assert.throws(fn, error => pattern.test(error.message))

// A valid draft, then letter fields that come from the request.
assert.equal(turn([{ type: 'replace_paragraphs', values: [
  'Your Frontend Developer opening at Northwind matches the accessible dashboards I built with React during my internship at Acme.',
  'At Acme I cut page load time by 40% with caching, which is the kind of practical gain I want to repeat for your users.',
  'Thank you for reading. I would welcome a conversation about the role.'
] }]).steps[0].operations.length, 1)
assert.equal(turn([{ type: 'set_letter_field', target: 'recipientName', value: 'Priya Shah' }], 'Address it to Priya Shah').steps.length, 1)

// Names and companies must come from the sources; numbers and skills must not be invented.
throwsMatching(() => turn([{ type: 'set_letter_field', target: 'recipientName', value: 'Priya Shah' }], 'make it warmer'), /not in the resume/)
throwsMatching(() => turn([{ type: 'set_letter_field', target: 'company', value: 'Globex' }], 'x'), /not in the resume/)
throwsMatching(() => turn([{ type: 'set_paragraph', index: 1, text: 'I grew revenue by 300% using Kubernetes at scale for the whole team.' }]), /adds/)

// Weak drafts are rejected with a reason the model can repair from.
throwsMatching(() => turn([{ type: 'replace_paragraphs', values: ['I am writing to apply for the role at your company because I like it a lot.', 'Thanks.'] }]), /generic opener/)
throwsMatching(() => turn([{ type: 'set_paragraph', index: 1, text: 'Reduced page load time by 40% by caching API responses and splitting bundles.' }]), /repeat the resume/)

// Structure limits and unsupported operations.
throwsMatching(() => turn([{ type: 'set_paragraph', index: 9, text: 'x' }]), /index/)
throwsMatching(() => turn([{ type: 'remove_paragraph', index: 9 }]), /index/)
throwsMatching(() => turn([{ type: 'set_element_style', target: 'letter.date', changes: { fontWeight: 700 } }]), /not a letter operation/)
throwsMatching(() => turn([{ type: 'set_field', target: 'summary', value: 'x' }]), /only changes/)
assert.equal(turn([{ type: 'set_field', target: 'phone', value: '555 0100' }], 'my phone is 555 0100').steps.length, 1)

// Other modes.
assert.equal(validateLetterTurn({ mode: 'question', message: 'Which?', question: { text: 'What drew you to Northwind?' } }, ctx()).question.text, 'What drew you to Northwind?')
assert.equal(validateLetterTurn({ mode: 'conversation', message: 'Fonts are in the Format panel.' }, ctx()).mode, 'conversation')
throwsMatching(() => validateLetterTurn({ mode: 'options', message: 'x' }, ctx()), /mode must be/)
console.log('letterPlan ok')

// The flat one-step form is accepted and becomes a single titled step.
const flat = validateLetterTurn({ mode: 'edit', message: 'Done', title: 'Tighten the closing', operations: [{ type: 'set_paragraph', index: 3, text: 'Thank you for reading. I would welcome a conversation about the role.' }] }, ctx())
assert.equal(flat.steps.length, 1)
assert.equal(flat.steps[0].title, 'Tighten the closing')
console.log('letterPlan flat ok')
