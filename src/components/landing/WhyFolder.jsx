import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import FolderFloat from '../reactbits/FolderFloat.jsx'
import { prefersReducedMotion } from './useLenis.js'
import { advantages } from './landingContent.js'

// Folder size and how far its notes fan out, smaller on phones so everything stays on screen.
const sizeFor = () => {
  const width = typeof window === 'undefined' ? 1440 : window.innerWidth
  if (width < 640) return { width: 240, height: 176, spread: Math.max(130, width / 2 - 28), lift: 30 }
  if (width < 1024) return { width: 320, height: 236, spread: 300, lift: 38 }
  return { width: 380, height: 280, spread: 420, lift: 46 }
}
// FolderFloat packs the notes into rows no wider than 2 × spread, GAP apart, each row ROW higher than the last.
const NOTE_GAP = 12
const NOTE_ROW = 52

/** Height the open notes reach above the folder, from their real widths, so the space is reserved before it opens. */
function notesRoom(element, { spread, lift }) {
  const notes = [...element.querySelectorAll('.folder-float__item')]
  if (!notes.length) return lift + 4 * NOTE_ROW
  let rows = 0
  let width = 0
  for (const note of notes) {
    if (rows && width + NOTE_GAP + note.offsetWidth <= spread * 2) width += NOTE_GAP + note.offsetWidth
    else { rows += 1; width = note.offsetWidth }
  }
  return lift + (rows - 1) * NOTE_ROW + Math.max(...notes.map(note => note.offsetHeight)) + 20
}

/** Why Resumetrics: a large folder with the logo's R on it. It opens by itself the first time it comes into view. */
export default function WhyFolder() {
  const ref = useRef(null)
  const [size, setSize] = useState(sizeFor)
  const [room, setRoom] = useState(null)
  useLayoutEffect(() => {
    let live = true
    const measure = () => { if (live && ref.current) setRoom(notesRoom(ref.current, size)) }
    measure()
    document.fonts?.ready.then(measure)
    return () => { live = false }
  }, [size])
  useEffect(() => {
    const onResize = () => setSize(sizeFor())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useEffect(() => {
    const element = ref.current
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const trigger = element.querySelector('.folder-float__trigger')
      if (trigger?.getAttribute('aria-expanded') === 'false') setTimeout(() => trigger.click(), prefersReducedMotion() ? 0 : 450)
    }, { threshold: .6 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return <section className="lp-why" id="why" data-cine aria-label="Why Resumetrics">
    <div className="lp-folder" ref={ref} style={{ '--folder-room': `${room ?? size.lift + 4 * NOTE_ROW}px` }}>
      <FolderFloat
        items={advantages}
        label="Why Resumetrics"
        sublabel={`${advantages.length} reasons`}
        trigger="click"
        closeOnSelect={false}
        folderColor="#2a1f63"
        frontColor="#5b45e4"
        paperColor="#fff6dc"
        itemColor="#ffffff"
        itemTextColor="#1b1508"
        labelColor="#ffffff"
        width={size.width}
        height={size.height}
        radius={26}
        spread={size.spread}
        lift={size.lift}
        emblem={<span className="lp-folder-r" aria-hidden="true" />}
      />
    </div>
  </section>
}
