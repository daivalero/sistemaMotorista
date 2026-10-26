import type { AppState } from '../types'

export const STORAGE_KEY = 'braulio-viagens-v3'

export function emptyState(): AppState {
  return {
    session: { loggedIn: false, profile: null },
    vehicles: [],
    trips: [],
    expenses: [],
    attachments: [],
    events: [],
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // migrate from v2 if present
      const legacy = localStorage.getItem('braulio-viagens-v2')
      if (!legacy) return emptyState()
      const parsed = JSON.parse(legacy) as Partial<AppState> & {
        deliveries?: unknown
        clients?: unknown
        trips?: Array<Record<string, unknown>>
      }
      return normalizeLoaded(parsed)
    }
    return normalizeLoaded(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

function normalizeLoaded(parsed: Partial<AppState> & { trips?: Array<Record<string, unknown>> }): AppState {
  const base = emptyState()
  const trips = (parsed.trips ?? []).map((trip) => {
    const startedAt = String(trip.startedAt ?? new Date().toISOString())
    return {
      id: String(trip.id),
      driverId: String(trip.driverId),
      vehicleId: String(trip.vehicleId),
      status: (trip.status as AppState['trips'][number]['status']) ?? 'rascunho',
      tripDate: String(trip.tripDate ?? startedAt.slice(0, 10)),
      relato: trip.relato ? String(trip.relato) : undefined,
      startedAt,
      endedAt: trip.endedAt ? String(trip.endedAt) : undefined,
      kmStart: trip.kmStart == null ? undefined : Number(trip.kmStart),
      kmEnd: trip.kmEnd == null ? undefined : Number(trip.kmEnd),
      distanceKm: trip.distanceKm == null ? undefined : Number(trip.distanceKm),
      correctionNotes: trip.correctionNotes ? String(trip.correctionNotes) : undefined,
      createdAt: String(trip.createdAt ?? startedAt),
      updatedAt: String(trip.updatedAt ?? startedAt),
      syncState: (trip.syncState as AppState['trips'][number]['syncState']) ?? 'local',
      syncError: trip.syncError ? String(trip.syncError) : undefined,
      clientRequestId: String(trip.clientRequestId ?? trip.id),
    }
  })

  return {
    ...base,
    ...parsed,
    session: {
      loggedIn: Boolean(parsed.session?.loggedIn),
      profile: parsed.session?.profile ?? null,
    },
    vehicles: parsed.vehicles ?? [],
    trips,
    expenses: parsed.expenses ?? [],
    attachments: parsed.attachments ?? [],
    events: parsed.events ?? [],
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
