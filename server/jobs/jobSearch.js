// Job tracker search: resume → search terms → JSearch and Tavily in parallel → one row of postings per job board,
// each posting scored against the resume (shared/jobMatch.js) and given a salary: the posted pay, or else a Glassdoor
// median for that company, or for the role in that city. Raw results are cached per set of search terms, so the same
// search by anyone in the next few hours costs no API calls; scoring is always redone for the person asking.
import { env } from '../config/env.js'
import { PLATFORMS, formatPay, scoreJob } from '../../shared/jobMatch.js'
import { jobKeyOf, jobStore } from '../db/jobStore.js'
import { JobSourceError, TAVILY_SITES, estimateSalary, searchJSearch, searchTavily } from './sources.js'

export class JobSearchError extends Error {
  constructor(message) {
    super(message)
    this.name = 'JobSearchError'
  }
}

/** JSON round trip: Firestore refuses `undefined`. */
const plain = value => JSON.parse(JSON.stringify(value))
const SALARY_CACHE_MS = 30 * 24 * 3600_000
/** Company salary lookups per fresh search, for the best-matching companies without posted pay. */
export const COMPANY_SALARY_LOOKUPS = 6
export const MIN_COMPANY_SALARIES = 3
const companyKey = company => company.trim().toLowerCase()

export function searchQueries(profile) {
  const where = profile.remote ? 'remote' : `in ${profile.location}`
  // Google Jobs (behind JSearch) answers "via LinkedIn" with LinkedIn postings only, which fills the LinkedIn row.
  return { jsearch: `${profile.role} ${where}`, linkedin: `${profile.role} ${where} via LinkedIn`, web: `${profile.role} job ${where}` }
}

export function cacheKeyOf(profile) {
  const { jsearch } = searchQueries(profile)
  return jobKeyOf(JSON.stringify({ v: 2, query: jsearch.toLowerCase(), remote: profile.remote, datePosted: profile.datePosted }))
}

/** { text, kind: 'posted' | 'company' | 'market', note } for a card, or null when nothing is known. */
export function salaryFor(job, salaries = {}, profile) {
  if (job.pay) return { text: formatPay(job.pay), kind: 'posted', note: 'Pay listed in the posting' }
  if (job.payText) return { text: job.payText, kind: 'posted', note: 'Pay listed in the posting' }
  const company = job.company ? salaries.companies?.[companyKey(job.company)] : null
  if (company) return { text: formatPay({ min: company.median, period: company.period }), kind: 'company', note: `Typical pay for a ${profile.role} at ${job.company} (${company.source} median)` }
  const market = salaries.market
  if (market) return { text: formatPay({ min: market.median, period: market.period }), kind: 'market', note: `Typical pay for a ${profile.role} in ${profile.location} (${market.source} median${market.count ? ` of ${market.count.toLocaleString('en-IN')} salaries` : ''})` }
  return null
}

/**
 * Rows in PLATFORMS order, each { platform, name, jobs[] }. A posting listed on several boards appears in each of
 * their rows with that board's apply link. Postings found on the web have only a short snippet, so they get no score.
 */
export function buildRows(profile, { jobs = [], web = [], salaries = {} }) {
  const rows = new Map(PLATFORMS.map(platform => [platform.id, { platform: platform.id, name: platform.name, jobs: [] }]))
  for (const job of jobs) {
    const fit = scoreJob(profile, job)
    const card = {
      key: jobKeyOf(job.id), title: job.title, company: job.company, logo: job.logo, location: job.location, remote: job.remote, type: job.type, experience: '',
      postedAt: job.postedAt, salary: salaryFor(job, salaries, profile), snippet: job.description.slice(0, 220), score: fit.score, matched: fit.matched, missing: fit.missing, source: 'jsearch'
    }
    for (const option of job.applyOptions) rows.get(option.platform)?.jobs.push({ ...card, platform: option.platform, url: option.url })
  }
  for (const item of web) {
    rows.get(item.platform)?.jobs.push({
      key: jobKeyOf(item.url), title: item.title, company: item.company, logo: '', location: item.location, remote: /remote|work from home/i.test(item.location), type: '', experience: item.experience,
      postedAt: null, salary: salaryFor(item, salaries, profile), snippet: item.snippet.slice(0, 220), score: null,
      matched: profile.skills.filter(skill => item.snippet.toLowerCase().includes(skill.toLowerCase())).slice(0, 6), missing: [], source: 'web', platform: item.platform, url: item.url
    })
  }
  return [...rows.values()]
    .map(row => {
      const seen = new Set()
      const unique = row.jobs.filter(job => !seen.has(job.key) && seen.add(job.key))
      unique.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
      return { ...row, jobs: unique }
    })
    .filter(row => row.jobs.length)
}

