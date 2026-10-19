import { driver } from '../data'

type Props = {
  onLogout: () => void
  onReset: () => void
}

export function ProfilePage({ onLogout, onReset }: Props) {
  return (
    <div className="profile-grid">
      <section className="panel identity">
        <span className="avatar large" aria-hidden="true">
          {driver.iniciais}
        </span>
        <div>
          <h2>{driver.nome}</h2>
          <p className="muted">
            Matrícula {driver.matricula} · {driver.base}
          </p>
          <p>{driver.telefone}</p>
        </div>
      </section>

      <section className="panel">
        <h2>Documentos</h2>
        <dl className="spec">
          <div>
            <dt>CNH</dt>
            <dd>{driver.cnh}</dd>
          </div>
          <div>
            <dt>Categoria</dt>
            <dd>{driver.categoria}</dd>
          </div>
          <div>
            <dt>Validade</dt>
            <dd>{driver.validade}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2>Veículo da rota</h2>
        <dl className="spec">
          <div>
            <dt>Modelo</dt>
            <dd>{driver.veiculo}</dd>
          </div>
          <div>
            <dt>Placa</dt>
            <dd>{driver.placa}</dd>
          </div>
          <div>
            <dt>Ano</dt>
            <dd>{driver.ano}</dd>
          </div>
          <div>
            <dt>Capacidade</dt>
            <dd>{driver.capacidade}</dd>
          </div>
        </dl>
      </section>

      <section className="panel actions-panel">
        <h2>Conta</h2>
        <p className="muted">A demonstração guarda as rotas neste aparelho. Restaurar volta ao dia de exemplo.</p>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            Restaurar demonstração
          </button>
          <button type="button" className="btn btn-primary" onClick={onLogout}>
            Sair da conta
          </button>
        </div>
      </section>
    </div>
  )
}
