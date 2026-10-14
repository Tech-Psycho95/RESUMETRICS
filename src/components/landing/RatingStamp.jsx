import { useEffect, useState } from 'react'
import PeekRating from '../reactbits/PeekRating.jsx'

const LABELS = ['Needs work', 'Getting there', 'Solid', 'Strong', 'Interview-ready']

/** Big stars; five of them press a "Resumetrics approved" stamp beside the row. */
const starSize = () => {
  const width = typeof window === 'undefined' ? 1440 : window.innerWidth
  return width < 520 ? 50 : width < 900 ? 66 : 84
}

export default function RatingStamp() {
  const [rating, setRating] = useState(0)
  const [size, setSize] = useState(starSize)
  useEffect(() => {
    const onResize = () => setSize(starSize())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const approved = rating === 5
  return <section className="lp-rate" data-cine aria-labelledby="lp-rate-title">
    <h2 className="lp-title is-center" id="lp-rate-title">How does it look so far?</h2>
    <div className="lp-rate-row">
      <div className="lp-rate-stars" style={{ '--star': `${size}px` }}>
        <PeekRating value={rating} onChange={setRating} labels={LABELS} size={size} lift={10} activeColor="#e9a920" idleColor="#ddd6c6" tipColor="#1b1508" tipTextColor="#fff6dc" ariaLabel="Rate what you have seen" />
        <div className="lp-stamp-slot" aria-live="polite">
          {approved && <svg className="lp-stamp" viewBox="0 0 200 200" role="img" aria-label="Resumetrics approved">
            <defs>
              <path id="lp-stamp-top" d="M40 100a60 60 0 0 1 120 0" />
              <path id="lp-stamp-bottom" d="M34 100a66 66 0 0 0 132 0" />
              <filter id="lp-stamp-ink">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
                <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.45" />
                <feComposite in="SourceGraphic" operator="in" />
              </filter>
            </defs>
            <g filter="url(#lp-stamp-ink)">
              <circle cx="100" cy="100" r="92" className="lp-stamp-ring" />
              <circle cx="100" cy="100" r="80" className="lp-stamp-ring is-thin" />
              <text className="lp-stamp-arc"><textPath href="#lp-stamp-top" startOffset="50%" textAnchor="middle">Resumetrics</textPath></text>
              <text className="lp-stamp-arc"><textPath href="#lp-stamp-bottom" startOffset="50%" textAnchor="middle">Approved</textPath></text>
              <image href="/landing/r-mark-ink.png" x="74" y="74" width="52" height="52" />
            </g>
          </svg>}
        </div>
      </div>
    </div>
  </section>
}
