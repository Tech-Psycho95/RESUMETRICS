import { useEffect, useId, useRef, useState } from 'react'
import { NOTIF_BLUE } from '../vendor/bloub/bot/decor.ts'
import { BotEngine } from '../vendor/bloub/bot/engine.ts'
import { clamp } from '../vendor/bloub/bot/math.ts'
import { DEMI_VIEWBOX, RAYON } from '../vendor/bloub/bot/repere.ts'
import { mixHex, SHAPE_BY_ID } from '../vendor/bloub/bot/skins.ts'

// Resumetrics lifecycle states mapped to the closest measured Bloub states.
const BLOUB_STATE_MAP = Object.freeze({
  idle: 'idle',
  curious: 'wide',
  exploring: 'notify',
  thinking: 'thinking',
  processing: 'orbit',
  success: 'wink',
  exclaim: 'exclaim'
})

const INK = '#0a0a0c'
const PAPER = '#ffffff'
const CLOUD_SHAPE = SHAPE_BY_ID.get('nuage')?.radii ?? null

function BloubDot({ dot }) {
  const fill = dot.color ?? (dot.depth === undefined ? INK : mixHex(PAPER, INK, dot.depth))
  if (dot.d) {
    return <path d={dot.d} transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${RAYON})`} fill={fill} opacity={dot.opacity} />
  }
  return <circle cx={dot.x} cy={dot.y} r={dot.r} fill={fill} opacity={dot.opacity} />
}

export default function BloubAIIcon({ state = 'idle', followRegionRef }) {
  const mappedState = BLOUB_STATE_MAP[state] ?? BLOUB_STATE_MAP.idle
  const engineRef = useRef(null)
  if (!engineRef.current) engineRef.current = new BotEngine(RAYON, mappedState, CLOUD_SHAPE)

  const [frame, setFrame] = useState(() => engineRef.current.sample(0))
  const clockRef = useRef(0)
  const activeStateRef = useRef(mappedState)
  const pointerRef = useRef(null)
  const aimingRef = useRef(false)
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const maskId = `bloub-mask-${uid}`

  useEffect(() => {
    activeStateRef.current = mappedState
    engineRef.current.setState(mappedState, clockRef.current)
    if (mappedState !== 'idle' && aimingRef.current) {
      engineRef.current.setLook(null, clockRef.current)
      aimingRef.current = false
    }
  }, [mappedState])

  useEffect(() => {
    const region = followRegionRef?.current
    if (!region) return undefined

    const trackPointer = event => {
      if (event.pointerType === 'touch') {
        pointerRef.current = null
        return
      }
      const box = region.getBoundingClientRect()
      const nearbyPadding = 160
      const isNearby = event.clientX >= box.left - nearbyPadding
        && event.clientX <= box.right + nearbyPadding
        && event.clientY >= box.top - nearbyPadding
        && event.clientY <= box.bottom + nearbyPadding
      pointerRef.current = isNearby ? { x: event.clientX, y: event.clientY } : null
    }
    const releasePointer = () => { pointerRef.current = null }

    window.addEventListener('pointermove', trackPointer, { passive: true })
    document.addEventListener('pointerleave', releasePointer)
    return () => {
      window.removeEventListener('pointermove', trackPointer)
      document.removeEventListener('pointerleave', releasePointer)
    }
  }, [followRegionRef])

  useEffect(() => {
    let animationFrame = 0
    let previousTime = 0

    const tick = milliseconds => {
      const delta = previousTime ? Math.min((milliseconds - previousTime) / 1000, 0.064) : 0
      previousTime = milliseconds
      clockRef.current += delta

      const engine = engineRef.current
      const pointer = pointerRef.current
      const region = followRegionRef?.current
      if (activeStateRef.current === 'idle' && pointer && region) {
        const box = region.getBoundingClientRect()
        if (box.width > 0 && box.height > 0) {
          const nx = clamp((pointer.x - (box.left + box.width / 2)) / Math.max(1, box.width / 2), -1, 1)
          const ny = clamp((pointer.y - (box.top + box.height / 2)) / Math.max(1, box.height / 2), -1, 1)
          engine.setLook({ yaw: nx * 16, pitch: 8 - ny * 13, mix: 1, spin: 0, wander: 0 }, clockRef.current)
          aimingRef.current = true
        }
      } else if (aimingRef.current) {
        engine.setLook(null, clockRef.current)
        aimingRef.current = false
      }

      setFrame(engine.sample(clockRef.current))
      animationFrame = requestAnimationFrame(tick)
    }

    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [followRegionRef])

  const renderDots = prefix => frame.dots.map((dot, index) => <BloubDot dot={dot} key={`${prefix}-${index}`} />)

  return <svg className="bloub-ai-icon" viewBox={`${-DEMI_VIEWBOX} ${-DEMI_VIEWBOX} ${DEMI_VIEWBOX * 2} ${DEMI_VIEWBOX * 2}`} aria-hidden="true" focusable="false">
    <defs>
      <mask id={maskId} maskUnits="userSpaceOnUse" x={-DEMI_VIEWBOX} y={-DEMI_VIEWBOX} width={DEMI_VIEWBOX * 2} height={DEMI_VIEWBOX * 2}>
        <path d={frame.bodyPath} fill="#fff" />
        {frame.eyes.map((eye, index) => <path d={eye.d} transform={eye.matrix} opacity={eye.alpha} fill="#000" key={index} />)}
        {frame.notch && <circle cx={frame.notch.x} cy={frame.notch.y} r={frame.notch.r} fill="#000" />}
      </mask>
      {frame.arcs.map(arc => <linearGradient id={`${uid}-${arc.id}`} gradientUnits="userSpaceOnUse" x1={arc.grad.x1} y1={arc.grad.y1} x2={arc.grad.x2} y2={arc.grad.y2} key={arc.id}>
        {arc.grad.stops.map((color, index) => <stop offset={index / Math.max(1, arc.grad.stops.length - 1)} stopColor={color} key={color + index} />)}
      </linearGradient>)}
    </defs>

    <g fill="none" strokeLinecap="round">
      {frame.arcs.map(arc => <path d={arc.back} stroke={`url(#${uid}-${arc.id})`} strokeWidth={arc.width} opacity={arc.opacity} key={`back-${arc.id}`} />)}
    </g>
    {frame.dotsBehind && <g>{renderDots('behind')}</g>}
    <g opacity={frame.bodyAlpha}>
      <path d={frame.bodyPath} fill={PAPER} />
      <g mask={`url(#${maskId})`}><rect x={-DEMI_VIEWBOX} y={-DEMI_VIEWBOX} width={DEMI_VIEWBOX * 2} height={DEMI_VIEWBOX * 2} fill={INK} /></g>
    </g>
    {!frame.dotsBehind && <g>{renderDots('front')}</g>}
    {frame.notif && <circle cx={frame.notif.x} cy={frame.notif.y} r={frame.notif.r} fill={NOTIF_BLUE} />}
    <g fill="none" strokeLinecap="round">
      {frame.arcs.map(arc => <path d={arc.front} stroke={`url(#${uid}-${arc.id})`} strokeWidth={arc.width} opacity={arc.opacity} key={`front-${arc.id}`} />)}
    </g>
  </svg>
}
