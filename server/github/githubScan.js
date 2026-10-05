import { env } from '../config/env.js'
import { explicitResumeSkills, knownSkillsIn } from '../../shared/roleAnalysis.js'
import { languageTotals, skillEvidence } from '../../shared/githubEvidenceMath.js'
import { skillsFromManifest } from '../../shared/skillTaxonomy.js'
import { normalizeResumeData } from '../services/resumeData.js'
import { runStructuredTask } from '../ai/runTask.js'
import { getAllInstallationRepositoriesWithClient, getInstallationClient, getRepositoryFileWithClient, getRepositoryLanguagesWithClient, getRepositoryReadmeWithClient } from '../services/githubApp.js'

const MANIFESTS = ['package.json', 'requirements.txt', 'pyproject.toml', 'Pipfile', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.github/workflows/ci.yml', '.github/workflows/main.yml']
const MAX_README = 2_000
const CONCURRENCY = 4
const unique = values => [...new Map(values.filter(Boolean).map(value => [String(value).trim().toLowerCase(), String(value).trim()])).values()]

async function optional(call) {
  try { return await call() } catch (error) { if (error?.status === 404 || error?.status === 409) return null; throw error }
}

// GitHub's secondary rate limits answer 403/429 with retry-after; wait and try once more.
async function withBackoff(call, signal) {
  try { return await call() } catch (error) {
    if (![403, 429].includes(error?.status) || signal?.aborted) throw error
    const wait = Math.min(20, Number(error.response?.headers?.['retry-after']) || 5) * 1000
    await new Promise(resolve => setTimeout(resolve, wait))
    return call()
  }
}

function resumeSkillsOf(resumeData) {
  const direct = [...Object.values(resumeData.skills ?? {}).flat(), ...(resumeData.projects ?? []).flatMap(project => project.techStack ?? [])]
  return unique([...explicitResumeSkills(resumeData), ...direct].map(skill => String(skill).replace(/\[\/?[bius]\]/g, ''))).slice(0, 40)
}

const githubApi = {
  client: getInstallationClient,
  listRepositories: getAllInstallationRepositoriesWithClient,
  languages: getRepositoryLanguagesWithClient,
  readme: getRepositoryReadmeWithClient,
  file: getRepositoryFileWithClient
}

async function inspect(api, octokit, repository, signal) {
  const [owner, repo] = repository.full_name.split('/')
  const languages = await withBackoff(() => optional(() => api.languages(octokit, owner, repo)), signal) ?? {}
  if (signal?.aborted) return null
  const readme = await withBackoff(() => optional(() => api.readme(octokit, owner, repo)), signal)
  const manifests = (await Promise.all(MANIFESTS.map(path => withBackoff(() => optional(() => api.file(octokit, owner, repo, path)), signal)))).filter(Boolean)
  const manifestSkills = unique(manifests.flatMap(file => skillsFromManifest(file.path, String(file.content ?? '').slice(0, 20_000))))
  const readmeSkills = readme?.content ? knownSkillsIn(String(readme.content).slice(0, MAX_README)) : []
  return {
    name: repository.name,
    fullName: repository.full_name,
    url: repository.html_url,
    description: repository.description,
    pushedAt: repository.pushed_at,
    stars: repository.stargazers_count,
    fork: repository.fork,
    archived: repository.archived,
    private: repository.private,
    topics: repository.topics,
    languages,
    manifestSkills,
    readmeSkills,
    filesChecked: [readme?.path, ...manifests.map(file => file.path)].filter(Boolean)
  }
}

async function narrative({ scanned, accessible, languages, skills }) {
  const top = languages.slice(0, 4).map(entry => `${entry.name} ${entry.share}%`).join(', ')
  const weak = skills.filter(skill => skill.status === 'weak').map(skill => skill.name)
  const none = skills.filter(skill => skill.status === 'none' || skill.status === 'mentioned').map(skill => skill.name)
  const fallback = `Scanned your ${scanned} most recent of ${accessible} repositories. Most code is ${top || 'not classified'}. ${skills.length - weak.length - none.length} of ${skills.length} resume skills have evidence${weak.length ? `; ${weak.length} have too little (under 5%)` : ''}.`
  try {
    const { value } = await runStructuredTask({
      group: 'github',
      systemPrompt: 'You summarise GitHub evidence for a resume in two short factual sentences. Use ONLY the numbers given. Never claim employment, authorship quality or proficiency. Return {"summary":""}.',
      userPrompt: JSON.stringify({ repositoriesScanned: scanned, repositoriesAccessible: accessible, topLanguages: languages.slice(0, 6).map(entry => ({ name: entry.name, share: entry.share, repos: entry.repos })), strongOrModerate: skills.filter(skill => skill.status === 'strong' || skill.status === 'moderate').map(skill => `${skill.name} ${skill.share}%`), tooLittle: weak, noEvidence: none }),
      temperature: 0,
      maxCompletionTokens: 1024,
      validate: data => {
        const summary = String(data?.summary ?? '').trim()
        if (!summary || summary.length > 400) throw new Error('summary must be 1–2 short sentences.')
        return summary
      },
      fallback: () => fallback
    })
    return value
  } catch {
    return fallback
  }
}

/**
 * Streams a GitHub evidence scan: start → repo (one per repository, with running totals) → result.
 * Only the most recently pushed repositories (env cap, default 25) are scanned.
 */
export async function * scanGitHubEvidence({ installationId, resumeData, signal, api = githubApi, cap = env.githubScanCap, skipNarrative = false }) {
  const resume = normalizeResumeData(resumeData)
  const resumeSkills = resumeSkillsOf(resume)
  const octokit = await api.client(installationId)
  const { repositories, total } = await api.listRepositories(octokit)
  const queue = [...repositories].sort((a, b) => String(b.pushed_at ?? '').localeCompare(String(a.pushed_at ?? ''))).slice(0, cap)
  yield { type: 'start', total: queue.length, accessible: total, cap, resumeSkills }

  const scanned = []
  const pending = new Set()
  let next = 0
  const events = []
  let wake = null
  const launch = () => {
    while (pending.size < CONCURRENCY && next < queue.length && !signal?.aborted) {
      const repository = queue[next]
      next += 1
      const task = inspect(api, octokit, repository, signal)
        .then(result => { if (result) { scanned.push(result); events.push({ ok: true, result }) } })
        .catch(error => { events.push({ ok: false, name: repository.name, error: error?.status === 403 ? 'access denied or rate limited' : 'could not be read' }) })
        .finally(() => { pending.delete(task); wake?.() })
      pending.add(task)
    }
  }
  launch()
  while ((pending.size || events.length) && !signal?.aborted) {
    if (!events.length) await new Promise(resolve => { wake = resolve })
    wake = null
    while (events.length) {
      const event = events.shift()
      const done = scanned.length
      const totals = languageTotals(scanned)
      if (event.ok) yield { type: 'repo', done, total: queue.length, percent: Math.round(done / Math.max(queue.length, 1) * 100), repo: event.result, languages: totals.languages, totalBytes: totals.totalBytes }
      else yield { type: 'repo-error', name: event.name, message: event.error }
    }
    launch()
  }
  if (signal?.aborted) return

  const { totalBytes, languages } = languageTotals(scanned)
  const skills = skillEvidence(resumeSkills, scanned)
  yield {
    type: 'result',
    scanned: scanned.length,
    accessible: total,
    cap,
    totalBytes,
    languages,
    skills,
    repositories: [...scanned].sort((a, b) => String(b.pushedAt ?? '').localeCompare(String(a.pushedAt ?? ''))),
    summary: skipNarrative ? '' : await narrative({ scanned: scanned.length, accessible: total, languages, skills })
  }
}
