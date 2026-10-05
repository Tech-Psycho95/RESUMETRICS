import { useRef, useState } from 'react'

const fieldId = path => `form-${String(path).replace(/[^a-z0-9]+/gi, '-')}`
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const thisYear = new Date().getFullYear()
const YEARS = Array.from({ length: thisYear + 6 - 1970 + 1 }, (_, index) => thisYear + 6 - index)

function Label({ children, required, optional }) {
  return <span className="form-label">{children}{required && <span className="form-required" aria-hidden="true"> *</span>}{optional && <span className="form-optional"> (optional)</span>}</span>
}

function ErrorText({ id, error }) {
  return error ? <small className="form-error" id={id}>{error}</small> : null
}

export function TextField({ label, path, value, onChange, required, optional, error, type = 'text', placeholder, multiline, hint, autoFocus }) {
  const id = fieldId(path)
  const Input = multiline ? 'textarea' : 'input'
  return <label className={`form-field${error ? ' is-missing' : ''}`} htmlFor={id} data-field-path={path}>
    <Label required={required} optional={optional}>{label}</Label>
    <Input id={id} type={multiline ? undefined : type} value={value ?? ''} rows={multiline ? 4 : undefined} placeholder={placeholder} autoFocus={autoFocus}
      aria-required={required || undefined} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      onChange={event => onChange(event.target.value)} />
    {hint && !error && <small className="form-hint" id={`${id}-hint`}>{hint}</small>}
    <ErrorText id={`${id}-error`} error={error} />
  </label>
}

function parseMonthYear(value) {
  const raw = String(value ?? '').trim()
  const full = raw.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/)
  if (full) {
    const month = MONTHS.findIndex(item => item.toLowerCase() === full[1].toLowerCase())
    return { month: month >= 0 ? MONTHS[month] : '', year: full[2], known: true }
  }
  const year = raw.match(/^(\d{4})$/)
  if (year) return { month: '', year: year[1], known: true }
  return { month: '', year: '', known: !raw }
}

/** Month + year pickers that store "Mon YYYY" (or "YYYY" when no month is chosen). */
export function MonthYearField({ label, path, value, onChange, required, optional, error, allowNoMonth = true, current, onCurrentChange, currentLabel }) {
  const id = fieldId(path)
  const isCurrent = current !== undefined && /^present$/i.test(String(value ?? '').trim())
  const parsed = parseMonthYear(isCurrent ? '' : value)
  const emit = (month, year) => onChange(year ? (month ? `${month} ${year}` : allowNoMonth ? year : `${MONTHS[0]} ${year}`) : '')
  return <fieldset className={`form-field form-month-year${error ? ' is-missing' : ''}`} data-field-path={path} aria-describedby={error ? `${id}-error` : undefined}>
    <legend><Label required={required} optional={optional}>{label}</Label></legend>
    <div className="form-month-year-row">
      <select aria-label={`${label} month`} value={parsed.month} disabled={isCurrent} onChange={event => emit(event.target.value, parsed.year || String(thisYear))}>
        <option value="">Month</option>
        {MONTHS.map(month => <option key={month} value={month}>{month}</option>)}
      </select>
      <select aria-label={`${label} year`} value={parsed.year} disabled={isCurrent} onChange={event => emit(parsed.month, event.target.value)}>
        <option value="">Year</option>
        {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
      </select>
    </div>
    {!parsed.known && <small className="form-hint">Currently “{value}”. Pick a month and year to replace it.</small>}
    {onCurrentChange && <label className="form-check"><input type="checkbox" checked={isCurrent} onChange={event => onCurrentChange(event.target.checked)} />{currentLabel}</label>}
    <ErrorText id={`${id}-error`} error={error} />
  </fieldset>
}

/** One line per bullet, with add, remove and reorder. Enter adds the next bullet. */
export function BulletListField({ label, path, items, onChange, required, optional, error, placeholder, addLabel = 'Add bullet' }) {
  const id = fieldId(path)
  const rows = items.length ? items : ['']
  const inputsRef = useRef([])
  const update = next => onChange(next)
  const focusRow = index => requestAnimationFrame(() => inputsRef.current[index]?.focus())
  const move = (index, delta) => {
    const next = [...rows]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    update(next)
    focusRow(index + delta)
  }
  return <fieldset className={`form-field form-bullets${error ? ' is-missing' : ''}`} data-field-path={path} aria-describedby={error ? `${id}-error` : undefined}>
    <legend><Label required={required} optional={optional}>{label}</Label></legend>
    <ol>{rows.map((item, index) => <li key={index}>
      <span className="form-bullet-dot" aria-hidden="true" />
      <input ref={node => { inputsRef.current[index] = node }} value={item} placeholder={placeholder} aria-label={`${label} ${index + 1}`}
        onChange={event => update(rows.map((row, rowIndex) => rowIndex === index ? event.target.value : row))}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault()
            update([...rows.slice(0, index + 1), '', ...rows.slice(index + 1)])
            focusRow(index + 1)
          }
          if (event.key === 'Backspace' && !item && rows.length > 1) {
            event.preventDefault()
            update(rows.filter((_, rowIndex) => rowIndex !== index))
            focusRow(Math.max(0, index - 1))
          }
        }} />
      <span className="form-row-actions">
        <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${label.toLowerCase()} ${index + 1} up`}>↑</button>
        <button type="button" disabled={index === rows.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${label.toLowerCase()} ${index + 1} down`}>↓</button>
        <button type="button" onClick={() => update(rows.filter((_, rowIndex) => rowIndex !== index))} aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}>×</button>
      </span>
    </li>)}</ol>
    <button type="button" className="form-add-inline" onClick={() => { update([...rows, '']); focusRow(rows.length) }}>+ {addLabel}</button>
    <ErrorText id={`${id}-error`} error={error} />
  </fieldset>
}

