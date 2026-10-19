import type { AppState, CheckItem, Stop, Trip } from './types'

export const driver = {
  nome: 'Carlos Mendes',
  primeiro: 'Carlos',
  iniciais: 'CM',
  matricula: '1042',
  senha: 'rota',
  telefone: '(11) 98821-4407',
  base: 'CD Guarulhos',
  cnh: '04938291022',
  categoria: 'C',
  validade: '12/2028',
  veiculo: 'Mercedes Sprinter 415',
  placa: 'RTA2B19',
  ano: '2022',
  capacidade: '12 m³',
}

export function todayISO(date = new Date()) {
  const copy = new Date(date)
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset())
  return copy.toISOString().slice(0, 10)
}

export function shiftISO(days: number, date = new Date()) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return todayISO(copy)
}

export function formatLongDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const text = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatShortDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)
}

function stop(
  id: string,
  cliente: string,
  endereco: string,
  bairro: string,
  janela: string,
  volumes: number,
  status: Stop['status'] = 'pendente',
  extra?: Pick<Stop, 'motivo' | 'nota'>,
): Stop {
  return { id, cliente, endereco, bairro, janela, volumes, status, ...extra }
}

export function createTrips(now = new Date()): Trip[] {
  const today = todayISO(now)
  const yesterday = shiftISO(-1, now)
  const tomorrow = shiftISO(1, now)

  return [
    {
      id: 't1',
      codigo: 'RT-1842',
      data: today,
      saida: '08:40',
      origem: 'CD Guarulhos',
      regiao: 'Zona Sul',
      veiculo: driver.veiculo,
      placa: driver.placa,
      km: 42,
      status: 'agendada',
      paradas: [
        stop('t1-s1', 'Padaria Estrela', 'Rua da Consolação, 1204', 'Consolação', '08:40–09:10', 4),
        stop('t1-s2', 'Mercado São José', 'Av. Santo Amaro, 880', 'Brooklin', '09:30–10:00', 8),
        stop('t1-s3', 'Clínica Vida', 'Rua Verbo Divino, 1400', 'Chácara Santo Antônio', '10:20–10:50', 2),
        stop('t1-s4', 'Escola Horizonte', 'Rua Domingos de Morais, 256', 'Vila Mariana', '11:10–11:40', 6),
        stop('t1-s5', 'Farmácia Central', 'Av. Indianópolis, 2100', 'Indianópolis', '12:00–12:30', 3),
        stop('t1-s6', 'Ateliê Lume', 'Rua Harmonia, 412', 'Vila Madalena', '13:00–13:40', 1),
      ],
    },
    {
      id: 't2',
      codigo: 'RT-1855',
      data: today,
      saida: '15:10',
      origem: 'CD Guarulhos',
      regiao: 'ABC',
      veiculo: driver.veiculo,
      placa: driver.placa,
      km: 36,
      status: 'agendada',
      paradas: [
        stop('t2-s1', 'Oficina Norte', 'Av. Industrial, 950', 'Santo André', '15:30–16:00', 5),
        stop('t2-s2', 'Mercado Bom Preço', 'Rua Coronel Oliveira Lima, 320', 'São Bernardo', '16:20–16:50', 7),
        stop('t2-s3', 'Clínica ABC', 'Av. Pereira Barreto, 110', 'São Bernardo', '17:10–17:40', 2),
        stop('t2-s4', 'Depósito Leste', 'Rua Giovanni Battista Pirelli, 880', 'Santo André', '18:00–18:30', 9),
      ],
    },
    {
      id: 't3',
      codigo: 'RT-1790',
      data: yesterday,
      saida: '07:50',
      origem: 'CD Guarulhos',
      regiao: 'Centro',
      veiculo: driver.veiculo,
      placa: driver.placa,
      km: 28,
      status: 'concluida',
      paradas: [
        stop('t3-s1', 'Livraria Página', 'Rua Augusta, 500', 'Consolação', '08:20–08:50', 3, 'entregue'),
        stop('t3-s2', 'Café do Largo', 'Rua Direita, 80', 'Sé', '09:10–09:40', 2, 'entregue'),
        stop('t3-s3', 'Escritório Atlas', 'Av. São João, 1500', 'República', '10:00–10:30', 4, 'ocorrencia', {
          motivo: 'Cliente ausente',
          nota: 'Porteiro pediu retorno amanhã cedo.',
        }),
        stop('t3-s4', 'Studio Norte', 'Rua Amaral Gurgel, 240', 'Santa Cecília', '11:00–11:30', 1, 'entregue'),
      ],
    },
    {
      id: 't4',
      codigo: 'RT-1902',
      data: tomorrow,
      saida: '09:00',
      origem: 'CD Guarulhos',
      regiao: 'Zona Leste',
      veiculo: driver.veiculo,
      placa: driver.placa,
      km: 31,
      status: 'agendada',
      paradas: [
        stop('t4-s1', 'Mercado Tatuapé', 'Rua Serra de Juruena, 200', 'Tatuapé', '09:30–10:00', 6),
        stop('t4-s2', 'Laboratório Sul', 'Av. Radial Leste, 3400', 'Penha', '10:30–11:00', 2),
        stop('t4-s3', 'Escola Parque', 'Rua Coelho Lisboa, 90', 'Tatuapé', '11:20–11:50', 5),
      ],
    },
  ]
}

export function createChecks(): CheckItem[] {
  return [
    { id: 'c1', grupo: 'Documentos', label: 'CNH em mãos', detalhe: 'Categoria C, dentro da validade', ok: null },
    { id: 'c2', grupo: 'Documentos', label: 'CRLV do veículo', detalhe: 'Documento da Sprinter RTA2B19', ok: null },
    { id: 'c3', grupo: 'Documentos', label: 'Celular carregado', detalhe: 'App e rota disponíveis offline', ok: true },
    { id: 'c4', grupo: 'Luzes', label: 'Faróis e lanternas', detalhe: 'Baixo, alto e luz de posição', ok: null },
    { id: 'c5', grupo: 'Luzes', label: 'Setas e pisca-alerta', detalhe: 'Dianteiras e traseiras', ok: null },
    { id: 'c6', grupo: 'Luzes', label: 'Freio e ré', detalhe: 'Acender com o pedal e a marcha', ok: null },
    { id: 'c7', grupo: 'Pneus', label: 'Calibragem', detalhe: 'Inclusive o estepe', ok: null },
    { id: 'c8', grupo: 'Pneus', label: 'Desgaste e estepe', detalhe: 'Sem bolha, corte ou sulco baixo', ok: null },
    { id: 'c9', grupo: 'Fluidos', label: 'Nível de óleo', detalhe: 'Entre as marcas da vareta', ok: null },
    { id: 'c10', grupo: 'Fluidos', label: 'Água e limpador', detalhe: 'Reservatório e palhetas', ok: null },
    { id: 'c11', grupo: 'Carga', label: 'Volumes conferidos', detalhe: 'Quantidade bate com a rota', ok: null },
    { id: 'c12', grupo: 'Carga', label: 'Portas e lacre', detalhe: 'Trava e lacre registrados', ok: null },
  ]
}

export function createInitialState(now = new Date()): AppState {
  return {
    loggedIn: false,
    trips: createTrips(now),
    checks: createChecks(),
  }
}

export const motivos = [
  'Cliente ausente',
  'Endereço não localizado',
  'Recusa do recebimento',
  'Avaria na carga',
  'Acesso impedido',
]
