import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ScoreRing from '../charts/ScoreRing.jsx'

const SIZE = 196
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * After the last change is executed, the score comes forward from its place on the page,
 * the page behind blurs, a soft light glows behind it, and it reports "from X% to Y%".
 * Then it returns to where it came from. rect: the on-page ring's bounding box.
 */
export default function ScoreSpotlight({ from, to, rect, count, onClose, colourFor }) {
  const ringRef = useRef(null)
  const rootRef = useRef(null)
  const closeRef = useRef(null)
  const closingRef = useRef(false)

  // Transform that puts the centred, enlarged ring back over the on-page ring.
  const origin = () => {
    if (!rect) return 'scale(.6)'
    const dx = rect.left + rect.width / 2 - window.innerWidth / 2
    const dy = rect.top + rect.height / 2 - (window.innerHeight / 2 - 40)
    return `translate(${dx}px, ${dy}px) scale(${rect.width / SIZE})`
  }

  const close = () => {
    if (closingRef.current) return
    closingRef.current = true
    if (reducedMotion()) { onClose(); return }
    rootRef.current?.classList.add('is-leaving')
    const animation = ringRef.current?.animate([{ transform: 'none' }, { transform: origin() }], { duration: 520, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' })
    const done = () => onClose()
    if (animation) animation.onfinish = done
    window.setTimeout(done, 600)
  }

  useEffect(() => {
    const previousFocus = document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    if (!reducedMotion()) ringRef.current?.animate([{ transform: origin() }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2, .8, .2, 1)' })
    const timer = window.setTimeout(close, 4600)
    const onKey = event => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', onKey); previousFocus?.focus?.({ preventScroll: true }) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const gained = to - from
  return createPortal(<div className="spot" ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="spot-title" onClick={close}>
    <div className="spot-veil" aria-hidden="true" />
    <div className="spot-stage" onClick={event => event.stopPropagation()}>
      <div className="spot-light" aria-hidden="true"><span className="spot-rays" /></div>
      <div className="spot-ring" ref={ringRef}><ScoreRing score={to} label="Match" size={SIZE} stroke={15} duration={0} {...(colourFor ? { colourFor } : {})} /></div>
      <h2 id="spot-title" className="spot-title">Your JD match score went from <b>{from}%</b> to <b>{to}%</b></h2>
      <p className="spot-sub">{gained > 0 ? `+${gained} points` : 'All changes applied'} · {count} change{count === 1 ? '' : 's'} applied to your resume</p>
      <button ref={closeRef} type="button" className="btn btn-secondary spot-close" onClick={close}>Continue</button>
    </div>
  </div>, document.body)
}
