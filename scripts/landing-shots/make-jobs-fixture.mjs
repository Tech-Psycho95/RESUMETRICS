// Runs one real job search (JSearch + Tavily keys from server/.env.local) for the demo resume and saves the result
// the job tracker shows, so screenshots show real postings. Re-run when the fixture gets old:
//   node scripts/landing-shots/make-jobs-fixture.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { env } from '../../server/config/env.js'
import { buildRows, createJobSearch } from '../../server/jobs/jobSearch.js'
import { buildSearchProfile } from '../../shared/jobMatch.js'
import { sampleResumes } from './sample.js'

const resume = sampleResumes[0]
const profile = buildSearchProfile(resume.data)
const store = { getCached: async () => null, putCached: async () => {}, getSalary: async () => undefined, putSalary: async () => {} }
const raw = await createJobSearch({ store, config: env.jobs }).fetchFresh(profile)
const search = { resumeId: resume.id, resumeName: resume.name, profile, rows: buildRows(profile, raw), failures: raw.failures, cached: false, searchedAt: new Date().toISOString() }
writeFileSync(fileURLToPath(new URL('./jobs-fixture.json', import.meta.url)), `${JSON.stringify(search, null, 1)}\n`)
console.log(`${search.rows.reduce((total, row) => total + row.jobs.length, 0)} jobs on ${search.rows.length} boards for "${profile.role}" in ${profile.location}`)
