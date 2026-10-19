type IconName = 'hoje' | 'viagens' | 'check' | 'perfil' | 'back' | 'arrow'

const common = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function Icon({ name }: { name: IconName }) {
  if (name === 'hoje') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M4 10h16" />
      </svg>
    )
  }
  if (name === 'viagens') {
    return (
      <svg {...common}>
        <circle cx="6" cy="17" r="2.2" />
        <circle cx="18" cy="7" r="2.2" />
        <path d="M8 16c2.5-1 4-5 8-7" />
      </svg>
    )
  }
  if (name === 'check') {
    return (
      <svg {...common}>
        <rect x="5" y="3.5" width="14" height="17" rx="2" />
        <path d="M8.5 12.5l2.2 2.2 4.3-4.8" />
      </svg>
    )
  }
  if (name === 'perfil') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19.5c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
      </svg>
    )
  }
  if (name === 'back') {
    return (
      <svg {...common}>
        <path d="M15 5l-7 7 7 7" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function RouteArt() {
  return (
    <svg className="route-art" viewBox="0 0 420 230" aria-hidden="true">
      <path
        d="M28 176C78 176 92 58 154 62s78 92 132 78 62-96 108-78"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="28" cy="176" r="8" fill="#c44914" />
      <circle cx="168" cy="64" r="7" fill="currentColor" />
      <circle cx="286" cy="146" r="7" fill="currentColor" />
      <circle cx="392" cy="62" r="8" fill="#fffcf7" />
    </svg>
  )
}
