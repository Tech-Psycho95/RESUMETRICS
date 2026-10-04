import { useRef, useState } from 'react'
import { streamNdjson } from '../utils/readNdjson.js'
import { extractResumeDocument } from '../utils/extractResumeDocument.js'
import { scoreResumeAgainstJd } from '../../shared/jdScoring.js'
import { settleLayout } from '../nimbus/useNimbusTurns.js'

/**
 * Job match runner shared by the editor and its fixture.
 * adapter: { getResume(), pageCount(), elementIds(), snapshot(), restore(snapshot), applyOperations(ops) }
 * analysis/setAnalysis hold the persisted result; draft/setDraft the composer text.
 */
export default function useJobMatch({ analysis, setAnalysis, draft, setDraft, adapter, endpoint = '/api/jd/analyze' }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef(null)
  const snapshotsRef = useRef(new Map())
  const orderRef = useRef(0)
  const adapterRef = useRef(adapter)
  adapterRef.current = adapter

  const run = async (savedJobText = null) => {
    setError('')
    let jobText = typeof savedJobText === 'string' ? savedJobText : draft.trim()
    if (file && typeof savedJobText !== 'string') {
      try {
        const extracted = await extractResumeDocument(file)
        jobText = [extracted.rawText, jobText].filter(Boolean).join('\n\n')
      } catch {
        setError('Could not read that file. Try a text-based PDF, a Word file, or paste the text.')
        return
      }
    }
    if (jobText.trim().length < 40) { setError('That job description looks too short — paste the full posting.'); return }
    const controller = new AbortController()
    abortRef.current = controller
    snapshotsRef.current.clear()
    setBusy(true)
    setAnalysis({ jobText: jobText.slice(0, 20_000), stages: [], fixes: [], fixState: {}, runId: Date.now() })
    try {
      await streamNdjson(endpoint, {
        body: { jobText, resumeData: adapterRef.current.getResume(), pages: adapterRef.current.pageCount(), elementIds: adapterRef.current.elementIds() },
        signal: controller.signal,
        onEvent: event => {
          if (event.type === 'stage') setAnalysis(current => ({ ...current, stages: [...(current?.stages ?? []), { id: event.id, label: event.label }] }))
          else if (event.type === 'jd') setAnalysis(current => ({ ...current, jd: event.jd }))
          else if (event.type === 'score') setAnalysis(current => ({ ...current, score: event.score, categories: event.categories, keywords: event.keywords }))
          else if (event.type === 'fixes') setAnalysis(current => ({ ...current, fixes: event.fixes, fixesDegraded: Boolean(event.degraded), fixesLimited: Boolean(event.limited) }))
          else if (event.type === 'error') setError(event.message)
        }
      })
      setDraft('')
      setFile(null)
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof TypeError ? 'The job match service is offline — start the app with npm run dev:all.' : caught.message || 'The job match could not be completed.')
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const rescore = (current, extra = {}) => {
    if (!current?.jd) return current
    const next = scoreResumeAgainstJd(adapterRef.current.getResume(), current.jd, { pages: adapterRef.current.pageCount() })
    return { ...current, score: next.score, categories: next.categories, keywords: next.keywords, ...extra }
  }

  const executeFix = async fix => {
    const before = adapterRef.current.snapshot()
    const previousScore = analysis?.score ?? 0
    try {
      adapterRef.current.applyOperations(fix.operations)
    } catch (caught) {
      setAnalysis(current => ({ ...current, fixState: { ...current.fixState, [fix.id]: { error: caught.message } } }))
      return
    }
    snapshotsRef.current.set(fix.id, before)
    orderRef.current += 1
    const order = orderRef.current
    await settleLayout(160)
    setAnalysis(current => {
      const next = rescore(current)
      return { ...next, fixState: { ...current.fixState, [fix.id]: { status: 'done', order, delta: next.score - previousScore } } }
    })
  }

  const executeMany = async fixes => { for (const fix of fixes) await executeFix(fix) }

  // Undoing a fix also undoes the fixes applied after it (they were built on top of it).
  const undoFix = async fix => {
    const snapshot = snapshotsRef.current.get(fix.id)
    const order = analysis?.fixState?.[fix.id]?.order
    if (!snapshot || !order) return
    adapterRef.current.restore(snapshot)
    await settleLayout(160)
    setAnalysis(current => rescore(current, { fixState: Object.fromEntries(Object.entries(current.fixState).filter(([, state]) => !(state.order >= order))) }))
  }

  // Ask for fixes again without re-reading the job (used when the first attempt couldn't produce tailored fixes).
  const retryFixes = () => run(analysis?.jobText ?? '')

  const reset = () => { abortRef.current?.abort(); setAnalysis(null); setError(''); snapshotsRef.current.clear() }

  return { busy, error, file, retryFixes, setFile: next => { setFile(next); setError('') }, run, stop: () => abortRef.current?.abort(), executeFix, executeMany, undoFix, reset }
}
