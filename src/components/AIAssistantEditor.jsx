import aiPlaylistAnimation from '../assets/ai-animations/edit-ai-animation.mp4'

export default function AIAssistantEditor({
  value,
  onChange,
  onSubmit,
  busy,
  feedback,
  inputRef
}) {
  const feedbackId = 'ai-edit-feedback'

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit(event)
    }
  }

  return <section className="ai-edit-minimal panel" aria-label="Edit with AI">
    <header className="ai-edit-identity">
      <span className="eyebrow">EDIT WITH AI</span>
      <svg className="ai-edit-sparkle" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8 11.5 8.5 18.2 10l-6.7 1.5L10 18.2l-1.5-6.7L1.8 10l6.7-1.5L10 1.8Z" /><path d="m16.1 2.2.4 1.3 1.3.4-1.3.4-.4 1.3-.4-1.3-1.3-.4 1.3-.4.4-1.3Z" /></svg>
    </header>
    <div className="ai-edit-stage">
      <div className="ai-edit-animation" aria-hidden="true">
        <video
          src={aiPlaylistAnimation}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      </div>
      <form className="ai-edit-composer" onSubmit={onSubmit}>
        <label className="ai-edit-label" htmlFor="ai-edit-request">Describe a change for AI to make</label>
        <textarea
          id="ai-edit-request"
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          disabled={busy}
          maxLength="2000"
          rows="2"
          placeholder="Describe a change to your resume…"
          aria-describedby={feedback ? feedbackId : undefined}
        />
        <button className="ai-edit-send" disabled={busy} aria-label={busy ? 'Applying AI change' : 'Send AI edit request'} type="submit">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h12M10.5 5.5 15 10l-4.5 4.5" /></svg>
        </button>
      </form>
    </div>
    {feedback?.text && <p id={feedbackId} className={`ai-edit-feedback ${feedback.tone || 'info'}`} role={feedback.tone === 'error' ? 'alert' : 'status'} aria-live="polite">{feedback.text}</p>}
  </section>
}
