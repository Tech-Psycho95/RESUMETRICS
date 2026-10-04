// One-off: download the families in catalogue.source.js from Google Fonts into public/fonts,
// fetch each family's licence from github.com/google/fonts, and write src/fonts/fontCatalogue.json.
// Only OFL and Apache-licensed families are kept. Re-run safely: existing files are reused.
// Usage: node scripts/fonts/fetch-fonts.mjs
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fontSources } from './catalogue.source.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const fontsDir = path.join(root, 'public', 'fonts')
const licenceDir = path.join(root, 'licenses', 'fonts')
const outFile = path.join(root, 'src', 'fonts', 'fontCatalogue.json')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const SUBSETS = new Set(['latin', 'latin-ext'])
const WANTED = [[0, 400], [0, 500], [0, 600], [0, 700], [1, 400], [1, 700]]

const slugify = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const quoteFamily = (name, generic) => `${/^[A-Za-z][A-Za-z ]*$/.test(name) ? name : `"${name}"`}, ${generic}`

async function fetchText(url, headers = {}) {
  const response = await fetch(url, { headers: { 'User-Agent': UA, ...headers } })
  if (!response.ok) return null
  return response.text()
}

async function fetchCss(name, tuples) {
  const axis = tuples.map(([italic, weight]) => `${italic},${weight}`).join(';')
  return fetchText(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:ital,wght@${axis}&display=swap`)
}

function parseCss(css) {
  const faces = []
  for (const match of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g)) {
    const [, subset, body] = match
    if (!SUBSETS.has(subset)) continue
    const read = key => body.match(new RegExp(`${key}:\\s*([^;]+);`))?.[1]?.trim()
    const url = body.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (!url) continue
    faces.push({ subset, style: read('font-style'), weight: Number(read('font-weight')), unicodeRange: read('unicode-range'), url })
  }
  return faces
}

async function fetchLicence(name) {
  const dir = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const [kind, file, licence] of [['ofl', 'OFL.txt', 'OFL-1.1'], ['apache', 'LICENSE.txt', 'Apache-2.0']]) {
    const text = await fetchText(`https://raw.githubusercontent.com/google/fonts/main/${kind}/${dir}/${file}`)
    if (text) return { licence, text }
  }
  return null
}

async function processFont(source) {
  const id = slugify(source.name)
  const licence = await fetchLicence(source.name)
  if (!licence) return { id, error: 'no OFL/Apache licence found' }
  let css = await fetchCss(source.name, WANTED)
  let faces = css ? parseCss(css) : []
  if (!faces.length) {
    // Some weights don't exist for this family: ask for each one separately.
    for (const tuple of WANTED) {
      const single = await fetchCss(source.name, [tuple])
      if (single) faces.push(...parseCss(single))
    }
  }
  if (!faces.length) return { id, error: 'not found on Google Fonts' }
  await mkdir(path.join(fontsDir, id), { recursive: true })
  const fileForUrl = new Map()
  for (const face of faces) {
    if (!fileForUrl.has(face.url)) {
      const file = `${id}-${face.subset}-${fileForUrl.size + 1}.woff2`
      const target = path.join(fontsDir, id, file)
      if (!existsSync(target)) {
        const response = await fetch(face.url, { headers: { 'User-Agent': UA } })
        if (!response.ok) return { id, error: `download failed ${response.status}` }
        await writeFile(target, Buffer.from(await response.arrayBuffer()))
      }
      fileForUrl.set(face.url, `/fonts/${id}/${file}`)
    }
    face.file = fileForUrl.get(face.url)
  }
  await mkdir(licenceDir, { recursive: true })
  await writeFile(path.join(licenceDir, `${id}.txt`), licence.text)
  const weights = [...new Set(faces.filter(face => face.style === 'normal').map(face => face.weight))].sort((a, b) => a - b)
  return {
    id,
    entry: {
      id,
      name: source.legacyName ?? source.name,
      googleFamily: source.name,
      family: quoteFamily(source.name, source.generic),
      category: source.category,
      tags: source.tags,
      roles: source.roles,
      atsSafe: source.atsSafe,
      ...(source.note ? { note: source.note } : {}),
      weights,
      italics: faces.some(face => face.style === 'italic'),
      licence: licence.licence,
      faces: faces.map(({ weight, style, unicodeRange, file }) => ({ weight, style, unicodeRange, file }))
    }
  }
}

const results = []
const queue = [...fontSources]
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const source = queue.shift()
    try { results.push(await processFont(source)) } catch (error) { results.push({ id: slugify(source.name), error: error.message }) }
    process.stdout.write('.')
  }
}))
const order = new Map(fontSources.map((source, index) => [slugify(source.name), index]))
const entries = results.filter(result => result.entry).map(result => result.entry).sort((a, b) => order.get(a.id) - order.get(b.id))
await mkdir(path.dirname(outFile), { recursive: true })
await writeFile(outFile, `${JSON.stringify(entries, null, 1)}\n`)

let bytes = 0
for (const entry of entries) for (const file of new Set(entry.faces.map(face => face.file))) bytes += (await stat(path.join(root, 'public', file))).size
console.log(`\n${entries.length} families saved, ${(bytes / 1024 / 1024).toFixed(1)} MB of woff2.`)
const failed = results.filter(result => result.error)
if (failed.length) console.log(`Skipped ${failed.length}:\n${failed.map(result => `  ${result.id}: ${result.error}`).join('\n')}`)
