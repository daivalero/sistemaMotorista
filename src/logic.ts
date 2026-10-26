import type { Action, AppState, Delivery, Expense, Trip, TripAttachment } from './types'

export function tripDistance(trip: Trip) {
  if (trip.kmStart == null || trip.kmEnd == null) return undefined
  return Math.max(0, Number((trip.kmEnd - trip.kmStart).toFixed(1)))
}

export function deliveriesOf(state: AppState, tripId: string) {
  return state.deliveries.filter((item) => item.tripId === tripId)
}

export function expensesOf(state: AppState, tripId: string) {
  return state.expenses.filter((item) => item.tripId === tripId)
}

export function attachmentsOf(state: AppState, tripId: string) {
  return state.attachments.filter((item) => item.tripId === tripId)
}

export function expenseTotal(expenses: Expense[]) {
  return expenses.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0)
}

export function expenseTotalsByCategory(expenses: Expense[]) {
  return expenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount
    return acc
  }, {})
}

export function canEditTrip(trip: Trip) {
  return trip.status === 'rascunho' || trip.status === 'em_andamento' || trip.status === 'precisa_correcao'
}

export function pendingProofs(
  expenses: Expense[],
  attachments: TripAttachment[],
  deliveries: Delivery[] = [],
) {
  const expensePending = expenses.filter((e) => e.proofPending || !e.proofDataUrl).length
  const attachmentPending = attachments.filter((a) => a.proofPending || !a.proofDataUrl).length
  const deliveryPending = deliveries.filter(
    (d) => d.status === 'entregue' && (d.proofPending || !d.proofDataUrl),
  ).length
  return expensePending + attachmentPending + deliveryPending
}

function upsert<T extends { id: string }>(list: T[], item: T) {
  const idx = list.findIndex((row) => row.id === item.id)
  if (idx === -1) return [...list, item]
  const next = list.slice()
  next[idx] = item
  return next
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
    case 'replace-all':
      return action.state
    case 'login':
      return { ...state, session: { loggedIn: true, profile: action.profile } }
    case 'logout':
      return { ...state, session: { loggedIn: false, profile: null } }
    case 'upsert-vehicle':
      return { ...state, vehicles: upsert(state.vehicles, action.vehicle) }
    case 'upsert-trip': {
      const byRequest = state.trips.find(
        (item) => item.clientRequestId === action.trip.clientRequestId && item.id !== action.trip.id,
      )
      if (byRequest) return state
      return { ...state, trips: upsert(state.trips, action.trip) }
    }
    case 'upsert-delivery': {
      const byRequest = state.deliveries.find(
        (item) =>
          item.clientRequestId === action.delivery.clientRequestId && item.id !== action.delivery.id,
      )
      if (byRequest) return state
      return { ...state, deliveries: upsert(state.deliveries, action.delivery) }
    }
    case 'remove-delivery':
      return { ...state, deliveries: state.deliveries.filter((item) => item.id !== action.id) }
    case 'upsert-expense': {
      const byRequest = state.expenses.find(
        (item) => item.clientRequestId === action.expense.clientRequestId && item.id !== action.expense.id,
      )
      if (byRequest) return state
      return { ...state, expenses: upsert(state.expenses, action.expense) }
    }
    case 'remove-expense':
      return { ...state, expenses: state.expenses.filter((item) => item.id !== action.id) }
    case 'upsert-attachment': {
      const byRequest = state.attachments.find(
        (item) =>
          item.clientRequestId === action.attachment.clientRequestId &&
          item.id !== action.attachment.id,
      )
      if (byRequest) return state
      return { ...state, attachments: upsert(state.attachments, action.attachment) }
    }
    case 'remove-attachment':
      return { ...state, attachments: state.attachments.filter((item) => item.id !== action.id) }
    case 'add-event':
      return { ...state, events: [...state.events, action.event] }
    default:
      return state
  }
}
