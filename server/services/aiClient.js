import Groq from 'groq-sdk'
import { env, validateAIConfiguration } from '../config/env.js'

function createProviderClient() {
  validateAIConfiguration()

  // Provider selection is kept here so route handlers stay provider-agnostic.
  if (env.ai.provider === 'groq') {
    return new Groq({ apiKey: env.ai.apiKey })
  }

  // validateAIConfiguration currently prevents this path, but it keeps the
  // provider boundary explicit for future implementations.
  throw new Error(`No client is registered for provider: ${env.ai.provider}`)
}

function buildResponseFormat(responseFormat) {
  if (responseFormat === 'json') return { type: 'json_object' }
  return undefined
}

/**
 * Generate a response without exposing a provider SDK to routes or frontend code.
 */
export async function generateAIResponse({
  systemPrompt = 'You are a concise, helpful resume-writing assistant.',
  userPrompt,
  temperature = 0.4,
  responseFormat = 'text'
}) {
  if (typeof userPrompt !== 'string' || !userPrompt.trim()) {
    throw new TypeError('A non-empty user prompt is required.')
  }

  const client = createProviderClient()
  const completion = await client.chat.completions.create({
    model: env.ai.defaultModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt.trim() }
    ],
    temperature,
    response_format: buildResponseFormat(responseFormat)
  })

  const result = completion.choices?.[0]?.message?.content?.trim()
  if (!result) throw new Error('The AI provider returned an empty response.')
  return result
}

