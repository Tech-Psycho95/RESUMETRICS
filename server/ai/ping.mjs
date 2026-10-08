// Sends one prompt to the configured AI provider and prints the reply: `npm run ai:ping [message]`.
// Replaces the public POST /api/ai/test route, which let anyone send prompts on our key.
import { env, validateAIConfiguration } from '../config/env.js'
import { generateAIResponse } from '../services/aiClient.js'

const message = process.argv.slice(2).join(' ').trim() || 'Reply with the single word OK.'

try {
  validateAIConfiguration()
  const started = Date.now()
  const reply = await generateAIResponse({ userPrompt: message, maxCompletionTokens: 1024, reasoningEffort: 'low' })
  console.log(`${env.ai.provider} · ${env.ai.defaultModel} · ${Date.now() - started} ms`)
  console.log(reply)
} catch (error) {
  console.error(`AI ping failed: ${error.message}`)
  process.exitCode = 1
}
