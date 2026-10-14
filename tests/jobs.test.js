import assert from 'node:assert/strict'
import express from 'express'
import { buildSearchProfile, experienceFit, formatPay, platformOf, roleFromResume, scoreJob, titleFit } from '../shared/jobMatch.js'
import { estimateSalary, normalizeJSearchJob, normalizeTavilyResult, postingFromSlug, postingFromTitle, searchJSearch, searchTavily } from '../server/jobs/sources.js'
import { buildRows, cacheKeyOf, createJobSearch, salaryFor } from '../server/jobs/jobSearch.js'
import { createJobStore, jobKeyOf, validateSavedJob } from '../server/db/jobStore.js'
import { createResumeStore } from '../server/db/resumeStore.js'
import { createRequirePro } from '../server/middleware/requirePro.js'
import { createJobsRouter } from '../server/routes/jobs.routes.js'
import { createFakeFirestore } from './helpers/fakeFirestore.js'

const resume = {
  fullName: 'Ada Lovelace', email: 'ada@example.com', location: 'Bengaluru, Karnataka', headline: 'Frontend Developer | React, TypeScript',
  skills: { core: ['React', 'TypeScript', 'Node.js', 'CSS'] },
  experience: [{ role: 'Frontend Engineer', company: 'Acme', startDate: 'Jan 2023', endDate: 'Jan 2025', bullets: ['Built a React app'] }]
}

// Search profile: role from the headline, city from the location, skills from the resume, never contact details.
const profile = buildSearchProfile(resume, {}, new Date('2026-10-14'))
assert.equal(profile.role, 'Frontend Developer')
assert.equal(profile.location, 'Bengaluru')
assert.equal(profile.datePosted, 'month')
assert.equal(profile.remote, false)
assert.ok(profile.skills.includes('React') && profile.skills.includes('TypeScript'))
assert.equal(profile.level, 'Junior')
assert.ok(!JSON.stringify(profile).includes('ada@example.com'))
assert.equal(buildSearchProfile(resume, { role: '  Data Analyst ', location: 'Pune', remote: true, datePosted: 'week' }).role, 'Data Analyst')
assert.equal(buildSearchProfile(resume, { datePosted: 'yesterday' }).datePosted, 'month')
assert.equal(roleFromResume({ experience: [{ role: 'QA Engineer' }] }), 'QA Engineer')
assert.equal(roleFromResume({}), 'Software Developer')
assert.equal(buildSearchProfile({ location: 'Remote' }).location, 'India')

// Platforms
assert.equal(platformOf('LinkedIn', 'https://www.linkedin.com/jobs/view/1'), 'linkedin')
assert.equal(platformOf('', 'https://www.naukri.com/job-listings-x-123456'), 'naukri')
assert.equal(platformOf('Foundit', 'https://foundit.in/x'), 'foundit')
assert.equal(platformOf('Acme Careers', 'https://careers.acme.com/1', { direct: true }), 'company')
assert.equal(platformOf('Jobrapido.com', 'https://in.jobrapido.com/1'), 'other')

// Scoring
assert.equal(titleFit('Frontend Developer', 'Senior Frontend Developer (React)'), 1)
assert.equal(titleFit('Frontend Developer', 'Backend Engineer'), 0)
assert.equal(experienceFit(2, 'Requires 2-4 years of experience'), 1)
assert.equal(experienceFit(0, 'Minimum 6+ years'), 0)
assert.equal(experienceFit(3, 'No experience mentioned'), .7)
const strong = scoreJob(profile, { title: 'Frontend Developer', description: 'Build UIs with React, TypeScript and CSS. 1-3 years.' })
const weak = scoreJob(profile, { title: 'Java Backend Engineer', description: 'Spring, Java, Kafka, Kubernetes. 6+ years.' })
assert.ok(strong.score >= 80, `strong match scored ${strong.score}`)
assert.ok(weak.score < 30, `weak match scored ${weak.score}`)
assert.ok(strong.matched.includes('React'))
assert.ok(weak.missing.includes('Java') && weak.missing.includes('Kubernetes'))

