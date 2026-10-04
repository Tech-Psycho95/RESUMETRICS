export const RAIL_MIN = 260
export const RAIL_MAX = 520
export const RAIL_DEFAULT = 340

const clampWidth = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Coupled resize: whatever one rail gains the other loses, so the resume between them never
 * changes width. `side` is the rail whose handle is dragged; `dx` is the pointer movement in px
 * (positive = right). The allowed movement is limited so neither rail leaves [min, max].
 */
export function resizeCoupled({ left, right, side, dx, min = RAIL_MIN, max = RAIL_MAX }) {
  // Dragging either handle to the right widens the left rail and narrows the right rail.
  const lowest = Math.max(min - left, right - max)
  const highest = Math.min(max - left, right - min)
  const shift = lowest > highest ? 0 : clampWidth(dx, lowest, highest)
  return { left: left + shift, right: right - shift, side }
}

/** Keep a stored pair valid: each within limits and, when possible, summing to the default total. */
export function normaliseRails(value, min = RAIL_MIN, max = RAIL_MAX) {
  const left = Number(value?.left)
  const right = Number(value?.right)
  if (!Number.isFinite(left) || !Number.isFinite(right)) return { left: RAIL_DEFAULT, right: RAIL_DEFAULT }
  const total = RAIL_DEFAULT * 2
  const nextLeft = clampWidth(left, min, max)
  const nextRight = clampWidth(total - nextLeft, min, max)
  return { left: total - nextRight, right: nextRight }
}
