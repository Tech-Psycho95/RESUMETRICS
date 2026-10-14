import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The page's one Lenis instance, and everything that follows the scroll. Listeners run inside Lenis's own frame, so
// scroll-linked styles land in the same paint as the scroll itself (a native scroll listener would run a frame late).
let lenis = null
const listeners = new Set()
const notify = () => listeners.forEach(listener => listener())
const onNativeScroll = () => { if (!lenis) notify() }
const easeOutQuart = t => 1 - (1 - t) ** 4

export const getLenis = () => lenis

/** Calls `listener` on every scroll frame (Lenis's when it runs, native scroll otherwise). Returns the unsubscribe. */
export function onScroll(listener) {
  if (!listeners.size) window.addEventListener('scroll', onNativeScroll, { passive: true })
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) window.removeEventListener('scroll', onNativeScroll)
  }
}

/** Light smooth scrolling for the landing page: wheel input glides and settles quickly, touch keeps native momentum. */
export default function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      anchors: { duration: 1.1, easing: easeOutQuart },
      stopInertiaOnNavigate: true,
      autoRaf: true,
      prevent: node => node.classList?.contains('lp-lightbox')
    })
    lenis.on('scroll', notify)
    notify()
    return () => { lenis.destroy(); lenis = null }
  }, [])
}