// JSearch postings: one apply link per board, the main link included, unsafe links dropped.
const raw = {
  job_id: 'abc==', job_title: 'Frontend Developer', employer_name: 'Acme', employer_logo: 'https://logo/acme.png', job_publisher: 'LinkedIn',
  job_apply_link: 'https://www.linkedin.com/jobs/view/1', job_apply_is_direct: false, job_city: 'Bengaluru', job_state: 'Karnataka',
  job_is_remote: false, job_employment_type: 'Full–time', job_posted_at_datetime_utc: '2026-10-12T00:00:00.000Z',
  job_description: 'React and TypeScript.', job_highlights: { Qualifications: ['2+ years of React'] },
  apply_options: [
    { publisher: 'LinkedIn', apply_link: 'https://www.linkedin.com/jobs/view/1', is_direct: false },
    { publisher: 'Naukri.com', apply_link: 'https://www.naukri.com/job-listings-frontend-acme-1234567', is_direct: false },
    { publisher: 'Acme', apply_link: 'https://careers.acme.com/1', is_direct: true },
    { publisher: 'Evil', apply_link: 'javascript:alert(1)' }
  ]
}
const job = normalizeJSearchJob(raw)
assert.deepEqual(job.applyOptions.map(option => option.platform), ['linkedin', 'naukri', 'company'])
assert.equal(job.location, 'Bengaluru, Karnataka')
assert.equal(job.type, 'Full-time')
assert.equal(job.qualifications, '2+ years of React')

// Posted pay in rupees is formatted; no pay means none.
assert.equal(job.pay, null)
const paid = normalizeJSearchJob({ ...raw, job_country: 'IN', job_min_salary: 600000, job_max_salary: 900000, job_salary_period: 'YEAR' })
assert.deepEqual(paid.pay, { min: 600000, max: 900000, period: 'YEAR' })
assert.equal(formatPay(paid.pay), '₹6–9 LPA')
assert.equal(formatPay({ min: 3775000, period: 'YEAR' }), '₹37.8 LPA')
assert.equal(formatPay({ min: 40000, max: 60000, period: 'MONTH' }), '₹40k–60k a month')
assert.equal(formatPay({}), '')

// Tavily: only single postings with a company; search pages ("4,422 openings") and profiles are dropped.
assert.deepEqual(postingFromSlug('https://www.naukri.com/job-listings-react-developer-athenahealth-bengaluru-2-to-4-years-180226034721', 'Bengaluru'), { title: 'React Developer', company: 'Athenahealth', location: 'Bengaluru', experience: '2–4 years' })
assert.deepEqual(postingFromTitle('Junior Full Stack Developer (Immediate Joiner) - Pune - IBN Technologies - 0 to 2 years of experience', 'naukri'), { title: 'Junior Full Stack Developer (Immediate Joiner)', location: 'Pune', company: 'IBN Technologies' })
assert.deepEqual(postingFromTitle('Full Stack Developer Job In Delhi At Charmai Technologies', 'internshala'), { title: 'Full Stack Developer', location: 'Delhi', company: 'Charmai Technologies' })
assert.equal(normalizeTavilyResult({ url: 'https://www.naukri.com/react-developer-jobs-in-bengaluru', title: 'React Developer Jobs In Bengaluru - 4422 React Developer Job Vacancies In Bengaluru - Naukri.com', content: 'x' }, 'naukri'), null)
const naukriPosting = normalizeTavilyResult({ url: 'https://www.naukri.com/job-listings-react-developer-athenahealth-bengaluru-2-to-4-years-180226034721', title: 'React Developer Jobs In Bengaluru - 4341 React Developer Job Vacancies In Bengaluru - Naukri.com', content: 'React, Redux' }, 'naukri', 'Bengaluru')
assert.equal(naukriPosting.company, 'Athenahealth')
assert.equal(naukriPosting.title, 'React Developer')
const posting = normalizeTavilyResult({ url: 'https://internshala.com/job/detail/react-developer-job-in-bangalore-at-acme1760000000', title: 'React Developer Job in Bangalore at Acme', content: 'React, Redux' }, 'internshala')
assert.deepEqual([posting.title, posting.company, posting.location], ['React Developer', 'Acme', 'Bangalore'])
assert.equal(normalizeTavilyResult({ url: 'https://internshala.com/job/detail/x-1760000000', title: 'Senior Developer Work From Home Job', content: '' }, 'internshala'), null, 'no company, no card')
assert.equal(normalizeTavilyResult({ url: 'http://insecure.example/jobs', title: 'x' }, 'indeed'), null)
assert.equal(normalizeTavilyResult({ url: 'https://internshala.com/job/detail/a-b-1760000000', title: 'A Job in Pune at B', content: 'OR OR As per my preferences Profile Location All Filters Senior Developer' }, 'internshala').snippet, 'Senior Developer')

