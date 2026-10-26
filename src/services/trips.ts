import { createId } from '../lib/id'
import { supabaseConfigured } from '../lib/supabase'
import type {
  Expense,
  ExpenseCategory,
  Profile,
  Trip,
  TripAttachment,
  TripEvent,
  TripStatus,
  Vehicle,
} from '../types'
import { tripDistance } from '../logic'

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

export type TripFormExpense = {
  localKey: string
  id?: string
  clientRequestId: string
  category: ExpenseCategory
  amount: string
  expenseDate: string
  notes: string
  proofDataUrl?: string
  proofPending: boolean
}

export type TripFormAttachment = {
  localKey: string
  id?: string
  clientRequestId: string
  description: string
  proofDataUrl?: string
  proofPending: boolean
}

export function buildTripFromForm(input: {
  existing?: Trip
  driverId: string
  vehicleId: string
  tripDate: string
  kmStart?: number
  kmEnd?: number
  relato?: string
  status: Extract<TripStatus, 'rascunho' | 'aguardando_conferencia'>
  clientRequestId: string
}): { trip: Trip; event: TripEvent } {
  const stamp = nowIso()
  const startedAt = input.existing?.startedAt ?? `${input.tripDate}T12:00:00.000Z`
  const trip: Trip = {
    id: input.existing?.id ?? createId('trip'),
    driverId: input.driverId,
    vehicleId: input.vehicleId,
    status: input.status,
    tripDate: input.tripDate,
    relato: input.relato?.trim() || undefined,
    startedAt,
    endedAt:
      input.status === 'aguardando_conferencia' ? stamp : input.existing?.endedAt,
    kmStart: input.kmStart,
    kmEnd: input.kmEnd,
    distanceKm: undefined,
    correctionNotes: input.existing?.correctionNotes,
    createdAt: input.existing?.createdAt ?? stamp,
    updatedAt: stamp,
    syncState: supabaseConfigured ? 'enviando' : 'local',
    clientRequestId: input.clientRequestId,
  }
  trip.distanceKm = tripDistance(trip)

  const event: TripEvent = {
    id: createId('evt'),
    tripId: trip.id,
    actorId: input.driverId,
    action: input.status === 'rascunho' ? 'salvar_rascunho' : 'salvar_registro',
    detail: `Data ${input.tripDate}`,
    createdAt: stamp,
  }
  return { trip, event }
}

export function expenseFromForm(
  tripId: string,
  row: TripFormExpense,
): Expense {
  const stamp = nowIso()
  const amount = Number(String(row.amount).replace(',', '.'))
  return {
    id: row.id ?? createId('exp'),
    tripId,
    category: row.category,
    amount: Number.isFinite(amount) ? amount : 0,
    expenseDate: row.expenseDate || todayDate(),
    notes: row.notes.trim() || undefined,
    proofDataUrl: row.proofDataUrl,
    proofPending: row.proofPending || !row.proofDataUrl,
    reviewStatus: 'pendente',
    createdAt: stamp,
    updatedAt: stamp,
    clientRequestId: row.clientRequestId,
    syncState: supabaseConfigured ? 'enviando' : 'local',
  }
}

export function attachmentFromForm(
  tripId: string,
  row: TripFormAttachment,
): TripAttachment {
  const stamp = nowIso()
  return {
    id: row.id ?? createId('att'),
    tripId,
    description: row.description.trim() || undefined,
    proofDataUrl: row.proofDataUrl,
    proofPending: row.proofPending || !row.proofDataUrl,
    createdAt: stamp,
    updatedAt: stamp,
    clientRequestId: row.clientRequestId,
    syncState: supabaseConfigured ? 'enviando' : 'local',
  }
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

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

export function newFormKey(prefix: string) {
  return createId(prefix)
}
