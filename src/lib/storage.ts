import type { AppState } from '../types'

export const STORAGE_KEY = 'braulio-viagens-v2'

export function emptyState(): AppState {
  return {
    session: { loggedIn: false, profile: null },
    vehicles: [],
    clients: [],
    trips: [],
    deliveries: [],
    expenses: [],
    events: [],
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed?.session || !Array.isArray(parsed.trips)) return emptyState()
    return {
      ...emptyState(),
      ...parsed,
      session: {
        loggedIn: Boolean(parsed.session.loggedIn),
        profile: parsed.session.profile ?? null,
      },
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
