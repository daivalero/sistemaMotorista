import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { formatDateTime } from '../data'
import { deliveriesOf } from '../logic'
import { useStore } from '../store'
import type { TripStatus } from '../types'

const filters: { id: 'todas' | TripStatus; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'em_andamento', label: 'Em andamento' },
  { id: 'aguardando_conferencia', label: 'Conferência' },
  { id: 'precisa_correcao', label: 'Correção' },
  { id: 'concluida', label: 'Concluídas' },
]

type Props = {
  onOpen: (id: string) => void
}

export function TripsPage({ onOpen }: Props) {
  const { state } = useStore()
  const profile = state.session.profile
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('todas')

  const trips = useMemo(() => {
    if (!profile) return []
    return state.trips
      .filter((trip) => (profile.role === 'admin' ? true : trip.driverId === profile.id))
      .filter((trip) => (filter === 'todas' ? true : trip.status === filter))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  }, [state.trips, profile, filter])

  if (!profile) return null

  return (
    <div className="page-stack">
      <header className="page-intro">
        <p className="home-section-label">Histórico</p>
        <h1>Minhas viagens</h1>
        <p className="muted">Consulte entregas, despesas e documentos. Viagens concluídas não podem ser alteradas livremente.</p>
      </header>

      <div className="filters">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? 'chip active' : 'chip'}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {trips.length === 0 ? (
        <Card padding="lg">
          <h2>Nenhuma viagem aqui</h2>
          <p className="muted">Inicie uma viagem na home para começar a registrar entregas e gastos.</p>
        </Card>
      ) : (
        <ul className="trip-list">
          {trips.map((trip) => (
            <li key={trip.id}>
              <button type="button" className="trip-card" onClick={() => onOpen(trip.id)}>
                <div className="trip-card-top">
                  <strong>{formatDateTime(trip.startedAt)}</strong>
                  <span className={`badge badge-${trip.status}`}>{statusLabel(trip.status)}</span>
                </div>
                <p className="muted">
                  {deliveriesOf(state, trip.id).length} entregas · KM {trip.kmStart}
                  {trip.kmEnd != null ? ` → ${trip.kmEnd}` : ''}
                  {trip.distanceKm != null ? ` · ${trip.distanceKm} km` : ''}
                </p>
                {trip.syncState === 'local' && <span className="sync-pill">Local</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
