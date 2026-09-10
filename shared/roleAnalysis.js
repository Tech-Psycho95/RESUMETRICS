const skillDefinitions = [
  ['JavaScript', [/\bjavascript\b/i, /\bjs\b/i]], ['TypeScript', [/\btypescript\b/i, /\bts\b/i]], ['React', [/\breact(?:\.js)?\b/i]], ['Angular', [/\bangular\b/i]], ['Vue.js', [/\bvue(?:\.js)?\b/i]], ['Next.js', [/\bnext(?:\.js)?\b/i]], ['Node.js', [/\bnode(?:\.js)?\b/i]], ['Express.js', [/\bexpress(?:\.js)?\b/i]],
  ['HTML', [/\bhtml\b/i]], ['CSS', [/\bcss\b/i]], ['Tailwind CSS', [/\btailwind(?:\s+css)?\b/i]], ['Redux', [/\bredux\b/i]], ['Python', [/\bpython\b/i]], ['Java', [/\bjava\b/i]], ['C#', [/\bc#\b/i, /\bcsharp\b/i]], ['C++', [/\bc\+\+\b/i, /\bcplusplus\b/i]], ['Go', [/\bgolang\b/i, /\bgo\s+language\b/i]], ['PHP', [/\bphp\b/i]], ['Ruby', [/\bruby\b/i]], ['SQL', [/\bsql\b/i]], ['R', [/\b(?:r language|r programming)\b/i]],
  ['AWS', [/\baws\b/i, /\bamazon web services\b/i]], ['Azure', [/\bazure\b/i]], ['Google Cloud', [/\bgoogle cloud\b/i, /\bgcp\b/i]], ['Cloud platforms', [/\bcloud platforms?\b/i, /\bcloud computing\b/i]], ['Docker', [/\bdocker\b/i]], ['Kubernetes', [/\bkubernetes\b/i, /\bk8s\b/i]], ['Terraform', [/\bterraform\b/i]], ['Linux', [/\blinux\b/i]], ['Git', [/\bgit\b/i]], ['GitHub Actions', [/\bgithub actions\b/i]], ['CI/CD', [/\bci\/?cd\b/i, /\bcontinuous integration\b/i, /\bcontinuous delivery\b/i]], ['REST APIs', [/\brest(?:ful)?\s+apis?\b/i]], ['GraphQL', [/\bgraphql\b/i]], ['Microservices', [/\bmicroservices?\b/i]],
  ['PostgreSQL', [/\bpostgres(?:ql)?\b/i]], ['MySQL', [/\bmysql\b/i]], ['MongoDB', [/\bmongodb\b/i]], ['Redis', [/\bredis\b/i]], ['Firebase', [/\bfirebase\b/i]], ['Elasticsearch', [/\belasticsearch\b/i]], ['Jest', [/\bjest\b/i]], ['Cypress', [/\bcypress\b/i]], ['Playwright', [/\bplaywright\b/i]], ['Selenium', [/\bselenium\b/i]], ['Unit testing', [/\bunit tests?\b/i]], ['Automated testing', [/\bautomated testing\b/i, /\btest automation\b/i]], ['Testing', [/\btesting\b/i]],
  ['Figma', [/\bfigma\b/i]], ['UI/UX', [/\bui\/?ux\b/i, /\buser experience\b/i]], ['Accessibility', [/\baccessibility\b/i, /\ba11y\b/i]], ['Responsive design', [/\bresponsive design\b/i]], ['AI-assisted development', [/\bai-assisted development\b/i, /\bai coding tools?\b/i]], ['GitHub Copilot', [/\bgithub copilot\b/i]], ['Cursor', [/\bcursor\b/i]], ['Agile', [/\bagile\b/i]], ['Scrum', [/\bscrum\b/i]], ['Jira', [/\bjira\b/i]], ['Product management', [/\bproduct management\b/i]], ['Data analysis', [/\bdata analysis\b/i]], ['Excel', [/\bexcel\b/i]], ['Power BI', [/\bpower bi\b/i]], ['Tableau', [/\btableau\b/i]], ['Machine learning', [/\bmachine learning\b/i]], ['Data modeling', [/\bdata modell?ing\b/i]], ['ETL', [/\betl\b/i]], ['Pandas', [/\bpandas\b/i]], ['NumPy', [/\bnumpy\b/i]],
  ['Communication', [/\bcommunication\b/i]], ['Leadership', [/\bleadership\b/i]], ['Stakeholder management', [/\bstakeholder management\b/i]], ['Problem solving', [/\bproblem solving\b/i]], ['Teamwork', [/\bteamwork\b/i, /\bcollaboration\b/i]]
]

const unique = values => [...new Map(values.filter(Boolean).map(value => [value.toLocaleLowerCase(), value])).values()]
const relatedResumeEvidence = {
  'cloud platforms': ['aws', 'azure', 'google cloud'],
  'automated testing': ['jest', 'cypress', 'playwright', 'selenium', 'unit testing', 'testing'],
  testing: ['jest', 'cypress', 'playwright', 'selenium', 'unit testing', 'automated testing'],
  'ci/cd': ['github actions'],
  'ai-assisted development': ['github copilot', 'cursor']
}

function knownSkillsIn(text) {
  const source = String(text || '')
  const matched = skillDefinitions.filter(([, patterns]) => patterns.some(pattern => pattern.test(source))).map(([label]) => label)
  const matchedKeys = new Set(matched.map(skill => skill.toLocaleLowerCase()))
  return matched.filter(skill => !(skill === 'Testing' && (matchedKeys.has('automated testing') || matchedKeys.has('unit testing'))))
}

function explicitResumeSkills(resumeData) {
  const skills = Object.values(resumeData?.skills || {}).flat()
  const projectTech = (resumeData?.projects || []).flatMap(project => project?.techStack || [])
  const certificates = resumeData?.certifications || []
  const explicitValues = [...skills, ...projectTech, ...certificates].filter(value => typeof value === 'string')
  const recognized = explicitValues.flatMap(knownSkillsIn)
  const unrecognized = explicitValues
    .map(value => value.trim())
    .filter(value => value && value.length <= 42 && !/^(skills?|tools?|technologies)$/i.test(value))

  return unique([...recognized, ...unrecognized])
}

/**
 * Compare only the skills deliberately extracted from the resume with concrete,
 * recognized requirements stated in the job description. This gives the UI a
 * useful, explainable result even while a provider request is unavailable.
 */
export function buildSkillAwareRoleAnalysis(resumeData, jobDescription) {
  const comparedResumeSkills = explicitResumeSkills(resumeData)
  const comparedJobSkills = unique(knownSkillsIn(jobDescription))
  const resumeKeys = new Set(comparedResumeSkills.map(skill => skill.toLocaleLowerCase()))
  const hasResumeMatch = skill => {
    const key = skill.toLocaleLowerCase()
    return resumeKeys.has(key) || relatedResumeEvidence[key]?.some(related => resumeKeys.has(related))
  }
  const matchedSkills = comparedJobSkills.filter(hasResumeMatch)
  const missingSkills = comparedJobSkills.filter(skill => !hasResumeMatch(skill))
  const score = comparedJobSkills.length ? Math.round((matchedSkills.length / comparedJobSkills.length) * 100) : 0

  let summary
  if (!comparedResumeSkills.length) summary = 'No extracted resume skills were available for a reliable comparison.'
  else if (!comparedJobSkills.length) summary = 'Add concrete technologies or competencies to the job description for a skills-based match.'
  else if (!missingSkills.length) summary = `All ${matchedSkills.length} identified job requirements are reflected in the extracted resume skills.`
  else summary = `${matchedSkills.length} of ${comparedJobSkills.length} identified job requirements are reflected in the extracted resume skills.`

  return {
    score,
    summary,
    strengths: matchedSkills,
    missingSkills,
    recommendations: missingSkills.length ? ['Add evidence only for requirements you genuinely have experience with.'] : [],
    comparedResumeSkills,
    comparedJobSkills,
    matchedSkills
  }
}
