import { useEffect } from 'react'
import { onScroll, prefersReducedMotion } from './useLenis.js'

/**
 * One scroll loop for the page's soft cinematic motion. Every `[data-cine]` element gets --sp (0..1): how far it has
 * travelled through the viewport (0 entering at the bottom, 1 leaving at the top). The hero (`data-cine="hero"`)
 * instead gets how far the page has scrolled past it. CSS turns these into small drifts, tilts and fades.
 */
export default function useCinematicScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return undefined
    const elements = [...root.querySelectorAll('[data-cine]')]
    const update = () => {
      const viewport = window.innerHeight
      for (const element of elements) {
        const rect = element.getBoundingClientRect()
        if (rect.bottom < -viewport || rect.top > viewport * 2) continue   // far off screen: leave it
        const progress = element.dataset.cine === 'hero'
          ? -rect.top / Math.max(1, rect.height)
          : (viewport - rect.top) / (viewport + rect.height)
        element.style.setProperty('--sp', Math.min(1, Math.max(0, progress)).toFixed(4))
      }
    }
    update()
    const off = onScroll(update)
    window.addEventListener('resize', update)
    return () => { off(); window.removeEventListener('resize', update) }
  }, [rootRef])
}
