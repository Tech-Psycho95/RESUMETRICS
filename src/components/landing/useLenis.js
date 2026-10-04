import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: true })
    let frameId = requestAnimationFrame(function raf(time) {
      lenis.raf(time)
      frameId = requestAnimationFrame(raf)
    })
    return () => { cancelAnimationFrame(frameId); lenis.destroy() }
  }, [])
}
