import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { formatDateTime, formatMoney } from '../data'
import { attachmentsOf, deliveriesOf, expenseTotal, expensesOf } from '../logic'
import { approveTrip, requestTripCorrection } from '../services/trips'
import { useStore } from '../store'
import type { Expense } from '../types'

type Props = {
  onOpen: (id: string) => void
}

function driverLabel(driverId: string) {
  if (driverId === 'driver_demo_1042') return 'Carlos Mendes'
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
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.trips],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = state.trips.find((t) => t.id === (selectedId ?? queue[0]?.id)) ?? null
  const vehicle = selected ? state.vehicles.find((v) => v.id === selected.vehicleId) : null
  const expenses = selected ? expensesOf(state, selected.id) : []
  const attachments = selected ? attachmentsOf(state, selected.id) : []
  const deliveries = selected ? deliveriesOf(state, selected.id) : []
  const events = selected
    ? state.events
        .filter((e) => e.tripId === selected.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : []

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="empty-hero">
        <h2>Acesso restrito</h2>
        <p>Apenas administradores conferem registros.</p>
      </div>
    )
  }

  const approve = () => {
    if (!selected) return
    const result = approveTrip(selected, profile.id)
    dispatch({ type: 'upsert-trip', trip: result.trip })
    dispatch({ type: 'add-event', event: result.event })
    notify('Viagem aprovada. Despesas seguem com revisão individual.')
  }

  const requestFix = () => {
    if (!selected) return
    const notes = window.prompt('Descreva o que o motorista precisa corrigir')
    if (!notes?.trim()) return
    const result = requestTripCorrection(selected, profile.id, notes)
    dispatch({ type: 'upsert-trip', trip: result.trip })
    dispatch({ type: 'add-event', event: result.event })
    notify('Registro devolvido para correção.')
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
        <h1>Conferência</h1>
        <p className="muted">Aprovar a viagem não aprova automaticamente cada despesa.</p>
      </header>

      <div className="admin-grid">
        <Card padding="md">
          <h2>Fila</h2>
          {queue.length === 0 ? (
            <p className="muted">Nenhum registro aguardando.</p>
          ) : (
            <ul className="home-routes">
              {queue.map((trip) => (
                <li key={trip.id}>
                  <button type="button" onClick={() => setSelectedId(trip.id)}>
                    <span>
                      <strong>{trip.tripDate}</strong>
                      <small>
                        {driverLabel(trip.driverId)} · {formatMoney(expenseTotal(expensesOf(state, trip.id)))}
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
          <Card padding="md">
            <div className="block-head">
              <h2>Detalhe</h2>
              <button type="button" className="text-btn" onClick={() => onOpen(selected.id)}>
                Abrir
              </button>
            </div>
            <p>
              <strong>{driverLabel(selected.driverId)}</strong>
              {vehicle ? ` · ${vehicle.plate}` : ''}
            </p>
            <p className="muted">
              {selected.tripDate} · KM {selected.kmStart ?? '—'} → {selected.kmEnd ?? '—'} (
              {selected.distanceKm ?? '—'} km)
            </p>
            {selected.relato && <p style={{ whiteSpace: 'pre-wrap' }}>{selected.relato}</p>}
            <p>
              Entregas: {deliveries.length} · Despesas: {formatMoney(expenseTotal(expenses))} ·
              Anexos: {attachments.length}
            </p>

            {deliveries.length > 0 && (
              <>
                <h3 className="subhead">Entregas</h3>
                <ul className="home-routes">
                  {deliveries.map((item) => (
                    <li key={item.id}>
                      <button type="button">
                        <span>
                          <strong>{item.clientName}</strong>
                          <small>
                            {item.address || 'Sem endereço'} · {item.status}
                          </small>
                        </span>
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

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
                        {expense.proofPending || !expense.proofDataUrl ? ' · comprovante pendente' : ''}
                      </small>
                    </span>
                    <span className="admin-expense-actions">
                      <button type="button" className="chip" onClick={() => reviewExpense(expense, 'aprovada')}>
                        Aprovar
                      </button>
                      <button type="button" className="chip" onClick={() => reviewExpense(expense, 'rejeitada')}>
                        Rejeitar
                      </button>
                    </span>
                  </div>
                </li>
              ))}
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
