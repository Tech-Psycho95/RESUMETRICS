import { formGroupLabel } from '../../shared/skillGroups.js'
const headerNames = { name: 'Name', headline: 'Headline', email: 'Email', phone: 'Phone', location: 'Location', photo: 'Profile photo' }
const sectionNames = { experience: 'Experience', projects: 'Projects', education: 'Education', summary: 'Summary', skills: 'Skills', languages: 'Languages', certifications: 'Certifications', achievements: 'Achievements' }
const fieldNames = {
  role: 'Job title', company: 'Company', location: 'Location', startDate: 'Start date', endDate: 'End date',
  name: 'Project name', description: 'Project description', techStack: 'Technologies',
  degree: 'Degree', institution: 'Institution'
}
const listNames = { bullets: 'bullet', details: 'detail' }

/** A readable name for any element id the templates render, for the format panel and NIMBUS. */
const letterNames = { role: 'Job title', date: 'Date', subject: 'Subject line', salutation: 'Greeting', signoff: 'Sign-off', signature: 'Signature', name: 'Your name' }
const recipientNames = { name: 'Recipient name', title: 'Recipient title', company: 'Company' }

export function describeResumeElement(id = '') {
  const parts = String(id).split('.')
  if (parts[0] === 'letter') {
    if (parts[1] === 'recipient') return { label: parts[2] === 'address' ? `Address line ${Number(parts[3]) + 1}` : recipientNames[parts[2]] ?? 'Recipient', kind: 'text' }
    if (parts[1] === 'paragraph') return { label: 'Paragraph', kind: 'text' }
    return { label: letterNames[parts[1]] ?? 'Letter text', kind: parts[1] === 'signature' ? 'image' : 'text' }
  }
  if (parts[0] === 'resume' && parts[1] === 'header') {
    if (parts[2] === 'link') return { label: `Link ${Number(parts[3]) + 1}`, kind: 'text' }
    return { label: headerNames[parts[2]] ?? 'Header', kind: parts[2] === 'photo' ? 'image' : 'text' }
  }
  if (parts[0] === 'section' && parts[2] === 'heading') return { label: `${sectionNames[parts[1]] ?? 'Section'} heading`, kind: 'heading' }
  if (parts[0] === 'skills') return { label: parts[1] ? `Skills · ${formGroupLabel(parts[1]).toLowerCase()}` : 'Skills', kind: 'text' }
  if (sectionNames[parts[0]] && parts.length === 1) return { label: sectionNames[parts[0]], kind: 'text' }
  if (['certifications', 'achievements'].includes(parts[0])) return { label: `${sectionNames[parts[0]].slice(0, -1)} ${Number(parts[1]) + 1}`, kind: 'text' }
  if (['experience', 'projects', 'education'].includes(parts[0])) {
    const section = sectionNames[parts[0]]
    if (listNames[parts[2]]) return { label: `${section} ${listNames[parts[2]]} ${Number(parts[3]) + 1}`, kind: 'text' }
    if (fieldNames[parts[2]]) return { label: `${section} · ${fieldNames[parts[2]]}`, kind: 'text' }
  }
  if (id === 'footerText') return { label: 'Footer', kind: 'text' }
  return { label: 'Selected text', kind: 'text' }
}
