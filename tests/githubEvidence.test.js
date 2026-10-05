import assert from 'node:assert/strict'
import { evidenceStatus, languageTotals, skillEvidence } from '../shared/githubEvidenceMath.js'
import { skillsFromManifest } from '../shared/skillTaxonomy.js'

const repos = [
  { name: 'shop', languages: { TypeScript: 600, CSS: 100, HTML: 100 }, manifestSkills: ['React', 'Node.js', 'Jest'], readmeSkills: ['Docker'] },
  { name: 'ml', languages: { Python: 250, 'Jupyter Notebook': 0 }, manifestSkills: ['Pandas'], readmeSkills: [] },
  { name: 'tiny', languages: { Go: 40 }, manifestSkills: [], readmeSkills: [] }
]
const totals = languageTotals(repos)
assert.equal(totals.totalBytes, 1090)
assert.deepEqual(totals.languages.map(entry => [entry.name, entry.share, entry.repos]).slice(0, 3), [['TypeScript', 55, 1], ['Python', 22.9, 1], ['CSS', 9.2, 1]])
// Excluding markup changes the denominator.
assert.equal(languageTotals(repos, { excludeMarkup: true }).languages[0].share, 67.4)

const evidence = Object.fromEntries(skillEvidence(['TS', 'Python', 'React', 'Go', 'Docker', 'Rust', 'Pandas'], repos).map(item => [item.name, item]))
assert.equal(evidence.TS.status, 'strong') // 55%
assert.equal(evidence.React.share, 73.4) // bytes of repos using React / all bytes
assert.equal(evidence.Go.share, 3.7)
assert.equal(evidence.Go.status, 'weak') // < 5% flagged
assert.equal(evidence.Docker.status, 'mentioned') // README only
assert.equal(evidence.Rust.status, 'none')
assert.equal(evidence.Pandas.source, 'manifest')
// Exactly 5% is not flagged; 4.9% is.
assert.equal(evidenceStatus(5, true, false), 'moderate')
assert.equal(evidenceStatus(4.9, true, false), 'weak')

// Manifest parsing.
assert.deepEqual(skillsFromManifest('package.json', JSON.stringify({ dependencies: { react: '18', express: '4' }, devDependencies: { jest: '29' } })).sort(), ['Express.js', 'Jest', 'Node.js', 'React'])
assert.deepEqual(skillsFromManifest('requirements.txt', 'Django==4.2\nnumpy>=1.2\n# comment\npsycopg2-binary').sort(), ['Django', 'NumPy', 'PostgreSQL'])
assert.deepEqual(skillsFromManifest('docker-compose.yml', 'services:\n  db:\n    image: postgres:16').sort(), ['Docker', 'PostgreSQL'])
// Overall code-evidence score.
{
  const { evidenceScore } = await import('../shared/githubEvidenceMath.js')
  const result = evidenceScore([{ status: 'strong' }, { status: 'moderate' }, { status: 'weak' }, { status: 'none' }])
  assert.equal(result.score, 50)
  assert.equal(result.backed, 2)
  assert.deepEqual(result.counts, { strong: 1, moderate: 1, weak: 1, mentioned: 0, none: 1 })
  assert.equal(evidenceScore([]).score, 0)
}
console.log('githubEvidence: all checks passed')
