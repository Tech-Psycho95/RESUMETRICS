import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const configDirectory = path.dirname(fileURLToPath(import.meta.url))
const serverDirectory = path.resolve(configDirectory, '..')

// Keep local secrets in the server directory. Existing process variables take priority.
dotenv.config({ path: path.join(serverDirectory, '.env.local'), quiet: true })
dotenv.config({ path: path.join(serverDirectory, '.env'), quiet: true })

export const env = Object.freeze({
  port: Number.parseInt(process.env.PORT ?? '8787', 10),
  webOrigin: process.env.RESUMETRICS_WEB_ORIGIN ?? 'http://localhost:5173',
  ai: Object.freeze({
    apiKey: process.env.RESUMETRICS_AI_API_KEY?.trim() ?? '',
    provider: process.env.RESUMETRICS_AI_PROVIDER?.trim().toLowerCase() ?? 'groq',
    defaultModel: process.env.RESUMETRICS_AI_DEFAULT_MODEL?.trim() ?? ''
  })
})

export class AIConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AIConfigurationError'
  }
}

export function validateAIConfiguration() {
  if (!env.ai.apiKey) {
    throw new AIConfigurationError('RESUMETRICS_AI_API_KEY is missing. Add it to server/.env.local.')
  }

  if (!env.ai.defaultModel) {
    throw new AIConfigurationError('RESUMETRICS_AI_DEFAULT_MODEL is missing. Add it to server/.env.local.')
  }

  if (env.ai.provider !== 'groq') {
    throw new AIConfigurationError(`Unsupported AI provider: ${env.ai.provider}.`)
  }
}