export function createJobSearch({ store = jobStore, config = env.jobs, fetchImpl = fetch } = {}) {
  const cacheMs = config.cacheHours * 3600_000
  const jsearch = { apiKey: config.jsearchKey, url: config.jsearchUrl, fetchImpl }

  /** Cached raw results for these terms, or null. A cache that can't be read just means a fresh search. */
  async function lookup(profile) {
    try {
      return await store.getCached(cacheKeyOf(profile), cacheMs)
    } catch (error) {
      console.error('Job cache could not be read:', error?.message)
      return null
    }
  }

  /** One salary estimate through the salary cache; null when unknown. Never throws: pay is a nice-to-have. */
  async function cachedEstimate(request) {
    const key = jobKeyOf(JSON.stringify({ v: 1, ...request, company: request.company ? companyKey(request.company) : '' }))
    try {
      const cached = await store.getSalary(key, SALARY_CACHE_MS)
      if (cached !== undefined) return cached
    } catch (error) {
      console.error('Salary cache could not be read:', error?.message)
    }
    try {
      const estimate = await estimateSalary(request, jsearch)
      store.putSalary(key, estimate).catch(error => console.error('Salary cache could not be written:', error?.message))
      return estimate
    } catch (error) {
      console.error('Salary estimate failed:', error?.message)
      return null
    }
  }

  /** The market median for the role here, and medians for the best-matching companies that don't list pay. */
  async function estimateSalaries(profile, jobs, web) {
    const location = profile.remote ? 'India' : `${profile.location}, India`
    const ranked = [...jobs.filter(job => !job.pay && !job.payText).map(job => ({ company: job.company, score: scoreJob(profile, job).score })), ...web.map(item => ({ company: item.company, score: 0 }))]
      .filter(item => item.company)
      .sort((a, b) => b.score - a.score)
    const companies = [...new Map(ranked.map(item => [companyKey(item.company), item.company])).values()].slice(0, COMPANY_SALARY_LOOKUPS)
    const [market, ...byCompany] = await Promise.all([
      cachedEstimate({ jobTitle: profile.role, location }),
      ...companies.map(company => cachedEstimate({ jobTitle: profile.role, location, company }))
    ])
    // A company median from one or two salaries says little; those cards show the role's median in the city instead.
    return { market, companies: Object.fromEntries(companies.map((company, index) => [companyKey(company), byCompany[index]]).filter(([, estimate]) => estimate?.count >= MIN_COMPANY_SALARIES)) }
  }

  /** Calls every source; fails only when all of them fail. Complete results are cached. */
  async function fetchFresh(profile) {
    const queries = searchQueries(profile)
    const platforms = Object.keys(TAVILY_SITES)
    const options = { datePosted: profile.datePosted, remote: profile.remote }
    const settled = await Promise.allSettled([
      searchJSearch({ query: queries.jsearch, ...options, pages: 2 }, jsearch),
      searchJSearch({ query: queries.linkedin, ...options, pages: 1 }, jsearch),
      ...platforms.map(platform => searchTavily({ query: queries.web, platform, location: profile.location }, { apiKey: config.tavilyKey, fetchImpl }))
    ])
    const labels = ['LinkedIn, Glassdoor and other boards', 'LinkedIn', ...platforms.map(platform => TAVILY_SITES[platform])]
    const failures = []
    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') return
      console.error(`Job source ${labels[index]} failed:`, result.reason instanceof JobSourceError ? result.reason.message : result.reason?.message)
      if (!failures.includes(labels[index])) failures.push(labels[index])
    })
    if (failures.length && settled.every(result => result.status === 'rejected')) throw new JobSearchError('Job boards could not be reached right now. Please try again in a few minutes.')
    const value = index => (settled[index].status === 'fulfilled' ? settled[index].value : [])
    const jobs = [...new Map([...value(0), ...value(1)].map(job => [job.id, job])).values()]
    const web = settled.slice(2).flatMap((_, index) => value(index + 2))
    const raw = plain({ jobs, web, salaries: await estimateSalaries(profile, jobs, web), failures })
    if (!failures.length) store.putCached(cacheKeyOf(profile), raw).catch(error => console.error('Job cache could not be written:', error?.message))
    return raw
  }

  return { lookup, fetchFresh }
}

export const jobSearch = createJobSearch()
