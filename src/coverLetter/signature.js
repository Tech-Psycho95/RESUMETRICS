// Signature import (PLAN-033). A photo or scan of a signature has a paper-coloured background; this turns it
// into ink on a transparent background, so whatever colour the letter's paper is shows through and always matches.
// The pixel maths takes plain RGBA arrays so it runs (and is tested) in node; the canvas wrapper is browser-only.

export const SIGNATURE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const MAX_SIGNATURE_BYTES = 8 * 1024 * 1024
const MAX_SOURCE_WIDTH = 700
const PNG_BUDGET = 150_000
const MAX_DISTANCE = Math.sqrt(3 * 255 * 255)

const median = values => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 255 }
const smoothstep = (low, high, value) => { const t = Math.min(1, Math.max(0, (value - low) / (high - low || 1))); return t * t * (3 - 2 * t) }

export const hexToRgb = hex => {
  const value = String(hex ?? '#172033').replace('#', '')
  const full = value.length === 3 ? [...value].map(char => char + char).join('') : value.padEnd(6, '0')
  return [0, 2, 4].map(offset => parseInt(full.slice(offset, offset + 2), 16) || 0)
}

/** The paper colour: the median of the pixels along the image border (the signature never touches the edge). */
export function estimatePaper(data, width, height) {
  const ring = Math.max(2, Math.round(Math.min(width, height) * 0.03))
  const reds = []; const greens = []; const blues = []
  const take = (x, y) => { const at = (y * width + x) * 4; reds.push(data[at]); greens.push(data[at + 1]); blues.push(data[at + 2]) }
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    if (x < ring || y < ring || x >= width - ring || y >= height - ring) take(x, y)
  }
  return [median(reds), median(greens), median(blues)]
}

/** Opacity of a pixel from how far it is from the paper. `cleanup` 0–1: higher ignores more faint marks (shadows, lines). */
export const alphaFor = (distance, cleanup = 0.5) => {
  const low = 0.04 + 0.2 * Math.min(1, Math.max(0, cleanup))
  return smoothstep(low, low + 0.22, distance / MAX_DISTANCE)
}

/**
 * Paper → transparent, ink → `ink` colour. Returns { data, bounds, inkShare } where bounds is the ink's rectangle
 * (null when nothing was found) and inkShare the fraction of pixels that are mostly ink.
 */
export function processPixels(data, width, height, { ink = [23, 32, 51], cleanup = 0.5, paper = estimatePaper(data, width, height) } = {}) {
  const out = new Uint8ClampedArray(data.length)
  let x0 = width; let y0 = height; let x1 = -1; let y1 = -1; let strong = 0
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const at = (y * width + x) * 4
    const distance = Math.hypot(data[at] - paper[0], data[at + 1] - paper[1], data[at + 2] - paper[2])
    const alpha = alphaFor(distance, cleanup) * (data[at + 3] / 255)
    out[at] = ink[0]; out[at + 1] = ink[1]; out[at + 2] = ink[2]; out[at + 3] = Math.round(alpha * 255)
    if (alpha > 0.5) strong += 1
    if (alpha > 0.1) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  return { data: out, bounds: x1 < 0 ? null : { x0, y0, x1, y1 }, inkShare: strong / (width * height), paper }
}

/** Why a processed signature may look wrong, in words the writer can act on. Null = fine. */
export const signatureAdvice = inkShare => inkShare < 0.002 ? 'We could barely see any ink. Try a darker pen on plain white paper, in daylight.'
  : inkShare > 0.4 ? 'The whole image looks like ink. Photograph the signature on plain, evenly lit paper.' : null

export function validateSignatureFile(file) {
  if (!file) return 'Choose an image of your signature.'
  if (!SIGNATURE_TYPES.includes(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name ?? '')) return 'Choose a PNG, JPG or WebP image.'
  if (file.size > MAX_SIGNATURE_BYTES) return 'Choose an image smaller than 8 MB.'
  return null
}

const loadImage = source => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('This image could not be opened. Choose another one.'))
  image.src = source
})
const readAsDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(new Error('This image could not be read. Choose another one.'))
  reader.readAsDataURL(file)
})

function canvasFor(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width)); canvas.height = Math.max(1, Math.round(height))
  return canvas
}

/** Re-run the pipeline from a stored (downscaled) original: used after the colour or Clean-up changes. */
export async function renderSignature(source, { ink, cleanup = 0.5 }) {
  const image = await loadImage(source)
  const scale = Math.min(1, MAX_SOURCE_WIDTH / image.naturalWidth)
  let width = image.naturalWidth * scale
  let height = image.naturalHeight * scale
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const canvas = canvasFor(width, height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('This browser could not process the image.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const result = processPixels(pixels.data, canvas.width, canvas.height, { ink: hexToRgb(ink), cleanup })
    if (!result.bounds) return { image: null, inkShare: result.inkShare, advice: signatureAdvice(result.inkShare) ?? 'No signature found in this image.' }
    const pad = 4
    const x = Math.max(0, result.bounds.x0 - pad); const y = Math.max(0, result.bounds.y0 - pad)
    const w = Math.min(canvas.width - x, result.bounds.x1 - result.bounds.x0 + 1 + pad * 2)
    const h = Math.min(canvas.height - y, result.bounds.y1 - result.bounds.y0 + 1 + pad * 2)
    context.putImageData(new ImageData(result.data, canvas.width, canvas.height), 0, 0)
    const cropped = canvasFor(w, h)
    cropped.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h)
    const url = cropped.toDataURL('image/png')
    // Keep the saved draft small: shrink and redo when the PNG is over budget.
    if (url.length <= PNG_BUDGET * 1.37 || attempt === 2) return { image: url, aspect: w / h, inkShare: result.inkShare, advice: signatureAdvice(result.inkShare) }
    width *= 0.72; height *= 0.72
  }
  return { image: null, inkShare: 0, advice: 'No signature found in this image.' }
}

/** Read a file, keep a downscaled original for re-tinting, and return { source, image, aspect, advice }. */
export async function importSignature(file, { ink, cleanup = 0.5 } = {}) {
  const problem = validateSignatureFile(file)
  if (problem) throw new Error(problem)
  const original = await readAsDataUrl(file)
  const image = await loadImage(original)
  const scale = Math.min(1, MAX_SOURCE_WIDTH / image.naturalWidth)
  const canvas = canvasFor(image.naturalWidth * scale, image.naturalHeight * scale)
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const source = canvas.toDataURL('image/jpeg', 0.82)
  const rendered = await renderSignature(source, { ink, cleanup })
  return { source, ...rendered }
}
