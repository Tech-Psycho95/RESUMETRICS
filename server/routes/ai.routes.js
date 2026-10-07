import { Router } from 'express'
import { env, validateAIConfiguration } from '../config/env.js'

const router = Router()

function publicConfigurationMessage() {
  return 'AI backend is not configured. Add the required RESUMETRICS_AI_* values to server/.env.local.'
}

// Config check only; it never calls the model. To try the model itself, run `npm run ai:ping`
// (the old public POST /api/ai/test let anyone send prompts on our key).
router.get('/health', (_request, response) => {
  try {
    validateAIConfiguration()
    return response.json({
      ok: true,
      provider: env.ai.provider,
      message: 'AI backend is configured'
    })
  } catch (error) {
    console.error('AI health check configuration error:', error.message)
    return response.status(503).json({
      ok: false,
      provider: env.ai.provider,
      message: publicConfigurationMessage()
    })
  }
})

export default router