// Salary per card: posted pay first, then the company's median, then the role's median in that city.
const salaries = { market: { median: 900000, period: 'YEAR', count: 1112, source: 'Glassdoor' }, companies: { acme: { median: 1500000, period: 'YEAR', source: 'Glassdoor' } } }
assert.equal(salaryFor(paid, salaries, profile).kind, 'posted')
assert.deepEqual(salaryFor(job, salaries, profile), { text: '₹15 LPA', kind: 'company', note: 'Typical pay for a Frontend Developer at Acme (Glassdoor median)' })
assert.equal(salaryFor({ ...job, company: 'Unknown Co' }, salaries, profile).text, '₹9 LPA')
assert.equal(salaryFor({ ...job, company: 'Unknown Co' }, {}, profile), null)

// Rows: one per board in order, a posting in every board it is listed on, best match first.
const rows = buildRows(profile, { jobs: [job, normalizeJSearchJob({ ...raw, job_id: 'weak', job_title: 'Java Engineer', job_description: 'Java Spring', apply_options: [] })], web: [naukriPosting, posting], salaries })
assert.deepEqual(rows.map(row => row.platform), ['linkedin', 'naukri', 'internshala', 'company'])
assert.equal(rows[0].jobs[0].title, 'Frontend Developer')
assert.ok(rows[0].jobs[0].score > rows[0].jobs[1].score)
assert.equal(rows[0].jobs[0].url, 'https://www.linkedin.com/jobs/view/1')
assert.equal(rows[0].jobs[0].salary.text, '₹15 LPA')
assert.deepEqual(rows[1].jobs.map(item => item.url), ['https://www.naukri.com/job-listings-frontend-acme-1234567', naukriPosting.url])
assert.equal(rows[2].jobs[0].score, null, 'web postings have no description to score')
assert.equal(rows[2].jobs[0].salary.kind, 'company', 'Acme has a company estimate')
assert.equal(rows[0].jobs[0].key, jobKeyOf('abc=='))
assert.ok(rows.every(row => !('browse' in row)))

// Sources over fake fetch: the right request, and errors become JobSourceError.
const calls = []
const fakeFetch = async (url, init) => {
  calls.push({ url: String(url), init })
  if (String(url).includes('tavily')) return new Response(JSON.stringify({ results: [{ url: posting.url, title: 'React Developer Job in Bangalore at Acme', content: 'React' }, { url: 'https://internshala.com/jobs/react-jobs', title: 'React Jobs: 77 Vacancies' }] }))
  if (String(url).includes('salary')) return new Response(JSON.stringify({ status: 'OK', data: [{ median_salary: String(url).includes('company=') ? 1500000 : 900000, salary_period: 'YEAR', salary_currency: 'INR', salary_count: 10, publisher_name: 'Glassdoor' }] }))
  return new Response(JSON.stringify({ status: 'OK', data: [raw] }))
}
const found = await searchJSearch({ query: 'Frontend Developer in Bengaluru', remote: true, pages: 2 }, { apiKey: 'k', url: 'https://jsearch.test/search', fetchImpl: fakeFetch })
assert.equal(found.length, 1)
assert.equal(calls[0].init.headers['x-api-key'], 'k')
assert.match(calls[0].url, /work_from_home=true/)
assert.match(calls[0].url, /country=in/)
const web = await searchTavily({ query: 'q', platform: 'internshala' }, { apiKey: 't', fetchImpl: fakeFetch })
assert.deepEqual(JSON.parse(calls[1].init.body).include_domains, ['internshala.com'])
assert.deepEqual(web.map(item => item.company), ['Acme'], 'the search page is dropped')
const estimate = await estimateSalary({ jobTitle: 'SDE', location: 'Bengaluru, India', company: 'Google' }, { apiKey: 'k', url: 'https://jsearch.test/jsearch/search', fetchImpl: fakeFetch })
assert.match(calls[2].url, /^https:\/\/jsearch\.test\/jsearch\/company-job-salary\?.*company=Google/)
assert.equal(estimate.median, 1500000)
assert.equal(await estimateSalary({ jobTitle: 'SDE', location: 'x' }, { apiKey: 'k', url: 'https://x/search', fetchImpl: async () => new Response(JSON.stringify({ data: [{ median_salary: 5, salary_currency: 'USD' }] })) }), null, 'only rupee estimates')
await assert.rejects(searchJSearch({ query: 'q' }, { apiKey: '', url: 'x' }), /not configured/)
await assert.rejects(searchJSearch({ query: 'q' }, { apiKey: 'k', url: 'https://x', fetchImpl: async () => new Response('{}', { status: 429 }) }), /answered 429/)

