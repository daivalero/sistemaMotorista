import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

type Common = {
  interactive?: boolean
  gradientTop?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

type DivProps = Common &
  Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'> & {
    as?: 'div' | 'article' | 'section'
  }

type ButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    as: 'button'
  }

type Props = DivProps | ButtonProps

const paddingClass = {
  none: '',
  sm: 'card-pad-sm',
  md: 'card-pad-md',
  lg: 'card-pad-lg',
} as const

export function Card(props: Props) {
  const {
    as = 'div',
    className = '',
    interactive = false,
    gradientTop = false,
    padding = 'md',
    children,
    ...rest
  } = props

  const classes = [
    'ui-card',
    paddingClass[padding],
    interactive ? 'ui-card-interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (as === 'button') {
    return (
      <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {gradientTop && <span className="gradient-line" aria-hidden />}
        {children}
      </button>
    )
  }

  const Tag = as
  return (
    <Tag className={classes} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {gradientTop && <span className="gradient-line" aria-hidden />}
      {children}
    </Tag>
  )
}
