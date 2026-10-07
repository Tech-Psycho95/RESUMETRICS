// Which letter layout family each resume template gets (PLAN-033). The letter renders the template's own
// masthead and column markup, so every letter already matches its resume; the family only adds the small
// structural device from the reference letters (a rule, a rail, an offset body…).
//   rule     full-height vertical rule at the left, contact at the top right        (reference 1)
//   band     the template's tinted/coloured header band, date and recipient in a side rail (reference 2)
//   rail     labelled left rail with a hairline divider and one accent bar         (reference 3)
//   offset   body pushed to the right, masthead and date to the left, hairline ticks (reference 4)
//   centred  centred masthead, hairline, then a left-aligned letter
export const letterFamilies = {
  'keywords-cv': 'rule', receive: 'rule', lapras: 'rule', onyx: 'rule', rhyhorn: 'rule', meowth: 'rule',
  'simple-hipster': 'band', ditgar: 'band', ditto: 'band', gengar: 'band', glalie: 'band', leafish: 'band', pikachu: 'band',
  'minimal-academic': 'rail', 'libre-cv': 'rail', 'curve-academic': 'rail', chikorita: 'rail',
  'developer-cv': 'offset', scizor: 'offset',
  'navy-professional': 'centred', 'elegant-resume': 'centred', azurill: 'centred', bronzor: 'centred', kakuna: 'centred'
}
export const letterFamilyFor = templateId => letterFamilies[templateId] ?? 'centred'