// Search: a general and a LinkedIn JSearch query (deduplicated), the web boards, salaries; cached per terms.
const db = createFakeFirestore()
let clock = Date.UTC(2026, 9, 14, 10)
const jobs = createJobStore({ getDb: () => db, now: () => clock })
const config = { jsearchKey: 'k', jsearchUrl: 'https://jsearch.test/search', tavilyKey: 't', cacheHours: 6 }
const search = createJobSearch({ store: jobs, config, fetchImpl: fakeFetch })
assert.equal(await search.lookup(profile), null)
calls.length = 0
const fresh = await search.fetchFresh(profile)
assert.equal(fresh.jobs.length, 1, 'the same posting from both JSearch queries is kept once')
assert.ok(calls.some(call => new URL(call.url).searchParams.get('query')?.endsWith('via LinkedIn')))
assert.equal(fresh.web.length, 1, 'each board keeps only its own posting addresses')
assert.equal(fresh.salaries.market.median, 900000)
assert.equal(fresh.salaries.companies.acme.median, 1500000)
assert.equal(fresh.failures.length, 0)
await new Promise(resolve => setTimeout(resolve, 10))
const salaryCalls = calls.filter(call => call.url.includes('salary')).length
await search.fetchFresh({ ...profile, datePosted: 'week' })
assert.equal(calls.filter(call => call.url.includes('salary')).length, salaryCalls, 'salary estimates come from their cache the second time')
assert.ok(await search.lookup(profile), 'cached after a complete search')
clock += 7 * 3600_000
assert.equal(await search.lookup(profile), null, 'cache expires')
assert.notEqual(cacheKeyOf(profile), cacheKeyOf({ ...profile, remote: true }))
const flaky = createJobSearch({ store: jobs, config, fetchImpl: async url => (String(url).includes('tavily') ? new Response('{}', { status: 500 }) : fakeFetch(url, {})) })
const partial = await flaky.fetchFresh({ ...profile, role: 'Partial role' })
assert.equal(partial.failures.length, 3)
await new Promise(resolve => setTimeout(resolve, 10))
assert.equal(await flaky.lookup({ ...profile, role: 'Partial role' }), null, 'partial results are not cached')
await assert.rejects(createJobSearch({ store: jobs, config, fetchImpl: async () => { throw new Error('down') } }).fetchFresh(profile), /could not be reached/)

// Saved jobs: only display fields are kept; saving again keeps progress.
assert.throws(() => validateSavedJob({ title: 'x', url: 'javascript:alert(1)' }), /title and a link/)
assert.equal(validateSavedJob({ title: 'x', url: 'https://a', logo: 'http://insecure/logo.png', extra: 'dropped' }).logo, '')

