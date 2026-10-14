// Words and pictures for the landing page. Every claim describes something the app really does; numbers come from the
// code (template registry, font catalogue, job boards, GitHub scan cap) so keep them in step when those change.

export const stats = [
  { value: 24, suffix: '', label: 'resume templates' },
  { value: 131, suffix: '', label: 'fonts' },
  { value: 8, suffix: '+', label: 'job boards searched' },
  { value: 25, suffix: '', label: 'repos read for proof' },
  { value: 0, suffix: '', label: 'invented facts' }
]

export const nimbusPowers = [
  ['Writes from your facts', 'Every edit is checked against your resume. If a new number, employer or date appears that you never gave, the change is refused.'],
  ['Knows what you selected', 'Click a bullet or a section and ask. NIMBUS works on exactly that part of the page.'],
  ['Shows its plan', 'Bigger requests are split into steps you can watch land on the page one by one.'],
  ['Asks when it is unsure', 'If a request could mean two things, NIMBUS offers choices or asks a short question instead of guessing.'],
  ['Words, not formatting', 'NIMBUS writes and rewrites content. Fonts, colours and spacing stay in your hands in the format panel.'],
  ['Also writes your letters', 'The same assistant drafts and tightens cover letters from your resume and the job post.']
]

export const nimbusPrompts = [
  { ask: 'Deepen my summary', reply: 'I rewrote your summary to open with the analytics dashboard used by 12,000 weekly users, then your 38% page-load win.' },
  { ask: 'Make the billing bullet stronger', reply: 'Changed it to lead with the result: “Cut payment errors by 61% by rewriting the billing service with typed APIs.”' },
  { ask: 'Add my hackathon win to achievements', reply: 'Added “Winner, Smart India Hackathon 2023 (software edition)” to Achievements, as you wrote it.' },
  { ask: 'Make my SQL experience 10 years', reply: 'I can’t add that: your resume shows SQL work from 2020 onwards. I can make your SQL experience stand out instead.' }
]

// Real screens from the app (scripts/landing-shots/capture.mjs), in the order someone meets them.
const shot = name => `/landing/shots/${name}.webp`
export const screens = [
  { id: 'dashboard', name: 'Dashboard', path: 'dashboard', src: shot('dashboard'), alt: 'The dashboard with resume progress and saved projects' },
  { id: 'start', name: 'Start a resume', path: 'workspace', src: shot('start'), alt: 'Options to upload a resume, start from scratch or import from LinkedIn' },
  { id: 'editor', name: 'Editor', path: 'workspace/editor', src: shot('editor'), alt: 'The editor with NIMBUS, the resume page and the format panel' },
  { id: 'nimbus-editor', name: 'NIMBUS', path: 'workspace/editor', src: shot('nimbus'), alt: 'NIMBUS after rewriting the summary on request' },
  { id: 'tailor', name: 'Job tailoring', path: 'workspace/tailor', src: shot('tailor'), alt: 'Job tailoring with a match score, missing keywords and the resume beside the job post' },
  { id: 'letter', name: 'Cover letters', path: 'workspace/letter', src: shot('letter'), alt: 'A cover letter written by NIMBUS in the resume design' },
  { id: 'evidence', name: 'Evidence check', path: 'workspace/evidence', src: shot('evidence'), alt: 'The GitHub evidence report with each skill beside its share of code' },
  { id: 'jobs', name: 'Job tracker', path: 'jobs', src: shot('jobs-matches'), alt: 'The job tracker with the best matches, salaries and locations' },
  { id: 'applications', name: 'Applications', path: 'jobs', src: shot('jobs-board'), alt: 'The applications board from saved to offer' },
  { id: 'templates-page', name: 'Templates', path: 'templates', src: shot('templates'), alt: 'The template gallery' }
]

export const advantages = ['Never invents facts', 'Proof from your code', 'One-click job fixes', 'Jobs that fit you', '24 real templates', 'Private by default', 'Priced in rupees', 'Nothing gets lost']

export const nav = [['NIMBUS', '#nimbus'], ['Inside the app', '#inside'], ['Templates', '#templates'], ['Why Resumetrics', '#why']]
