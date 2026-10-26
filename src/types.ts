export type AppRole = 'motorista' | 'admin'

export type TripStatus =
  | 'rascunho'
  | 'aguardando_conferencia'
  | 'precisa_correcao'
  | 'concluida'
  | 'em_andamento' // legado — tratado como rascunho/editável na UI

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
  | { name: 'registrar'; id?: string }
  | { name: 'viagem'; id: string; from: 'hoje' | 'viagens' | 'admin' }
  | { name: 'perfil' }
  | { name: 'admin' }

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

export type TripAttachment = {
  id: string
  tripId: string
  description?: string
  proofDataUrl?: string
  proofPending: boolean
  createdAt: string
  updatedAt: string
  clientRequestId: string
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
  tripDate: string
  relato?: string
  startedAt: string
  endedAt?: string
  kmStart?: number
  kmEnd?: number
  distanceKm?: number
  correctionNotes?: string
  createdAt: string
  updatedAt: string
  syncState: SyncState
  syncError?: string
  clientRequestId: string
}

export type AppState = {
  session: {
    loggedIn: boolean
    profile: Profile | null
  }
  vehicles: Vehicle[]
  trips: Trip[]
  expenses: Expense[]
  attachments: TripAttachment[]
  events: TripEvent[]
}

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'login'; profile: Profile }
  | { type: 'logout' }
  | { type: 'upsert-vehicle'; vehicle: Vehicle }
  | { type: 'upsert-trip'; trip: Trip }
  | { type: 'upsert-expense'; expense: Expense }
  | { type: 'remove-expense'; id: string }
  | { type: 'upsert-attachment'; attachment: TripAttachment }
  | { type: 'remove-attachment'; id: string }
  | { type: 'add-event'; event: TripEvent }
  | { type: 'replace-all'; state: AppState }
