// Curated resume colours shared by the format panel and NIMBUS. Every text colour passes WCAG AA on white.

export const textColours = [
  { hex: '#111827', name: 'Ink', tags: ['professional', 'neutral', 'classic'] },
  { hex: '#172033', name: 'Midnight', tags: ['professional', 'modern'] },
  { hex: '#1f2937', name: 'Graphite', tags: ['neutral', 'modern'] },
  { hex: '#374151', name: 'Slate', tags: ['soft', 'modern'] },
  { hex: '#3f3a36', name: 'Espresso', tags: ['warm', 'editorial'] },
  { hex: '#1e293b', name: 'Navy slate', tags: ['professional', 'cool'] },
  { hex: '#2b2d42', name: 'Charcoal blue', tags: ['professional', 'cool'] },
  { hex: '#4b5563', name: 'Grey', tags: ['soft', 'minimal'] }
]

export const accentColours = [
  { hex: '#1f3a5f', name: 'Navy', tags: ['professional', 'classic', 'corporate', 'trustworthy'] },
  { hex: '#294a69', name: 'Steel blue', tags: ['professional', 'calm'] },
  { hex: '#1d4ed8', name: 'Royal blue', tags: ['modern', 'confident', 'tech'] },
  { hex: '#0f766e', name: 'Teal', tags: ['modern', 'fresh', 'calm'] },
  { hex: '#166534', name: 'Forest', tags: ['calm', 'natural', 'classic'] },
  { hex: '#2f6a46', name: 'Pine', tags: ['calm', 'natural'] },
  { hex: '#7f1d1d', name: 'Burgundy', tags: ['elegant', 'classic', 'bold'] },
  { hex: '#9f1239', name: 'Crimson', tags: ['bold', 'creative'] },
  { hex: '#6d28d9', name: 'Violet', tags: ['creative', 'modern'] },
  { hex: '#4338ca', name: 'Indigo', tags: ['modern', 'tech', 'confident'] },
  { hex: '#a45c35', name: 'Copper', tags: ['warm', 'creative', 'editorial'] },
  { hex: '#92400e', name: 'Amber brown', tags: ['warm', 'classic'] },
  { hex: '#374151', name: 'Graphite', tags: ['minimal', 'neutral', 'professional'] },
  { hex: '#111111', name: 'Black', tags: ['minimal', 'classic', 'ats'] },
  { hex: '#0e7490', name: 'Cyan', tags: ['fresh', 'tech'] },
  { hex: '#be185d', name: 'Magenta', tags: ['creative', 'bold'] }
]

export const palettes = [
  { id: 'navy-professional', name: 'Navy professional', heading: '#1f3a5f', accent: '#294a69', text: '#1e293b', tags: ['professional', 'corporate', 'classic'] },
  { id: 'graphite-minimal', name: 'Graphite minimal', heading: '#111827', accent: '#374151', text: '#1f2937', tags: ['minimal', 'neutral', 'ats'] },
  { id: 'forest-calm', name: 'Forest calm', heading: '#166534', accent: '#2f6a46', text: '#1f2937', tags: ['calm', 'natural'] },
  { id: 'burgundy-classic', name: 'Burgundy classic', heading: '#7f1d1d', accent: '#9f1239', text: '#3f3a36', tags: ['elegant', 'classic'] },
  { id: 'teal-modern', name: 'Teal modern', heading: '#0f766e', accent: '#0e7490', text: '#172033', tags: ['modern', 'fresh'] },
  { id: 'indigo-tech', name: 'Indigo tech', heading: '#4338ca', accent: '#1d4ed8', text: '#111827', tags: ['tech', 'modern', 'confident'] },
  { id: 'copper-editorial', name: 'Copper editorial', heading: '#92400e', accent: '#a45c35', text: '#3f3a36', tags: ['warm', 'editorial', 'creative'] },
  { id: 'violet-creative', name: 'Violet creative', heading: '#6d28d9', accent: '#be185d', text: '#1f2937', tags: ['creative', 'bold'] }
]

const channel = value => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function parseHex(hex) {
  const match = String(hex ?? '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return null
  const full = match[1].length === 3 ? [...match[1]].map(c => c + c).join('') : match[1]
  return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16))
}

export function luminance(hex) {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two colours (defaults to white background). */
export function contrastRatio(foreground, background = '#ffffff') {
  const a = luminance(foreground)
  const b = luminance(background)
  if (a == null || b == null) return null
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** 'body' needs 4.5:1 (AA normal text); 'heading' needs 3:1 (AA large text). */
export function contrastVerdict(hex, role = 'body') {
  const ratio = contrastRatio(hex)
  if (ratio == null) return null
  const needed = role === 'heading' ? 3 : 4.5
  return { ratio: Math.round(ratio * 10) / 10, passes: ratio >= needed, needed }
}
