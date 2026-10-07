import assert from 'node:assert/strict'
import { applyLetterEdit, applyLetterOperations, countWords, createLetter, dateOf, insertParagraph, letterFromJob, letterReadModel, letterToText, moveParagraph, removeParagraph, replaceParagraphs, roleOf, salutationOf, signoffOf } from '../shared/letterModel.js'

const resume = { fullName: 'Asha Rao', headline: 'Frontend Developer', email: 'asha@mail.co', phone: '555 0100', location: 'Pune' }
const now = new Date('2026-10-06T10:00:00')

// Defaults follow the ResumeWay rules: named → sincerely, generic → faithfully.
let letter = createLetter()
assert.equal(letter.paragraphs.map(item => item.kind).join(), 'opening,proof,fit,closing')
assert.equal(salutationOf(letter), 'Dear Hiring Manager,')
assert.equal(signoffOf(letter), 'Yours faithfully,')
letter = applyLetterEdit(letter, 'letter.recipient.name', 'Ms. Rao')
assert.equal(salutationOf(letter), 'Dear Ms. Rao,')
assert.equal(signoffOf(letter), 'Yours sincerely,')
letter = applyLetterEdit(letter, 'letter.signoff', 'Best regards,')
assert.equal(signoffOf(letter), 'Best regards,')

// Date: auto until typed, auto again when cleared.
assert.equal(dateOf(letter, now, 'en-US'), 'October 6, 2026')
letter = applyLetterEdit(letter, 'letter.date', '1 Nov 2026')
assert.equal(dateOf(letter, now, 'en-US'), '1 Nov 2026')
assert.equal(applyLetterEdit(letter, 'letter.date', '').dateAuto, true)

// Role override falls back to the resume headline.
assert.equal(roleOf(letter, resume), 'Frontend Developer')
assert.equal(roleOf(applyLetterEdit(letter, 'letter.role', 'UI Engineer'), resume), 'UI Engineer')

// Paragraph edits by id and address lines.
const first = letter.paragraphs[0].id
letter = applyLetterEdit(letter, `letter.paragraph.${first}`, 'Hello world there')
assert.equal(letter.paragraphs[0].text, 'Hello world there')
letter = applyLetterEdit(letter, 'letter.recipient.address', '12 Park Road\n\nPune 411001')
assert.deepEqual(letter.recipient.address, ['12 Park Road', 'Pune 411001'])
assert.equal(applyLetterEdit(letter, 'letter.recipient.address.1', 'Pune 411002').recipient.address[1], 'Pune 411002')
assert.equal(applyLetterEdit(letter, 'fullName', 'x'), letter, 'resume paths are not the letter')

// Structure helpers keep first=opening, last=closing and a six paragraph cap.
let long = letter
for (let i = 0; i < 5; i += 1) long = insertParagraph(long, 1, `extra ${i}`)
assert.equal(long.paragraphs.length, 6)
assert.equal(long.paragraphs[0].kind, 'opening')
assert.equal(long.paragraphs.at(-1).kind, 'closing')
assert.equal(removeParagraph(createLetter({ paragraphs: [{ id: 'a', kind: 'opening', text: '' }] }), 0).paragraphs.length, 1)
const moved = moveParagraph(letter, 0, 2)
assert.equal(moved.paragraphs[2].id, first)
assert.equal(replaceParagraphs(letter, ['a', 'b', 'c']).paragraphs.map(item => item.kind).join(), 'opening,proof,closing')
assert.equal(replaceParagraphs(letter, ['a', 'b', 'c']).paragraphs[0].id, first, 'ids are reused')

// Operations: letter fields, paragraphs and the shared header.
const result = applyLetterOperations({ letter, resumeData: resume }, [
  { type: 'set_letter_field', target: 'company', value: 'Northwind' },
  { type: 'set_letter_field', target: 'address', value: ['1 Main St', 'Leeds'] },
  { type: 'set_paragraph', index: 1, text: 'Proof text' },
  { type: 'set_field', target: 'headline', value: 'Senior Frontend Developer' },
  { type: 'clear_letter_field', target: 'date' }
])
assert.equal(result.letter.recipient.company, 'Northwind')
assert.deepEqual(result.letter.recipient.address, ['1 Main St', 'Leeds'])
assert.equal(result.letter.paragraphs[1].text, 'Proof text')
assert.equal(result.resumeData.headline, 'Senior Frontend Developer')
assert.equal(result.letter.dateAuto, true)
assert.equal(result.changed, true)
assert.equal(applyLetterOperations({ letter, resumeData: resume }, []).changed, false)

// Job prefill never overwrites what the user typed.
const fromJob = letterFromJob(applyLetterEdit(createLetter(), 'letter.recipient.company', 'Mine'), { title: 'UI Engineer', company: 'Other' })
assert.equal(fromJob.recipient.company, 'Mine')
assert.equal(fromJob.role, 'UI Engineer')
assert.equal(fromJob.subject, 'Application for UI Engineer')

// Read model reaches every editable value by its path; text export has the whole letter.
const model = letterReadModel(letter, resume, now)
assert.equal(model.letter.paragraph[first], 'Hello world there')
assert.equal(model.letter.recipient.name, 'Ms. Rao')
assert.equal(model.headline, 'Frontend Developer')
const text = letterToText(letter, resume, now)
assert.match(text, /Asha Rao/)
assert.match(text, /Dear Ms\. Rao,/)
assert.match(text, /Hello world there/)
assert.equal(countWords('One [b]two[/b] three-four 40% $5'), 5)
console.log('letterModel ok')
