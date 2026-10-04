import { useEffect } from 'react'
import { prefersReducedMotion } from './useLenis.js'

// Writes --p (0..1) on the element: how far the page has scrolled through it.
// mode 'pin': 0 when its top reaches the viewport top, 1 when its bottom reaches the viewport bottom.
// mode 'pass': 0 when its top enters from below, 1 when its bottom leaves at the top.
export default function useScrollProgress(ref, mode = 'pin') {
  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    if (prefersReducedMotion()) { element.style.setProperty('--p', mode === 'pin' ? '1' : '.5'); return undefined }
    let frameId = 0
    const update = () => {
      frameId = 0
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight
      const progress = mode === 'pin'
        ? -rect.top / Math.max(1, rect.height - viewport)
        : (viewport - rect.top) / (viewport + rect.height)
      element.style.setProperty('--p', Math.min(1, Math.max(0, progress)).toFixed(4))
    }
    const schedule = () => { if (!frameId) frameId = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frameId) }
  }, [ref, mode])
}
