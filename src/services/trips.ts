import { createId } from '../lib/id'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type {
  Client,
  Delivery,
  Expense,
  ExpenseCategory,
  Profile,
  Trip,
  TripEvent,
  Vehicle,
} from '../types'

function nowIso() {
  return new Date().toISOString()
}

function todayDate() {
  return nowIso().slice(0, 10)
}

export function ensureDriverSeed(profile: Profile): {
  profile: Profile
  vehicles: Vehicle[]
} {
  return {
    profile,
    vehicles: [
      {
        id: createId('veh'),
        plate: 'RTA2B19',
        model: 'Mercedes Sprinter 415',
        year: '2022',
        driverId: profile.id,
        active: true,
      },
      {
        id: createId('veh'),
        plate: 'BRA1C22',
        model: 'VW Delivery 11.180',
        year: '2021',
        driverId: profile.id,
        active: true,
      },
    ],
  }
}

export function createTrip(input: {
  driverId: string
  vehicleId: string
  kmStart: number
}): { trip: Trip; event: TripEvent } {
  const startedAt = nowIso()
  const trip: Trip = {
    id: createId('trip'),
    driverId: input.driverId,
    vehicleId: input.vehicleId,
    status: 'em_andamento',
    startedAt,
    kmStart: input.kmStart,
    createdAt: startedAt,
    updatedAt: startedAt,
    syncState: supabaseConfigured ? 'enviando' : 'local',
  }
  const event: TripEvent = {
    id: createId('evt'),
    tripId: trip.id,
    actorId: input.driverId,
    action: 'iniciar_viagem',
    detail: `KM inicial ${input.kmStart}`,
    createdAt: startedAt,
  }
  return { trip, event }
}

export function createDelivery(input: {
  tripId: string
  clientName: string
  address: string
  orderRef?: string
  notes?: string
  clientId?: string
}): Delivery {
  const stamp = nowIso()
  return {
    id: createId('del'),
    tripId: input.tripId,
    clientId: input.clientId,
    clientName: input.clientName.trim(),
    address: input.address.trim(),
    orderRef: input.orderRef?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    status: 'pendente',
    proofRequired: true,
    createdAt: stamp,
    updatedAt: stamp,
    syncState: supabaseConfigured ? 'enviando' : 'local',
  }
}

export function createClient(input: {
  name: string
  address: string
  createdBy?: string
}): Client {
  return {
    id: createId('cli'),
    name: input.name.trim(),
    address: input.address.trim(),
    createdBy: input.createdBy,
  }
}

export function createExpense(input: {
  tripId: string
  category: ExpenseCategory
  amount: number
  expenseDate?: string
  notes?: string
  proofDataUrl?: string
  proofPending?: boolean
  liters?: number
  pricePerLiter?: number
  odometer?: number
  stationName?: string
  clientRequestId?: string
}): Expense {
  const stamp = nowIso()
  const clientRequestId = input.clientRequestId ?? createId('req')
  return {
    id: createId('exp'),
    tripId: input.tripId,
    category: input.category,
    amount: Number(input.amount),
    expenseDate: input.expenseDate || todayDate(),
    notes: input.notes?.trim() || undefined,
    proofDataUrl: input.proofDataUrl,
    proofPending: Boolean(input.proofPending) || !input.proofDataUrl,
    reviewStatus: 'pendente',
    liters: input.liters,
    pricePerLiter: input.pricePerLiter,
    odometer: input.odometer,
    stationName: input.stationName?.trim() || undefined,
    createdAt: stamp,
    updatedAt: stamp,
    clientRequestId,
    syncState: supabaseConfigured ? 'enviando' : 'local',
  }
}

export function finishTrip(trip: Trip, kmEnd: number, actorId: string) {
  if (kmEnd < trip.kmStart) {
    throw new Error('A quilometragem final não pode ser menor que a inicial.')
  }
  if (trip.status !== 'em_andamento' && trip.status !== 'precisa_correcao') {
    throw new Error('Esta viagem já foi finalizada.')
  }
  const endedAt = nowIso()
  const distanceKm = Number((kmEnd - trip.kmStart).toFixed(1))
  const next: Trip = {
    ...trip,
    kmEnd,
    distanceKm,
    endedAt,
    status: 'aguardando_conferencia',
    updatedAt: endedAt,
    syncState: supabaseConfigured ? 'enviando' : 'local',
  }
  const event: TripEvent = {
    id: createId('evt'),
    tripId: trip.id,
    actorId,
    action: 'finalizar_viagem',
    detail: `KM final ${kmEnd} · ${distanceKm} km`,
    createdAt: endedAt,
  }
  return { trip: next, event }
}

export function approveTrip(trip: Trip, actorId: string) {
  const stamp = nowIso()
  return {
    trip: {
      ...trip,
      status: 'concluida' as const,
      updatedAt: stamp,
      syncState: (supabaseConfigured ? 'enviando' : 'local') as Trip['syncState'],
    },
    event: {
      id: createId('evt'),
      tripId: trip.id,
      actorId,
      action: 'aprovar_viagem',
      createdAt: stamp,
    } satisfies TripEvent,
  }
}

export function requestTripCorrection(trip: Trip, actorId: string, notes: string) {
  const stamp = nowIso()
  return {
    trip: {
      ...trip,
      status: 'precisa_correcao' as const,
      correctionNotes: notes.trim(),
      updatedAt: stamp,
      syncState: (supabaseConfigured ? 'enviando' : 'local') as Trip['syncState'],
    },
    event: {
      id: createId('evt'),
      tripId: trip.id,
      actorId,
      action: 'solicitar_correcao',
      detail: notes.trim(),
      createdAt: stamp,
    } satisfies TripEvent,
  }
}

export async function pushTripToSupabase(trip: Trip) {
  if (!supabase) return { ok: false as const, reason: 'offline' as const }
  const { error } = await supabase.from('trips').upsert({
    id: trip.id,
    driver_id: trip.driverId,
    vehicle_id: trip.vehicleId,
    status: trip.status,
    started_at: trip.startedAt,
    ended_at: trip.endedAt ?? null,
    km_start: trip.kmStart,
    km_end: trip.kmEnd ?? null,
    distance_km: trip.distanceKm ?? null,
    correction_notes: trip.correctionNotes ?? null,
    created_at: trip.createdAt,
    updated_at: trip.updatedAt,
  })
  if (error) return { ok: false as const, reason: error.message }
  return { ok: true as const }
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}
