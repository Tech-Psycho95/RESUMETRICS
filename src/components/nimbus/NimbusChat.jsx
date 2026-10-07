import { useEffect, useRef, useState } from 'react'
import BloubAIIcon from '../BloubAIIcon.jsx'

const placeholders = [
  'Deepen my summary…',
  'Add my hackathon win to achievements…',
  'Make my internship bullets stronger…',
  'Change my headline to Data Analyst…',
  'Add Python and SQL to my skills…',
  'Rewrite my project description…',
  'Shorten my longest bullet…',
  'Add a line about mentoring to my last job…'
]

// Bloub states: idle, curious, exploring, thinking, processing, success, exclaim.
function cloudState({ busy, phase, typing }) {
  if (busy) return phase === 'executing' ? 'processing' : phase === 'contemplating' ? 'thinking' : 'curious'
  if (phase === 'done') return 'success'
  if (phase === 'error') return 'exclaim'
  return typing ? 'exploring' : 'idle'
}

/** NIMBUS: wordmark, cloud, plain chat, a shimmering line for the task in progress, and the composer. */
export default function NimbusChat({ turns, busy, phase, task, available, value, onChange, onSend, onStop, inputRef, hints = placeholders, unavailableText = 'Open a resume to talk to NIMBUS', suggestions = [] }) {
  const sectionRef = useRef(null)
  const threadRef = useRef(null)
  const [placeholder, setPlaceholder] = useState(0)

  useEffect(() => {
    const thread = threadRef.current
    if (thread) thread.scrollTop = thread.scrollHeight
  }, [turns, busy])
  useEffect(() => { if (!value && inputRef?.current) inputRef.current.style.height = '' }, [value, inputRef])
  // A new one-liner every few seconds while the box is empty.
  useEffect(() => {
    if (value) return undefined
    const timer = window.setInterval(() => setPlaceholder(index => (index + 1) % hints.length), 4200)
    return () => window.clearInterval(timer)
  }, [value])

  const submit = event => {
    event.preventDefault()
    if (busy || !value.trim() || !available) return
    onSend(value.trim())
    setPlaceholder(index => (index + 1) % hints.length)
  }

  const messages = turns.filter(turn => turn.role === 'user' || turn.text || turn.question?.text)
  return <section className="nimbus" ref={sectionRef} aria-label="NIMBUS">
    <h2 className="nimbus-wordmark">NIMBUS</h2>
    <div className="nimbus-cloud" aria-hidden="true">
      <BloubAIIcon state={available ? cloudState({ busy, phase, typing: Boolean(value.trim()) }) : 'idle'} followRegionRef={sectionRef} />
    </div>
    <div className="nimbus-thread" ref={threadRef} role="log" aria-live="polite">
      {messages.map(turn => turn.role === 'user'
        ? <p key={turn.id} className="nimbus-msg is-user">{turn.text}</p>
        : <p key={turn.id} className={`nimbus-msg is-nimbus${turn.tone === 'warning' || turn.status === 'error' ? ' is-warning' : ''}`}>{turn.question?.text ? `${turn.intro ? `${turn.intro} ` : ''}${turn.question.text}` : turn.text}</p>)}
    </div>
    {busy && task && <p className="nimbus-task" role="status">{task}</p>}
    {!busy && available && suggestions.length > 0 && !turns.some(turn => turn.role === 'user') && <div className="nimbus-suggestions" role="group" aria-label="Suggestions">
      {suggestions.map(item => <button key={item} type="button" className="nimbus-chip" onClick={() => onSend(item)}>{item}</button>)}
    </div>}
    <form className="nimbus-input" onSubmit={submit}>
      <textarea ref={inputRef} value={value} rows={1} maxLength={2000} disabled={!available}
        placeholder={available ? hints[placeholder] : unavailableText} aria-label="Message NIMBUS"
        onChange={onChange}
        onInput={event => { const box = event.currentTarget; box.style.height = 'auto'; box.style.height = `${Math.min(box.scrollHeight, 150)}px`; box.classList.toggle('is-scrolling', box.scrollHeight > 150) }}
        onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) submit(event) }} />
      {busy
        ? <button type="button" className="nimbus-send is-stop" onClick={onStop} aria-label="Stop"><span /></button>
        : <button type="submit" className="nimbus-send" disabled={!value.trim() || !available} aria-label="Send"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 15.5v-11M5.5 9 10 4.5 14.5 9" /></svg></button>}
    </form>
  </section>
}
