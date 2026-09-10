import { Router } from 'express'
import { AIConfigurationError, env, validateAIConfiguration } from '../config/env.js'
import { generateAIResponse } from '../services/aiClient.js'

const router = Router()
const MAX_TEST_MESSAGE_LENGTH = 2_000

function publicConfigurationMessage() {
  return 'AI backend is not configured. Add the required RESUMETRICS_AI_* values to server/.env.local.'
}

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

router.post('/test', async (request, response) => {
  const { message } = request.body ?? {}

  if (typeof message !== 'string' || !message.trim()) {
    return response.status(400).json({ ok: false, error: 'message must be a non-empty string.' })
  }

  if (message.length > MAX_TEST_MESSAGE_LENGTH) {
    return response.status(400).json({ ok: false, error: `message must be ${MAX_TEST_MESSAGE_LENGTH} characters or fewer.` })
  }

  try {
    const result = await generateAIResponse({ userPrompt: message })
    return response.json({ ok: true, result })
  } catch (error) {
    console.error('AI test request failed:', error)

    if (error instanceof AIConfigurationError) {
      return response.status(503).json({ ok: false, error: publicConfigurationMessage() })
    }

    return response.status(502).json({ ok: false, error: 'AI service is temporarily unavailable. Please try again.' })
  }
})

export default router

