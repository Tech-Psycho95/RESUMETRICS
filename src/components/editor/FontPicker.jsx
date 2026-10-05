import { useEffect, useRef, useState } from 'react'
import { findFont, loadResumeFont } from '../../editor/fontRegistry.js'

// One row per font, written in that font. The face loads only when the row scrolls into view.
function FontOption({ font, selected, onPick, rootRef }) {
  const rowRef = useRef(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const row = rowRef.current
    if (!row) return undefined
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect()
        loadResumeFont(font).then(() => setReady(true))
      }
    }, { root: rootRef.current, rootMargin: '80px' })
    observer.observe(row)
    return () => observer.disconnect()
  }, [font, rootRef])
  return <li ref={rowRef} role="option" aria-selected={selected}>
    <button type="button" className={selected ? 'is-selected' : ''} style={{ fontFamily: ready ? font.family : undefined }} onClick={() => onPick(font)}>{font.name}</button>
  </li>
}

/** A plain font dropdown over the self-hosted catalogue. value = CSS family string or null (default). */
export default function FontPicker({ id, fonts, value, onChange, defaultLabel, headingsAllowed = true }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const current = findFont(value)
  const list = headingsAllowed ? fonts : fonts.filter(font => font.roles.includes('body'))

  useEffect(() => { if (current) loadResumeFont(current) }, [current])
  useEffect(() => {
    if (!open) return undefined
    const onPointer = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const onKey = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => listRef.current?.querySelector('.is-selected')?.scrollIntoView({ block: 'center' }))
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open])

  const pick = font => { onChange(font ? font.family : null); setOpen(false) }
  return <div className="font-picker" ref={rootRef}>
    <button id={id} type="button" className="format-select font-picker-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <span style={{ fontFamily: current?.family }}>{current?.name ?? defaultLabel}</span>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
    </button>
    {open && <ul className="font-picker-list" role="listbox" aria-label="Fonts" ref={listRef}>
      <li role="option" aria-selected={!current}><button type="button" className={!current ? 'is-selected' : ''} onClick={() => pick(null)}>{defaultLabel}</button></li>
      {list.map(font => <FontOption key={font.id} font={font} selected={current?.id === font.id} onPick={pick} rootRef={listRef} />)}
    </ul>}
  </div>
}
