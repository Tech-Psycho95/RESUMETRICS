// Resume-safe font choices sourced from Figma's 25-font resume guide.
// Fonts are fetched from Google Fonts only when selected in the editor.
export const resumeFonts = [
  { name: 'Open Sans', family: 'Open Sans, sans-serif', category: 'Sans serif', weights: [400, 500, 600, 700] },
  { name: 'Roboto', family: 'Roboto, sans-serif', category: 'Sans serif', weights: [400, 500, 700] },
  { name: 'Roboto Slab', family: 'Roboto Slab, serif', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Roboto Mono', family: 'Roboto Mono, monospace', category: 'Monospace', weights: [400, 500, 600, 700] },
  { name: 'Lato', family: 'Lato, sans-serif', category: 'Sans serif', weights: [400, 700] },
  { name: 'Source Sans Pro', family: 'Source Sans 3, sans-serif', googleFamily: 'Source Sans 3', category: 'Sans serif', weights: [400, 600, 700] },
  { name: 'Inter', family: 'Inter, sans-serif', category: 'Sans serif', weights: [400, 500, 600, 700] },
  { name: 'Karla', family: 'Karla, sans-serif', category: 'Sans serif', weights: [400, 500, 700] },
  { name: 'Work Sans', family: 'Work Sans, sans-serif', category: 'Sans serif', weights: [400, 500, 700] },
  { name: 'Fira Sans', family: 'Fira Sans, sans-serif', category: 'Sans serif', weights: [400, 500, 700] },
  { name: 'Nunito Sans', family: 'Nunito Sans, sans-serif', category: 'Sans serif', weights: [400, 600, 700] },
  { name: 'IBM Plex Sans', family: 'IBM Plex Sans, sans-serif', category: 'Sans serif', weights: [400, 500, 600, 700] },
  { name: 'IBM Plex Serif', family: 'IBM Plex Serif, serif', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Libre Franklin', family: 'Libre Franklin, sans-serif', category: 'Sans serif', weights: [400, 500, 600, 700] },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'Sans serif', weights: [400, 500, 700] },
  { name: 'DM Sans', family: 'DM Sans, sans-serif', category: 'Sans serif', weights: [400, 500, 700] },
  { name: 'Alegreya Sans', family: 'Alegreya Sans, sans-serif', category: 'Sans serif', weights: [400, 500, 700] },
  { name: 'Noto Sans', family: 'Noto Sans, sans-serif', category: 'Sans serif', weights: [400, 500, 600, 700] },
  { name: 'Raleway', family: 'Raleway, sans-serif', category: 'Sans serif', weights: [400, 500, 600, 700] },
  { name: 'Merriweather', family: 'Merriweather, serif', category: 'Serif', weights: [400, 700] },
  { name: 'PT Serif', family: 'PT Serif, serif', category: 'Serif', weights: [400, 700] },
  { name: 'Lora', family: 'Lora, serif', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Crimson Text', family: 'Crimson Text, serif', category: 'Serif', weights: [400, 600, 700] },
  { name: 'EB Garamond', family: 'EB Garamond, serif', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Cormorant Garamond', family: 'Cormorant Garamond, serif', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Domine', family: 'Domine, serif', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Baskerville', family: 'Libre Baskerville, Georgia, serif', googleFamily: 'Libre Baskerville', category: 'Serif', weights: [400, 700] },
  { name: 'Arvo', family: 'Arvo, serif', category: 'Slab serif', weights: [400, 700] }
]

const loadedFonts = new Map()

export function loadResumeFont(font) {
  if (!font?.name || typeof document === 'undefined') return Promise.resolve()
  if (loadedFonts.has(font.name)) return loadedFonts.get(font.name)

  const googleFamily = font.googleFamily || font.name
  const weights = [...new Set(font.weights || [400, 700])].sort((a, b) => a - b)
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(googleFamily).replace(/%20/g, '+')}:wght@${weights.join(';')}&display=swap`
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)

  const loaded = new Promise(resolve => {
    link.addEventListener('load', async () => {
      if (document.fonts?.load) {
        await Promise.all(weights.map(weight => document.fonts.load(`${weight} 14px "${googleFamily}"`).catch(() => [])))
      }
      resolve()
    }, { once: true })
    link.addEventListener('error', () => resolve(), { once: true })
  })
  loadedFonts.set(font.name, loaded)
  return loaded
}
