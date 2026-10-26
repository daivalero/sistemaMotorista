import type { TripStatus } from '../types'

const tripLabels: Record<TripStatus, string> = {
  rascunho: 'Rascunho',
  em_andamento: 'Rascunho',
  aguardando_conferencia: 'Enviado',
  precisa_correcao: 'Correção',
  concluida: 'Concluída',
}

export function Badge({ status }: { status: TripStatus | string }) {
  const label = (tripLabels as Record<string, string>)[status] ?? status
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
