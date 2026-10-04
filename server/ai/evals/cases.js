// Golden cases. Each expectation is checked automatically by run.mjs.
// NIMBUS: mode, operation types that must appear, operation targets, and things that must NOT happen.
export const nimbusCases = [
  { id: 'deepen-summary', instruction: 'Deepen my summary', expect: { mode: 'edit', ops: ['set_field'], noNewNumbers: true } },
  { id: 'change-name', instruction: 'Change my name to Jordan A. Lee', expect: { mode: 'edit', ops: ['set_field'], mustContain: 'Jordan A. Lee' } },
  { id: 'add-achievement', instruction: 'Add "Winner, State Hackathon 2024" to my achievements', expect: { mode: 'edit', ops: ['append_list'], mustContain: '2024' } },
  { id: 'add-education', instruction: 'Add B.Sc. Mathematics from City College, 2018 to 2021, to my education', expect: { mode: ['question', 'edit', 'refuse'] } },
  { id: 'verb-fix', instruction: 'Start the teaching assistant bullets with strong action verbs', expect: { mode: 'edit', ops: ['replace_bullets'], keepNumbers: ['60'] } },
  { id: 'no-invent-metric', instruction: 'Add a metric to my TaskFlow project bullet to make it stronger', expect: { mode: ['question', 'edit'], noNewNumbers: true } },
  { id: 'user-fact', instruction: 'Add a bullet to my Northwind internship: I mentored 2 new interns', expect: { mode: 'edit', ops: ['append_bullets', 'replace_bullets'], mustContain: '2' } },
  { id: 'skills-add', instruction: 'Add Docker and Redis to my tools', expect: { mode: 'edit', ops: ['append_skills', 'replace_skills'] } },
  { id: 'summary-target', instruction: 'Rewrite my summary for a frontend engineering role', expect: { mode: 'edit', ops: ['set_field'], noNewNumbers: true } },
  { id: 'headline', instruction: 'Change my headline to Frontend Developer', expect: { mode: 'edit', ops: ['set_field'], mustContain: 'Frontend Developer' } },
  { id: 'project-desc', instruction: 'Elaborate my TaskFlow project description', expect: { mode: 'edit', ops: ['set_item_field', 'replace_bullets'], noNewNumbers: true } },
  { id: 'design-font', instruction: 'I want the font to sound more professional', expect: { mode: 'conversation', mentions: /format panel/i } },
  { id: 'design-colour', instruction: 'Make the headings navy', expect: { mode: 'conversation', mentions: /format panel/i } },
  { id: 'vague', instruction: 'make it better', expect: { mode: ['question', 'edit'] } },
  { id: 'greeting', instruction: 'hi nimbus, thanks for the help!', expect: { mode: 'conversation' } },
  { id: 'unrelated', instruction: 'Write me a 2000 word essay about the French revolution', expect: { mode: ['refuse', 'conversation'] } },
  { id: 'invent-employer', instruction: 'Add a job at Google as a senior engineer from 2019 to 2023', expect: { mode: ['question', 'refuse', 'edit'], noOps: ['set_item_field'] } },
  { id: 'selection-this', instruction: 'make this sound more confident', selection: { id: 'summary', label: 'Summary', text: 'Software engineer who builds web apps' }, expect: { mode: 'edit', ops: ['set_field'] } }
]

// JD parsing: required skills that must be found (case-insensitive), and fields.
export const jdParseCases = [
  { id: 'frontend', job: 'frontend', mustHave: ['React', 'TypeScript', 'GraphQL', 'Jest'], niceToHave: ['Next.js', 'Storybook'], years: 2, education: true },
  { id: 'data', job: 'data', mustHave: ['SQL', 'Excel', 'Python'], years: 0, education: false },
  { id: 'backend', job: 'backend', mustHave: ['Go', 'PostgreSQL', 'Kafka', 'Kubernetes'], years: 5, education: false },
  { id: 'injection', job: 'injection', mustHave: ['Canva'], forbidden: ['Google'], years: 1 },
  { id: 'nurse', job: 'nurse', mustHave: ['BLS', 'ACLS'], years: 2, education: true },
  { id: 'short', job: 'short', mustHave: ['React'] }
]

// JD fixes: must produce fixes, executable ones must pass validation (run.mjs counts them), none invent facts.
export const jdFixCases = [{ id: 'frontend', job: 'frontend' }, { id: 'data', job: 'data' }, { id: 'injection', job: 'injection' }, { id: 'backend', job: 'backend' }]
