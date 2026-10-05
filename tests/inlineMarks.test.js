import assert from 'node:assert/strict'
import { hasMarks, parseMarks, rangeHasMark, serialiseRuns, stripMarks, toggleMarkInRange } from '../src/editor/inlineMarks.js'

// Plain text is untouched; literal asterisks and underscores are safe.
assert.deepEqual(parseMarks('Built __init__ hooks in C*'), [{ text: 'Built __init__ hooks in C*', marks: [] }])
assert.equal(serialiseRuns(parseMarks('plain')), 'plain')

// Parse nested marks.
assert.deepEqual(parseMarks('Led [b]5 [i]teams[/i][/b] well'), [
  { text: 'Led ', marks: [] }, { text: '5 ', marks: ['b'] }, { text: 'teams', marks: ['b', 'i'] }, { text: ' well', marks: [] }
])
// Stray or unmatched tags stay literal.
assert.equal(stripMarks('a [b]b and [/i] c'), 'a [b]b and [/i] c')
assert.equal(stripMarks('[b]Bold[/b] text'), 'Bold text')
assert.equal(hasMarks('[u]x[/u]'), true)

// Toggle on, toggle off, partial overlap.
let text = 'Reduced latency by 40%'
text = toggleMarkInRange(text, 19, 22, 'b')
assert.equal(text, 'Reduced latency by [b]40%[/b]')
assert.equal(rangeHasMark(text, 19, 22, 'b'), true)
assert.equal(toggleMarkInRange(text, 19, 22, 'b'), 'Reduced latency by 40%')
text = toggleMarkInRange(text, 8, 22, 'i')
assert.equal(text, 'Reduced [i]latency by [b]40%[/b][/i]')
assert.equal(stripMarks(text), 'Reduced latency by 40%')
// Partly-bold range becomes fully bold.
assert.equal(toggleMarkInRange('[b]ab[/b]cd', 0, 4, 'b'), '[b]abcd[/b]')
// Empty range changes nothing; out-of-range offsets clamp.
assert.equal(toggleMarkInRange('abc', 2, 2, 'u'), 'abc')
assert.equal(toggleMarkInRange('abc', -5, 99, 's'), '[s]abc[/s]')
// Emoji / surrogate pairs keep offsets aligned with DOM UTF-16 offsets.
assert.equal(toggleMarkInRange('🚀 Launch', 3, 9, 'b'), '🚀 [b]Launch[/b]')
// Round trip.
for (const sample of ['[b]a[i]b[/i][/b]c', '[u]x[/u][s]y[/s]', 'none']) assert.equal(serialiseRuns(parseMarks(sample)), sample)
console.log('inlineMarks: all checks passed')
