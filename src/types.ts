export type StopStatus = 'pendente' | 'em_rota' | 'entregue' | 'ocorrencia'

export type TripStatus = 'agendada' | 'em_andamento' | 'concluida'

export type Stop = {
  id: string
  cliente: string
  endereco: string
  bairro: string
  janela: string
  volumes: number
  status: StopStatus
  motivo?: string
  nota?: string
}

export type Trip = {
  id: string
  codigo: string
  data: string
  saida: string
  origem: string
  regiao: string
  veiculo: string
  placa: string
  km: number
  status: TripStatus
  paradas: Stop[]
}

export type CheckItem = {
  id: string
  grupo: string
  label: string
  detalhe: string
  ok: boolean | null
}

export type AppState = {
  loggedIn: boolean
  trips: Trip[]
  checks: CheckItem[]
}

export type Screen =
  | { name: 'hoje' }
  | { name: 'viagens' }
  | { name: 'checklist' }
  | { name: 'perfil' }
  | { name: 'viagem'; id: string; from: 'hoje' | 'viagens' }

export type Action =
  | { type: 'login' }
  | { type: 'logout' }
  | { type: 'start-trip'; tripId: string }
  | { type: 'deliver-stop'; tripId: string; stopId: string }
  | { type: 'report-stop'; tripId: string; stopId: string; motivo: string; nota: string }
  | { type: 'finish-trip'; tripId: string }
  | { type: 'set-check'; id: string; value: boolean }
  | { type: 'reset' }
