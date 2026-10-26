import { useState, type FormEvent } from 'react'
import { ArrowRight, ClipboardCheck, MapPinned, Smartphone } from 'lucide-react'
import { demoCredentials } from '../data'
import { Logo } from '../components/Logo'
import { ensureDriverSeed } from '../services/trips'
import type { Profile } from '../types'
import { useStore } from '../store'
import { supabaseConfigured } from '../lib/supabase'

type Props = {
  error: string
  onSubmit: (matricula: string, senha: string) => void
}

const benefits = [
  {
    icon: MapPinned,
    title: 'Entregas na viagem',
    description: 'Registre clientes e comprovantes no percurso.',
  },
  {
    icon: ClipboardCheck,
    title: 'Gastos com categoria',
    description: 'Combustível, pedágio e mais, com recibo.',
  },
  {
    icon: Smartphone,
    title: 'Feito para o celular',
    description: 'Poucos toques, mesmo com internet instável.',
  },
]

export function LoginPage({ error, onSubmit }: Props) {
  const { state, dispatch } = useStore()
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    onSubmit(matricula.trim(), senha)
  }

  const enterAs = (profile: Profile) => {
    const hasVehicles = state.vehicles.some((v) => v.driverId === profile.id)
    if (!hasVehicles && profile.role === 'motorista') {
      const seed = ensureDriverSeed(profile)
      seed.vehicles.forEach((vehicle) => dispatch({ type: 'upsert-vehicle', vehicle }))
    }
    onSubmit(profile.matricula, profile.matricula === '9001' ? 'admin' : 'rota')
  }

  return (
    <main className="login">
      <div className="login-glow login-glow-a" aria-hidden />
      <div className="login-glow login-glow-b" aria-hidden />

      <section className="login-hero">
        <Logo variant="full" />
        <h1 className="hero-title">
          Viagens com
          <br />
          entregas e gastos
        </h1>
        <p className="hero-copy">
          Inicie a viagem, registre entregas e despesas, finalize com quilometragem e envie para
          conferência.
        </p>
        <ul className="login-benefits">
          {benefits.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.title} className="login-benefit">
                <span className="login-benefit-icon">
                  <Icon size={20} aria-hidden />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="login-panel">
        <div className="login-stack">
          <div className="login-mobile-brand">
            <Logo variant="full" />
            <p className="muted">Transportadora Braulio · sistema do motorista</p>
          </div>

          <form className="login-card" onSubmit={submit}>
            <span className="gradient-line" aria-hidden />
            <div className="login-card-head">
              <h1>Entrar</h1>
              <p className="muted">
                {supabaseConfigured
                  ? 'Use suas credenciais da base.'
                  : 'Modo local: registros ficam neste aparelho até configurar o Supabase.'}
              </p>
            </div>

            <label className="field">
              <span>Matrícula</span>
              <input
                inputMode="numeric"
                autoComplete="username"
                value={matricula}
                onChange={(event) => setMatricula(event.target.value)}
                placeholder="1042"
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="rota"
              />
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-block">
              Entrar
              <ArrowRight size={20} aria-hidden />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => enterAs(demoCredentials.motorista.profile)}
            >
              Entrar como motorista (demo)
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => enterAs(demoCredentials.admin.profile)}
            >
              Entrar como admin (demo)
            </button>
            <p className="fine">
              Motorista {demoCredentials.motorista.matricula}/{demoCredentials.motorista.senha} ·
              Admin {demoCredentials.admin.matricula}/{demoCredentials.admin.senha}
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
