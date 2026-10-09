import { Router } from 'express'
import { startNdjson } from '../ai/ndjson.js'
import { suggestFixes } from '../jd/jdEngine.js'
import { normalizeResumeData } from '../services/resumeData.js'

const router = Router()

// Fixes for the keywords the person selected. Keywords are found and scored in the browser (shared/jdExtract.js, shared/jdKeywords.js).
router.post('/fixes', async (request, response) => {
  const { resumeData, jd, keywords, elementIds } = request.body ?? {}
  if (!resumeData || typeof resumeData !== 'object' || !jd || typeof jd !== 'object') return response.status(400).json({ ok: false, error: 'Open a resume and read a job description first.' })
  const stream = startNdjson(request, response)
  try {
    stream.send({ type: 'stage', id: 'fixes', label: 'Preparing changes' })
    const safeKeywords = (Array.isArray(keywords) ? keywords : []).slice(0, 60)
      .filter(item => item && typeof item.term === 'string')
      .map(item => ({ term: item.term.slice(0, 60), key: Boolean(item.key), found: Boolean(item.found), prominent: Boolean(item.prominent) }))
    const { fixes, degraded, limited } = await suggestFixes({ resumeData: normalizeResumeData(resumeData), jd, keywords: safeKeywords, elementIds: Array.isArray(elementIds) ? elementIds.slice(0, 400) : [] })
    stream.end({ type: 'fixes', fixes, degraded, limited })
  } catch (error) {
    console.error('JD fixes failed:', error?.message)
    stream.end({ type: 'error', message: 'Changes could not be prepared. Please try again.' })
  }
})

export default router
