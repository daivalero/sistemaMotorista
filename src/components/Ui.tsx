import type { StopStatus, TripStatus } from '../types'

const labels: Record<TripStatus | StopStatus, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  pendente: 'Pendente',
  em_rota: 'Agora',
  entregue: 'Entregue',
  ocorrencia: 'Ocorrência',
}

export function Badge({ status }: { status: TripStatus | StopStatus }) {
  return <span className={`badge badge-${status}`}>{labels[status]}</span>
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${value} de ${max}`}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}
