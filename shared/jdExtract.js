// Instant job-post reading (PLAN-031): no network, works for any profession.
// Produces the same jd shape the AI parser did, so scoring and fixes are unchanged.
import { knownSkillsIn } from './roleAnalysis.js'
import { countTerm } from './jdKeywords.js'

const STOP = new Set(('a about above across after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each either etc ever every few for from further get gets given good great had has have having he her here hers him his how i if in into is it its itself just least less like make makes many may me might more most must my need needed needs new no nor not now of off on once one only or other our ours out over own part per plus please prefer preferred previous related relevant required requirements requirement responsibilities responsibility role same set shall she should so some such strong than that the their them then there these they this those through to too under until up upon us use used using very via was we well were what when where which while who whom why will with within without work working would year years yes you your yours ability able experience experienced knowledge skills skill team teams candidate candidates company job position opportunity including include includes ensure ensuring provide providing within based day days time full looking join apply benefits salary pay hours week weeks month months environment level levels high highly excellent proven demonstrated equivalent minimum plus bonus ideal ideally duties duty key core various other others well-being people person').split(' '))
const SOFT_SKILLS = ['communication', 'written communication', 'verbal communication', 'teamwork', 'collaboration', 'leadership', 'problem solving', 'problem-solving', 'critical thinking', 'time management', 'attention to detail', 'adaptability', 'flexibility', 'customer service', 'interpersonal skills', 'organisation', 'organization', 'organizational skills', 'multitasking', 'decision making', 'decision-making', 'creativity', 'empathy', 'mentoring', 'coaching', 'negotiation', 'conflict resolution', 'stakeholder management', 'presentation skills', 'self-motivated', 'reliability', 'work ethic', 'integrity', 'patience', 'professionalism', 'initiative', 'accountability', 'emotional intelligence', 'active listening']
const REQUIRED_LINE = /\b(must|required|requirements?|you have|you'll have|you will have|essential|mandatory|need to have|qualifications?|minimum|proficien|experience (with|in))\b/i
const NICE_LINE = /\b(nice to have|preferred|bonus|a plus|desirable|advantage|ideally)\b/i
const DUTY_LINE = /\b(responsibilit|you will|you'll|duties|what you('ll| will) do|day to day|role involves)\b/i

