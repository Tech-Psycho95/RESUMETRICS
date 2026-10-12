import assert from 'node:assert/strict'
import { buildResumeFields, hashFields, hasContent, presentationWithoutImageBytes, splitSavedPresentation, stableStringify } from '../src/db/resumeFields.js'
import { saveErrorKind, SaveError } from '../src/db/saveError.js'
import { validateResumeFields } from '../server/db/resumeStore.js'

// Canonical JSON: key order and undefined don't matter, array order does.
assert.equal(stableStringify({ b: 1, a: { d: [1, 2], c: undefined } }), stableStringify({ a: { d: [1, 2] }, b: 1 }))
assert.notEqual(stableStringify({ a: [1, 2] }), stableStringify({ a: [2, 1] }))
assert.equal(stableStringify(undefined), 'null')
assert.equal(stableStringify([undefined, 1]), '[null,1]')

const state = {
  resumeName: 'Ada CV', selectedTemplateId: 'onyx',
  resumeData: { fullName: 'Ada', experience: [{ id: 'e1', role: 'Engineer', bullets: ['Built things'] }], skills: { languages: ['JS'] } },
  resumePresentation: { template: 'onyx', accentColor: '#112233', photo: { source: 'data:image/png;base64,AAAA', originalSource: 'data:image/png;base64,BBBB', shape: 'circle', uploaded: true } },
  fontColor: '#172033', fontFamily: 'Georgia, serif', globalFontSize: 14, useGlobalTextColor: true, footerText: 'Thanks',
  confirmedSections: { education: true }, uploadedFileName: 'cv.pdf', parseMetadata: { pages: 2 }
}
const fields = buildResumeFields(state)

// What is saved includes the look of the resume (the first version saved only the text), but not image bytes.
assert.equal(fields.name, 'Ada CV')
assert.equal(fields.templateId, 'onyx')
assert.equal(fields.presentation.accentColor, '#112233')
assert.deepEqual(fields.presentation.style, { fontColor: '#172033', fontFamily: 'Georgia, serif', globalFontSize: 14, useGlobalTextColor: true, footerText: 'Thanks' })
assert.equal(fields.presentation.photo.source, undefined)
assert.equal(fields.presentation.photo.uploaded, false)
assert.equal(fields.presentation.photo.shape, 'circle')
assert.equal(state.resumePresentation.photo.source, 'data:image/png;base64,AAAA', 'the editor state itself is not changed')
assert.equal(JSON.stringify(fields).includes('base64'), false)
assert.equal(presentationWithoutImageBytes({ photo: { source: 'https://x/y.png' } }).photo.source, 'https://x/y.png')
assert.deepEqual(presentationWithoutImageBytes(null), {})

// The browser and the server agree on what gets stripped.
assert.equal(validateResumeFields(buildResumeFields({ ...state, resumePresentation: { ...state.resumePresentation, photo: { source: 'data:image/png;base64,AAAA' } } })).presentation.photo.source, undefined)

// Opening a saved resume must hash to exactly what is already saved, so it isn't saved again. Simulate the trip:
// server validation (drops undefined), JSON, and Firestore returning map keys in a different order.
const reorder = value => Array.isArray(value) ? value.map(reorder) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().reverse().map(key => [key, reorder(value[key])])) : value
const fromServer = reorder(validateResumeFields(fields))
const { presentation, style } = splitSavedPresentation(fromServer.presentation)
const reopened = buildResumeFields({ resumeName: fromServer.name, selectedTemplateId: fromServer.templateId, resumeData: fromServer.data, resumePresentation: presentation, ...style, confirmedSections: fromServer.confirmedSections, uploadedFileName: fromServer.sourceFileName, parseMetadata: fromServer.parseMetadata })
assert.equal(hashFields(reopened), hashFields(fields))

// Defaults when the saved presentation is missing or partial.
assert.deepEqual(splitSavedPresentation(null).style, { fontColor: '#172033', fontFamily: null, globalFontSize: null, useGlobalTextColor: false, footerText: '' })
assert.equal(splitSavedPresentation({ accentColor: '#fff' }).presentation.accentColor, '#fff')
assert.equal('style' in splitSavedPresentation({ style: { footerText: 'x' } }).presentation, false)

// A just-started blank resume has no content; element ids don't count as content.
assert.equal(hasContent({ fullName: '', experience: [{ id: 'e1', role: '', bullets: [''] }], skills: { languages: [] } }), false)
assert.equal(hasContent({ experience: [{ id: 'e1', bullets: ['x'] }] }), true)
assert.equal(hasContent({ skills: { tools: [' '] } }), false)
assert.equal(hasContent(null), false)

// HTTP failures map to the kinds the autosave understands.
assert.equal(saveErrorKind(409, 'conflict'), 'conflict')
assert.equal(saveErrorKind(409), 'conflict')
assert.equal(saveErrorKind(404), 'not_found')
assert.equal(saveErrorKind(413), 'too_large')
assert.equal(saveErrorKind(401), 'auth')
assert.equal(saveErrorKind(429), 'busy')
assert.equal(saveErrorKind(400), 'invalid')
assert.equal(saveErrorKind(503), 'server')
assert.equal(saveErrorKind(500), 'server')
assert.equal(new SaveError('network', 'x').kind, 'network')

console.log('✓ resumeFields tests passed')
