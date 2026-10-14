import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ElectricLogo from '../reactbits/ElectricLogo.jsx'
import { BotEngine } from '../../vendor/bloub/bot/engine.ts'
import { RAYON } from '../../vendor/bloub/bot/repere.ts'
import { SHAPE_BY_ID } from '../../vendor/bloub/bot/skins.ts'
import { prefersReducedMotion } from './useLenis.js'
import { nimbusPowers } from './landingContent.js'

// The NIMBUS cloud from the app (src/components/BloubAIIcon.jsx), drawn as light: ElectricLogo traces the engine's own
// cloud body, and the engine's eyes are outlined on top in the same places, looking where the editor's NIMBUS would.
const CLOUD_SHAPE = SHAPE_BY_ID.get('nuage')?.radii ?? null
const LOGO_SCALE = 0.62

/** Bounding box of an SVG path, measured by the browser. */
function measurePath(d) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  svg.appendChild(path)
  document.body.appendChild(svg)
  const box = path.getBBox()
  svg.remove()
  return { x: box.x, y: box.y, width: box.width, height: box.height }
}

function NimbusCloud() {
  const boxRef = useRef(null)
  const engineRef = useRef(null)
  if (!engineRef.current) engineRef.current = new BotEngine(RAYON, 'idle', CLOUD_SHAPE)
  const [frame, setFrame] = useState(() => engineRef.current.sample(0))
  const [outline, setOutline] = useState(null)   // { src, box }
  const [size, setSize] = useState({ width: 0, height: 0 })

  // The electric outline is the engine's resting body, so the eyes sit on exactly the cloud they belong to.
  useLayoutEffect(() => {
    const d = engineRef.current.sample(0).bodyPath
    const box = measurePath(d)
    const pad = Math.max(box.width, box.height) * 0.04
    const view = { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(view.width * 4)}" height="${Math.round(view.height * 4)}" viewBox="${view.x} ${view.y} ${view.width} ${view.height}"><path d="${d}" fill="#fff"/></svg>`
    setOutline({ src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, box })
  }, [])

  useEffect(() => {
    const element = boxRef.current
    const observer = new ResizeObserver(() => setSize({ width: element.clientWidth, height: element.clientHeight }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Same loop as the editor: the clock runs, the head turns towards a nearby pointer, blinks come from the engine.
  useEffect(() => {
    const element = boxRef.current
    const engine = engineRef.current
    const reduce = prefersReducedMotion()
    let pointer = null
    let aiming = false
    let visible = true
    let clock = 0
    let previous = 0
    let raf = 0
    const onMove = event => {
      if (event.pointerType === 'touch') { pointer = null; return }
      const section = element.closest('section')?.getBoundingClientRect()
      pointer = section && event.clientY >= section.top && event.clientY <= section.bottom ? { x: event.clientX, y: event.clientY } : null
    }
    const tick = now => {
      raf = 0
      if (!visible) { previous = 0; return }
      clock += previous ? Math.min((now - previous) / 1000, 0.064) : 0
      previous = now
      if (pointer && !reduce) {
        const box = element.getBoundingClientRect()
        const nx = Math.max(-1, Math.min(1, (pointer.x - (box.left + box.width / 2)) / Math.max(1, box.width)))
        const ny = Math.max(-1, Math.min(1, (pointer.y - (box.top + box.height / 2)) / Math.max(1, box.height)))
        engine.setLook({ yaw: nx * 16, pitch: 8 - ny * 13, mix: 1, spin: 0, wander: 0 }, clock)
        aiming = true
      } else if (aiming) {
        engine.setLook(null, clock)
        aiming = false
      }
      setFrame(engine.sample(reduce ? 0 : clock))
      if (!reduce) raf = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(tick)
    })
    observer.observe(element)
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); observer.disconnect(); window.removeEventListener('pointermove', onMove) }
  }, [])

  // ElectricLogo fits the outline image to LOGO_SCALE of the box and centres it; the eyes use the same fit.
  const box = outline?.box
  const fit = box ? Math.min(size.width * LOGO_SCALE / box.width, size.height * LOGO_SCALE / box.height) : 0
  return <div className="lp-cloud-float" ref={boxRef}>
    {outline && <ElectricLogo className="lp-cloud-bolt" src={outline.src} color="#a4ba1b" glowColor="#709400" scale={LOGO_SCALE} strands={5} crackle={1.3} flicker={0.5} speed={2} glow={1.2} thickness={1.6} />}
    {fit > 0 && <svg className="lp-cloud-eyes" aria-hidden="true" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      style={{ width: box.width * fit, height: box.height * fit, left: (size.width - box.width * fit) / 2, top: (size.height - box.height * fit) / 2 }}>
      {frame.eyes.map((eye, index) => <path key={index} d={eye.d} transform={eye.matrix} opacity={eye.alpha} vectorEffect="non-scaling-stroke" />)}
    </svg>}
  </div>
}

export default function NimbusSection() {
  return <section className="lp-nimbus" id="nimbus" data-cine aria-labelledby="lp-nimbus-title">
    <div className="lp-nimbus-top">
      <div className="lp-nimbus-cloud" aria-hidden="true">
        <NimbusCloud />
      </div>
      <div className="lp-nimbus-intro">
        <h2 className="lp-title" id="lp-nimbus-title">Meet <span className="lp-nimbus-word">NIMBUS</span>, your writing partner</h2>
        <p>NIMBUS lives beside your resume in the editor. Ask in plain words and it edits the page in front of you: deeper summaries, sharper bullets, new sections, whole cover letters. It is built around one rule: it never writes anything you did not tell it.</p>
      </div>
    </div>

    <ul className="lp-nimbus-powers">
      {nimbusPowers.map(([title, text], index) => <li key={title} className="lp-reveal-up" style={{ '--delay': `${index * 70}ms` }}>
        <span className="lp-power-index">{String(index + 1).padStart(2, '0')}</span>
        <h3>{title}</h3>
        <p>{text}</p>
      </li>)}
    </ul>
  </section>
}
