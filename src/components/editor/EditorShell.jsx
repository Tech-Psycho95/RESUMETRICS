import { useCallback, useEffect, useRef, useState } from 'react'
import { normaliseRails, RAIL_DEFAULT, RAIL_MAX, RAIL_MIN, resizeCoupled } from './railSizing.js'

const storageKey = 'resumetrics-editor-rails'
const NARROW_QUERY = '(max-width: 1100px)'

function readStoredRails() {
  try { return normaliseRails(JSON.parse(localStorage.getItem(storageKey) || 'null')) } catch { return normaliseRails(null) }
}

function storeRails(rails) {
  try { localStorage.setItem(storageKey, JSON.stringify(rails)) } catch { /* widths just reset next visit */ }
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(NARROW_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY)
    const update = () => setNarrow(query.matches)
    query.addEventListener('change', update)
    // Some environments resize without a media-query change event; checking on resize covers them.
    window.addEventListener('resize', update)
    return () => {
      query.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return narrow
}

function RailHandle({ side, label, rails, onDragStart, onKeyResize, onReset }) {
  const value = side === 'left' ? rails.left : rails.right
  return <div
    className={`editor-rail-handle is-${side}`}
    role="separator"
    aria-orientation="vertical"
    aria-label={label}
    aria-valuemin={RAIL_MIN}
    aria-valuemax={RAIL_MAX}
    aria-valuenow={Math.round(value)}
    tabIndex={0}
    onPointerDown={event => onDragStart(event, side)}
    onDoubleClick={onReset}
    onKeyDown={event => {
      const step = event.shiftKey ? 48 : 16
      // Arrow keys move the handle; for the right rail, moving left widens it.
      if (event.key === 'ArrowLeft') onKeyResize(side, -step)
      else if (event.key === 'ArrowRight') onKeyResize(side, step)
      else if (event.key === 'Home') onKeyResize(side, -RAIL_MAX)
      else if (event.key === 'End') onKeyResize(side, RAIL_MAX)
      else if (event.key === 'Enter') onReset()
      else return
      event.preventDefault()
    }}
  ><span aria-hidden="true" /></div>
}

/**
 * Three containers: left (AI), centre (resume), right (formatting). Each scrolls on its own.
 * The two rails resize from the edge facing the resume and are coupled, so the centre never changes width.
 */
export default function EditorShell({ left, centre, right, leftLabel = 'AI tools', rightLabel = 'Format' }) {
  const gridRef = useRef(null)
  const dragRef = useRef(null)
  const frameRef = useRef(0)
  const [rails, setRails] = useState(readStoredRails)
  const [narrowTab, setNarrowTab] = useState('resume')
  const narrow = useIsNarrow()

  const paint = useCallback(next => {
    gridRef.current?.style.setProperty('--left-rail', `${next.left}px`)
    gridRef.current?.style.setProperty('--right-rail', `${next.right}px`)
  }, [])

  const commit = useCallback(next => {
    setRails(next)
    storeRails(next)
  }, [])

  useEffect(() => { paint(rails) }, [paint, rails])
  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  const onDragStart = (event, side) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { side, startX: event.clientX, start: rails, latest: rails }
    document.body.classList.add('is-resizing-rails')
    const handle = event.currentTarget
    const move = moveEvent => {
      const drag = dragRef.current
      if (!drag) return
      drag.latest = resizeCoupled({ ...drag.start, side, dx: moveEvent.clientX - drag.startX })
      cancelAnimationFrame(frameRef.current)
      // Real-time: write CSS variables straight to the grid, no React render per pointer move.
      frameRef.current = requestAnimationFrame(() => paint(drag.latest))
    }
    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
      document.body.classList.remove('is-resizing-rails')
      const finalRails = dragRef.current?.latest ?? rails
      dragRef.current = null
      commit({ left: finalRails.left, right: finalRails.right })
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  const onKeyResize = (side, dx) => {
    const next = resizeCoupled({ ...rails, side, dx })
    commit({ left: next.left, right: next.right })
  }
  const onReset = () => commit({ left: RAIL_DEFAULT, right: RAIL_DEFAULT })

  if (narrow) {
    const tabs = [['left', leftLabel], ['resume', 'Resume'], ['right', rightLabel]]
    return <div className="editor-shell-grid is-narrow">
      <div className="editor-shell-tabs" role="tablist" aria-label="Editor panels">
        {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={narrowTab === id} className={narrowTab === id ? 'is-active' : ''} onClick={() => setNarrowTab(id)}>{label}</button>)}
      </div>
      <section className="editor-pane editor-pane-left" hidden={narrowTab !== 'left'} aria-label={leftLabel}>{left}</section>
      <section className="editor-pane editor-pane-centre" hidden={narrowTab !== 'resume'} aria-label="Resume">{centre}</section>
      <section className="editor-pane editor-pane-right" hidden={narrowTab !== 'right'} aria-label={rightLabel}>{right}</section>
    </div>
  }

  return <div className="editor-shell-grid" ref={gridRef} style={{ '--left-rail': `${rails.left}px`, '--right-rail': `${rails.right}px` }}>
    <section className="editor-pane editor-pane-left" aria-label={leftLabel}>{left}</section>
    <RailHandle side="left" label={`Resize ${leftLabel} panel`} rails={rails} onDragStart={onDragStart} onKeyResize={onKeyResize} onReset={onReset} />
    <section className="editor-pane editor-pane-centre" aria-label="Resume">{centre}</section>
    <RailHandle side="right" label={`Resize ${rightLabel} panel`} rails={rails} onDragStart={onDragStart} onKeyResize={onKeyResize} onReset={onReset} />
    <section className="editor-pane editor-pane-right" aria-label={rightLabel}>{right}</section>
  </div>
}
