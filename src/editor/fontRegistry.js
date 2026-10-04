// Self-hosted, open-licensed resume fonts (see scripts/fonts and licenses/fonts).
// Files live in public/fonts and are registered with the FontFace API only when a font is used.
import catalogue from '../fonts/fontCatalogue.json'

// Family strings saved by earlier versions, so old drafts still resolve to the right font.
const legacyFamilies = {
  'source-sans-3': ['Source Sans 3, sans-serif'],
  'libre-baskerville': ['Libre Baskerville, Georgia, serif']
}

export const resumeFonts = catalogue.map(font => ({ ...font, aliases: legacyFamilies[font.id] ?? [] }))
export const fontCategories = [...new Set(resumeFonts.map(font => font.category))]
export const fontTags = [...new Set(resumeFonts.flatMap(font => font.tags))].sort()

const byFamily = new Map(resumeFonts.flatMap(font => [[font.family, font], ...font.aliases.map(alias => [alias, font])]))
const byId = new Map(resumeFonts.map(font => [font.id, font]))
const firstFamilyName = family => String(family ?? '').split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase()

/** Find a catalogue font by its CSS family string, id or display name. */
export function findFont(value) {
  if (!value) return null
  if (byFamily.has(value)) return byFamily.get(value)
  if (byId.has(value)) return byId.get(value)
  const name = firstFamilyName(value)
  return resumeFonts.find(font => font.name.toLowerCase() === name || font.googleFamily.toLowerCase() === name) ?? null
}

const loadedFonts = new Map()

/** Register and load a font's faces from /public/fonts. Resolves when the browser can use it. */
export function loadResumeFont(font) {
  const entry = typeof font === 'string' ? findFont(font) : font?.faces ? font : findFont(font?.family ?? font?.name)
  if (!entry || typeof document === 'undefined' || typeof FontFace === 'undefined') return Promise.resolve()
  if (loadedFonts.has(entry.id)) return loadedFonts.get(entry.id)
  const loading = Promise.all(entry.faces.map(face => {
    const fontFace = new FontFace(entry.googleFamily, `url(${face.file}) format('woff2')`, {
      weight: String(face.weight), style: face.style, unicodeRange: face.unicodeRange, display: 'swap'
    })
    document.fonts.add(fontFace)
    // Only the latin faces are fetched up front; latin-ext loads on demand when such characters appear.
    return /U\+0000-00FF/i.test(face.unicodeRange ?? '') ? fontFace.load().catch(() => null) : null
  })).then(() => undefined)
  loadedFonts.set(entry.id, loading)
  return loading
}

/** Load every font the resume uses (global + per-element). Used before printing and by the editor. */
export function loadFontsForPresentation(presentation, extraFamilies = []) {
  const families = [presentation?.fontFamily, ...Object.values(presentation?.elementOverrides ?? {}).map(override => override?.fontFamily), ...extraFamilies]
  return Promise.all([...new Set(families.filter(Boolean))].map(family => loadResumeFont(family)))
}
