import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { formatDateTime, formatMoney } from '../data'
import { expenseTotal, expensesOf } from '../logic'
import { useStore } from '../store'
import type { TripStatus } from '../types'

const filters: { id: 'todas' | TripStatus; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'rascunho', label: 'Rascunhos' },
  { id: 'aguardando_conferencia', label: 'Enviados' },
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
      .filter((trip) => {
        if (filter === 'todas') return true
        if (filter === 'rascunho') return trip.status === 'rascunho' || trip.status === 'em_andamento'
        return trip.status === filter
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [state.trips, profile, filter])

  if (!profile) return null

  return (
    <div className="page-stack">
      <header className="page-intro">
        <p className="home-section-label">Histórico</p>
        <h1>Meus registros</h1>
        <p className="muted">Consulte viagens salvas, rascunhos e status de sincronização.</p>
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
          <h2>Nenhum registro aqui</h2>
          <p className="muted">Use “Registrar viagem” na home para criar o primeiro.</p>
        </Card>
      ) : (
        <ul className="trip-list">
          {trips.map((trip) => (
            <li key={trip.id}>
              <button type="button" className="trip-card" onClick={() => onOpen(trip.id)}>
                <div className="trip-card-top">
                  <strong>{trip.tripDate}</strong>
                  <span className={`badge badge-${trip.status}`}>{statusLabel(trip.status)}</span>
                </div>
                <p className="muted">
                  {expensesOf(state, trip.id).length} gastos ·{' '}
                  {formatMoney(expenseTotal(expensesOf(state, trip.id)))}
                  {trip.distanceKm != null ? ` · ${trip.distanceKm} km` : ''}
                </p>
                <p className="fine left">Atualizado {formatDateTime(trip.updatedAt)}</p>
                {trip.syncState === 'local' && <span className="sync-pill">Neste aparelho</span>}
                {trip.syncState === 'sincronizado' && <span className="sync-pill">Sincronizado</span>}
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
    case 'rascunho':
    case 'em_andamento':
      return 'Rascunho'
    case 'aguardando_conferencia':
      return 'Enviado'
    case 'precisa_correcao':
      return 'Correção'
    case 'concluida':
      return 'Concluída'
    default:
      return status
  }
}
