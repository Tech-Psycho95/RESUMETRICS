// Which fields each form section asks for, which are mandatory, and how complete a section is.
// Pure functions: the form, the section cards and the "continue to editor" check all use them.

const text = value => String(value ?? '').trim()
const list = value => Array.isArray(value) ? value : []
const filledList = value => list(value).map(text).filter(Boolean)
const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text(value))
const isUrl = value => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(text(value))

export const SUMMARY_MIN = 40

/** True when an experience, education or project entry has nothing typed into it. */
export const isBlankEntry = item => !Object.entries(item ?? {}).some(([key, value]) => key !== 'id' && (Array.isArray(value) ? value.some(entry => text(entry)) : text(value)))
export const SKILLS_MIN = 3

export const sectionInfo = {
  personal: { title: 'Personal information', hint: 'Name and how employers reach you', required: true },
  summary: { title: 'Summary', hint: 'Two or three sentences about you', required: true },
  experience: { title: 'Work experience', hint: 'Jobs and internships, newest first', required: false },
  education: { title: 'Education', hint: 'Degrees and qualifications', required: true },
  projects: { title: 'Projects', hint: 'Work that shows what you can do', required: false },
  skills: { title: 'Skills', hint: `At least ${SKILLS_MIN} skills`, required: true },
  languages: { title: 'Languages', hint: 'Languages you speak', required: false },
  certifications: { title: 'Certifications', hint: 'Courses and certificates', required: false },
  achievements: { title: 'Achievements', hint: 'Awards and recognition', required: false },
  customSections: { title: 'Additional sections', hint: 'Volunteering, licences, publications, interests…', required: false }
}

/** The sections the form shows, in the order the template prints them, with personal information first. */
export function formSectionsFor(templatePlan) {
  const ids = (templatePlan?.sections ?? []).map(section => section.id).filter(id => sectionInfo[id])
  const ordered = ['personal', ...ids, ...Object.keys(sectionInfo).filter(id => id !== 'personal' && !ids.includes(id))]
  return ordered.map(id => ({ id, ...sectionInfo[id], placement: templatePlan?.sections?.find(section => section.id === id)?.placement ?? 'main' }))
}

// Each check: { path, label, required, filled, valid, message }
function check(path, label, value, { required = false, validate, message } = {}) {
  const filled = Array.isArray(value) ? value.length > 0 : Boolean(text(value))
  const valid = !filled ? !required : validate ? validate(value) : true
  return { path, label, required, filled, valid, message: !filled && required ? 'Required' : !valid ? message : '' }
}

function entryChecks(sectionId, item, index) {
  const at = field => `${sectionId}.${index}.${field}`
  if (sectionId === 'experience') {
    const name = `Position ${index + 1}`
    return [
      check(at('role'), `${name} · Job title`, item?.role, { required: true }),
      check(at('company'), `${name} · Company`, item?.company, { required: true }),
      check(at('startDate'), `${name} · Start date`, item?.startDate, { required: true }),
      check(at('endDate'), `${name} · End date`, item?.endDate, { required: true }),
      check(at('bullets'), `${name} · At least one achievement`, filledList(item?.bullets), { required: true }),
      check(at('location'), `${name} · Location`, item?.location)
    ]
  }
  if (sectionId === 'education') {
    const name = `Education ${index + 1}`
    return [
      check(at('degree'), `${name} · Degree`, item?.degree, { required: true }),
      check(at('institution'), `${name} · Institution`, item?.institution, { required: true }),
      check(at('endDate'), `${name} · End year`, item?.endDate, { required: true }),
      check(at('startDate'), `${name} · Start year`, item?.startDate),
      check(at('location'), `${name} · Location`, item?.location),
      check(at('details'), `${name} · Details`, filledList(item?.details))
    ]
  }
  if (sectionId === 'projects') {
    const name = `Project ${index + 1}`
    return [
      check(at('name'), `${name} · Name`, item?.name, { required: true }),
      check(at('description'), `${name} · Description`, item?.description, { required: true }),
      check(at('techStack'), `${name} · Technologies`, filledList(item?.techStack)),
      check(at('bullets'), `${name} · Results`, filledList(item?.bullets))
    ]
  }
  return []
}

