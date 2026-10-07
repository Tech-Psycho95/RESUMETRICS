import assert from 'node:assert/strict'

// The provider is read from the environment at import time, so set it before loading any server module.
process.env.RESUMETRICS_AI_PROVIDER = 'mock'
process.env.RESUMETRICS_AI_DEFAULT_MODEL = ''
const { env } = await import('../server/config/env.js')
const { generateAIResponse } = await import('../server/services/aiClient.js')
const { planNimbusTurn } = await import('../server/nimbus/nimbusEngine.js')
const { planLetterTurn } = await import('../server/nimbus/letterEngine.js')
const { parseJobDescription, suggestFixes } = await import('../server/jd/jdEngine.js')
const { extractCompleteResumeDocument } = await import('../server/services/resumeExtraction.js')
const { extractJdKeywords, scoreKeywords } = await import('../shared/jdKeywords.js')
const { applyNimbusOperations } = await import('../src/nimbus/applyNimbusOperations.js')
const { resume, elements, style, jobs, letters } = await import('../server/ai/evals/fixtures.js')

assert.equal(env.ai.provider, 'mock')
assert.equal(env.ai.defaultModel, 'mock')

// A fallback would mean the real validators rejected the mock's answer; fail loudly instead.
const warn = console.warn
console.warn = (...args) => { throw new Error(`Unexpected AI fallback: ${args.join(' ')}`) }

// Plain text (npm run ai:ping).
assert.equal(await generateAIResponse({ userPrompt: 'Reply with OK' }), 'OK')

// NIMBUS: an edit the real validator accepts, and that the editor can apply.
const context = { resumeData: resume, elements, style, elementOverrides: {}, selection: null, conversation: [] }
const turn = await planNimbusTurn({ instruction: 'Make my internship stronger', context })
assert.equal(turn.mode, 'edit')
assert.equal(turn.model, 'mock')
const [operation] = turn.steps[0].operations
assert.equal(operation.type, 'replace_bullets')
assert.deepEqual(operation.values, [resume.experience[0].bullets.at(-1), ...resume.experience[0].bullets.slice(0, -1)])
const applied = applyNimbusOperations({ resumeData: resume, resumePresentation: { elementOverrides: {} } }, turn.steps[0].operations)
assert.equal(applied.resumeData.experience[0].bullets[0], resume.experience[0].bullets.at(-1))

// Forced modes for tests of the chat UI.
assert.equal((await planNimbusTurn({ instruction: 'mock:question', context })).mode, 'question')
assert.equal((await planNimbusTurn({ instruction: 'mock:refuse', context })).mode, 'refuse')

// Cover letter: letter-only operations pass the letter validator.
const letterTurn = await planLetterTurn({ instruction: 'Add a greeting', context: { document: 'letter', resumeData: resume, letter: letters.empty, job: null, elements: [], selection: null, conversation: [] } })
assert.equal(letterTurn.mode, 'edit')
assert.deepEqual(letterTurn.steps[0].operations.map(op => `${op.target}=${op.value}`), ['salutation=Dear Hiring Manager,', 'signoff=Kind regards,'])

// Job fixes: an executable skills reorder plus suggestions for missing keywords, not the degraded fallback.
const jd = await parseJobDescription(jobs.frontend)
assert.equal(jd.parsedBy, 'ai')
assert.ok(jd.mustHave.includes('React'))
const keywords = scoreKeywords(resume, extractJdKeywords(jd, jobs.frontend)).rows
const { fixes, degraded } = await suggestFixes({ resumeData: resume, jd, keywords })
assert.equal(degraded, false)
assert.ok(fixes.length >= 2)
assert.ok(fixes.some(fix => fix.kind === 'executable' && fix.operations[0].type === 'replace_skills'))

// Resume import goes through the AI path (not the text-only fallback) and reads the basics.
const text = 'Jordan Lee\nSoftware Engineer\njordan@example.com | +1 555 0100\nSkills\nJavaScript, React, PostgreSQL'
const imported = await extractCompleteResumeDocument({ pages: [{ pageNumber: 1, text }], links: [], metadata: {} })
assert.equal(imported.extractionMethod, 'ai')
assert.equal(imported.resumeData.fullName, 'Jordan Lee')
assert.equal(imported.resumeData.email, 'jordan@example.com')

console.warn = warn
console.log('mockProvider: all checks passed')
