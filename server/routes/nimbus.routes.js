import { Router } from 'express'
import { startNdjson } from '../ai/ndjson.js'
import { friendlyNimbusError, planNimbusTurn } from '../nimbus/nimbusEngine.js'

const router = Router()

// One NIMBUS turn, streamed: thinking → (plan + steps) | options | question | message → done.
router.post('/turn', async (request, response) => {
  const { instruction, context } = request.body ?? {}
  if (typeof instruction !== 'string' || !instruction.trim() || instruction.length > 2000) {
    return response.status(400).json({ ok: false, error: 'Tell NIMBUS what to do (up to 2,000 characters).' })
  }
  if (!context || typeof context !== 'object' || !context.resumeData) {
    return response.status(400).json({ ok: false, error: 'Open a resume before asking NIMBUS to edit it.' })
  }
  const stream = startNdjson(request, response)
  stream.send({ type: 'thinking', text: 'Reading your resume and request…' })
  try {
    const turn = await planNimbusTurn({ instruction: instruction.trim(), context })
    if (stream.closed) return
    if (turn.mode === 'edit') {
      stream.send({ type: 'plan', steps: turn.steps.map((step, index) => ({ id: `s${index + 1}`, title: step.title })) })
      turn.steps.forEach((step, index) => stream.send({ type: 'step', id: `s${index + 1}`, title: step.title, operations: step.operations }))
      stream.send({ type: 'message', text: turn.message || 'Done.' })
    } else if (turn.mode === 'options') {
      if (turn.message) stream.send({ type: 'message', text: turn.message })
      stream.send({ type: 'options', ...turn.options })
    } else if (turn.mode === 'question') {
      stream.send({ type: 'question', text: turn.question.text, quickReplies: turn.question.quickReplies, intro: turn.message && turn.message !== turn.question.text ? turn.message : '' })
    } else {
      stream.send({ type: 'message', text: turn.message, tone: turn.tone ?? (turn.mode === 'refuse' ? 'warning' : 'neutral') })
    }
    stream.end({ type: 'done', model: turn.model })
  } catch (error) {
    console.error('NIMBUS turn failed:', error?.message)
    const message = friendlyNimbusError(error)
    stream.end({ type: 'error', message })
  }
})

export default router
