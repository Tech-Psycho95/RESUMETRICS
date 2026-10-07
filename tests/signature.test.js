import assert from 'node:assert/strict'
import { alphaFor, estimatePaper, hexToRgb, processPixels, signatureAdvice, validateSignatureFile } from '../src/coverLetter/signature.js'

// A synthetic scan: paper-coloured background, a diagonal pen stroke, and some faint shadow noise.
function scan(width, height, paper, pen = [20, 20, 60]) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const at = (y * width + x) * 4
    const onStroke = Math.abs(x - (20 + y)) <= 1 && y > 10 && y < height - 10
    const shade = onStroke ? pen : paper
    data.set([...shade, 255], at)
  }
  return data
}

for (const [name, paper] of [['white', [255, 255, 255]], ['cream', [245, 242, 234]], ['grey', [233, 233, 231]], ['photo-grey', [205, 205, 200]]]) {
  const width = 120; const height = 60
  const data = scan(width, height, paper)
  assert.deepEqual(estimatePaper(data, width, height), paper, `${name} paper estimated from the border`)
  const ink = hexToRgb('#112a66')
  const result = processPixels(data, width, height, { ink })
  // Paper becomes fully transparent; the stroke is opaque and takes the chosen ink colour.
  assert.equal(result.data[3], 0, `${name} background is transparent`)
  const stroke = (30 * width + 50) * 4
  assert.ok(result.data[stroke + 3] > 240, `${name} ink stays opaque`)
  assert.deepEqual([...result.data.slice(stroke, stroke + 3)], ink, `${name} ink is recoloured`)
  assert.ok(result.bounds.x0 >= 10 && result.bounds.x1 <= 90 && result.bounds.y0 >= 10, `${name} bounds hug the ink`)
  assert.equal(signatureAdvice(result.inkShare), null)
}

// Faint marks (shadow, ruled lines) disappear as Clean-up rises, strong ink never does.
assert.ok(alphaFor(30, 0) > alphaFor(30, 1))
assert.equal(alphaFor(30, 1), 0)
assert.ok(alphaFor(400, 1) > 0.99)

// Blank pages and fully dark pages get advice instead of a silent failure.
const blank = processPixels(scan(40, 40, [250, 250, 250], [250, 250, 250]), 40, 40, {})
assert.equal(blank.bounds, null)
assert.match(signatureAdvice(blank.inkShare), /barely see any ink/)
assert.match(signatureAdvice(0.6), /whole image/)

// Transparent sources stay transparent.
const clear = new Uint8ClampedArray(20 * 20 * 4)
assert.equal(processPixels(clear, 20, 20, { paper: [255, 255, 255] }).bounds, null)

// File checks.
assert.match(validateSignatureFile(null), /Choose an image/)
assert.match(validateSignatureFile({ type: 'application/pdf', name: 'a.pdf', size: 10 }), /PNG, JPG or WebP/)
assert.match(validateSignatureFile({ type: 'image/png', name: 'a.png', size: 9 * 1024 * 1024 }), /8 MB/)
assert.equal(validateSignatureFile({ type: 'image/jpeg', name: 'a.jpg', size: 1000 }), null)
assert.deepEqual(hexToRgb('#fff'), [255, 255, 255])
console.log('signature ok')
