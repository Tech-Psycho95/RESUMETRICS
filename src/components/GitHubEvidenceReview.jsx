const chartColors = ['#5f4dd0', '#1f8c88', '#497dd5', '#bb7b2a', '#9d5db5', '#4f9b62', '#d45d6c', '#718096']

function GitHubMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.48.09.65-.2.65-.46v-1.68c-2.65.58-3.21-1.12-3.21-1.12-.44-1.1-1.07-1.4-1.07-1.4-.87-.59.07-.58.07-.58.96.07 1.46.99 1.46.99.86 1.46 2.25 1.04 2.8.8.09-.62.09-1.04.61-1.28-2.12-.24-4.35-1.06-4.35-4.7 0-1.04.37-1.9.98-2.57-.1-.24-.43-1.22.09-2.54 0 0 .8-.26 2.62.98A9.1 9.1 0 0 1 12 7.1c.8 0 1.6.11 2.35.34 1.82-1.24 2.62-.98 2.62-.98.52 1.32.19 2.3.09 2.54.61.67.98 1.53.98 2.57 0 3.65-2.23 4.46-4.36 4.7.35.3.65.87.65 1.76v2.6c0 .26.17.56.66.46A9.5 9.5 0 0 0 12 2.5Z" /></svg>
}

function VerificationMark() {
  return <span className="evidence-verified-mark" title="Verified by a repository language or project manifest" aria-label="Verified evidence"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4.5 10.4 3.2 3.1 7.8-7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
}

function SkillPieChart({ skills }) {
  const chartSkills = skills.filter(skill => skill.repositoryCount > 0).slice(0, 8)
  const totalSignals = chartSkills.reduce((total, skill) => total + skill.repositoryCount, 0)
  if (!chartSkills.length || !totalSignals) return <div className="github-pie-empty">No matching repository signals yet.</div>

  let progress = 0
  const stops = chartSkills.map((skill, index) => {
    const start = progress
    progress += (skill.repositoryCount / totalSignals) * 100
    return `${chartColors[index % chartColors.length]} ${start}% ${progress}%`
  })

  return <div className="github-skill-chart">
    <div className="github-pie" style={{ background: `conic-gradient(${stops.join(', ')})` }}><div><strong>{chartSkills.length}</strong><span>skills found</span></div></div>
    <div className="github-pie-legend">
      {chartSkills.map((skill, index) => <div key={skill.name}><i style={{ background: chartColors[index % chartColors.length] }} /><span>{skill.name}</span><b>{skill.presence}%</b></div>)}
    </div>
  </div>
}

function RepositoryList({ repositories }) {
  if (!repositories.length) return null
  return <div className="github-repository-list">
    {repositories.slice(0, 6).map(repository => <a href={repository.url} target="_blank" rel="noreferrer" key={repository.id}>
      <span><b>{repository.fullName}</b><small>{repository.primaryLanguage || 'Repository'} · {repository.inspectedFiles.length} evidence file{repository.inspectedFiles.length === 1 ? '' : 's'} inspected</small></span>
      <span aria-hidden="true">↗</span>
    </a>)}
  </div>
}

export default function GitHubEvidenceReview({ analysis, isLoading, error, resumeSkills, onRetry }) {
  if (!isLoading && !analysis && !error) return null

  return <section className={`panel section-panel github-evidence-review ${isLoading ? 'is-loading' : ''}`} aria-live="polite">
    <div className="github-evidence-heading">
      <span className="github-evidence-icon"><GitHubMark /></span>
      <div><span className="eyebrow">GITHUB EVIDENCE</span><h2>{isLoading ? 'Reviewing repository evidence…' : 'Skills supported by GitHub'}</h2></div>
      {!isLoading && analysis && <span className="github-evidence-count">{analysis.verifiedSkillCount} verified</span>}
    </div>

    {isLoading && <>
      <p className="muted">Extracting languages, project manifests, and README signals from your allowed repositories.</p>
      <div className="github-scan-steps"><span>Resume skills ready</span><span>Scanning repository signals</span><span>Comparing evidence</span></div>
      <div className="github-resume-skill-preview"><b>Resume skills being compared</b><div>{resumeSkills.length ? resumeSkills.slice(0, 12).map(skill => <span key={skill}>{skill}</span>) : <small>Preparing your extracted skills…</small>}</div></div>
    </>}

    {!isLoading && error && <div className="github-evidence-error"><p>{error}</p><button className="secondary-button" type="button" onClick={onRetry}>Try again</button></div>}

    {!isLoading && analysis && <>
      <p className="github-evidence-summary">{analysis.summary}</p>
      <p className="github-evidence-caption">{analysis.scannedRepositories} of {analysis.accessibleRepositoryCount} accessible repositories were scanned. A check means a matching language or project manifest was found; README-only mentions remain unverified.</p>
      <div className="github-evidence-layout">
        <div><h3>Skill presence</h3><SkillPieChart skills={analysis.skills} /></div>
        <div className="github-skill-list"><h3>Evidence comparison</h3>{analysis.skills.slice(0, 12).map(skill => <div className="github-skill-row" key={skill.name}>
          <div><span>{skill.name}</span>{skill.verified && <VerificationMark />}</div>
          <b>{skill.presence}%</b>
          <small>{skill.repositoryCount ? `${skill.repositoryCount} ${skill.repositoryCount === 1 ? 'repository' : 'repositories'} · ${skill.sourceTypes.join(', ')}` : 'No direct repository signal found'}</small>
        </div>)}</div>
      </div>
      {analysis.observations?.length > 0 && <ul className="github-evidence-observations">{analysis.observations.map(observation => <li key={observation}>{observation}</li>)}</ul>}
      <div className="github-repositories-heading"><h3>Repositories reviewed</h3><span>{analysis.githubSkills.length} GitHub skills detected</span></div>
      <RepositoryList repositories={analysis.repositories} />
      {analysis.analysisMethod !== 'ai' && <small className="analysis-note">Deterministic evidence comparison shown while the AI narrative service is unavailable.</small>}
    </>}
  </section>
}
