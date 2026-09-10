export default function LandingIcon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    upload: <><path d="M12 16V4" /><path d="m8 8 4-4 4 4" /><path d="M5 15v4h14v-4" /></>,
    switch: <><rect x="4" y="4" width="7" height="16" rx="1.5" /><rect x="13" y="4" width="7" height="16" rx="1.5" /><path d="M7 8h1M7 12h1M16 8h1M16 12h1" /></>,
    wand: <><path d="m15 4 5 5" /><path d="m13 6 5 5L9 20H4v-5L13 6Z" /><path d="M5 4v3M3.5 5.5h3M20 15v3M18.5 16.5h3" /></>,
    skills: <><path d="M5 6.5h14M5 12h10M5 17.5h7" /><circle cx="18" cy="12" r="2" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m16 8 4-4M20 4h-3M20 4v3" /></>,
    edit: <><path d="m4 16.5-.7 3.2 3.2-.7L18 7.5 14.5 4 4 16.5Z" /><path d="m13 5.5 3.5 3.5" /></>,
    download: <><path d="M12 4v11" /><path d="m8 11 4 4 4-4" /><path d="M5 19h14" /></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.2 4.4L17.5 9l-4.3 1.6L12 15l-1.2-4.4L6.5 9l4.3-1.6L12 3Z" /><path d="m19 15 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z" /></>,
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>
  }
  return <svg {...common}>{paths[name] || paths.spark}</svg>
}
