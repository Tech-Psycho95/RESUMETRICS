import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import aiRoutes from './routes/ai.routes.js'
import githubRoutes from './routes/github.routes.js'
import resumeRoutes from './routes/resume.routes.js'
import { initializeFirebaseAdmin } from './services/firebaseAdmin.js'

const app = express()
const allowedOrigins = env.webOrigin.split(',').map(origin => origin.trim()).filter(Boolean)
const allowsLocalDevelopment = allowedOrigins.some(origin => {
  try {
    const url = new URL(origin)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  } catch {
    return false
  }
})

function isAllowedOrigin(origin) {
  if (allowedOrigins.includes(origin)) return true
  if (!allowsLocalDevelopment) return false

  try {
    const url = new URL(origin)
    return url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  } catch {
    return false
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS.'))
  }
}))
// Resume source pages are extracted in the browser and sent with page metadata.
// The route chunks long text for AI processing; this limit only protects transport.
app.use(express.json({ limit: '2mb' }))

app.use('/api/ai', aiRoutes)
app.use('/api/github', githubRoutes)
app.use('/api/resume', resumeRoutes)

try {
  initializeFirebaseAdmin()
  console.log('Firebase Admin initialized for authenticated integrations.')
} catch {
  console.error('Firebase service account configuration is missing or invalid. GitHub endpoints will remain unavailable until it is configured.')
}

app.use((error, _request, response, _next) => {
  console.error('Unhandled server error:', error)
  if (error?.type === 'entity.too.large') {
    return response.status(413).json({ ok: false, error: 'This document is too large to send safely. Split it into smaller files and try again.' })
  }
  response.status(500).json({ ok: false, error: 'The server could not process this request.' })
})

app.listen(env.port, () => {
  console.log(`Resumetrics AI server listening on http://localhost:${env.port}`)
})
