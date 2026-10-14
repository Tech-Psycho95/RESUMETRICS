// First page of every template (templates.html in the harness) as public/landing/templates/<id>.webp, for the
// landing page's template carousel. Start the harness (vite.config.js here), then:
//   node scripts/landing-shots/capture-templates.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openPage } from './cdp.mjs'

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5198'
const OUT = fileURLToPath(new URL('../../public/landing/templates/', import.meta.url))
// A little shorter than A4: every template's content reaches the bottom of the card, so no card ends in blank paper.
const A4 = { width: 794, height: 1060 }
const SCALE = 0.62   // cards in the carousel are at most ~300 px wide; this keeps them sharp on 2x screens

mkdirSync(OUT, { recursive: true })
const page = await openPage({ port: 9334, viewport: { width: 860, height: 1200, deviceScaleFactor: 1 } })
try {
  await page.goto(`${BASE}/scripts/landing-shots/templates.html`, 'window.__ready', 60_000)
  const pages = await page.evaluate(`return [...document.querySelectorAll('[id^="tpl-"]')].map(node => { const rect = node.getBoundingClientRect(); return { id: node.id.slice(4), name: node.dataset.name, x: rect.left + scrollX, y: rect.top + scrollY } })`)
  const index = []
  for (const item of pages) {
    const image = await page.screenshot({ clip: { x: item.x, y: item.y, width: A4.width, height: A4.height, scale: SCALE }, quality: 84 })
    writeFileSync(join(OUT, `${item.id}.webp`), image)
    index.push({ id: item.id, name: item.name })
    console.log(`✓ ${item.id}`)
  }
  writeFileSync(join(OUT, 'index.json'), `${JSON.stringify(index, null, 1)}\n`)
} finally {
  page.close()
}
