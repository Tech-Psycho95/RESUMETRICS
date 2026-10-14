import { useEffect } from 'react'
import { onScroll, prefersReducedMotion } from './useLenis.js'

// Writes --p (0..1) on the element: how far the page has scrolled through it.
// mode 'pin': 0 when its top reaches the viewport top, 1 when its bottom reaches the viewport bottom.
// mode 'pass': 0 when its top enters from below, 1 when its bottom leaves at the top.
export default function useScrollProgress(ref, mode = 'pin') {
  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    if (prefersReducedMotion()) { element.style.setProperty('--p', mode === 'pin' ? '1' : '.5'); return undefined }
    const update = () => {
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight
      const progress = mode === 'pin'
        ? -rect.top / Math.max(1, rect.height - viewport)
        : (viewport - rect.top) / (viewport + rect.height)
      element.style.setProperty('--p', Math.min(1, Math.max(0, progress)).toFixed(4))
    }
    update()
    const off = onScroll(update)
    window.addEventListener('resize', update)
    return () => { off(); window.removeEventListener('resize', update) }
  }, [ref, mode])
}
