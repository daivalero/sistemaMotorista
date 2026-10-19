import { useState } from 'react'
import { formatShortDate, todayISO } from '../data'
import { countDone } from '../logic'
import type { Trip } from '../types'
import { Badge } from '../components/Ui'

type Filter = 'todas' | 'hoje' | 'andamento' | 'concluidas'

const filters: { id: Filter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'hoje', label: 'Hoje' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'concluidas', label: 'Concluídas' },
]

type Props = {
  trips: Trip[]
  onOpen: (id: string) => void
}

export function TripsPage({ trips, onOpen }: Props) {
  const [filter, setFilter] = useState<Filter>('todas')
  const today = todayISO()

  const visible = trips
    .filter((trip) => {
      if (filter === 'hoje') return trip.data === today
      if (filter === 'andamento') return trip.status === 'em_andamento'
      if (filter === 'concluidas') return trip.status === 'concluida'
      return true
    })
    .sort((a, b) => (b.data + b.saida).localeCompare(a.data + a.saida))

  return (
    <div className="page">
      <p className="lede tight">Rotas liberadas pela base, da mais recente para a mais antiga.</p>
      <div className="filters" role="tablist" aria-label="Filtrar viagens">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={filter === item.id ? 'chip active' : 'chip'}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <section className="empty-hero">
          <h2>Nada neste filtro</h2>
          <p>Troque o filtro para ver outras rotas.</p>
        </section>
      ) : (
        <ul className="trip-list">
          {visible.map((trip) => (
            <li key={trip.id}>
              <button type="button" className="trip-card" onClick={() => onOpen(trip.id)}>
                <div className="trip-card-top">
                  <span className="code">{trip.codigo}</span>
                  <Badge status={trip.status} />
                </div>
                <strong>
                  {trip.origem} → {trip.regiao}
                </strong>
                <span className="muted">
                  {formatShortDate(trip.data)} · saída {trip.saida} · {trip.km} km
                </span>
                <span className="trip-foot">
                  {countDone(trip)}/{trip.paradas.length} paradas · {trip.placa}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
