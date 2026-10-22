import {
  ArrowRight,
  ClipboardCheck,
  MapPinned,
  Route,
  Truck,
  UserRound,
} from 'lucide-react'
import { Card } from '../components/Card'
import { Badge, Progress } from '../components/Ui'
import { driver, formatLongDate, todayISO } from '../data'
import { countDone, pickFeatured } from '../logic'
import type { CheckItem, Trip } from '../types'

type Props = {
  trips: Trip[]
  checks: CheckItem[]
  onOpen: (id: string) => void
  onStart: (id: string) => void
  onChecklist: () => void
  onTrips: () => void
  onProfile: () => void
}

export function HomePage({
  trips,
  checks,
  onOpen,
  onStart,
  onChecklist,
  onTrips,
  onProfile,
}: Props) {
  const today = todayISO()
  const featured = pickFeatured(trips, today)
  const todayTrips = trips.filter((trip) => trip.data === today)
  const others = trips.filter((trip) => trip.id !== featured?.id).slice(0, 4)
  const pendingChecks = checks.filter((item) => item.ok !== true).length
  const attentionChecks = checks.filter((item) => item.ok === false).length
  const doneStops = todayTrips.reduce((sum, trip) => sum + countDone(trip), 0)
  const totalStops = todayTrips.reduce((sum, trip) => sum + trip.paradas.length, 0)
  const issues = todayTrips.reduce(
    (sum, trip) => sum + trip.paradas.filter((stop) => stop.status === 'ocorrencia').length,
    0,
  )
  const checksOk = checks.filter((item) => item.ok === true).length

  const quickActions = [
    {
      key: 'checklist',
      label: 'Checklist',
      description: pendingChecks > 0 ? `${pendingChecks} pendentes` : 'Veículo ok',
      icon: ClipboardCheck,
      onClick: onChecklist,
    },
    {
      key: 'viagens',
      label: 'Viagens',
      description: 'Rotas liberadas',
      icon: Route,
      onClick: onTrips,
    },
    {
      key: 'parada',
      label: 'Paradas',
      description: featured ? `${featured.paradas.length} na saída` : 'Sem saída',
      icon: MapPinned,
      onClick: () => (featured ? onOpen(featured.id) : onTrips()),
    },
    {
      key: 'perfil',
      label: 'Perfil',
      description: driver.placa,
      icon: UserRound,
      onClick: onProfile,
    },
  ]

  return (
    <div className="home-dash">
      <header className="home-hello">
        <p className="home-hello-label">Olá,</p>
        <h1 className="home-hello-name">{driver.nome}</h1>
        <p className="home-hello-meta">
          {formatLongDate(today)} · {driver.base}
        </p>
      </header>

      {pendingChecks > 0 && (
        <button type="button" className="home-alert" onClick={onChecklist}>
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
        <Card
          as="button"
          interactive
          gradientTop
          padding="lg"
          className="home-hero"
          type="button"
          onClick={() =>
            featured.status === 'agendada' ? onStart(featured.id) : onOpen(featured.id)
          }
        >
          <div className="home-hero-top">
            <span className="home-hero-icon" aria-hidden>
              <Truck size={22} />
            </span>
            <ArrowRight className="home-hero-arrow" size={18} aria-hidden />
          </div>
          <div className="home-hero-body">
            <p className="home-section-label">
              {featured.status === 'em_andamento' ? 'Continuar viagem' : 'Próxima saída'}
            </p>
            <h2>
              {featured.codigo}
              <span>{featured.saida}</span>
            </h2>
            <p>
              {featured.origem} <span aria-hidden="true">→</span> {featured.regiao}
            </p>
            <div className="home-hero-meta">
              <Badge status={featured.status} />
              <span>
                {countDone(featured)}/{featured.paradas.length} paradas · {featured.km} km
              </span>
            </div>
          </div>
          <span className="home-hero-cta">
            {featured.status === 'agendada'
              ? 'Iniciar viagem'
              : featured.status === 'concluida'
                ? 'Ver resumo'
                : 'Abrir viagem'}
          </span>
        </Card>
      ) : (
        <Card padding="lg" className="home-hero home-hero-empty">
          <span className="home-hero-icon" aria-hidden>
            <Truck size={22} />
          </span>
          <h2>Nenhuma saída pendente</h2>
          <p>Quando a base liberar a próxima rota, ela aparece aqui.</p>
          <button type="button" className="btn btn-primary" onClick={onTrips}>
            Ver viagens
          </button>
        </Card>
      )}

      <section aria-labelledby="acoes-rapidas">
        <h2 id="acoes-rapidas" className="home-section-label">
          Ações rápidas
        </h2>
        <div className="home-actions">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card
                key={action.key}
                as="button"
                type="button"
                interactive
                padding="md"
                className="home-action"
                onClick={action.onClick}
              >
                <Icon size={18} className="home-action-icon" aria-hidden />
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </Card>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="resumo-hoje">
        <h2 id="resumo-hoje" className="home-section-label">
          Hoje
        </h2>
        <Card padding="md">
          <ul className="home-summary">
            <li>
              <span>Paradas</span>
              <strong>{totalStops}</strong>
            </li>
            <li>
              <span>Resolvidas</span>
              <strong>{doneStops}</strong>
            </li>
            <li>
              <span>Ocorrências</span>
              <strong>{issues}</strong>
            </li>
            <li>
              <span>Checklist</span>
              <strong>
                {checksOk}/{checks.length}
              </strong>
            </li>
          </ul>
          <div className="home-summary-foot">
            <Progress value={checksOk} max={checks.length} />
            <button type="button" className="text-btn" onClick={onChecklist}>
              Abrir checklist
            </button>
          </div>
        </Card>
      </section>

      {featured && (
        <section aria-labelledby="paradas-saida">
          <div className="home-section-row">
            <h2 id="paradas-saida" className="home-section-label">
              Paradas da saída
            </h2>
            <button type="button" className="text-btn" onClick={() => onOpen(featured.id)}>
              Abrir
            </button>
          </div>
          <Card padding="md">
            <ol className="home-stops">
              {featured.paradas.map((stop, index) => (
                <li key={stop.id} className={stop.status === 'em_rota' ? 'is-now' : undefined}>
                  <span className="home-stop-index">{index + 1}</span>
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
          </Card>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="outras-rotas">
          <div className="home-section-row">
            <h2 id="outras-rotas" className="home-section-label">
              Outras rotas
            </h2>
            <button type="button" className="text-btn" onClick={onTrips}>
              Todas
            </button>
          </div>
          <Card padding="md">
            <ul className="home-routes">
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
          </Card>
        </section>
      )}

      <section className="home-stats-desktop" aria-label="Resumo operacional">
        {[
          { label: 'Paradas hoje', value: String(totalStops) },
          { label: 'Resolvidas', value: String(doneStops) },
          { label: 'Ocorrências', value: String(issues) },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <p className="home-stat-label">{stat.label}</p>
            <p className="home-stat-value">{stat.value}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
