import { findFont } from '../editor/fontRegistry.js'
import { describeResumeElement } from '../editor/describeResumeElement.js'

const groupNames = { name: 'your name', headline: 'the headline', contact: 'contact details', headings: 'section headings', summary: 'the summary', 'job-titles': 'job titles', companies: 'company names', dates: 'dates', bullets: 'bullet points', skills: 'skills', 'education-degrees': 'degrees', 'project-names': 'project names' }
const targetName = target => String(target).startsWith('group:') ? groupNames[target.slice(6)] ?? target.slice(6) : describeResumeElement(target).label.toLowerCase()
const markNames = { b: 'Bold', i: 'Italic', u: 'Underline', s: 'Strikethrough' }
const sectionItem = (section, index) => `${section === 'experience' ? 'role' : section === 'projects' ? 'project' : 'education entry'} ${Number(index) + 1}`

function describeChanges(changes) {
  const parts = []
  if (changes.fontId) parts.push(`font ${findFont(changes.fontId)?.name ?? changes.fontId}`)
  if (changes.fontWeight) parts.push(changes.fontWeight >= 600 ? 'bold' : 'regular weight')
  if (changes.fontStyle) parts.push(changes.fontStyle)
  if (changes.textDecoration) parts.push(changes.textDecoration === 'none' ? 'no underline' : changes.textDecoration.replace('line-through', 'strikethrough'))
  if (changes.color) parts.push(`colour ${changes.color}`)
  if (changes.textAlign) parts.push(`${changes.textAlign} aligned`)
  if (changes.lineHeight) parts.push(`line height ${Math.round(changes.lineHeight * 100)}%`)
  if (changes.letterSpacing != null) parts.push(`letter spacing ${changes.letterSpacing}px`)
  return parts.join(', ')
}

/** One plain-language line per NIMBUS (or JD fix) operation, for the "changes" list. */
export function describeNimbusOperation(operation) {
  switch (operation.type) {
    case 'set_field': return `Rewrote ${operation.target === 'fullName' ? 'your name' : operation.target}`
    case 'clear_field': return `Cleared ${operation.target}`
    case 'set_item_field': return `Updated ${operation.field} for ${sectionItem(operation.section, operation.itemIndex)}`
    case 'replace_bullets': return `Rewrote bullets for ${sectionItem(operation.section, operation.itemIndex)}`
    case 'append_bullets': return `Added ${operation.values.length} bullet${operation.values.length === 1 ? '' : 's'} to ${sectionItem(operation.section, operation.itemIndex)}`
    case 'replace_details': case 'append_details': return `Updated details for ${sectionItem('education', operation.itemIndex)}`
    case 'append_skills': return `Added skills: ${operation.values.join(', ')}`
    case 'replace_skills': return `Reorganised ${operation.category} skills`
    case 'append_list': case 'replace_list': return `Updated ${operation.target}`
    case 'set_link': case 'append_link': case 'replace_links': return 'Updated links'
    case 'set_footer': case 'clear_footer': return 'Updated the footer'
    case 'apply_marks': return `${markNames[operation.mark]} “${operation.text}”`
    case 'set_element_style': return `Styled ${targetName(operation.target)}: ${describeChanges(operation.changes)}`
    case 'set_resume_style': return `Whole resume: ${[operation.fontId && `font ${findFont(operation.fontId)?.name ?? operation.fontId}`, operation.baseSize && `size ${operation.baseSize}px`, operation.textColor && `text ${operation.textColor}`, operation.lineHeight && `line height ${Math.round(operation.lineHeight * 100)}%`].filter(Boolean).join(', ')}`
    case 'set_accent': return `Accent colour ${operation.hex}`
    case 'reset_style': return operation.scope === 'all' ? 'Reset all formatting' : `Reset formatting on ${targetName(operation.target)}`
    case 'fit_one_page': return 'Fit on one page'
    default: return operation.type
  }
}
