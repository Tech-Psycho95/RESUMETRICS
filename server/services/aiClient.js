import Groq from 'groq-sdk'
import { env, validateAIConfiguration } from '../config/env.js'

function createProviderClient() {
  validateAIConfiguration()

  // Provider selection is kept here so route handlers stay provider-agnostic.
  // The SDK retries rate limits (honouring retry-after), timeouts and server errors itself.
  if (env.ai.provider === 'groq') {
    // Interactive features can't make people wait through long retry chains: one retry, 30s per call.
    return new Groq({ apiKey: env.ai.apiKey, maxRetries: 1, timeout: 30_000 })
  }

  // validateAIConfiguration currently prevents this path, but it keeps the
  // provider boundary explicit for future implementations.
  throw new Error(`No client is registered for provider: ${env.ai.provider}`)
}

function buildResponseFormat(responseFormat, jsonSchema) {
  if (responseFormat === 'json_schema' && jsonSchema) return { type: 'json_schema', json_schema: { name: jsonSchema.name, schema: jsonSchema.schema, strict: true } }
  if (responseFormat === 'json') return { type: 'json_object' }
  return undefined
}

const isReasoningModel = model => /gpt-oss/i.test(model)

/**
 * Generate a response without exposing a provider SDK to routes or frontend code.
 */
export async function generateAIResponse({
  systemPrompt = 'You are a concise, helpful resume-writing assistant.',
  userPrompt,
  temperature = 0.4,
  responseFormat = 'text',
  jsonSchema,
  seed,
  maxCompletionTokens,
  reasoningEffort,
  model,
  messages
}) {
  if (!messages && (typeof userPrompt !== 'string' || !userPrompt.trim())) {
    throw new TypeError('A non-empty user prompt is required.')
  }

  const client = createProviderClient()
  const selectedModel = model || env.ai.defaultModel
  const request = {
    model: selectedModel,
    messages: messages ?? [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt.trim() }
    ],
    temperature,
    response_format: buildResponseFormat(responseFormat, jsonSchema)
  }
  if (Number.isInteger(seed)) request.seed = seed
  if (Number.isInteger(maxCompletionTokens)) request.max_completion_tokens = maxCompletionTokens
  if (reasoningEffort && isReasoningModel(selectedModel)) request.reasoning_effort = reasoningEffort

  const completion = await client.chat.completions.create(request)

  const result = completion.choices?.[0]?.message?.content?.trim()
  if (!result) throw new Error('The AI provider returned an empty response.')
  return result
}
