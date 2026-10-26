import { useMemo, useState } from 'react'
import { DeliverySheet } from '../components/trips/DeliverySheet'
import { ExpenseSheet } from '../components/trips/ExpenseSheet'
import { FinishSheet } from '../components/trips/FinishSheet'
import { Card } from '../components/Card'
import { formatDateTime, formatMoney } from '../data'
import {
  canEditTrip,
  deliveryCounts,
  deliveriesOf,
  expenseTotal,
  expenseTotalsByCategory,
  expensesOf,
} from '../logic'
import { useStore } from '../store'
import type { Delivery } from '../types'

const categoryLabel: Record<string, string> = {
  combustivel: 'Combustível',
  pedagio: 'Pedágio',
  estacionamento: 'Estacionamento',
  manutencao: 'Manutenção',
  outros: 'Outros',
}

type Props = {
  tripId: string
}

export function TripPage({ tripId }: Props) {
  const { state } = useStore()
  const trip = state.trips.find((item) => item.id === tripId)
  const vehicle = state.vehicles.find((item) => item.id === trip?.vehicleId)
  const deliveries = useMemo(() => deliveriesOf(state, tripId), [state, tripId])
  const expenses = useMemo(() => expensesOf(state, tripId), [state, tripId])
  const counts = deliveryCounts(deliveries)
  const byCategory = expenseTotalsByCategory(expenses)
  const editable = trip ? canEditTrip(trip) : false

  const [sheet, setSheet] = useState<'delivery' | 'expense' | 'finish' | null>(null)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | undefined>()

  if (!trip) {
    return (
      <div className="empty-hero">
        <h2>Viagem não encontrada</h2>
        <p>Ela pode ter sido removida ou ainda não sincronizada neste aparelho.</p>
      </div>
    )
  }

  const distance =
    trip.distanceKm ??
    (trip.kmEnd != null ? Number((trip.kmEnd - trip.kmStart).toFixed(1)) : undefined)

  return (
    <div className="page-stack">
      <header className="page-intro">
        <p className="home-section-label">Detalhe da viagem</p>
        <h1>{formatDateTime(trip.startedAt)}</h1>
        <p className="muted">
          {vehicle ? `${vehicle.plate} · ${vehicle.model}` : 'Veículo'} ·{' '}
          <span className={`badge badge-${trip.status}`}>{statusLabel(trip.status)}</span>
        </p>
        {trip.syncState === 'local' && (
          <p className="sync-pill">Salvo neste aparelho — ainda não confirmado no servidor</p>
        )}
        {trip.syncState === 'erro' && (
          <p className="form-error">Falha de envio: {trip.syncError ?? 'tente novamente quando houver internet.'}</p>
        )}
        {trip.correctionNotes && (
          <p className="form-error">Correção solicitada: {trip.correctionNotes}</p>
        )}
      </header>

      <div className="stats-row">
        <Card padding="sm">
          <p className="home-stat-label">KM inicial</p>
          <p className="home-stat-value">{trip.kmStart}</p>
        </Card>
        <Card padding="sm">
          <p className="home-stat-label">KM final</p>
          <p className="home-stat-value">{trip.kmEnd ?? '—'}</p>
        </Card>
        <Card padding="sm">
          <p className="home-stat-label">Distância</p>
          <p className="home-stat-value">{distance != null ? `${distance} km` : '—'}</p>
        </Card>
      </div>

      <Card padding="md">
        <div className="block-head">
          <h2>Resumo</h2>
        </div>
        <ul className="home-summary">
          <li>
            <span>Entregas</span>
            <strong>{counts.total}</strong>
          </li>
          <li>
            <span>Pendentes</span>
            <strong>{counts.pendente}</strong>
          </li>
          <li>
            <span>Despesas</span>
            <strong>{formatMoney(expenseTotal(expenses))}</strong>
          </li>
          <li>
            <span>Comprovantes faltando</span>
            <strong>
              {counts.proofMissing + expenses.filter((e) => e.proofPending || !e.proofDataUrl).length}
            </strong>
          </li>
        </ul>
      </Card>

      {editable && (
        <div className="ticket-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSelectedDelivery(undefined)
              setSheet('delivery')
            }}
          >
            Adicionar entrega
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setSheet('expense')}>
            Registrar gasto
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setSheet('finish')}>
            Finalizar viagem
          </button>
        </div>
      )}

      <section>
        <h2 className="home-section-label">Entregas</h2>
        <Card padding="md">
          {deliveries.length === 0 ? (
            <p className="muted">Nenhuma entrega ainda. Você pode adicionar depois de iniciar.</p>
          ) : (
            <ul className="home-routes">
              {deliveries.map((delivery) => (
                <li key={delivery.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDelivery(delivery)
                      setSheet('delivery')
                    }}
                  >
                    <span>
                      <strong>{delivery.clientName}</strong>
                      <small>
                        {delivery.address}
                        {delivery.proofRequired && !delivery.proofDataUrl ? ' · comprovante pendente' : ''}
                      </small>
                    </span>
                    <span className={`badge badge-${delivery.status}`}>{delivery.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className="home-section-label">Despesas</h2>
        <Card padding="md">
          {expenses.length === 0 ? (
            <p className="muted">Nenhum gasto registrado nesta viagem.</p>
          ) : (
            <>
              <ul className="home-summary">
                {Object.entries(byCategory).map(([cat, total]) => (
                  <li key={cat}>
                    <span>{categoryLabel[cat] ?? cat}</span>
                    <strong>{formatMoney(total)}</strong>
                  </li>
                ))}
              </ul>
              <ul className="home-routes">
                {expenses.map((expense) => (
                  <li key={expense.id}>
                    <button type="button">
                      <span>
                        <strong>
                          {categoryLabel[expense.category]} · {formatMoney(expense.amount)}
                        </strong>
                        <small>
                          {expense.expenseDate}
                          {expense.proofPending || !expense.proofDataUrl
                            ? ' · comprovante pendente'
                            : ' · comprovante ok'}
                          {expense.reviewStatus !== 'pendente' ? ` · ${expense.reviewStatus}` : ''}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </section>

      {sheet === 'delivery' && (
        <DeliverySheet
          tripId={tripId}
          delivery={selectedDelivery}
          onClose={() => {
            setSheet(null)
            setSelectedDelivery(undefined)
          }}
        />
      )}
      {sheet === 'expense' && <ExpenseSheet tripId={tripId} onClose={() => setSheet(null)} />}
      {sheet === 'finish' && (
        <FinishSheet tripId={tripId} onClose={() => setSheet(null)} onFinished={() => setSheet(null)} />
      )}
    </div>
  )
}

function statusLabel(status: string) {
  switch (status) {
    case 'em_andamento':
      return 'Em andamento'
    case 'aguardando_conferencia':
      return 'Aguardando conferência'
    case 'precisa_correcao':
      return 'Precisa de correção'
    case 'concluida':
      return 'Concluída'
    default:
      return status
  }
}
