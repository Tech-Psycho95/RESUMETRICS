import Groq from 'groq-sdk'
import { env, validateAIConfiguration } from '../config/env.js'
import { AIBusyError, providerBudget } from '../ai/providerBudget.js'
import { recordAiCall, recordLimited } from '../ai/usage.js'
import { createMockClient } from '../ai/mockProvider.js'

// Seconds from a provider 429's Retry-After header (Headers object or plain record), default 30.
function retryAfterSeconds(error) {
  const raw = typeof error?.headers?.get === 'function' ? error.headers.get('retry-after') : error?.headers?.['retry-after']
  const seconds = Number(raw)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 30
}

function createProviderClient() {
  validateAIConfiguration()

  // Provider selection is kept here so route handlers stay provider-agnostic.
  // The SDK retries rate limits (honouring retry-after), timeouts and server errors itself.
  if (env.ai.provider === 'groq') {
    // Interactive features can't make people wait through long retry chains: one retry, 30s per call.
    return new Groq({ apiKey: env.ai.apiKey, maxRetries: 1, timeout: 30_000 })
  }
  // Canned, offline answers for CI and tests (server/ai/mockProvider.js).
  if (env.ai.provider === 'mock') return createMockClient()

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

  // Every model call passes the app-wide provider budget first (throws AIBusyError when it is spent),
  // and is counted against the signed-in user of the current request (server/ai/usage.js).
  let ticket
  let completion
  try {
    // The mock costs nothing, so it skips the provider budget (tests make many calls quickly); usage is still recorded.
    if (env.ai.provider !== 'mock') ticket = providerBudget.reserve(request.messages)
    completion = await client.chat.completions.create(request)
  } catch (error) {
    const busy = error instanceof AIBusyError ? error : error?.status === 429 ? new AIBusyError(retryAfterSeconds(error), 'provider') : null
    if (busy) {
      recordLimited().catch(() => {})
      throw busy
    }
    throw error
  }
  providerBudget.settle(ticket, completion.usage?.total_tokens)
  recordAiCall({ tokensIn: completion.usage?.prompt_tokens ?? 0, tokensOut: completion.usage?.completion_tokens ?? 0 })
    .catch(error => console.error('AI usage could not be recorded:', error?.message))

  const result = completion.choices?.[0]?.message?.content?.trim()
  if (!result) throw new Error('The AI provider returned an empty response.')
  return result
}
