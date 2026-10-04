import { Router } from 'express'
import { startNdjson } from '../ai/ndjson.js'
import { parseJobDescription, suggestFixes } from '../jd/jdEngine.js'
import { scoreResumeAgainstJd } from '../../shared/jdScoring.js'
import { normalizeResumeData } from '../services/resumeData.js'

const router = Router()

// Streamed: stage events → result. Scoring is deterministic; parsing and fixes use AI with safe fallbacks.
router.post('/analyze', async (request, response) => {
  const { jobText, resumeData, pages, elementIds } = request.body ?? {}
  if (typeof jobText !== 'string' || jobText.trim().length < 40) return response.status(400).json({ ok: false, error: 'Paste or upload a job description (at least a few sentences).' })
  if (jobText.length > 30_000) return response.status(400).json({ ok: false, error: 'That job description is too long. Paste the main posting text only.' })
  if (!resumeData || typeof resumeData !== 'object') return response.status(400).json({ ok: false, error: 'Open a resume before matching it to a job.' })
  const stream = startNdjson(request, response)
  try {
    stream.send({ type: 'stage', id: 'read', label: 'Reading the job description' })
    const jd = await parseJobDescription(jobText)
    if (stream.closed) return
    stream.send({ type: 'jd', jd })
    stream.send({ type: 'stage', id: 'compare', label: 'Comparing with your resume' })
    const resume = normalizeResumeData(resumeData)
    const score = scoreResumeAgainstJd(resume, jd, { pages: Number.isInteger(pages) ? pages : null })
    stream.send({ type: 'score', ...score })
    stream.send({ type: 'stage', id: 'fixes', label: 'Preparing fixes' })
    const { fixes, degraded, limited } = await suggestFixes({ resumeData: resume, jd, score, elementIds: Array.isArray(elementIds) ? elementIds.slice(0, 400) : [] })
    stream.end({ type: 'fixes', fixes, degraded, limited })
  } catch (error) {
    console.error('JD analysis failed:', error?.message)
    stream.end({ type: 'error', message: 'The job match could not be completed. Please try again.' })
  }
})

export default router
