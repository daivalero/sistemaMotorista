import { useState, type FormEvent } from 'react'
import { driver } from '../data'
import { RouteArt } from '../components/Icons'

type Props = {
  error: string
  onSubmit: (matricula: string, senha: string) => void
}

export function LoginPage({ error, onSubmit }: Props) {
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    onSubmit(matricula.trim(), senha)
  }

  return (
    <main className="login">
      <section className="login-hero">
        <p className="eyebrow light">Sistema do motorista</p>
        <p className="hero-title">A rota do dia, clara no celular e na mesa.</p>
        <p className="hero-copy">
          Saídas, paradas e o checklist do veículo no mesmo lugar. Feito para usar com o polegar, e
          também com a tela grande da base.
        </p>
        <RouteArt />
        <ul className="hero-points">
          <li>Paradas na ordem da janela</li>
          <li>Ocorrência em dois toques</li>
          <li>Checklist antes de sair</li>
        </ul>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <p className="wordmark">
            Rota <span>sistema do motorista</span>
          </p>
          <h1>Entrar</h1>
          <p className="muted">Use a matrícula da base para ver as rotas de hoje.</p>

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
      </section>
    </main>
  )
}
