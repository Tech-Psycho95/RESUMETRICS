import { Router } from 'express'
import { AIConfigurationError } from '../config/env.js'
import { AIBusyError } from '../ai/providerBudget.js'
import { normalizeResumeData } from '../services/resumeData.js'
import { extractCompleteResumeDocument, extractSourceFallbackDocument, MAX_DOCUMENT_CHARACTERS, normalizeResumeDocument } from '../services/resumeExtraction.js'

const router = Router()

function configurationError(response) {
  return response.status(503).json({ ok: false, error: 'AI backend is not configured. Check the server environment configuration.' })
}

router.post('/extract', async (request, response) => {
  const { document, resumeText } = request.body ?? {}
  const sourceDocument = normalizeResumeDocument(document ?? { resumeText })

  if (!sourceDocument.rawText) {
    return response.status(400).json({ ok: false, error: 'A document with readable text must be provided.' })
  }

  if (sourceDocument.rawText.length > MAX_DOCUMENT_CHARACTERS) {
    return response.status(400).json({ ok: false, error: `This document contains more than ${MAX_DOCUMENT_CHARACTERS.toLocaleString()} readable characters. Split it into smaller files and try again.` })
  }

  try {
    const result = await extractCompleteResumeDocument(sourceDocument)
    return response.json({ ok: true, ...result })
  } catch (error) {
    console.error('Resume extraction failed:', error)
    if (error instanceof AIConfigurationError) return configurationError(response)
    // Busy AI: ask the person to retry rather than handing back the much weaker text-only fallback.
    if (error instanceof AIBusyError) {
      response.set('Retry-After', String(error.retryAfterSeconds))
      return response.status(429).json({ ok: false, error: `${error.message} Your file wasn't changed.`, retryAfterSeconds: error.retryAfterSeconds })
    }
    const result = extractSourceFallbackDocument(sourceDocument)
    return response.json({ ok: true, ...result })
  }
})

export default router
