import { useEffect, useMemo, useState } from 'react'
import CircularCarousel from '../reactbits/CircularCarousel.jsx'
import { resumeTemplates } from '../../config/resumeTemplates.js'

// The captures (scripts/landing-shots/capture-templates.mjs) are 794 × 1060: the content reaches every card's edge.
const CARD_RATIO = 794 / 1060

/** Card width; the ring is wider than the screen (see .lp-carousel), so the front cards read at full size. */
function useCardWidth() {
  const pick = () => (typeof window === 'undefined' ? 250 : window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 250 : 290)
  const [width, setWidth] = useState(pick)
  useEffect(() => {
    const onResize = () => setWidth(pick())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

/** All 24 templates, each a real page from the app with the same sample resume, on a ring you can drag. */
export default function TemplateCarousel() {
  const cardWidth = useCardWidth()
  const items = useMemo(() => resumeTemplates.map(template => ({
    src: `/landing/templates/${template.id}.webp`,
    alt: `${template.name} resume template`,
    title: template.name,
    subtitle: template.layout === 'two-column' ? 'Two columns' : 'Single column'
  })), [])
  return <section className="lp-templates" id="templates" data-cine aria-labelledby="lp-templates-title">
    <div className="lp-section-head is-center">
      <h2 className="lp-title" id="lp-templates-title">One resume, 24 designs</h2>
      <p>Drag the ring. Every card is a real template from the app with the same resume, and switching designs never asks you to retype a thing.</p>
    </div>
    <div className="lp-carousel">
      <CircularCarousel items={items} preset="cylinder" cardWidth={cardWidth} aspectRatio={CARD_RATIO} gap={28} autoplay="drift" speed={10} fadeColor="#faf8f3" depthFade={0.78} innerShade={0.6} cornerRadius={14} captions />
    </div>
  </section>
}
