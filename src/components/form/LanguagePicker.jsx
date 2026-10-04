import { useEffect, useRef, useState } from 'react'
import { spokenLanguages } from '../../data/languages.js'

// Search matches the start of any word, so "hin" finds Hindi but not Mandarin Chinese.
const matchesLanguage = (language, query) => !query.trim() || language.toLocaleLowerCase().split(/[\s-]+/).some(word => word.startsWith(query.trim().toLocaleLowerCase())) || language.toLocaleLowerCase().startsWith(query.trim().toLocaleLowerCase())

// Multi-select language picker: tick several languages, then add them all at once.
export default function LanguagePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState([])
  const rootRef = useRef(null)
  const selectedKeys = new Set(value.map(item => item.toLocaleLowerCase()))
  const available = spokenLanguages.filter(language => !selectedKeys.has(language.toLocaleLowerCase()) && matchesLanguage(language, query))

  useEffect(() => {
    if (!open) return undefined
    const onPointer = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const onKey = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open])

  const toggle = language => setPicked(current => current.includes(language) ? current.filter(item => item !== language) : [...current, language])
  const addPicked = () => {
    onChange([...value, ...picked])
    setPicked([])
    setQuery('')
    setOpen(false)
  }

  return <div className="language-picker" ref={rootRef}>
    {value.length > 0 && <ul className="language-chips" aria-label="Languages on your resume">{value.map(language => <li key={language}>
      {language}
      <button type="button" onClick={() => onChange(value.filter(item => item !== language))} aria-label={`Remove ${language}`}>×</button>
    </li>)}</ul>}
    <button className="language-picker-toggle" type="button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(current => !current)}>
      <span>{value.length ? 'Add more languages' : 'Choose languages'}</span><span aria-hidden="true">▾</span>
    </button>
    {open && <div className="language-picker-panel">
      <input className="language-picker-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search languages" aria-label="Search languages" autoFocus />
      <ul className="language-picker-list" role="listbox" aria-multiselectable="true" aria-label="Languages">
        {available.length ? available.map(language => <li key={language}>
          <label className={picked.includes(language) ? 'is-picked' : ''}>
            <input type="checkbox" checked={picked.includes(language)} onChange={() => toggle(language)} />
            <span>{language}</span>
          </label>
        </li>) : <li className="language-picker-empty">No languages match “{query}”.</li>}
      </ul>
      <div className="language-picker-footer">
        <span>{picked.length ? `${picked.length} selected` : 'Tick one or more'}</span>
        <button type="button" onClick={addPicked} disabled={!picked.length}><span aria-hidden="true">+</span> Add{picked.length ? ` ${picked.length}` : ''}</button>
      </div>
    </div>}
  </div>
}
