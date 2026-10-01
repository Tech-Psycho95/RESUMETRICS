const asArray = value => Array.isArray(value) ? value : []

const clean = value => String(value ?? '').trim()

const unique = values => [...new Set(values.map(clean).filter(Boolean))]
const linkHref = value => {
  const url = clean(value)
  if (/^https?:\/\//i.test(url)) return url
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || !url) return undefined
  return `https://${url}`
}

// Links are shown by where they lead ("LinkedIn", "GitHub"), not as raw addresses.
const linkSites = [
  ['linkedin.', 'LinkedIn'], ['github.', 'GitHub'], ['gitlab.', 'GitLab'], ['bitbucket.', 'Bitbucket'], ['leetcode.', 'LeetCode'],
  ['hackerrank.', 'HackerRank'], ['codechef.', 'CodeChef'], ['codeforces.', 'Codeforces'], ['geeksforgeeks.', 'GeeksforGeeks'],
  ['kaggle.', 'Kaggle'], ['stackoverflow.', 'Stack Overflow'], ['medium.', 'Medium'], ['dev.to', 'DEV'], ['hashnode.', 'Hashnode'],
  ['behance.', 'Behance'], ['dribbble.', 'Dribbble'], ['figma.', 'Figma'], ['youtube.', 'YouTube'], ['youtu.be', 'YouTube'],
  ['twitter.', 'X (Twitter)'], ['x.com', 'X (Twitter)'], ['instagram.', 'Instagram'], ['scholar.google.', 'Google Scholar'],
  ['orcid.', 'ORCID'], ['researchgate.', 'ResearchGate'], ['credly.', 'Credly']
]
const hostingSuffixes = ['github.io', 'vercel.app', 'netlify.app', 'pages.dev', 'web.app', 'firebaseapp.com', 'onrender.com', 'herokuapp.com']
const looksLikeAddress = value => /^(https?:\/\/|www\.)|^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(clean(value))
const hostOf = value => clean(value).replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].toLowerCase()

// A label the person typed always wins; otherwise the destination's name, then its domain.
export function linkDisplayLabel(url, label = '') {
  if (clean(label) && !looksLikeAddress(label)) return clean(label)
  const host = hostOf(url)
  const isPersonalSite = hostingSuffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`))
  const site = isPersonalSite ? '' : linkSites.find(([pattern]) => host.includes(pattern))?.[1]
  return site || host || clean(url)
}

/**
 * Presentation-only adapter between Resumetrics' normalized resume data and a
 * template. It deliberately does not mutate the source object: parsing, AI
 * edits, persistence, and templates can therefore keep using the same schema.
 */
export function adaptResumeForTemplate(resumeData = {}) {
  const links = asArray(resumeData.links)
    .map((link, index) => typeof link === 'string'
      ? { index, label: link, url: link }
      : { index, label: clean(link?.label) || clean(link?.url), url: clean(link?.url) })
    .filter(link => link.label || link.url)

  const skillsByCategory = Object.entries(resumeData.skills ?? {})
    .map(([category, values]) => ({ category, values: unique(asArray(values)) }))
    .filter(group => group.values.length)

  return {
    ...resumeData,
    contactItems: [
      { path: 'email', value: clean(resumeData.email), kind: 'email' },
      { path: 'phone', value: clean(resumeData.phone), kind: 'phone' },
      { path: 'location', value: clean(resumeData.location), kind: 'location' },
      ...links.map(link => {
        const href = linkHref(link.url || (looksLikeAddress(link.label) ? link.label : ''))
        return href
          ? { path: `links.${link.index}.label`, value: linkDisplayLabel(link.url || link.label, link.label), kind: 'link', href, label: link.label, address: link.url }
          : { path: `links.${link.index}.label`, value: link.label, kind: 'text' }
      })
    ].filter(item => item.value),
    links,
    skillsByCategory,
    allSkills: unique(skillsByCategory.flatMap(group => group.values)),
    // These optional groups let a template render future normalized fields
    // without forcing the current parser or editor to add them.
    languages: unique(asArray(resumeData.languages)),
    customSections: asArray(resumeData.customSections).filter(section => section && typeof section === 'object')
  }
}
