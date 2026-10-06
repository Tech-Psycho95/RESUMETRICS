// Shared pieces of the product UI (PLAN-031/032): used by Job tailoring and GitHub evidence so both
// tools look and behave the same. Styles live in src/job-tailoring.css (.tw-*).
/** Score colours taken from the references: red under 50, orange under 75, teal above. */
export const scoreColour = score => score >= 75 ? '#22A699' : score >= 50 ? '#F08A3E' : '#E2483D'

const paths = {
  back: <path d="M12 4.5 6.5 10l5.5 5.5" />,
  doc: <><path d="M6 2.5h6l3 3v12H6v-15Z" /><path d="M12 2.5v3h3M8.5 9.5h4M8.5 12.5h4" /></>,
  key: <path d="m10 2.6 2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5L2.8 7.8l5-.6L10 2.6Z" />,
  fix: <path d="m13 3.5 3.5 3.5-8.5 8.5H4.5V12L13 3.5Z" />,
  title: <><rect x="3" y="4" width="14" height="12" rx="2" /><path d="M6.5 8h7M6.5 11h4.5" /></>,
  check: <path d="m5 10.5 3.2 3L15 6.5" />,
  clip: <path d="m13.5 6.5-5.6 5.6a1.6 1.6 0 1 0 2.3 2.3l5.9-5.9a3.2 3.2 0 1 0-4.5-4.5l-6 6a4.8 4.8 0 1 0 6.8 6.8l4.2-4.2" />,
  left: <path d="M12 4.5 6.5 10l5.5 5.5" />,
  right: <path d="m8 4.5 5.5 5.5L8 15.5" />,
  copy: <><rect x="7" y="7" width="9" height="10" rx="1.5" /><path d="M4 13V4.5A1.5 1.5 0 0 1 5.5 3H13" /></>,
  split: <><rect x="3" y="3" width="14" height="14" rx="2" /><path d="M3 10h14" /></>,
  post: <><rect x="4" y="3" width="12" height="14" rx="1.5" /><path d="M7 7h6M7 10h6M7 13h3.5" /></>,
  resume: <><path d="M5 2.5h10v15H5z" /><circle cx="10" cy="7" r="2" /><path d="M7 13h6" /></>,
  history: <><path d="M3.5 10a6.5 6.5 0 1 0 2-4.7" /><path d="M3 3.5v3h3M10 6.5V10l2.5 1.5" /></>,
  open: <><path d="M11 3.5h5.5V9" /><path d="M16.5 3.5 9 11M14 12v4.5H3.5V6H8" /></>,
  plus: <path d="M10 4v12M4 10h12" />,
  github: <path fill="currentColor" stroke="none" d="M10 2.5a7.5 7.5 0 0 0-2.4 14.6c.4.1.5-.2.5-.4v-1.3c-2 .4-2.5-1-2.5-1-.3-.8-.8-1-.8-1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.1 1.8.8 2.2.6.1-.5.3-.8.5-1-1.7-.2-3.4-.8-3.4-3.7 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2 0 0 .6-.2 2.1.8a7 7 0 0 1 3.8 0c1.4-1 2.1-.8 2.1-.8.4 1 .1 1.8.1 2 .5.5.8 1.2.8 2 0 2.9-1.7 3.5-3.4 3.7.3.2.5.7.5 1.4v2c0 .2.1.5.5.4A7.5 7.5 0 0 0 10 2.5Z" />,
  repo: <><path d="M5 3.5h10v13H6.5A1.5 1.5 0 0 1 5 15V3.5Z" /><path d="M5 15a1.5 1.5 0 0 1 1.5-1.5H15M8 6.5h4" /></>,
  code: <path d="m7 6-4 4 4 4M13 6l4 4-4 4" />,
  chart: <><circle cx="10" cy="10" r="6.5" /><path d="M10 3.5V10l5 4" /></>,
  star: <path d="m10 3 2 4.2 4.6.6-3.4 3.1.9 4.6L10 13.2l-4.1 2.3.9-4.6L3.4 7.8 8 7.2 10 3Z" />,
  refresh: <><path d="M15.5 6.5A6 6 0 1 0 16 11" /><path d="M16 3.5v3h-3" /></>,
  stop: <rect x="5.5" y="5.5" width="9" height="9" rx="1.5" />,
  shield: <><path d="M10 2.8 16 5v4.6c0 3.7-2.6 6.4-6 7.6-3.4-1.2-6-3.9-6-7.6V5l6-2.2Z" /><path d="m7.3 10 1.9 1.8 3.6-3.6" /></>,
  chevron: <path d="m7 8 3 3 3-3" />,
}
export const Icon = ({ name, size = 16 }) => <svg className="tw-icon" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>

export function NavItem({ icon, label, value, tone, active, done, onClick }) {
  return <button type="button" className={`tw-nav-item${active ? ' is-active' : ''}${done ? ' is-done' : ''}`} onClick={onClick} aria-current={active ? 'true' : undefined}>
    <span className="tw-nav-icon"><Icon name={icon} size={15} /></span>
    <span className="tw-nav-label">{label}</span>
    {value && <span className={`tw-nav-value is-${tone}`}>{value}</span>}
  </button>
}

export function Toggle({ label, checked, onChange }) {
  return <label className="tw-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span aria-hidden="true" />{label}</label>
}

