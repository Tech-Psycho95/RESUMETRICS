import { useCallback, useEffect, useRef, useState } from 'react'

const HISTORY_LIMIT = 100
// Changes that land within this window (typing, dragging a slider) become one undo step.
const SETTLE_MS = 600

/**
 * Undo/redo over editor snapshots. It watches the snapshot instead of wrapping every handler,
 * so form edits, inline edits, format-panel changes and NIMBUS edits are all covered.
 * `restore(snapshot)` must write every field of the snapshot back into state.
 */
export default function useEditorHistory(snapshot, restore, enabled = true) {
  const pastRef = useRef([])
  const futureRef = useRef([])
  const currentRef = useRef(null)
  const restoringRef = useRef(false)
  const timerRef = useRef(0)
  const [, setRevision] = useState(0)
  const serialised = enabled ? JSON.stringify(snapshot) : null

  useEffect(() => {
    if (!enabled || serialised === null) return undefined
    if (restoringRef.current) {
      restoringRef.current = false
      currentRef.current = serialised
      return undefined
    }
    if (currentRef.current === null) {
      currentRef.current = serialised
      return undefined
    }
    if (currentRef.current === serialised) return undefined
    window.clearTimeout(timerRef.current)
    const previous = currentRef.current
    timerRef.current = window.setTimeout(() => {
      if (previous === serialised) return
      pastRef.current = [...pastRef.current, previous].slice(-HISTORY_LIMIT)
      futureRef.current = []
      currentRef.current = serialised
      setRevision(value => value + 1)
    }, SETTLE_MS)
    return () => window.clearTimeout(timerRef.current)
  }, [enabled, serialised])

  const flush = () => {
    // A pending, not yet recorded change counts as the latest state.
    window.clearTimeout(timerRef.current)
    if (serialised !== null && currentRef.current !== null && serialised !== currentRef.current) {
      pastRef.current = [...pastRef.current, currentRef.current].slice(-HISTORY_LIMIT)
      futureRef.current = []
      currentRef.current = serialised
    }
  }

  const undo = useCallback(() => {
    flush()
    const previous = pastRef.current.at(-1)
    if (!previous) return
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [currentRef.current, ...futureRef.current]
    restoringRef.current = true
    currentRef.current = previous
    restore(JSON.parse(previous))
    setRevision(value => value + 1)
  }, [restore, serialised])

  const redo = useCallback(() => {
    flush()
    const next = futureRef.current[0]
    if (!next) return
    futureRef.current = futureRef.current.slice(1)
    pastRef.current = [...pastRef.current, currentRef.current].slice(-HISTORY_LIMIT)
    restoringRef.current = true
    currentRef.current = next
    restore(JSON.parse(next))
    setRevision(value => value + 1)
  }, [restore, serialised])

  const reset = useCallback(() => {
    window.clearTimeout(timerRef.current)
    pastRef.current = []
    futureRef.current = []
    currentRef.current = null
    setRevision(value => value + 1)
  }, [])

  const pending = serialised !== null && currentRef.current !== null && serialised !== currentRef.current
  return { undo, redo, reset, canUndo: pastRef.current.length > 0 || pending, canRedo: futureRef.current.length > 0 && !pending }
}
