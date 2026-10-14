import { useEffect } from 'react'
import { prefersReducedMotion } from './useLenis.js'

/** Adds `is-in` to every `.lp-reveal-up` inside the root once it scrolls into view (one observer for the page). */
export default function useRevealOnScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const targets = [...root.querySelectorAll('.lp-reveal-up')]
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach(target => target.classList.add('is-in'))
      return undefined
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-in')
      observer.unobserve(entry.target)
    }), { threshold: .15, rootMargin: '0px 0px -6% 0px' })
    targets.forEach(target => observer.observe(target))
    return () => observer.disconnect()
  }, [rootRef])
}