// Routes behind sign-in and requirePro.
db.seed('users/pro', { plan: { tier: 'pro', status: 'active', term: 'lifetime' } })
db.seed('users/free', { plan: { tier: 'free', status: 'active' } })
const resumes = createResumeStore({ getDb: () => db, timestamp: db.timestamp, checkpointMs: Infinity })
const RESUME = 'a1b2c3d4-e5f6-4789-8abc-def012345678'
await resumes.saveResume('pro', RESUME, { baseRevision: null, fields: { name: 'Main', templateId: 'onyx', data: resume, presentation: {} } })
const users = { getPlan: async uid => db.read(`users/${uid}`)?.plan ?? null }
const app = express()
app.use('/api/jobs', (request, _response, next) => { request.firebaseUser = { uid: request.get('x-uid') }; next() }, createRequirePro({ feature: 'jobTracker', users }), express.json(),
  createJobsRouter({ jobs, resumes, search: createJobSearch({ store: jobs, config, fetchImpl: fakeFetch }), perDay: 2, day: () => '2026-10-14' }))
const server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
const call = async (method, path, { uid = 'pro', body } = {}) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/jobs${path}`, { method, headers: { 'Content-Type': 'application/json', 'x-uid': uid }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, body: await response.json() }
}
try {
  const refused = await call('GET', '/latest', { uid: 'free' })
  assert.equal(refused.status, 403)
  assert.equal(refused.body.code, 'pro_required')

  assert.deepEqual((await call('GET', '/latest')).body, { ok: true, search: null, searchesLeft: 2, searchesPerDay: 2 })
  assert.equal((await call('POST', '/search', { body: { resumeId: 'nope' } })).status, 400)
  assert.equal((await call('POST', '/search', { body: { resumeId: '11111111-2222-4333-8444-555555555555' } })).status, 404)

  const first = await call('POST', '/search', { body: { resumeId: RESUME, role: 'React Developer', location: 'Pune' } })
  assert.equal(first.status, 200)
  assert.equal(first.body.searchesLeft, 1)
  assert.equal(first.body.search.profile.role, 'React Developer')
  assert.equal(first.body.search.resumeName, 'Main')
  assert.ok(first.body.search.rows.some(row => row.platform === 'linkedin'))
  await new Promise(resolve => setTimeout(resolve, 10))
  const repeat = await call('POST', '/search', { body: { resumeId: RESUME, role: 'React Developer', location: 'Pune' } })
  assert.equal(repeat.body.search.cached, true)
  assert.equal(repeat.body.searchesLeft, 1, 'cached searches are free')
  assert.equal((await call('POST', '/search', { body: { resumeId: RESUME, role: 'Designer' } })).body.searchesLeft, 0)
  const limited = await call('POST', '/search', { body: { resumeId: RESUME, role: 'Tester' } })
  assert.equal(limited.status, 429)
  assert.equal(limited.body.code, 'limit')
  assert.equal((await call('GET', '/latest')).body.search.profile.role, 'Designer', 'the last results are kept')

  const card = first.body.search.rows[0].jobs[0]
  const saved = await call('PUT', `/saved/${card.key}`, { body: { job: { ...card, resumeId: RESUME } } })
  assert.equal(saved.body.job.status, 'saved')
  await call('PATCH', `/saved/${card.key}`, { body: { status: 'applied', notes: 'Referred by Sam' } })
  await call('PUT', `/saved/${card.key}`, { body: { job: card } })
  const list = (await call('GET', '/saved')).body.jobs
  assert.equal(list.length, 1)
  assert.equal(list[0].status, 'applied', 'saving again keeps the status')
  assert.equal(list[0].notes, 'Referred by Sam')
  assert.equal((await call('PATCH', `/saved/${card.key}`, { body: { status: 'hired' } })).status, 400)
  assert.equal((await call('PATCH', `/saved/${'0'.repeat(24)}`, { body: { status: 'offer' } })).status, 404)
  assert.equal((await call('PUT', '/saved/not-a-key', { body: { job: card } })).status, 400)
  await call('DELETE', `/saved/${card.key}`)
  assert.deepEqual((await call('GET', '/saved')).body.jobs, [])
} finally {
  server.close()
}

console.log('✓ jobs tests passed')
