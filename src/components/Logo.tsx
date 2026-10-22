type Props = {
  variant?: 'full' | 'compact'
  className?: string
}

const sizeClass = {
  full: 'logo logo-full',
  compact: 'logo logo-compact',
} as const

export function Logo({ variant = 'compact', className = '' }: Props) {
  return (
    <span className={[sizeClass[variant], className].filter(Boolean).join(' ')}>
      <img src={`${import.meta.env.BASE_URL}brand/braulio-logo.png`} alt="Transportadora Braulio" draggable={false} />
    </span>
  )
}
