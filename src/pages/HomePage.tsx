import { driver, formatLongDate, todayISO } from '../data'
import { countDone, pickFeatured } from '../logic'
import type { CheckItem, Trip } from '../types'
import { Badge, Progress } from '../components/Ui'

type Props = {
  trips: Trip[]
  checks: CheckItem[]
  onOpen: (id: string) => void
  onStart: (id: string) => void
  onChecklist: () => void
  onTrips: () => void
}

export function HomePage({ trips, checks, onOpen, onStart, onChecklist, onTrips }: Props) {
  const today = todayISO()
  const featured = pickFeatured(trips, today)
  const todayTrips = trips.filter((trip) => trip.data === today)
  const others = trips.filter((trip) => trip.id !== featured?.id).slice(0, 3)
  const pendingChecks = checks.filter((item) => item.ok !== true).length
  const attentionChecks = checks.filter((item) => item.ok === false).length
  const doneStops = todayTrips.reduce((sum, trip) => sum + countDone(trip), 0)
  const totalStops = todayTrips.reduce((sum, trip) => sum + trip.paradas.length, 0)
  const issues = todayTrips.reduce(
    (sum, trip) => sum + trip.paradas.filter((stop) => stop.status === 'ocorrencia').length,
    0,
  )

  return (
    <div className="home-grid">
      <div className="home-main">
        <p className="eyebrow">{formatLongDate(today)}</p>
        <h1 className="greeting">Olá, {driver.primeiro}</h1>
        <p className="lede">
          {totalStops === 0
            ? 'Nenhuma parada prevista para hoje.'
            : `${totalStops} paradas hoje, saindo de ${driver.base}.`}
        </p>

        {pendingChecks > 0 && (
          <button type="button" className="alert-banner" onClick={onChecklist}>
            <strong>
              {attentionChecks > 0
                ? attentionChecks === 1
                  ? '1 item em atenção no checklist'
                  : `${attentionChecks} itens em atenção no checklist`
                : pendingChecks === 1
                  ? 'Falta 1 item no checklist'
                  : `Faltam ${pendingChecks} itens no checklist`}
            </strong>
            <span>Conferir veículo</span>
          </button>
        )}

        {featured ? (
          <article className="ticket">
            <div className="ticket-top">
              <span className="eyebrow">
                {featured.status === 'em_andamento' ? 'Viagem em andamento' : 'Próxima saída'}
              </span>
              <strong className="ticket-time">{featured.saida}</strong>
            </div>
            <div className="ticket-code">
              <h2>{featured.codigo}</h2>
              <Badge status={featured.status} />
            </div>
            <p className="route-line">
              {featured.origem} <span aria-hidden="true">→</span> {featured.regiao}
            </p>
            <dl className="ticket-meta">
              <div>
                <dt>Paradas</dt>
                <dd>
                  {countDone(featured)}/{featured.paradas.length}
                </dd>
              </div>
              <div>
                <dt>Distância</dt>
                <dd>{featured.km} km</dd>
              </div>
              <div>
                <dt>Placa</dt>
                <dd>{featured.placa}</dd>
              </div>
            </dl>
            <Progress value={countDone(featured)} max={featured.paradas.length} />
            <div className="ticket-actions">
              {featured.status === 'agendada' ? (
                <button type="button" className="btn btn-primary btn-block" onClick={() => onStart(featured.id)}>
                  Iniciar viagem
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-block" onClick={() => onOpen(featured.id)}>
                  {featured.status === 'concluida' ? 'Ver resumo' : 'Continuar viagem'}
                </button>
              )}
              {featured.status === 'agendada' && (
                <button type="button" className="btn btn-ghost btn-block" onClick={() => onOpen(featured.id)}>
                  Ver paradas
                </button>
              )}
            </div>
          </article>
        ) : (
          <section className="empty-hero">
            <h2>Nenhuma saída pendente</h2>
            <p>Quando a base liberar a próxima rota, ela aparece aqui.</p>
            <button type="button" className="btn btn-primary" onClick={onTrips}>
              Ver viagens
            </button>
          </section>
        )}

        {featured && (
          <section className="block">
            <div className="block-head">
              <h2>Paradas</h2>
              <button type="button" className="text-btn" onClick={() => onOpen(featured.id)}>
                Abrir rota
              </button>
            </div>
            <ol className="stop-preview">
              {featured.paradas.map((stop, index) => (
                <li key={stop.id} className={stop.status === 'em_rota' ? 'now' : undefined}>
                  <span className="stop-index">{index + 1}</span>
                  <div>
                    <strong>{stop.cliente}</strong>
                    <span>
                      {stop.janela} · {stop.bairro}
                    </span>
                  </div>
                  <Badge status={stop.status} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <aside className="home-side">
        <section className="panel">
          <h2>Hoje</h2>
          <div className="stats">
            <div>
              <strong>{totalStops}</strong>
              <span>paradas</span>
            </div>
            <div>
              <strong>{doneStops}</strong>
              <span>resolvidas</span>
            </div>
            <div>
              <strong>{issues}</strong>
              <span>ocorrências</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="block-head">
            <h2>Checklist</h2>
            <button type="button" className="text-btn" onClick={onChecklist}>
              Abrir
            </button>
          </div>
          <p className="muted">
            {pendingChecks === 0
              ? 'Veículo conferido. Pode sair.'
              : `${checks.length - pendingChecks} de ${checks.length} itens ok.`}
          </p>
          <Progress value={checks.filter((item) => item.ok === true).length} max={checks.length} />
        </section>

        <section className="panel">
          <div className="block-head">
            <h2>Outras rotas</h2>
            <button type="button" className="text-btn" onClick={onTrips}>
              Todas
            </button>
          </div>
          <ul className="mini-list">
            {others.map((trip) => (
              <li key={trip.id}>
                <button type="button" onClick={() => onOpen(trip.id)}>
                  <span>
                    <strong>{trip.codigo}</strong>
                    <small>
                      {trip.saida} · {trip.regiao}
                    </small>
                  </span>
                  <Badge status={trip.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}
