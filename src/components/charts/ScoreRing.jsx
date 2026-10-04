import { useEffect, useRef, useState } from 'react'

/** Red (0) → amber (50) → green (100). */
export const scoreColour = score => `hsl(${Math.round(Math.max(0, Math.min(100, score)) * 1.2)}, 70%, 42%)`

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Animated score ring: fills from the previous value to `score`, its colour following the value, while the
 * number counts up. `size` in px. Pass a changing `runId` to replay the fill from 0.
 */
export default function ScoreRing({ score, size = 132, stroke = 12, label = 'Match', runId, duration = 1200 }) {
  const [shown, setShown] = useState(prefersReducedMotion() ? score : 0)
  const fromRef = useRef(0)
  const frameRef = useRef(0)

  useEffect(() => { fromRef.current = 0 }, [runId])
  useEffect(() => {
    const target = Math.max(0, Math.min(100, Number(score) || 0))
    if (prefersReducedMotion()) { setShown(target); fromRef.current = target; return undefined }
    const from = fromRef.current
    const started = performance.now()
    const step = now => {
      const progress = Math.min(1, (now - started) / duration)
      const eased = 1 - (1 - progress) ** 3
      const value = from + (target - from) * eased
      setShown(value)
      if (progress < 1) frameRef.current = requestAnimationFrame(step)
      else fromRef.current = target
    }
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(step)
    // Hidden tabs skip animation frames; land on the final value anyway.
    const fallback = window.setTimeout(() => { setShown(target); fromRef.current = target }, duration + 400)
    return () => { cancelAnimationFrame(frameRef.current); window.clearTimeout(fallback) }
  }, [score, runId, duration])

  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const colour = scoreColour(shown)
  return <div className="score-ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(score)} out of 100`}>
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle className="score-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
      <circle className="score-ring-value" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} stroke={colour}
        strokeDasharray={circumference} strokeDashoffset={circumference * (1 - shown / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
    <span className="score-ring-label" aria-hidden="true">
      <b style={{ color: colour, fontSize: size * 0.27 }}>{Math.round(shown)}<small>%</small></b>
      {label && <small>{label}</small>}
    </span>
  </div>
}
