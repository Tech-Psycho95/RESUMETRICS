// Per-resume choices about how sections print: hide one, rename its heading, change the order.
// Stored in the saved presentation as `presentation.sections` ({ hidden, titles, order }), so the data
// the person typed is never touched and everything is reversible. Pure functions, shared by the form and the page.

/** The built-in sections a person can hide, rename and move. Personal details and custom sections stay fixed. */
export const CONFIGURABLE_SECTIONS = Object.freeze(['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'achievements', 'languages'])
export const MAX_SECTION_TITLE = 40

const isConfigurable = id => CONFIGURABLE_SECTIONS.includes(id)
const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

export const isSectionHidden = (settings, id) => Boolean(settings?.hidden?.[id]) && isConfigurable(id)

/** The heading the person chose, or the fallback when they have not renamed it. */
export function sectionTitleFor(settings, id, fallback) {
  const title = typeof settings?.titles?.[id] === 'string' ? settings.titles[id].trim() : ''
  return title && isConfigurable(id) ? title.slice(0, MAX_SECTION_TITLE) : fallback
}

/** True when nothing differs from the template's own sections, so the settings can be dropped. */
export function hasSectionSettings(settings) {
  return Boolean(settings) && (Object.values(settings.hidden ?? {}).some(Boolean) || Object.values(settings.titles ?? {}).some(Boolean) || (settings.order?.length ?? 0) > 0)
}

/**
 * Applies a person's order to a template's own order without disturbing anything they cannot move.
 * The chosen sections swap among the slots they already occupy, so a template's fixed items
 * (such as a contact block) keep their place and the layout still makes sense.
 */
export function applySectionOrder(defaultOrder, userOrder) {
  const chosen = [...new Set((Array.isArray(userOrder) ? userOrder : []).filter(id => isConfigurable(id) && defaultOrder.includes(id)))]
  if (chosen.length < 2) return [...defaultOrder]
  const moved = new Set(chosen)
  // Sections in the saved order come first; any the template has that the list lacks keep their relative order after them.
  const sequence = [...chosen, ...defaultOrder.filter(id => moved.has(id) && !chosen.includes(id))]
  let next = 0
  return defaultOrder.map(id => moved.has(id) ? sequence[next++] : id)
}

/**
 * Moves a section one step among the sections shown in the same column, because a swap with a section
 * in the other column would change nothing on the page. Returns the full new order, or null when it cannot move.
 * `sections` is [{ id, placement }] in the order currently shown.
 */
export function moveSection(sections, id, delta) {
  const movable = sections.filter(section => isConfigurable(section.id))
  const current = movable.find(section => section.id === id)
  if (!current) return null
  const sameColumn = movable.filter(section => (section.placement ?? 'main') === (current.placement ?? 'main'))
  const position = sameColumn.findIndex(section => section.id === id)
  const target = sameColumn[position + delta]
  if (!target) return null
  const ids = movable.map(section => section.id)
  const from = ids.indexOf(id)
  const to = ids.indexOf(target.id)
  ids[from] = target.id
  ids[to] = id
  return ids
}

/** Settings from a saved draft, cleaned so unknown ids and wrong types cannot reach the page. */
export function normalizeSectionSettings(raw) {
  if (!isPlainObject(raw)) return {}
  const hidden = Object.fromEntries(Object.entries(isPlainObject(raw.hidden) ? raw.hidden : {}).filter(([id, value]) => isConfigurable(id) && value === true))
  // Titles keep their spaces so typing "Career history" in the form is not cut short; they are trimmed where they print.
  const titles = Object.fromEntries(Object.entries(isPlainObject(raw.titles) ? raw.titles : {})
    .filter(([id, value]) => isConfigurable(id) && typeof value === 'string' && value.trim())
    .map(([id, value]) => [id, value.slice(0, MAX_SECTION_TITLE)]))
  const order = [...new Set((Array.isArray(raw.order) ? raw.order : []).filter(isConfigurable))]
  return { ...(Object.keys(hidden).length ? { hidden } : {}), ...(Object.keys(titles).length ? { titles } : {}), ...(order.length > 1 ? { order } : {}) }
}

/** The sections that print, with the chosen headings, in the chosen order. */
export function shapeSections(sections, settings, defaultOrder) {
  const order = applySectionOrder(defaultOrder, settings?.order)
  const position = id => { const index = order.indexOf(id); return index < 0 ? order.length : index }
  return sections
    .filter(section => !isSectionHidden(settings, section.id))
    .map(section => ({ ...section, title: sectionTitleFor(settings, section.id, section.title) }))
    .sort((left, right) => position(left.id) - position(right.id))
}
