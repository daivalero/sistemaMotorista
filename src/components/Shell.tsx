import type { ReactNode } from 'react'
import { driver } from '../data'
import type { Screen } from '../types'
import { Icon } from './Icons'

const nav = [
  { name: 'hoje', label: 'Hoje', icon: 'hoje' },
  { name: 'viagens', label: 'Viagens', icon: 'viagens' },
  { name: 'checklist', label: 'Checklist', icon: 'check' },
  { name: 'perfil', label: 'Perfil', icon: 'perfil' },
] as const

type NavName = (typeof nav)[number]['name']

type Props = {
  title: string
  active: NavName
  showBack?: boolean
  onBack?: () => void
  onNavigate: (screen: Screen) => void
  attention: number
  toast: string | null
  children: ReactNode
}

export function Shell({
  title,
  active,
  showBack,
  onBack,
  onNavigate,
  attention,
  toast,
  children,
}: Props) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">Rota</span>
          <span className="brand-sub">sistema do motorista</span>
        </div>
        <nav className="side-nav" aria-label="Seções">
          {nav.map((item) => (
            <button
              key={item.name}
              type="button"
              className={item.name === active ? 'side-link active' : 'side-link'}
              aria-current={item.name === active ? 'page' : undefined}
              onClick={() => onNavigate({ name: item.name })}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.name === 'checklist' && attention > 0 && <em className="count">{attention}</em>}
            </button>
          ))}
        </nav>
        <div className="side-user">
          <span className="avatar" aria-hidden="true">
            {driver.iniciais}
          </span>
          <div>
            <strong>{driver.nome}</strong>
            <span>
              {driver.placa} · {driver.base}
            </span>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className={active === 'hoje' && !showBack ? 'topbar is-home' : 'topbar'}>
          <div className="topbar-lead">
            {showBack && (
              <button type="button" className="icon-btn" onClick={onBack} aria-label="Voltar">
                <Icon name="back" />
              </button>
            )}
            {active === 'hoje' && !showBack ? (
              <p className="wordmark">
                Rota <span>sistema do motorista</span>
              </p>
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
            {driver.iniciais}
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
            className={item.name === active ? 'tab active' : 'tab'}
            aria-current={item.name === active ? 'page' : undefined}
            onClick={() => onNavigate({ name: item.name })}
          >
            <span className="tab-icon">
              <Icon name={item.icon} />
              {item.name === 'checklist' && attention > 0 && <i className="dot" />}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

    </div>
  )
}
