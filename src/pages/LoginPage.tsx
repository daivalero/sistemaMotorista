import { useState, type FormEvent } from 'react'
import { ArrowRight, ClipboardCheck, MapPinned, Smartphone } from 'lucide-react'
import { driver } from '../data'
import { Logo } from '../components/Logo'

type Props = {
  error: string
  onSubmit: (matricula: string, senha: string) => void
}

const benefits = [
  {
    icon: MapPinned,
    title: 'Paradas na ordem',
    description: 'A janela do dia, clara no celular e na base.',
  },
  {
    icon: ClipboardCheck,
    title: 'Checklist do veículo',
    description: 'Confira antes de sair e registre atenção.',
  },
  {
    icon: Smartphone,
    title: 'Feito para o caminhão',
    description: 'Interface rápida, instalável como PWA.',
  },
]

export function LoginPage({ error, onSubmit }: Props) {
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    onSubmit(matricula.trim(), senha)
  }

  return (
    <main className="login">
      <div className="login-glow login-glow-a" aria-hidden />
      <div className="login-glow login-glow-b" aria-hidden />

      <section className="login-hero">
        <Logo variant="full" />
        <h1 className="hero-title">
          A rota do dia,
          <br />
          na palma da mão
        </h1>
        <p className="hero-copy">
          Saídas, paradas, checklist e ocorrências no mesmo lugar — feito para o motorista da
          Transportadora Braulio.
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
            <h1>Transportadora Braulio</h1>
            <p className="muted">Entre para ver as rotas de hoje</p>
          </div>

          <form className="login-card" onSubmit={submit}>
            <span className="gradient-line" aria-hidden />
            <div className="login-card-head">
              <h1>Entrar</h1>
              <p className="muted">Use a matrícula da base para acessar.</p>
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
              onClick={() => onSubmit(driver.matricula, driver.senha)}
            >
              Entrar com a demonstração
            </button>
            <p className="fine">
              Demonstração: matrícula {driver.matricula}, senha {driver.senha}.
            </p>
          </form>

          <p className="fine">Sistema interno · Transportadora Braulio</p>
        </div>
      </section>
    </main>
  )
}
