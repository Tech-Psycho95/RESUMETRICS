import assert from 'node:assert/strict'
import { scanGitHubEvidence } from '../server/github/githubScan.js'

const repos = Array.from({ length: 40 }, (_, index) => ({ name: `repo${index}`, full_name: `me/repo${index}`, html_url: `https://github.com/me/repo${index}`, pushed_at: `2025-${String((index % 12) + 1).padStart(2, '0')}-01T00:00:00Z`, private: false, topics: [] }))
let calls = 0
const fakeApi = {
  client: async () => ({}),
  listRepositories: async () => ({ repositories: repos, total: 40 }),
  languages: async (_o, _owner, repo) => { calls += 1; await new Promise(resolve => setTimeout(resolve, 5)); if (repo === 'repo3') throw Object.assign(new Error('boom'), { status: 500 }); return repo.endsWith('1') ? { Go: 100 } : { TypeScript: 900, CSS: 100 } },
  readme: async () => ({ path: 'README.md', content: 'Uses Docker and React' }),
  file: async (_o, _owner, _repo, path) => path === 'package.json' ? { path, content: JSON.stringify({ dependencies: { react: '18' } }) } : null
}
const resumeData = { skills: { languages: ['TypeScript', 'Go'], frameworks: ['React'], tools: ['Docker'], databases: [], softSkills: [], other: [] } }
const events = []
for await (const event of scanGitHubEvidence({ installationId: 1, resumeData, api: fakeApi, cap: 25, skipNarrative: true })) events.push(event)

assert.equal(events[0].type, 'start')
assert.equal(events[0].total, 25)
assert.equal(events[0].accessible, 40)
const repoEvents = events.filter(event => event.type === 'repo')
assert.equal(repoEvents.length, 24) // one of the 25 fails
assert.equal(events.filter(event => event.type === 'repo-error').length, 1)
assert.ok(repoEvents.every((event, index) => index === 0 || event.percent >= repoEvents[index - 1].percent), 'progress only goes up')
const result = events.at(-1)
assert.equal(result.type, 'result')
assert.equal(result.scanned, 24)
const evidence = Object.fromEntries(result.skills.map(skill => [skill.name, skill]))
assert.equal(evidence.TypeScript.status, 'strong')
assert.equal(evidence.Docker.status, 'mentioned')
assert.equal(evidence.React.source, 'manifest')
assert.ok(['weak', 'moderate'].includes(evidence.Go.status))

// Abort stops further GitHub calls.
calls = 0
const controller = new AbortController()
const seen = []
for await (const event of scanGitHubEvidence({ installationId: 1, resumeData, api: fakeApi, cap: 25, skipNarrative: true, signal: controller.signal })) {
  seen.push(event.type)
  if (seen.filter(type => type === 'repo').length === 2) controller.abort()
}
assert.ok(!seen.includes('result'))
assert.ok(calls < 25, `stopped early (${calls} language calls)`)
console.log('githubScan: all checks passed')
