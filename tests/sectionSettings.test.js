import assert from 'node:assert/strict'
import { applySectionOrder, hasSectionSettings, isSectionHidden, moveSection, normalizeSectionSettings, sectionTitleFor, shapeSections } from '../src/editor/sectionSettings.js'

const template = ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'achievements', 'languages']

// No saved order: the template's own order is untouched.
assert.deepEqual(applySectionOrder(template, undefined), template)
assert.deepEqual(applySectionOrder(template, ['skills']), template, 'one section is not an order')

// A saved order rearranges only those sections, in the slots they already hold.
assert.deepEqual(applySectionOrder(['contact', 'summary', 'experience', 'skills'], ['skills', 'experience', 'summary']), ['contact', 'skills', 'experience', 'summary'])
// Unknown, custom and duplicate ids are ignored; sections missing from the saved list keep their relative order.
assert.deepEqual(applySectionOrder(template, ['education', 'nonsense', 'custom-0', 'summary', 'education']), ['education', 'experience', 'projects', 'summary', 'skills', 'certifications', 'achievements', 'languages'])

// Moving a section swaps it with its neighbour in the same column only.
const shown = [
  { id: 'summary', placement: 'main' }, { id: 'experience', placement: 'main' }, { id: 'skills', placement: 'sidebar' },
  { id: 'education', placement: 'main' }, { id: 'languages', placement: 'sidebar' }
]
assert.deepEqual(moveSection(shown, 'education', -1), ['summary', 'education', 'skills', 'experience', 'languages'])
assert.deepEqual(moveSection(shown, 'languages', -1), ['summary', 'experience', 'languages', 'education', 'skills'])
assert.equal(moveSection(shown, 'summary', -1), null, 'first in its column')
assert.equal(moveSection(shown, 'languages', 1), null, 'last in its column')
assert.equal(moveSection(shown, 'personal', 1), null, 'personal details cannot move')

// Hidden, renamed.
const settings = { hidden: { education: true, personal: true }, titles: { experience: '  Career history ', skills: '   ' } }
assert.equal(isSectionHidden(settings, 'education'), true)
assert.equal(isSectionHidden(settings, 'personal'), false, 'only built-in sections can be hidden')
assert.equal(sectionTitleFor(settings, 'experience', 'Experience'), 'Career history')
assert.equal(sectionTitleFor(settings, 'skills', 'Skills'), 'Skills', 'a blank title falls back')
assert.equal(sectionTitleFor({ titles: { x: 'Nope' } }, 'x', 'X'), 'X')

// Shaping what prints: hidden removed, titles replaced, order applied.
const printed = shapeSections(
  [{ id: 'summary', title: 'Summary', blocks: [1] }, { id: 'experience', title: 'Experience', blocks: [1] }, { id: 'education', title: 'Education', blocks: [1] }, { id: 'custom-0', title: 'Volunteering', blocks: [1] }],
  { hidden: { summary: true }, titles: { experience: 'Career' }, order: ['education', 'experience'] },
  ['summary', 'experience', 'education']
)
assert.deepEqual(printed.map(section => [section.id, section.title]), [['education', 'Education'], ['experience', 'Career'], ['custom-0', 'Volunteering']])
assert.deepEqual(shapeSections([{ id: 'summary', title: 'Summary', blocks: [1] }], null, template).map(section => section.title), ['Summary'], 'no settings changes nothing')

// Saved drafts are cleaned, and empty settings count as none.
assert.deepEqual(normalizeSectionSettings(null), {})
assert.deepEqual(normalizeSectionSettings({ hidden: { skills: true, summary: false, nope: true }, titles: { skills: '  ', summary: 'About me ' }, order: ['skills', 'skills', 'x'] }), { hidden: { skills: true }, titles: { summary: 'About me ' } })
assert.equal(hasSectionSettings({}), false)
assert.equal(hasSectionSettings({ hidden: { skills: true } }), true)

console.log('sectionSettings tests passed')
