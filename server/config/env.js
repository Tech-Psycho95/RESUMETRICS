import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const configDirectory = path.dirname(fileURLToPath(import.meta.url))
const serverDirectory = path.resolve(configDirectory, '..')

// Keep local secrets in the server directory. Existing process variables take priority.
dotenv.config({ path: path.join(serverDirectory, '.env.local'), quiet: true })
dotenv.config({ path: path.join(serverDirectory, '.env'), quiet: true })

const positiveInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name] ?? '', 10)
  return Number.isInteger(value) && value > 0 ? value : fallback
}

const timeZoneOr = (name, fallback) => {
  const value = process.env[name]?.trim()
  if (!value) return fallback
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return fallback
  }
}

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
    defaultModel: process.env.RESUMETRICS_AI_DEFAULT_MODEL?.trim() || (process.env.RESUMETRICS_AI_PROVIDER?.trim().toLowerCase() === 'mock' ? 'mock' : ''),
    // Optional per-task models; each falls back to the default model.
    models: Object.freeze({
      nimbus: process.env.RESUMETRICS_AI_MODEL_NIMBUS?.trim() ?? '',
      jd: process.env.RESUMETRICS_AI_MODEL_JD?.trim() ?? '',
      linkedin: process.env.RESUMETRICS_AI_MODEL_LINKEDIN?.trim() ?? '',
      github: process.env.RESUMETRICS_AI_MODEL_GITHUB?.trim() ?? ''
    })
  }),
  githubScanCap: Math.max(1, Math.min(100, Number.parseInt(process.env.RESUMETRICS_GITHUB_SCAN_CAP ?? '25', 10) || 25)),
  // Rate limits (server/middleware/limits.js, server/ai/providerBudget.js). Provider defaults match the Groq free tier.
  limits: Object.freeze({
    ipPerMinute: positiveInt('RESUMETRICS_LIMIT_IP_PER_MINUTE', 60),
    userAiPerMinute: positiveInt('RESUMETRICS_LIMIT_USER_AI_PER_MINUTE', 10),
    userAiPerDay: positiveInt('RESUMETRICS_LIMIT_USER_AI_PER_DAY', 150),
    providerRpm: positiveInt('RESUMETRICS_AI_RPM', 30),
    providerTpm: positiveInt('RESUMETRICS_AI_TPM', 8000),
    providerRpd: positiveInt('RESUMETRICS_AI_RPD', 1000),
    providerTpd: positiveInt('RESUMETRICS_AI_TPD', 200_000)
  }),
  // Per-user daily AI allowance (server/ai/usage.js). The day starts at midnight in this time zone.
  usage: Object.freeze({
    userDailyTokens: positiveInt('RESUMETRICS_USER_DAILY_TOKENS', 50_000),
    timeZone: timeZoneOr('RESUMETRICS_USAGE_TIME_ZONE', 'Asia/Kolkata')
  }),
  // Number of reverse proxies in front of the server (e.g. 1 on Cloud Run or Render), so rate limits see real client IPs.
  trustProxy: Math.max(0, Number.parseInt(process.env.RESUMETRICS_TRUST_PROXY ?? '0', 10) || 0)
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
  // The offline mock needs no key or model (server/ai/mockProvider.js).
  if (env.ai.provider === 'mock') return

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
