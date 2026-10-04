import { useMemo, useRef, useState } from 'react'

// Validated categorical slots (light / dark) — see the dataviz reference palette. Five + "Other" keeps the
// donut readable (≤ 6 segments); the table beside it carries exact values.
export const CATEGORICAL_SLOTS = 5
export const OTHER_KEY = '__other__'

/**
 * Stable colours: a language keeps the slot it got when it first entered the top five, so colours never
 * jump while a live scan reorders languages. Returns { colourOf(name) → css var or other, top: [...] }.
 */
export function useStableLanguageColours(languages) {
  const assignedRef = useRef(new Map())
  return useMemo(() => {
    const assigned = assignedRef.current
    const top = languages.slice(0, CATEGORICAL_SLOTS).map(entry => entry.name)
    const used = new Set([...assigned.entries()].filter(([name]) => top.includes(name)).map(([, slot]) => slot))
    top.forEach(name => {
      if (assigned.has(name) && used.has(assigned.get(name))) return
      const free = [1, 2, 3, 4, 5].find(slot => !used.has(slot))
      assigned.set(name, free)
      used.add(free)
    })
    const colourOf = name => top.includes(name) ? `var(--series-${assigned.get(name)})` : 'var(--series-other)'
    return { colourOf, top }
  }, [languages])
}

const formatBytes = bytes => bytes >= 1_000_000 ? `${(bytes / 1_048_576).toFixed(1)} MB` : bytes >= 1024 ? `${Math.round(bytes / 1024)} KB` : `${bytes} B`
export { formatBytes }

function arcPath(cx, cy, outer, inner, start, end) {
  const point = (radius, angle) => [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  const large = end - start > Math.PI ? 1 : 0
  const [x1, y1] = point(outer, start)
  const [x2, y2] = point(outer, end)
  const [x3, y3] = point(inner, end)
  const [x4, y4] = point(inner, start)
  return `M${x1} ${y1}A${outer} ${outer} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${inner} ${inner} 0 ${large} 0 ${x4} ${y4}Z`
}

/**
 * Share of code by language. Hover or focus a segment for details; click to filter repositories.
 * languages: [{ name, bytes, share, repos }] sorted by bytes.
 */
export default function LanguageDonut({ languages, totalBytes, repoCount, colours, active, onSelect, size = 220 }) {
  const [hover, setHover] = useState(null)
  const segments = useMemo(() => {
    const top = languages.filter(entry => colours.top.includes(entry.name))
    const rest = languages.filter(entry => !colours.top.includes(entry.name))
    const other = rest.length ? [{ name: OTHER_KEY, label: `Other (${rest.length})`, bytes: rest.reduce((sum, entry) => sum + entry.bytes, 0), repos: null, members: rest.map(entry => entry.name) }] : []
    return [...top.map(entry => ({ ...entry, label: entry.name })), ...other].map(entry => ({ ...entry, share: totalBytes ? Math.round(entry.bytes / totalBytes * 1000) / 10 : 0 }))
  }, [colours.top, languages, totalBytes])

  const cx = size / 2
  const outer = size / 2 - 4
  const inner = outer * 0.62
  let angle = -Math.PI / 2
  const shown = hover ?? segments.find(segment => segment.name === active) ?? null

  return <div className="lang-donut" style={{ width: size }}>
    <svg viewBox={`0 0 ${size} ${size}`} role="group" aria-label="Share of code by language">
      {!totalBytes && <circle cx={cx} cy={cx} r={(outer + inner) / 2} fill="none" stroke="var(--chart-track)" strokeWidth={outer - inner} />}
      {segments.map(segment => {
        const sweep = totalBytes ? segment.bytes / totalBytes * Math.PI * 2 : 0
        const start = angle
        angle += sweep
        if (sweep <= 0) return null
        const end = sweep >= Math.PI * 2 ? start + Math.PI * 2 - 0.0001 : angle
        const dimmed = (active && active !== segment.name) || (hover && hover.name !== segment.name)
        return <path key={segment.name} d={arcPath(cx, cx, outer, inner, start, end)}
          fill={segment.name === OTHER_KEY ? 'var(--series-other)' : colours.colourOf(segment.name)}
          stroke="var(--chart-surface)" strokeWidth="2" className={`lang-donut-segment${dimmed ? ' is-dimmed' : ''}`}
          tabIndex={0} role="button" aria-pressed={active === segment.name}
          aria-label={`${segment.label}: ${segment.share}% of code${segment.repos != null ? `, ${segment.repos} repositories` : ''}`}
          onMouseEnter={() => setHover(segment)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(segment)} onBlur={() => setHover(null)}
          onClick={() => onSelect(active === segment.name ? null : segment.name)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(active === segment.name ? null : segment.name) } }} />
      })}
    </svg>
    <div className="lang-donut-centre" aria-hidden="true">
      {shown
        ? <><b>{shown.share}%</b><span>{shown.label}</span><small>{formatBytes(shown.bytes)}{shown.repos != null ? ` · ${shown.repos} repo${shown.repos === 1 ? '' : 's'}` : ''}</small></>
        : <><b>{formatBytes(totalBytes)}</b><span>of code</span><small>{repoCount} repo{repoCount === 1 ? '' : 's'}</small></>}
    </div>
  </div>
}