/** Type a value and press Enter or comma to add it as a chip. */
export function TagField({ label, path, values, onChange, required, optional, error, placeholder, hint }) {
  const id = fieldId(path)
  const [draft, setDraft] = useState('')
  const add = raw => {
    const parts = raw.split(',').map(item => item.trim()).filter(Boolean)
    if (!parts.length) return
    const known = new Set(values.map(item => item.toLowerCase()))
    onChange([...values, ...parts.filter(item => !known.has(item.toLowerCase()))])
    setDraft('')
  }
  return <div className={`form-field form-tags${error ? ' is-missing' : ''}`} data-field-path={path}>
    <label htmlFor={id}><Label required={required} optional={optional}>{label}</Label></label>
    <div className="form-tags-box">
      {values.map(value => <span className="form-tag" key={value}>{value}<button type="button" onClick={() => onChange(values.filter(item => item !== value))} aria-label={`Remove ${value}`}>×</button></span>)}
      <input id={id} value={draft} placeholder={values.length ? '' : placeholder} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={event => event.target.value.includes(',') ? add(event.target.value) : setDraft(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') { event.preventDefault(); add(draft) }
          if (event.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1))
        }}
        onBlur={() => add(draft)} />
    </div>
    {hint && !error && <small className="form-hint" id={`${id}-hint`}>{hint}</small>}
    <ErrorText id={`${id}-error`} error={error} />
  </div>
}

/** Collapsible card for one experience, education or project entry. */
export function EntryCard({ title, subtitle, index, count, open, onToggle, onMove, onRemove, hasError, children }) {
  return <section className={`form-entry${open ? ' is-open' : ''}${hasError ? ' has-missing' : ''}`}>
    <header>
      <button type="button" className="form-entry-toggle" aria-expanded={open} onClick={onToggle}>
        <span className="form-entry-chevron" aria-hidden="true">▸</span>
        <span><b>{title}</b>{subtitle && <small>{subtitle}</small>}</span>
      </button>
      <span className="form-row-actions">
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${title} up`}>↑</button>
        <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Move ${title} down`}>↓</button>
        <button type="button" onClick={onRemove} aria-label={`Remove ${title}`}>×</button>
      </span>
    </header>
    {open && <div className="form-entry-body">{children}</div>}
  </section>
}
