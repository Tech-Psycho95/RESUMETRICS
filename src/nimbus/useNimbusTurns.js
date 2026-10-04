import { useRef, useState } from 'react'
import { streamNdjson } from '../utils/readNdjson.js'
import { optionToOperations } from './applyNimbusOperations.js'
import { describeNimbusOperation } from './describeNimbusOperation.js'

// Waits for React to render and the template to re-paginate. Hidden tabs don't run animation frames,
// so a timer resolves it anyway (a turn never stalls because the user switched tabs).
export const settleLayout = (extra = 60) => new Promise(resolve => {
  let done = false
  const finish = () => { if (!done) { done = true; resolve() } }
  requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(finish, extra)))
  window.setTimeout(finish, extra + 250)
})

/**
 * NIMBUS turn runner shared by the editor and its test fixture.
 * adapter: { snapshot(), restore(snapshot), applyOperations(ops) → { changed, fitOnePage }, buildContext(), fitToOnePage() → { ok, changed, note } }
 */
export default function useNimbusTurns({ turns, setTurns, adapter, available, endpoint = '/api/nimbus/turn', stepDelay = 320 }) {
  const [busy, setBusy] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  // What NIMBUS is doing right now, for the cloud animation and the task line above the composer.
  const [phase, setPhase] = useState('idle')
  const [task, setTask] = useState('')
  const [startedAt, setStartedAt] = useState(0)
  const phaseTimerRef = useRef(0)
  const settlePhase = next => {
    setPhase(next)
    setTask('')
    window.clearTimeout(phaseTimerRef.current)
    phaseTimerRef.current = window.setTimeout(() => setPhase('idle'), 1800)
  }
  const abortRef = useRef(null)
  const snapshotsRef = useRef(new Map())
  const previewSnapshotRef = useRef(null)
  const adapterRef = useRef(adapter)
  adapterRef.current = adapter

  const update = (id, patch) => setTurns(current => current.map(turn => turn.id === id ? { ...turn, ...(typeof patch === 'function' ? patch(turn) : patch) } : turn))
  const notice = (text, tone = 'warning') => setTurns(current => [...current, { id: `n${Date.now()}`, role: 'assistant', status: 'done', tone, text }].slice(-60))

  const run = async instruction => {
    const text = String(instruction ?? '').trim()
    if (!text || busy) return
    if (!available) { notice('Open or create a resume first, then I can work on it.'); return }
    const stamp = Date.now()
    const turnId = `a${stamp}`
    const before = adapterRef.current.snapshot()
    setTurns(current => [...current, { id: `u${stamp}`, role: 'user', text }, { id: turnId, role: 'assistant', status: 'thinking', thinking: 'Reading your request…', steps: [], changes: [] }].slice(-60))
    setBusy(true)
    setStartedAt(Date.now())
    window.clearTimeout(phaseTimerRef.current)
    setPhase('searching')
    setTask('Reading your resume')
    const controller = new AbortController()
    abortRef.current = controller
    // Never leave someone waiting indefinitely.
    let timedOut = false
    const deadline = window.setTimeout(() => { timedOut = true; controller.abort() }, 75_000)
    let chain = Promise.resolve()
    let fit = false
    let anyChange = false
    let failed = false
    try {
      await streamNdjson(endpoint, {
        body: { instruction: text, context: adapterRef.current.buildContext() },
        signal: controller.signal,
        onEvent: event => {
          if (event.type === 'thinking') { setPhase('contemplating'); setTask('Thinking it through'); update(turnId, { thinking: event.text }) }
          else if (event.type === 'plan') update(turnId, { status: 'running', steps: event.steps.map(step => ({ ...step, status: 'pending' })) })
          else if (event.type === 'step') chain = chain.then(async () => {
            if (controller.signal.aborted) return
            setPhase('executing')
            setTask(event.title)
            update(turnId, turn => ({ steps: turn.steps.map(step => step.id === event.id ? { ...step, status: 'running' } : step) }))
            await settleLayout(120)
            try {
              const result = adapterRef.current.applyOperations(event.operations)
              anyChange = anyChange || result.changed
              fit = fit || result.fitOnePage
              update(turnId, turn => ({ changes: [...(turn.changes ?? []), ...event.operations.filter(op => op.type !== 'fit_one_page').map(describeNimbusOperation)] }))
              await settleLayout(stepDelay)
              update(turnId, turn => ({ steps: turn.steps.map(step => step.id === event.id ? { ...step, status: 'done' } : step) }))
            } catch (error) {
              update(turnId, turn => ({ steps: turn.steps.map(step => step.id === event.id ? { ...step, status: 'failed', note: error.message } : step) }))
            }
          })
          else if (event.type === 'message') chain = chain.then(() => update(turnId, { text: event.text, tone: event.tone }))
          else if (event.type === 'options') update(turnId, { options: { kind: event.kind, target: event.target, prompt: event.prompt, choices: event.choices } })
          else if (event.type === 'question') update(turnId, { question: { text: event.text, quickReplies: event.quickReplies }, intro: event.intro })
          else if (event.type === 'error') { failed = true; update(turnId, { status: 'error', text: event.message }) }
        }
      })
      await chain
      if (fit && !controller.signal.aborted) {
        setPhase('executing')
        setTask('Fitting the resume on one page')
        update(turnId, turn => ({ steps: [...turn.steps, { id: 'fit', title: 'Fit the resume on one page', status: 'running' }] }))
        const outcome = await adapterRef.current.fitToOnePage()
        anyChange = anyChange || outcome.changed
        update(turnId, turn => ({
          steps: turn.steps.map(step => step.id === 'fit' ? { ...step, status: outcome.ok ? 'done' : 'failed', note: outcome.note } : step),
          ...(outcome.ok ? {} : { text: outcome.note, tone: 'warning' })
        }))
      }
    } catch (error) {
      if (timedOut) {
        failed = true
        update(turnId, { status: 'error', text: 'NIMBUS is taking too long right now. Please try again in a minute.' })
      } else if (!controller.signal.aborted) {
        failed = true
        update(turnId, { status: 'error', text: error instanceof TypeError ? 'NIMBUS is offline — start the app with npm run dev:all.' : error.message || 'NIMBUS could not answer just now.' })
      }
    } finally {
      window.clearTimeout(deadline)
      await chain.catch(() => {})
      if (anyChange) snapshotsRef.current.set(turnId, before)
      update(turnId, turn => ({
        status: failed ? 'error' : 'done',
        canUndo: anyChange,
        ...(controller.signal.aborted && !timedOut ? { steps: turn.steps.map(step => step.status === 'pending' || step.status === 'running' ? { ...step, status: 'failed', note: 'Stopped' } : step), text: turn.text || 'Stopped. Changes made so far are kept.' } : {})
      }))
      setBusy(false)
      abortRef.current = null
      settlePhase(failed ? 'error' : anyChange ? 'done' : 'idle')
    }
  }

  // A quick second click on Send (now Stop) must not cancel the request it just made.
  const stop = () => { if (Date.now() - startedAt > 700) abortRef.current?.abort() }

  // Hovering a choice previews it; leaving restores exactly what was there.
  const previewOption = (turn, choice) => {
    if (!choice) {
      if (previewSnapshotRef.current) adapterRef.current.restore(previewSnapshotRef.current)
      previewSnapshotRef.current = null
      setPreviewing(false)
      return
    }
    if (!previewSnapshotRef.current) previewSnapshotRef.current = adapterRef.current.snapshot()
    setPreviewing(true)
    adapterRef.current.restore(previewSnapshotRef.current)
    adapterRef.current.applyOperations(optionToOperations(turn.options, choice))
  }

  const applyOption = (turn, index) => {
    const choice = turn.options.choices[index]
    const before = previewSnapshotRef.current ?? adapterRef.current.snapshot()
    if (previewSnapshotRef.current) adapterRef.current.restore(previewSnapshotRef.current)
    previewSnapshotRef.current = null
    setPreviewing(false)
    const operations = optionToOperations(turn.options, choice)
    adapterRef.current.applyOperations(operations)
    snapshotsRef.current.set(turn.id, before)
    update(turn.id, { appliedIndex: index, canUndo: true, undone: false, changes: operations.map(describeNimbusOperation) })
  }

  const undoTurn = turn => {
    const snapshot = snapshotsRef.current.get(turn.id)
    if (!snapshot) return
    adapterRef.current.restore(snapshot)
    snapshotsRef.current.delete(turn.id)
    update(turn.id, { undone: true, canUndo: false, appliedIndex: undefined })
  }

  const answerQuestion = (turn, reply) => {
    update(turn.id, { answered: true })
    run(reply)
  }

  const reset = () => {
    abortRef.current?.abort()
    snapshotsRef.current.clear()
    previewSnapshotRef.current = null
    setPreviewing(false)
  }

  return { busy, phase, task, previewing, run, stop, previewOption, applyOption, undoTurn, answerQuestion, notice, reset }
}
