import assert from 'node:assert/strict'
import { normaliseRails, resizeCoupled } from '../src/components/editor/railSizing.js'

// Growing one rail shrinks the other by the same amount.
assert.deepEqual(resizeCoupled({ left: 340, right: 340, side: 'left', dx: 60 }), { left: 400, right: 280, side: 'left' })
assert.deepEqual(resizeCoupled({ left: 340, right: 340, side: 'right', dx: -40 }), { left: 300, right: 380, side: 'right' })
// The total never changes, so the resume width is constant.
for (const dx of [-500, -80, 0, 33, 500]) {
  const next = resizeCoupled({ left: 340, right: 340, side: 'left', dx })
  assert.equal(next.left + next.right, 680)
  assert.ok(next.left >= 260 && next.left <= 520 && next.right >= 260 && next.right <= 520)
}
// A limit on either side stops both rails.
assert.deepEqual(resizeCoupled({ left: 340, right: 340, side: 'left', dx: 1000 }), { left: 420, right: 260, side: 'left' })
assert.deepEqual(resizeCoupled({ left: 340, right: 340, side: 'right', dx: -1000 }), { left: 260, right: 420, side: 'right' })
// Stored values are repaired.
assert.deepEqual(normaliseRails(null), { left: 340, right: 340 })
assert.deepEqual(normaliseRails({ left: 900, right: 10 }), { left: 420, right: 260 })
console.log('railSizing: all checks passed')
