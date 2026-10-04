// Formatting for part of a sentence, stored inside the text as [b]…[/b], [i]…[/i], [u]…[/u], [s]…[/s].
// Tags were chosen over Markdown because resumes contain *, _ and __init__ literally.
// Exports and AI-facing plain text use stripMarks(); the templates render parseMarks() runs.

export const MARKS = ['b', 'i', 'u', 's']
const TAG = /\[(\/?)([bius])\]/g

/** Text → [{ text, marks: ['b', 'i'] }]. Unmatched or stray tags are kept as literal text. */
export function parseMarks(value) {
  const source = String(value ?? '')
  if (!source.includes('[')) return source ? [{ text: source, marks: [] }] : []
  // First pass: find tag pairs that actually close, so stray tags stay literal.
  const tokens = []
  let last = 0
  for (const match of source.matchAll(TAG)) {
    if (match.index > last) tokens.push({ type: 'text', text: source.slice(last, match.index) })
    tokens.push({ type: match[1] ? 'close' : 'open', mark: match[2], raw: match[0] })
    last = match.index + match[0].length
  }
  if (last < source.length) tokens.push({ type: 'text', text: source.slice(last) })
  const paired = new Set()
  const stack = []
  tokens.forEach((token, index) => {
    if (token.type === 'open') stack.push(index)
    if (token.type === 'close') {
      const openIndex = stack.findLastIndex(candidate => tokens[candidate].mark === token.mark)
      if (openIndex >= 0) {
        paired.add(stack[openIndex]).add(index)
        stack.splice(openIndex, 1)
      }
    }
  })
  const active = []
  const runs = []
  tokens.forEach((token, index) => {
    if (token.type !== 'text' && !paired.has(index)) token = { type: 'text', text: token.raw }
    if (token.type === 'open') active.push(token.mark)
    else if (token.type === 'close') active.splice(active.lastIndexOf(token.mark), 1)
    else pushRun(runs, token.text, [...new Set(active)])
  })
  return runs
}

function pushRun(runs, text, marks) {
  if (!text) return
  const sorted = MARKS.filter(mark => marks.includes(mark))
  const previous = runs.at(-1)
  if (previous && previous.marks.join() === sorted.join()) previous.text += text
  else runs.push({ text, marks: sorted })
}

/** Runs → text with tags. Marks are opened/closed minimally between neighbouring runs. */
export function serialiseRuns(runs) {
  let output = ''
  let open = []
  const merged = []
  runs.forEach(run => pushRun(merged, run.text, run.marks))
  merged.forEach(run => {
    // Close marks that end here (and anything opened after them, to keep nesting valid).
    const keepUntil = open.findIndex(mark => !run.marks.includes(mark))
    if (keepUntil >= 0) {
      output += open.slice(keepUntil).reverse().map(mark => `[/${mark}]`).join('')
      open = open.slice(0, keepUntil)
    }
    run.marks.filter(mark => !open.includes(mark)).forEach(mark => { output += `[${mark}]`; open.push(mark) })
    output += run.text
  })
  output += open.reverse().map(mark => `[/${mark}]`).join('')
  return output
}

export const stripMarks = value => parseMarks(value).map(run => run.text).join('')
export const hasMarks = value => parseMarks(value).some(run => run.marks.length)

/**
 * Toggle a mark over plain-text offsets [start, end). If every character in the range already has
 * the mark it is removed, otherwise it is added — like Word's Bold button.
 */
export function toggleMarkInRange(value, start, end, mark) {
  const runs = parseMarks(value)
  const plainLength = runs.reduce((sum, run) => sum + run.text.length, 0)
  const from = Math.max(0, Math.min(start, end))
  const to = Math.min(plainLength, Math.max(start, end))
  if (from === to) return String(value ?? '')
  const chars = runs.flatMap(run => [...run.text].map(char => ({ char, marks: run.marks })))
  // [...string] splits surrogate pairs correctly but offsets from the DOM are UTF-16 units; map them.
  const unitIndex = []
  chars.forEach((entry, index) => { for (let unit = 0; unit < entry.char.length; unit += 1) unitIndex.push(index) })
  const first = unitIndex[from] ?? chars.length
  const lastExclusive = to >= unitIndex.length ? chars.length : unitIndex[to]
  const inRange = chars.slice(first, lastExclusive)
  const remove = inRange.length > 0 && inRange.every(entry => entry.marks.includes(mark))
  const next = chars.map((entry, index) => {
    if (index < first || index >= lastExclusive) return entry
    const marks = remove ? entry.marks.filter(item => item !== mark) : [...new Set([...entry.marks, mark])]
    return { ...entry, marks }
  })
  return serialiseRuns(next.map(entry => ({ text: entry.char, marks: entry.marks })))
}

/** Whether every character in [start, end) carries the mark (for button state). */
export function rangeHasMark(value, start, end, mark) {
  let offset = 0
  let covered = false
  for (const run of parseMarks(value)) {
    const runStart = offset
    const runEnd = offset + run.text.length
    offset = runEnd
    if (runEnd <= start || runStart >= end) continue
    if (!run.marks.includes(mark)) return false
    covered = true
  }
  return covered
}

const markForTag = { STRONG: 'b', B: 'b', EM: 'i', I: 'i', U: 'u', S: 's', DEL: 's', STRIKE: 's' }

/** Read an edited DOM element back into marked text (inline typing keeps bold/italic parts). */
export function readMarkedText(element) {
  const runs = []
  const walk = (node, marks) => {
    if (node.nodeType === 3) { pushRun(runs, node.nodeValue.replace(/ /g, ' '), marks); return }
    if (node.nodeType !== 1) return
    if (node.tagName === 'BR') { pushRun(runs, '\n', marks); return }
    const mark = markForTag[node.tagName]
    const next = mark ? [...marks, mark] : marks
    node.childNodes.forEach(child => walk(child, next))
  }
  element.childNodes.forEach(child => walk(child, []))
  return serialiseRuns(runs)
}

/** Plain-text offsets of a DOM Range inside an element, or null when the range leaves the element. */
export function rangeOffsetsWithin(element, range) {
  if (!element || !range || !element.contains(range.startContainer) || !element.contains(range.endContainer)) return null
  const measure = (container, offset) => {
    const probe = document.createRange()
    probe.selectNodeContents(element)
    probe.setEnd(container, offset)
    return probe.toString().length
  }
  const start = measure(range.startContainer, range.startOffset)
  const end = measure(range.endContainer, range.endOffset)
  return { start: Math.min(start, end), end: Math.max(start, end) }
}
