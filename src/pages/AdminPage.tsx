import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { formatDateTime, formatMoney } from '../data'
import { deliveriesOf, expenseTotal, expensesOf } from '../logic'
import { approveTrip, requestTripCorrection } from '../services/trips'
import { useStore } from '../store'
import type { Expense } from '../types'

type Props = {
  onOpen: (id: string) => void
}

function driverLabel(driverId: string, currentName?: string) {
  if (driverId === 'driver_demo_1042') return 'Carlos Mendes'
  if (currentName && driverId.startsWith('driver')) return currentName
  return driverId
}

export function AdminPage({ onOpen }: Props) {
  const { state, dispatch, notify } = useStore()
  const profile = state.session.profile
  const queue = useMemo(
    () =>
      state.trips
        .filter(
          (trip) =>
            trip.status === 'aguardando_conferencia' || trip.status === 'precisa_correcao',
        )
        .sort((a, b) => (b.endedAt ?? b.startedAt).localeCompare(a.endedAt ?? a.startedAt)),
    [state.trips],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = state.trips.find((t) => t.id === (selectedId ?? queue[0]?.id)) ?? null
  const vehicle = selected ? state.vehicles.find((v) => v.id === selected.vehicleId) : null
  const deliveries = selected ? deliveriesOf(state, selected.id) : []
  const expenses = selected ? expensesOf(state, selected.id) : []
  const events = selected
    ? state.events.filter((e) => e.tripId === selected.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : []

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="empty-hero">
        <h2>Acesso restrito</h2>
        <p>Apenas administradores conferem viagens.</p>
      </div>
    )
  }

  const approve = () => {
    if (!selected) return
    const result = approveTrip(selected, profile.id)
    dispatch({ type: 'upsert-trip', trip: result.trip })
    dispatch({ type: 'add-event', event: result.event })
    notify('Viagem aprovada como concluída. Despesas seguem com revisão individual.')
  }

  const requestFix = () => {
    if (!selected) return
    const notes = window.prompt('Descreva o que o motorista precisa corrigir')
    if (!notes?.trim()) return
    const result = requestTripCorrection(selected, profile.id, notes)
    dispatch({ type: 'upsert-trip', trip: result.trip })
    dispatch({ type: 'add-event', event: result.event })
    notify('Viagem devolvida ao motorista para correção.')
  }

  const reviewExpense = (expense: Expense, status: Expense['reviewStatus']) => {
    const reviewNotes =
      status === 'rejeitada' ? window.prompt('Motivo da rejeição') ?? '' : (expense.reviewNotes ?? '')
    if (status === 'rejeitada' && !reviewNotes.trim()) return
    dispatch({
      type: 'upsert-expense',
      expense: {
        ...expense,
        reviewStatus: status,
        reviewNotes: reviewNotes || undefined,
        updatedAt: new Date().toISOString(),
      },
    })
    notify(status === 'aprovada' ? 'Despesa aprovada.' : 'Despesa rejeitada.')
  }

  return (
    <div className="page-stack">
      <header className="page-intro">
        <p className="home-section-label">Administração</p>
        <h1>Conferência de viagens</h1>
        <p className="muted">
          Aprovar a viagem não aprova automaticamente cada despesa — revise uma a uma.
        </p>
      </header>

      <div className="admin-grid">
        <Card padding="md">
          <h2>Fila</h2>
          {queue.length === 0 ? (
            <p className="muted">Nenhuma viagem aguardando conferência.</p>
          ) : (
            <ul className="home-routes">
              {queue.map((trip) => (
                <li key={trip.id}>
                  <button type="button" onClick={() => setSelectedId(trip.id)}>
                    <span>
                      <strong>{formatDateTime(trip.endedAt ?? trip.startedAt)}</strong>
                      <small>
                        {driverLabel(trip.driverId)} · {trip.distanceKm ?? '—'} km ·{' '}
                        {deliveriesOf(state, trip.id).length} entregas
                      </small>
                    </span>
                    <span className={`badge badge-${trip.status}`}>{trip.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {selected && (
          <Card padding="md" className="admin-detail">
            <div className="block-head">
              <h2>Detalhe</h2>
              <button type="button" className="text-btn" onClick={() => onOpen(selected.id)}>
                Abrir completa
              </button>
            </div>
            <p>
              <strong>{driverLabel(selected.driverId)}</strong>
              {vehicle ? ` · ${vehicle.plate}` : ''}
            </p>
            <p className="muted">
              Início {formatDateTime(selected.startedAt)} · Fim {formatDateTime(selected.endedAt)} ·
              KM {selected.kmStart} → {selected.kmEnd ?? '—'} ({selected.distanceKm ?? '—'} km)
            </p>
            <p>Despesas: {formatMoney(expenseTotal(expenses))}</p>

            <h3 className="subhead">Entregas</h3>
            <ul className="home-summary">
              {deliveries.map((d) => (
                <li key={d.id}>
                  <span>
                    {d.clientName} · {d.status}
                    {d.proofRequired && !d.proofDataUrl ? ' · sem comprovante' : ''}
                  </span>
                </li>
              ))}
              {deliveries.length === 0 && <li><span>Nenhuma entrega</span></li>}
            </ul>

            <h3 className="subhead">Despesas</h3>
            <ul className="home-routes">
              {expenses.map((expense) => (
                <li key={expense.id}>
                  <div className="admin-expense">
                    <span>
                      <strong>
                        {expense.category} · {formatMoney(expense.amount)}
                      </strong>
                      <small>
                        {expense.reviewStatus}
                        {expense.proofPending || !expense.proofDataUrl
                          ? ' · comprovante pendente'
                          : ''}
                      </small>
                    </span>
                    <span className="admin-expense-actions">
                      <button
                        type="button"
                        className="chip"
                        onClick={() => reviewExpense(expense, 'aprovada')}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className="chip"
                        onClick={() => reviewExpense(expense, 'rejeitada')}
                      >
                        Rejeitar
                      </button>
                    </span>
                  </div>
                </li>
              ))}
              {expenses.length === 0 && (
                <li>
                  <button type="button">
                    <span>
                      <strong>Sem despesas</strong>
                    </span>
                  </button>
                </li>
              )}
            </ul>

            <h3 className="subhead">Histórico</h3>
            <ul className="home-summary">
              {events.map((event) => (
                <li key={event.id}>
                  <span>
                    {formatDateTime(event.createdAt)} · {event.action}
                    {event.detail ? ` — ${event.detail}` : ''}
                  </span>
                </li>
              ))}
              {events.length === 0 && (
                <li>
                  <span>Sem eventos</span>
                </li>
              )}
            </ul>

            <div className="ticket-actions">
              <button type="button" className="btn btn-primary" onClick={approve}>
                Aprovar viagem
              </button>
              <button type="button" className="btn btn-ghost" onClick={requestFix}>
                Solicitar correção
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