export function sectionChecks(sectionId, data = {}, { supportsPhoto = false, hasPhoto = false } = {}) {
  if (sectionId === 'personal') return [
    check('fullName', 'Full name', data.fullName, { required: true }),
    check('email', 'Email', data.email, { required: true, validate: isEmail, message: 'Enter a valid email address' }),
    check('phone', 'Phone', data.phone, { required: true, validate: value => text(value).replace(/\D/g, '').length >= 7, message: 'Enter a valid phone number' }),
    check('headline', 'Professional headline', data.headline),
    check('location', 'Location', data.location),
    check('links', 'Links', list(data.links).filter(link => text(link?.url ?? link)), { validate: links => links.every(link => isUrl(link?.url ?? link)), message: 'Check that every link is a valid web address' }),
    ...(supportsPhoto ? [check('photo', 'Photo', hasPhoto ? 'yes' : '')] : [])
  ]
  if (sectionId === 'summary') return [
    check('summary', 'Summary', data.summary, { required: true, validate: value => text(value).length >= SUMMARY_MIN, message: `Write at least ${SUMMARY_MIN} characters` })
  ]
  if (sectionId === 'skills') {
    const skills = Object.values(data.skills ?? {}).flat().map(text).filter(Boolean)
    const result = check('skills', `At least ${SKILLS_MIN} skills`, skills, { required: true, validate: value => value.length >= SKILLS_MIN, message: `Add at least ${SKILLS_MIN} skills (${skills.length} so far)` })
    return [result.filled ? result : { ...result, message: `Add at least ${SKILLS_MIN} skills, in any group` }]
  }
  if (sectionId === 'customSections') {
    // A section counts once anything is typed into it; then it needs both a title and some text.
    return list(data.customSections).map((item, index) => ({ item, index })).filter(({ item }) => text(item?.title) || text(item?.content)).flatMap(({ item, index }) => [
      check(`customSections.${index}.title`, `Section ${index + 1} · Title`, item?.title, { required: true }),
      check(`customSections.${index}.content`, `Section ${index + 1} · Text`, item?.content, { required: true })
    ])
  }
  if (['languages', 'certifications', 'achievements'].includes(sectionId)) {
    return filledList(data[sectionId]).length ? [check(sectionId, sectionInfo[sectionId].title, filledList(data[sectionId]))] : []
  }
  // Entries the user added but left completely blank are ignored (and dropped when the section is skipped).
  const items = list(data[sectionId]).filter(item => !isBlankEntry(item))
  // A required multi-entry section needs at least one entry.
  if (!items.length) return sectionInfo[sectionId]?.required ? [check(`${sectionId}.0`, `At least one ${sectionId === 'education' ? 'education entry' : 'entry'}`, '', { required: true })] : []
  return items.flatMap((item, index) => entryChecks(sectionId, item, index))
}

/**
 * percent  — share of tracked fields that are filled (0–100)
 * valid    — every mandatory field is filled and every filled field is valid
 * missing  — mandatory or invalid fields still to fix, with their paths for highlighting
 * empty    — nothing entered yet (optional sections show "Optional" instead of 0%)
 */
export function sectionProgress(sectionId, data, options) {
  const checks = sectionChecks(sectionId, data, options)
  const filled = checks.filter(item => item.filled).length
  let percent = checks.length ? Math.round(filled / checks.length * 100) : 0
  if (sectionId === 'skills') {
    const count = checks[0]?.filled ? Object.values(data?.skills ?? {}).flat().map(text).filter(Boolean).length : 0
    percent = Math.round(Math.min(count, SKILLS_MIN) / SKILLS_MIN * 100)
  }
  if (sectionId === 'summary' && checks[0]?.filled) percent = Math.round(Math.min(text(data.summary).length, SUMMARY_MIN) / SUMMARY_MIN * 100)
  const missing = checks.filter(item => !item.valid)
  return { percent, valid: missing.length === 0, missing, empty: filled === 0, required: Boolean(sectionInfo[sectionId]?.required) }
}

/** Sections that stop the user moving on to the editor. */
export function blockingSections(sections, data, options) {
  return sections.map(section => ({ ...section, progress: sectionProgress(section.id, data, options) })).filter(section => !section.progress.valid)
}

/** Whether the user has typed anything at all, so leaving can ask before throwing it away. */
export function hasStartedForm(sections, data, options) {
  return sections.some(section => !sectionProgress(section.id, data, options).empty)
}

/** Red at 0%, amber in the middle, green at 100%. */
export const percentColour = percent => `hsl(${Math.round(Math.max(0, Math.min(100, percent)) * 1.2)}, 72%, 40%)`
