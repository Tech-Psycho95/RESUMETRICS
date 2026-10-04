import { useMemo, useState } from 'react'
import LanguageDonut, { OTHER_KEY, useStableLanguageColours } from '../charts/LanguageDonut.jsx'
import { languageTotals, skillEvidence } from '../../../shared/githubEvidenceMath.js'

const statusText = { strong: 'Strong', moderate: 'Some', weak: 'Too little', mentioned: 'README only', none: 'None' }
const relativeDate = value => {
  if (!value) return ''
  const days = Math.round((Date.now() - new Date(value).getTime()) / 86_400_000)
  if (days < 1) return 'today'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

/** GitHub evidence: progress, code by language, resume skills by share of code, repositories. */
export default function GitHubEvidencePanel({ scan, onCancel, onScan, connected, onConnect, connecting }) {
  const [activeLanguage, setActiveLanguage] = useState(null)
  const repos = scan?.repos ?? []
  const { totalBytes, languages } = useMemo(() => languageTotals(repos), [repos])
  const skills = useMemo(() => skillEvidence(scan?.resumeSkills ?? [], repos), [repos, scan?.resumeSkills])
  const colours = useStableLanguageColours(languages)
  const shownRepos = activeLanguage ? repos.filter(repo => Object.keys(repo.languages ?? {}).some(name => activeLanguage === OTHER_KEY ? !colours.top.includes(name) : name === activeLanguage)) : repos

  if (!connected) return <div className="ev-empty"><p>Connect GitHub to see which languages your repositories actually use.</p><button type="button" className="btn btn-primary" onClick={onConnect} disabled={connecting}>{connecting ? 'Connecting…' : 'Connect GitHub'}</button></div>
  if (!scan) return <div className="ev-empty"><p>We'll scan your 25 most recently updated repositories.</p><button type="button" className="btn btn-primary" onClick={onScan}>Scan repositories</button></div>

  const scanning = scan.status === 'scanning'
  return <div className="gh">
    <div className="gh-progress">
      <div className="gh-progress-text" aria-live="polite">
        <span>{scanning ? `Scanning ${scan.done} of ${scan.total || 25} repositories` : scan.status === 'cancelled' ? `Stopped at ${scan.done} of ${scan.total} (partial)` : `${scan.done} repositories scanned`}</span>
        {scanning ? <button type="button" className="btn btn-link" onClick={onCancel}>Stop</button> : <button type="button" className="btn btn-link" onClick={onScan}>Scan again</button>}
      </div>
      <div className="gh-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={scan.percent} aria-label="Scan progress"><span style={{ width: `${scan.percent}%` }} /></div>
    </div>
    {scan.error && <p className="ev-error" role="alert">{scan.error}</p>}

    <div className="gh-grid">
      <section className="gh-card">
        <h3>Code by language</h3>
        <div className="gh-donut-row">
          <LanguageDonut languages={languages} totalBytes={totalBytes} repoCount={repos.length} colours={colours} active={activeLanguage} onSelect={setActiveLanguage} size={180} />
          <table className="gh-lang-table">
            <tbody>{languages.slice(0, 8).map(entry => <tr key={entry.name}>
              <th scope="row"><button type="button" onClick={() => setActiveLanguage(current => current === entry.name ? null : entry.name)} aria-pressed={activeLanguage === entry.name}><i style={{ background: colours.colourOf(entry.name) }} />{entry.name}</button></th>
              <td>{entry.share}%</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="gh-card">
        <h3>Your skills in your code</h3>
        {skills.length ? <ul className="gh-skills">{skills.map(skill => <li key={skill.name} className={`is-${skill.status}`}>
          <span className="gh-skill-name">{skill.name}</span>
          <span className="gh-skill-track"><span style={{ width: `${Math.min(100, skill.share)}%` }} /></span>
          <span className="gh-skill-value">{skill.share ? `${skill.share}%` : '—'}</span>
          <span className="gh-skill-status">{statusText[skill.status]}</span>
        </li>)}</ul> : <p className="ev-muted">Add skills to your resume to compare them.</p>}
        <p className="ev-muted">Under 5% of your code counts as too little evidence.</p>
      </section>
    </div>

    <section className="gh-card">
      <h3>Repositories{activeLanguage && <button type="button" className="btn btn-link" onClick={() => setActiveLanguage(null)}>{activeLanguage === OTHER_KEY ? 'Other' : activeLanguage} ×</button>}</h3>
      <ul className="gh-repos">{shownRepos.map(repo => {
        const total = Object.values(repo.languages ?? {}).reduce((sum, bytes) => sum + bytes, 0)
        return <li key={repo.fullName ?? repo.name}>
          <a href={repo.url} target="_blank" rel="noreferrer">{repo.name}</a>
          <span className="gh-repo-bar" aria-hidden="true">{Object.entries(repo.languages ?? {}).sort((a, b) => b[1] - a[1]).map(([name, bytes]) => <span key={name} style={{ width: `${bytes / (total || 1) * 100}%`, background: colours.colourOf(name) }} title={`${name} ${Math.round(bytes / (total || 1) * 100)}%`} />)}</span>
          <span className="gh-repo-date">{relativeDate(repo.pushedAt)}</span>
        </li>
      })}</ul>
      {!shownRepos.length && <p className="ev-muted">{scanning ? 'Repositories appear as they are scanned…' : 'No repositories.'}</p>}
    </section>
  </div>
}
