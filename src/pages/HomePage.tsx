import { ArrowRight, ClipboardList, Play, Route, Truck } from 'lucide-react'
import { Card } from '../components/Card'
import { formatDateTime, formatLongDate } from '../data'
import {
  activeTripForDriver,
  deliveryCounts,
  deliveriesOf,
  expenseTotal,
  expensesOf,
} from '../logic'
import { useStore } from '../store'

type Props = {
  onStartFlow: () => void
  onOpenTrip: (id: string) => void
  onTrips: () => void
  onAdmin?: () => void
}

export function HomePage({ onStartFlow, onOpenTrip, onTrips, onAdmin }: Props) {
  const { state } = useStore()
  const profile = state.session.profile
  if (!profile) return null

  const active = activeTripForDriver(state, profile.id)
  const myTrips = state.trips
    .filter((trip) => trip.driverId === profile.id || profile.role === 'admin')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  const awaiting = myTrips.filter((t) => t.status === 'aguardando_conferencia').length
  const needsFix = myTrips.filter((t) => t.status === 'precisa_correcao').length

  return (
    <div className="home-dash">
      <header className="home-hello">
        <div className="home-brand-row">
          <p className="home-hello-label">Olá,</p>
        </div>
        <h1 className="home-hello-name">{profile.nome}</h1>
        <p className="home-hello-meta">
          {formatLongDate(new Date().toISOString())} ·{' '}
          {profile.role === 'admin' ? 'Administração' : 'Motorista agregado'}
        </p>
      </header>

      {active ? (
        <Card
          as="button"
          type="button"
          interactive
          gradientTop
          padding="lg"
          className="home-hero"
          onClick={() => onOpenTrip(active.id)}
        >
          <div className="home-hero-top">
            <span className="home-hero-icon" aria-hidden>
              <Truck size={22} />
            </span>
            <ArrowRight className="home-hero-arrow" size={18} aria-hidden />
          </div>
          <div className="home-hero-body">
            <p className="home-section-label">Viagem em andamento</p>
            <h2>
              Desde {formatDateTime(active.startedAt)}
              <span>KM {active.kmStart}</span>
            </h2>
            <p>
              {deliveriesOf(state, active.id).length} entregas ·{' '}
              {formatMoneySafe(expenseTotal(expensesOf(state, active.id)))} em gastos
            </p>
            <div className="home-hero-meta">
              <span className="badge badge-em_andamento">Em andamento</span>
              {active.syncState === 'local' && (
                <span className="sync-pill">Salvo neste aparelho</span>
              )}
            </div>
          </div>
          <span className="home-hero-cta">Continuar viagem</span>
        </Card>
      ) : (
        <Card
          as="button"
          type="button"
          interactive
          gradientTop
          padding="lg"
          className="home-hero"
          onClick={onStartFlow}
        >
          <div className="home-hero-top">
            <span className="home-hero-icon" aria-hidden>
              <Play size={22} />
            </span>
            <ArrowRight className="home-hero-arrow" size={18} aria-hidden />
          </div>
          <div className="home-hero-body">
            <p className="home-section-label">Pronto para sair</p>
            <h2>Iniciar viagem</h2>
            <p>Informe a quilometragem inicial e o veículo. Entregas e gastos entram depois.</p>
          </div>
          <span className="home-hero-cta">Iniciar viagem</span>
        </Card>
      )}

      <section aria-labelledby="acoes-rapidas">
        <h2 id="acoes-rapidas" className="home-section-label">
          Ações rápidas
        </h2>
        <div className="home-actions">
          <Card as="button" type="button" interactive padding="md" className="home-action" onClick={onTrips}>
            <Route size={18} className="home-action-icon" aria-hidden />
            <strong>Minhas viagens</strong>
            <span>{myTrips.length} no histórico</span>
          </Card>
          {!active && (
            <Card
              as="button"
              type="button"
              interactive
              padding="md"
              className="home-action"
              onClick={onStartFlow}
            >
              <Play size={18} className="home-action-icon" aria-hidden />
              <strong>Nova viagem</strong>
              <span>Registrar saída</span>
            </Card>
          )}
          {active && (
            <Card
              as="button"
              type="button"
              interactive
              padding="md"
              className="home-action"
              onClick={() => onOpenTrip(active.id)}
            >
              <ClipboardList size={18} className="home-action-icon" aria-hidden />
              <strong>Entregas</strong>
              <span>
                {deliveryCounts(deliveriesOf(state, active.id)).pendente} pendentes
              </span>
            </Card>
          )}
          {profile.role === 'admin' && onAdmin && (
            <Card as="button" type="button" interactive padding="md" className="home-action" onClick={onAdmin}>
              <ClipboardList size={18} className="home-action-icon" aria-hidden />
              <strong>Conferência</strong>
              <span>
                {awaiting} aguardando · {needsFix} correção
              </span>
            </Card>
          )}
        </div>
      </section>

      {myTrips.length > 0 && (
        <section aria-labelledby="recentes">
          <div className="home-section-row">
            <h2 id="recentes" className="home-section-label">
              Recentes
            </h2>
            <button type="button" className="text-btn" onClick={onTrips}>
              Ver todas
            </button>
          </div>
          <Card padding="md">
            <ul className="home-routes">
              {myTrips.slice(0, 5).map((trip) => {
                const dels = deliveriesOf(state, trip.id)
                return (
                  <li key={trip.id}>
                    <button type="button" onClick={() => onOpenTrip(trip.id)}>
                      <span>
                        <strong>{formatDateTime(trip.startedAt)}</strong>
                        <small>
                          {dels.length} entregas · KM {trip.kmStart}
                          {trip.kmEnd != null ? ` → ${trip.kmEnd}` : ''}
                        </small>
                      </span>
                      <span className={`badge badge-${trip.status}`}>{statusLabel(trip.status)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>
      )}
    </div>
  )
}

function formatMoneySafe(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusLabel(status: string) {
  switch (status) {
    case 'em_andamento':
      return 'Em andamento'
    case 'aguardando_conferencia':
      return 'Conferência'
    case 'precisa_correcao':
      return 'Correção'
    case 'concluida':
      return 'Concluída'
    default:
      return status
  }
}
