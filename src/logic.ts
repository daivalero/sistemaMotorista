import type { Action, AppState, Delivery, Expense, Trip } from './types'

export function tripDistance(trip: Trip) {
  if (trip.kmEnd == null) return undefined
  return Math.max(0, Number((trip.kmEnd - trip.kmStart).toFixed(1)))
}

export function deliveriesOf(state: AppState, tripId: string) {
  return state.deliveries.filter((item) => item.tripId === tripId)
}

export function expensesOf(state: AppState, tripId: string) {
  return state.expenses.filter((item) => item.tripId === tripId)
}

export function expenseTotal(expenses: Expense[]) {
  return expenses.reduce((sum, item) => sum + item.amount, 0)
}

export function expenseTotalsByCategory(expenses: Expense[]) {
  return expenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount
    return acc
  }, {})
}

export function deliveryCounts(deliveries: Delivery[]) {
  return {
    total: deliveries.length,
    pendente: deliveries.filter((d) => d.status === 'pendente').length,
    entregue: deliveries.filter((d) => d.status === 'entregue').length,
    ocorrencia: deliveries.filter((d) => d.status === 'ocorrencia').length,
    proofMissing: deliveries.filter(
      (d) => d.proofRequired && !d.proofDataUrl && d.status === 'entregue',
    ).length,
  }
}

export function expenseProofMissing(expenses: Expense[]) {
  return expenses.filter((e) => e.proofPending || (!e.proofDataUrl && e.category === 'combustivel'))
    .length
}

export function canEditTrip(trip: Trip) {
  return trip.status === 'em_andamento' || trip.status === 'precisa_correcao'
}

export function activeTripForDriver(state: AppState, driverId: string) {
  return state.trips.find(
    (trip) => trip.driverId === driverId && trip.status === 'em_andamento',
  )
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
      return {
        ...state,
        session: { loggedIn: true, profile: action.profile },
      }
    case 'logout':
      return {
        ...state,
        session: { loggedIn: false, profile: null },
      }
    case 'upsert-vehicle':
      return { ...state, vehicles: upsert(state.vehicles, action.vehicle) }
    case 'upsert-client':
      return { ...state, clients: upsert(state.clients, action.client) }
    case 'upsert-trip':
      return { ...state, trips: upsert(state.trips, action.trip) }
    case 'upsert-delivery':
      return { ...state, deliveries: upsert(state.deliveries, action.delivery) }
    case 'upsert-expense': {
      const byRequest = state.expenses.find(
        (item) => item.clientRequestId === action.expense.clientRequestId,
      )
      if (byRequest && byRequest.id !== action.expense.id) {
        return state
      }
      return { ...state, expenses: upsert(state.expenses, action.expense) }
    }
    case 'add-event':
      return { ...state, events: [...state.events, action.event] }
    default:
      return state
  }
}
