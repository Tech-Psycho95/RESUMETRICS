import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const configDirectory = path.dirname(fileURLToPath(import.meta.url))
const serverDirectory = path.resolve(configDirectory, '..')

// Keep local secrets in the server directory. Existing process variables take priority.
dotenv.config({ path: path.join(serverDirectory, '.env.local'), quiet: true })
dotenv.config({ path: path.join(serverDirectory, '.env'), quiet: true })

const firebaseServiceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
  ''

export const env = Object.freeze({
  port: Number.parseInt(process.env.PORT ?? '8787', 10),
  webOrigin: process.env.RESUMETRICS_WEB_ORIGIN ?? 'http://localhost:5173',
  firebase: Object.freeze({
    serviceAccountPath: firebaseServiceAccountPath
  }),
  github: Object.freeze({
    appId: process.env.GITHUB_APP_ID?.trim() ?? '',
    clientId: process.env.GITHUB_CLIENT_ID?.trim() ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET?.trim() ?? '',
    privateKeyPath: process.env.GITHUB_PRIVATE_KEY_PATH?.trim() ?? '',
    appSlug: process.env.GITHUB_APP_SLUG?.trim() ?? 'resumetrics-evidence',
    callbackUrl: process.env.GITHUB_CALLBACK_URL?.trim() ?? 'http://localhost:8787/api/github/callback',
    frontendUrl: process.env.FRONTEND_URL?.trim() ?? process.env.RESUMETRICS_WEB_ORIGIN?.trim() ?? 'http://localhost:5173'
  }),
  ai: Object.freeze({
    apiKey: process.env.RESUMETRICS_AI_API_KEY?.trim() ?? '',
    provider: process.env.RESUMETRICS_AI_PROVIDER?.trim().toLowerCase() ?? 'groq',
    defaultModel: process.env.RESUMETRICS_AI_DEFAULT_MODEL?.trim() ?? ''
  })
})

export class GitHubConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'GitHubConfigurationError'
  }
}

export function validateGitHubConfiguration() {
  if (!env.github.appId) throw new GitHubConfigurationError('GITHUB_APP_ID is missing. Add it to server/.env.local.')
  if (!env.github.clientId) throw new GitHubConfigurationError('GITHUB_CLIENT_ID is missing. Add it to server/.env.local.')
  if (!env.github.clientSecret) throw new GitHubConfigurationError('GITHUB_CLIENT_SECRET is missing. Add it to server/.env.local.')
  if (!env.github.privateKeyPath) throw new GitHubConfigurationError('GITHUB_PRIVATE_KEY_PATH is missing. Add it to server/.env.local.')
  if (!env.github.appSlug) throw new GitHubConfigurationError('GITHUB_APP_SLUG is missing. Add it to server/.env.local.')
  if (!env.github.callbackUrl) throw new GitHubConfigurationError('GITHUB_CALLBACK_URL is missing. Add it to server/.env.local.')
  if (!env.github.frontendUrl) throw new GitHubConfigurationError('FRONTEND_URL is missing. Add it to server/.env.local.')
}

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
