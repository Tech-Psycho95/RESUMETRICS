import { useEffect, useRef } from 'react'

export default function ScrollReveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) {
      element?.classList.add('is-visible')
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => {
      element.classList.toggle('is-visible', entry.isIntersecting)
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className={`landing-reveal ${className}`} style={{ '--reveal-delay': `${delay}ms` }}>{children}</div>
}
