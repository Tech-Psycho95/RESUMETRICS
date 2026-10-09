import { useMemo } from 'react'
import { scoreKeywords } from '../../../shared/jdKeywords.js'

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The posting with every selected keyword marked: green when the resume has it, red when it is missing. */
export default function JdHighlight({ analysis, resumeData }) {
  const parts = useMemo(() => {
    const text = analysis?.jobText ?? ''
    const rows = scoreKeywords(resumeData ?? {}, analysis?.keywords ?? []).rows
    if (!rows.length) return [{ text }]
    const status = new Map(rows.map(row => [row.term.toLowerCase(), row.found]))
    const pattern = new RegExp(`(^|[^a-z0-9+#])(${rows.map(row => escapeRegExp(row.term)).sort((a, b) => b.length - a.length).join('|')})(?=$|[^a-z0-9+#])`, 'gi')
    const out = []
    let last = 0
    for (const match of text.matchAll(pattern)) {
      const start = match.index + match[1].length
      if (start > last) out.push({ text: text.slice(last, start) })
      out.push({ text: match[2], found: status.get(match[2].toLowerCase()) })
      last = start + match[2].length
    }
    out.push({ text: text.slice(last) })
    return out
  }, [analysis?.jobText, analysis?.keywords, resumeData])

  if (!analysis?.jobText) return <p className="tp-empty">Paste a job description to see it here with its keywords marked.</p>
  return <div className="jdh">
    <p className="jdh-legend"><span className="jdh-key is-found">On your resume</span><span className="jdh-key is-missing">Missing</span></p>
    <div className="jdh-text">{parts.map((part, index) => part.found == null ? part.text : <mark key={index} className={part.found ? 'is-found' : 'is-missing'}>{part.text}</mark>)}</div>
  </div>
}
