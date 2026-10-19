import { createInitialState } from './data'
import type { Action, AppState, Trip } from './types'

export function countDone(trip: Trip) {
  return trip.paradas.filter((stop) => stop.status === 'entregue' || stop.status === 'ocorrencia').length
}

export function tripOpen(trip: Trip) {
  return trip.paradas.some((stop) => stop.status === 'pendente' || stop.status === 'em_rota')
}

export function canFinish(trip: Trip) {
  return trip.status === 'em_andamento' && !tripOpen(trip)
}

function promoteNext(trip: Trip): Trip {
  const hasActive = trip.paradas.some((stop) => stop.status === 'em_rota')
  if (hasActive) return trip
  let promoted = false
  const paradas = trip.paradas.map((stop) => {
    if (!promoted && stop.status === 'pendente') {
      promoted = true
      return { ...stop, status: 'em_rota' as const }
    }
    return stop
  })
  return { ...trip, paradas }
}

function patchTrip(state: AppState, tripId: string, update: (trip: Trip) => Trip): AppState {
  return {
    ...state,
    trips: state.trips.map((trip) => (trip.id === tripId ? update(trip) : trip)),
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'login':
      return { ...state, loggedIn: true }
    case 'logout':
      return { ...state, loggedIn: false }
    case 'reset':
      return { ...createInitialState(), loggedIn: true }
    case 'set-check':
      return {
        ...state,
        checks: state.checks.map((item) =>
          item.id === action.id ? { ...item, ok: action.value } : item,
        ),
      }
    case 'start-trip':
      return patchTrip(state, action.tripId, (trip) => {
        if (trip.status === 'concluida') return trip
        return promoteNext({ ...trip, status: 'em_andamento' })
      })
    case 'deliver-stop':
      return patchTrip(state, action.tripId, (trip) => {
        const paradas = trip.paradas.map((stop) =>
          stop.id === action.stopId
            ? { ...stop, status: 'entregue' as const, motivo: undefined, nota: undefined }
            : stop,
        )
        return promoteNext({ ...trip, status: 'em_andamento', paradas })
      })
    case 'report-stop':
      return patchTrip(state, action.tripId, (trip) => {
        const paradas = trip.paradas.map((stop) =>
          stop.id === action.stopId
            ? { ...stop, status: 'ocorrencia' as const, motivo: action.motivo, nota: action.nota }
            : stop,
        )
        return promoteNext({ ...trip, status: 'em_andamento', paradas })
      })
    case 'finish-trip':
      return patchTrip(state, action.tripId, (trip) => {
        if (tripOpen(trip)) return trip
        return { ...trip, status: 'concluida' }
      })
    default:
      return state
  }
}

export function pickFeatured(trips: Trip[], today: string) {
  const active = trips.find((trip) => trip.status === 'em_andamento')
  if (active) return active
  return trips
    .filter((trip) => trip.status === 'agendada' && trip.data >= today)
    .sort((a, b) => (a.data + a.saida).localeCompare(b.data + b.saida))[0]
}