// Words that make a phrase a sentence fragment rather than a skill ("reporting and access", "build microservices").
const JOINERS = new Set(['and', 'or', 'with', 'the', 'a', 'an', 'to', 'for', 'in', 'on', 'at', 'by', 'from', 'our', 'your', 'their', 'as', 'is', 'are', 'be', 'will'])
const VERBS = new Set(['build', 'own', 'manage', 'monitor', 'respond', 'complete', 'create', 'develop', 'lead', 'maintain', 'support', 'work', 'help', 'provide', 'ensure', 'deliver', 'design', 'write', 'handle', 'perform', 'conduct', 'assist', 'prepare', 'review', 'patrol', 'join', 'keep', 'take', 'make', 'use', 'run', 'drive', 'report', 'track', 'plan', 'coordinate', 'communicate', 'collaborate', 'partner', 'oversee', 'implement', 'improve', 'operate', 'serve', 'greet', 'answer', 'process', 'record', 'follow', 'check'])
const HEADING = /^(requirements?|qualifications?|what you('ll| will) (do|need|bring)|what we('re| are) looking for|responsibilities|key responsibilities|duties|about you|skills|you have|nice to have|preferred|bonus|desirable)\b.*:?$|:$/i
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim()
const words = line => (line.toLowerCase().match(/[a-z][a-z0-9+#./-]*[a-z0-9+#]|[a-z]/g) ?? []).map(word => word.replace(/[./-]+$/, ''))

/** Lines of the post, with list markers removed. */
function linesOf(text) {
  return String(text ?? '').split(/\r?\n/).map(line => clean(line.replace(/^[\s•●▪◦*·\-–—>\d.)]+/, ''))).filter(Boolean)
}

/** Title and company from the opening lines ("Security Officer, Sentinel Protection" / "… at …" / "Company: …"). */
function titleAndCompany(lines) {
  const head = lines.slice(0, 6)
  const named = head.map(line => line.match(/^(?:job title|title|position|role)\s*[:\-–]\s*(.+)$/i)?.[1]).find(Boolean)
  const companyLine = lines.slice(0, 12).map(line => line.match(/^(?:company|employer|organi[sz]ation)\s*[:\-–]\s*(.+)$/i)?.[1]).find(Boolean)
  const first = clean(named || head.find(line => line.length <= 90 && !/[.!?]$/.test(line)) || head[0] || 'Role')
  const split = first.match(/^(.+?)\s+(?:at|@|[-–—|,])\s+(.+)$/i)
  const title = clean(split ? split[1] : first).slice(0, 80)
  const company = clean(companyLine || (split ? split[2] : '')).slice(0, 80)
  return { title, company }
}

/** 1–3 word phrases without stop words at either end. */
function phrasesIn(line) {
  // Phrases never cross punctuation: "React, Node.js, Docker" is three items, not one phrase.
  return String(line).split(/[,;:()|!?]|\.(?:\s|$)|\s[-–—]\s/).flatMap(phrasesInChunk)
}

function phrasesInChunk(chunk) {
  const tokens = words(chunk)
  const out = []
  for (let size = 3; size >= 1; size -= 1) {
    for (let index = 0; index + size <= tokens.length; index += 1) {
      const slice = tokens.slice(index, index + size)
      if (STOP.has(slice[0]) || STOP.has(slice.at(-1)) || slice.some(word => word.length < 2 || /^\d+$/.test(word))) continue
      if (slice.slice(1, -1).some(word => JOINERS.has(word)) || (size > 1 && VERBS.has(slice[0]))) continue
      if (size === 1 && slice[0].length < 4) continue
      out.push(slice.join(' '))
    }
  }
  return out
}

/**
 * jobText → { title, company, mustHave, niceToHave, keywords, softSkills, responsibilities }.
 * Hard skills come from the shared skill dictionary; requirement phrases come from repetition and from
 * requirement/duty lines, so posts for nurses, chefs or guards work as well as engineering posts.
 */
export function extractJd(jobText = '') {
  const text = String(jobText ?? '')
  const lines = linesOf(text)
  const { title, company } = titleAndCompany(lines)
  const lower = text.toLowerCase()
  const titleWords = new Set(words(title))

  // Hard skills from the dictionary, split by the kind of line they appear in.
  const softSet = new Set(SOFT_SKILLS)
  // Only skills the post actually names (the dictionary also infers, e.g. JavaScript from Node.js).
  const skills = knownSkillsIn(text).filter(skill => !softSet.has(skill.toLowerCase()) && countTerm(text, skill) > 0)
  const lineOf = skill => lines.filter(line => knownSkillsIn(line).includes(skill))
  const mustHave = []
  const niceToHave = []
  skills.forEach(skill => {
    const where = lineOf(skill)
    if (where.length && where.every(line => NICE_LINE.test(line))) niceToHave.push(skill)
    else mustHave.push(skill)
  })

  // Soft skills from a curated list.
  const softSkills = [...new Set(SOFT_SKILLS.filter(skill => new RegExp(`(^|[^a-z])${skill.replace(/[-/]/g, '[- ]?')}([^a-z]|$)`).test(lower)).map(skill => skill.replace('organisation', 'organization').replace('problem-solving', 'problem solving').replace('decision-making', 'decision making')))]

  // Each line inherits the kind of the heading above it ("Requirements:", "What you will do:", "Nice to have:").
  let section = null
  const kinds = lines.map(line => {
    if (HEADING.test(line) && line.length < 60 && (line.endsWith(':') || !line.includes(':'))) {
      section = NICE_LINE.test(line) ? 'nice' : REQUIRED_LINE.test(line) || /about you|you have|skills|looking for|need|bring/i.test(line) ? 'req' : DUTY_LINE.test(line) ? 'duty' : section
      return { heading: true, kind: section }
    }
    const own = NICE_LINE.test(line) ? 'nice' : REQUIRED_LINE.test(line) ? 'req' : DUTY_LINE.test(line) ? 'duty' : null
    return { heading: false, kind: own ?? section }
  })

  // Requirement phrases: count each phrase, boost those in requirement/duty lines, drop ones covered by skills.
  const scores = new Map()
  const lineCounts = new Map()
  const inRequirement = new Set()
  const inNice = new Set()
  lines.forEach((line, index) => {
    const { kind, heading } = kinds[index]
    if (heading) return
    const boost = kind === 'req' || kind === 'duty' || kind === 'nice' ? 1 : 0
    new Set(phrasesIn(line.replace(/^[^:]{0,40}:\s*/, ''))).forEach(phrase => {
      scores.set(phrase, (scores.get(phrase) ?? 0) + 1 + boost)
      lineCounts.set(phrase, (lineCounts.get(phrase) ?? 0) + 1)
      if (kind === 'req') inRequirement.add(phrase)
      if (kind === 'nice') inNice.add(phrase)
    })
  })
  const covered = new Set([...skills, ...softSkills].map(item => item.toLowerCase()))
  const candidates = [...scores.entries()]
    .filter(([phrase, score]) => score >= 2 && (phrase.includes(' ') || lineCounts.get(phrase) >= 2) && !VERBS.has(phrase) && !covered.has(phrase) && !phrase.split(' ').every(word => titleWords.has(word)) && ![...covered].some(item => item.includes(phrase) || countTerm(phrase, item) > 0))
    .sort((a, b) => b[1] - a[1] || b[0].split(' ').length - a[0].split(' ').length)
  // Prefer the longer phrase when a shorter one is inside it with a similar score.
  const keywords = []
  for (const [phrase, score] of candidates) {
    if (keywords.some(kept => kept.phrase.includes(phrase) && kept.score >= score - 1)) continue
    keywords.push({ phrase, score })
    if (keywords.length >= 14) break
  }
  const keyPhrases = keywords.filter(item => !inNice.has(item.phrase) && (inRequirement.has(item.phrase) || item.score >= 4)).map(item => item.phrase)
  const nicePhrases = keywords.filter(item => inNice.has(item.phrase) && !inRequirement.has(item.phrase)).map(item => item.phrase)

  return {
    title,
    company,
    mustHave: [...mustHave, ...keyPhrases.slice(0, 6)].slice(0, 15),
    niceToHave: [...niceToHave, ...nicePhrases].slice(0, 15),
    keywords: keywords.map(item => item.phrase).filter(phrase => !keyPhrases.slice(0, 6).includes(phrase) && !nicePhrases.includes(phrase)).slice(0, 12),
    softSkills: softSkills.slice(0, 8),
    responsibilities: lines.filter((line, index) => !kinds[index].heading && kinds[index].kind === 'duty' && line.length < 200).slice(0, 8),
    parsedBy: 'instant'
  }
}
