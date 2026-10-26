import type { ReactNode } from 'react'
import type { AppRole, Screen } from '../types'
import { Icon } from './Icons'
import { Logo } from './Logo'
import { useStore } from '../store'

type NavName = 'hoje' | 'viagens' | 'admin' | 'perfil'

type Props = {
  title: string
  active: NavName | 'registrar'
  showBack?: boolean
  onBack?: () => void
  onNavigate: (screen: Screen) => void
  role: AppRole
  toast: string | null
  children: ReactNode
}

export function Shell({
  title,
  active,
  showBack,
  onBack,
  onNavigate,
  role,
  toast,
  children,
}: Props) {
  const { state } = useStore()
  const profile = state.session.profile
  const nav = [
    { name: 'hoje' as const, label: 'Hoje', icon: 'hoje' as const },
    { name: 'viagens' as const, label: 'Viagens', icon: 'viagens' as const },
    ...(role === 'admin'
      ? [{ name: 'admin' as const, label: 'Conferir', icon: 'check' as const }]
      : []),
    { name: 'perfil' as const, label: 'Perfil', icon: 'perfil' as const },
  ]

  const current = active === 'registrar' ? 'hoje' : active

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo variant="compact" />
          <span className="brand-sub">Sistema do motorista</span>
        </div>
        <nav className="side-nav" aria-label="Seções">
          {nav.map((item) => (
            <button
              key={item.name}
              type="button"
              className={item.name === current ? 'side-link active' : 'side-link'}
              aria-current={item.name === current ? 'page' : undefined}
              onClick={() => onNavigate({ name: item.name })}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        {profile && (
          <div className="side-user">
            <span className="avatar" aria-hidden="true">
              {profile.nome
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase()}
            </span>
            <div>
              <strong>{profile.nome}</strong>
              <span>
                {profile.matricula} · {profile.role}
              </span>
            </div>
          </div>
        )}
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-lead">
            {showBack && (
              <button type="button" className="icon-btn" onClick={onBack} aria-label="Voltar">
                <Icon name="back" />
              </button>
            )}
            {!showBack && current === 'hoje' ? (
              <Logo variant="compact" />
            ) : (
              <h1 className="top-title">{title}</h1>
            )}
          </div>
          <button
            type="button"
            className="avatar avatar-btn"
            onClick={() => onNavigate({ name: 'perfil' })}
            aria-label="Abrir perfil"
          >
            {profile
              ? profile.nome
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()
              : '?'}
          </button>
        </header>
        <div className="content">
          <div className="content-inner">
            {toast && (
              <div className="toast" role="status">
                {toast}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>

      <nav className="tabbar" aria-label="Seções">
        {nav.map((item) => (
          <button
            key={item.name}
            type="button"
            className={item.name === current ? 'tab active' : 'tab'}
            aria-current={item.name === current ? 'page' : undefined}
            onClick={() => onNavigate({ name: item.name })}
          >
            <span className="tab-icon">
              <Icon name={item.icon} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
