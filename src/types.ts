export type AppRole = 'motorista' | 'admin'

export type TripStatus =
  | 'em_andamento'
  | 'aguardando_conferencia'
  | 'precisa_correcao'
  | 'concluida'

export type DeliveryStatus = 'pendente' | 'entregue' | 'ocorrencia'

export type ExpenseCategory =
  | 'combustivel'
  | 'pedagio'
  | 'estacionamento'
  | 'manutencao'
  | 'outros'

export type ExpenseReview = 'pendente' | 'aprovada' | 'rejeitada'

export type SyncState = 'local' | 'enviando' | 'sincronizado' | 'erro'

export type Screen =
  | { name: 'hoje' }
  | { name: 'viagens' }
  | { name: 'viagem'; id: string; from: 'hoje' | 'viagens' | 'admin' }
  | { name: 'perfil' }
  | { name: 'admin' }
  | { name: 'iniciar' }

export type Profile = {
  id: string
  nome: string
  matricula: string
  role: AppRole
  telefone?: string
}

export type Vehicle = {
  id: string
  plate: string
  model: string
  year?: string
  driverId: string
  active: boolean
}

export type Client = {
  id: string
  name: string
  address: string
  createdBy?: string
}

export type Delivery = {
  id: string
  tripId: string
  clientId?: string
  clientName: string
  address: string
  orderRef?: string
  notes?: string
  status: DeliveryStatus
  occurrenceReason?: string
  proofDataUrl?: string
  proofRequired: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
  syncState: SyncState
  syncError?: string
}

export type Expense = {
  id: string
  tripId: string
  category: ExpenseCategory
  amount: number
  expenseDate: string
  notes?: string
  proofDataUrl?: string
  proofPending: boolean
  reviewStatus: ExpenseReview
  reviewNotes?: string
  liters?: number
  pricePerLiter?: number
  odometer?: number
  stationName?: string
  createdAt: string
  updatedAt: string
  clientRequestId: string
  syncState: SyncState
  syncError?: string
}

export type TripEvent = {
  id: string
  tripId: string
  actorId?: string
  action: string
  detail?: string
  createdAt: string
}

export type Trip = {
  id: string
  driverId: string
  vehicleId: string
  status: TripStatus
  startedAt: string
  endedAt?: string
  kmStart: number
  kmEnd?: number
  distanceKm?: number
  correctionNotes?: string
  createdAt: string
  updatedAt: string
  syncState: SyncState
  syncError?: string
}

export type AppState = {
  session: {
    loggedIn: boolean
    profile: Profile | null
  }
  vehicles: Vehicle[]
  clients: Client[]
  trips: Trip[]
  deliveries: Delivery[]
  expenses: Expense[]
  events: TripEvent[]
}

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'login'; profile: Profile }
  | { type: 'logout' }
  | { type: 'upsert-vehicle'; vehicle: Vehicle }
  | { type: 'upsert-client'; client: Client }
  | { type: 'upsert-trip'; trip: Trip }
  | { type: 'upsert-delivery'; delivery: Delivery }
  | { type: 'upsert-expense'; expense: Expense }
  | { type: 'add-event'; event: TripEvent }
  | { type: 'replace-all'; state: AppState }

/** @deprecated kept for older checklist pages during transition */
export type StopStatus = DeliveryStatus | 'em_rota'
export type CheckItem = {
  id: string
  grupo: string
  label: string
  detalhe: string
  ok: boolean | null
}
