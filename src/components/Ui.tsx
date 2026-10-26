import type { DeliveryStatus, TripStatus } from '../types'

const tripLabels: Record<TripStatus, string> = {
  em_andamento: 'Em andamento',
  aguardando_conferencia: 'Conferência',
  precisa_correcao: 'Correção',
  concluida: 'Concluída',
}

const deliveryLabels: Record<DeliveryStatus, string> = {
  pendente: 'Pendente',
  entregue: 'Entregue',
  ocorrencia: 'Ocorrência',
}

export function Badge({ status }: { status: TripStatus | DeliveryStatus | string }) {
  const label =
    (tripLabels as Record<string, string>)[status] ??
    (deliveryLabels as Record<string, string>)[status] ??
    status
  return <span className={`badge badge-${status}`}>{label}</span>
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
