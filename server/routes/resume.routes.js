import { Router } from 'express'
import { AIConfigurationError } from '../config/env.js'
import { analyzeResumeAgainstRole, extractStructuredResumeData, rewriteResumeBullet } from '../services/resumeAI.js'
import { extractResumeDataFallback } from '../services/resumeFallback.js'
import { normalizeResumeData } from '../services/resumeData.js'
import { buildSkillAwareRoleAnalysis } from '../../shared/roleAnalysis.js'

const router = Router()
const MAX_RESUME_TEXT_LENGTH = 60_000
const MAX_BULLET_LENGTH = 1_000
const MAX_TARGET_ROLE_LENGTH = 160
const MAX_JOB_DESCRIPTION_LENGTH = 12_000

function configurationError(response) {
  return response.status(503).json({ ok: false, error: 'AI backend is not configured. Check the server environment configuration.' })
}

router.post('/extract', async (request, response) => {
  const { resumeText } = request.body ?? {}

  if (typeof resumeText !== 'string' || !resumeText.trim()) {
    return response.status(400).json({ ok: false, error: 'resumeText must be a non-empty string.' })
  }

  if (resumeText.length > MAX_RESUME_TEXT_LENGTH) {
    return response.status(400).json({ ok: false, error: `resumeText must be ${MAX_RESUME_TEXT_LENGTH.toLocaleString()} characters or fewer.` })
  }

  try {
    const resumeData = await extractStructuredResumeData(resumeText)
    return response.json({ ok: true, resumeData, extractionMethod: 'ai' })
  } catch (error) {
    console.error('Resume extraction failed:', error)
    if (error instanceof AIConfigurationError) return configurationError(response)
    const resumeData = extractResumeDataFallback(resumeText)
    return response.json({ ok: true, resumeData, extractionMethod: 'source-fallback' })
  }
})

router.post('/analyze', async (request, response) => {
  const { resumeData, jobDescription } = request.body ?? {}
  if (!resumeData || typeof resumeData !== 'object') return response.status(400).json({ ok: false, error: 'resumeData must be provided.' })
  if (typeof jobDescription !== 'string' || !jobDescription.trim()) return response.status(400).json({ ok: false, error: 'jobDescription must be a non-empty string.' })
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) return response.status(400).json({ ok: false, error: `jobDescription must be ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters or fewer.` })

  const normalizedResumeData = normalizeResumeData(resumeData)
  try {
    const analysis = await analyzeResumeAgainstRole({ resumeData: normalizedResumeData, jobDescription: jobDescription.trim() })
    return response.json({ ok: true, analysis, analysisMethod: 'ai' })
  } catch (error) {
    console.error('Role alignment analysis failed:', error)
    const analysis = buildSkillAwareRoleAnalysis(normalizedResumeData, jobDescription.trim())
    return response.json({ ok: true, analysis, analysisMethod: 'skill-fallback' })
  }
})

router.post('/rewrite-bullet', async (request, response) => {
  const { bullet, targetRole, tone } = request.body ?? {}

  if (typeof bullet !== 'string' || !bullet.trim()) {
    return response.status(400).json({ ok: false, error: 'bullet must be a non-empty string.' })
  }
  if (bullet.length > MAX_BULLET_LENGTH) {
    return response.status(400).json({ ok: false, error: `bullet must be ${MAX_BULLET_LENGTH.toLocaleString()} characters or fewer.` })
  }
  if (typeof targetRole === 'string' && targetRole.length > MAX_TARGET_ROLE_LENGTH) {
    return response.status(400).json({ ok: false, error: `targetRole must be ${MAX_TARGET_ROLE_LENGTH} characters or fewer.` })
  }
  if (tone !== undefined && typeof tone !== 'string') {
    return response.status(400).json({ ok: false, error: 'tone must be a string when provided.' })
  }

  try {
    const rewrittenBullet = await rewriteResumeBullet({ bullet, targetRole, tone })
    return response.json({ ok: true, rewrittenBullet })
  } catch (error) {
    console.error('Resume bullet rewrite failed:', error)
    if (error instanceof AIConfigurationError) return configurationError(response)
    return response.status(502).json({ ok: false, error: 'Could not rewrite this bullet right now. Please try again.' })
  }
})

export default router
