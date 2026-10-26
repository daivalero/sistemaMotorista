import { useState, type FormEvent } from 'react'
import { formatMoney } from '../../data'
import {
  deliveryCounts,
  deliveriesOf,
  expenseProofMissing,
  expenseTotal,
  expenseTotalsByCategory,
  expensesOf,
} from '../../logic'
import { finishTrip } from '../../services/trips'
import { useStore } from '../../store'

const categoryLabel: Record<string, string> = {
  combustivel: 'Combustível',
  pedagio: 'Pedágio',
  estacionamento: 'Estacionamento',
  manutencao: 'Manutenção',
  outros: 'Outros',
}

type Props = {
  tripId: string
  onClose: () => void
  onFinished: () => void
}

export function FinishSheet({ tripId, onClose, onFinished }: Props) {
  const { state, dispatch, notify } = useStore()
  const trip = state.trips.find((t) => t.id === tripId)
  const profile = state.session.profile
  const deliveries = deliveriesOf(state, tripId)
  const expenses = expensesOf(state, tripId)
  const counts = deliveryCounts(deliveries)
  const byCategory = expenseTotalsByCategory(expenses)
  const missingProofs = expenseProofMissing(expenses) + counts.proofMissing

  const [kmEnd, setKmEnd] = useState('')
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [force, setForce] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!trip || !profile) return null

  const distance =
    Number.isFinite(Number(kmEnd.replace(',', '.'))) && kmEnd
      ? Number((Number(kmEnd.replace(',', '.')) - trip.kmStart).toFixed(1))
      : null

  const goReview = (event: FormEvent) => {
    event.preventDefault()
    const km = Number(kmEnd.replace(',', '.'))
    if (!Number.isFinite(km)) {
      setError('Informe a quilometragem final.')
      return
    }
    if (km < trip.kmStart) {
      setError('A quilometragem final não pode ser menor que a inicial.')
      return
    }
    setError('')
    setStep('review')
  }

  const confirm = () => {
    if (busy) return
    if ((counts.pendente > 0 || missingProofs > 0) && !force) {
      setError('Há pendências. Marque a confirmação explícita para finalizar assim mesmo.')
      return
    }
    setBusy(true)
    try {
      const km = Number(kmEnd.replace(',', '.'))
      const result = finishTrip(trip, km, profile.id)
      dispatch({ type: 'upsert-trip', trip: result.trip })
      dispatch({ type: 'add-event', event: result.event })
      notify(
        result.trip.syncState === 'local'
          ? 'Viagem finalizada e salva neste aparelho. Aguardando conferência.'
          : 'Viagem enviada para conferência.',
      )
      onFinished()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível finalizar.')
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Finalizar viagem" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Finalizar viagem</h2>

        {step === 'form' && (
          <form className="form-stack" onSubmit={goReview}>
            <label className="field">
              <span>Quilometragem final</span>
              <input inputMode="decimal" value={kmEnd} onChange={(e) => setKmEnd(e.target.value)} required />
            </label>
            <p className="fine left">KM inicial: {trip.kmStart}</p>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block">
              Revisar resumo
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
              Voltar
            </button>
          </form>
        )}

        {step === 'review' && (
          <div className="form-stack">
            <p>
              Distância: <strong>{distance} km</strong>
            </p>
            <p>
              Entregas: {counts.entregue} entregues · {counts.pendente} pendentes · {counts.ocorrencia}{' '}
              ocorrências
            </p>
            <p>Total de despesas: {formatMoney(expenseTotal(expenses))}</p>
            <ul className="mini-list static">
              {Object.entries(byCategory).map(([cat, total]) => (
                <li key={cat}>
                  <span>
                    <strong>{categoryLabel[cat] ?? cat}</strong>
                    <small>{formatMoney(total)}</small>
                  </span>
                </li>
              ))}
            </ul>
            {(counts.pendente > 0 || missingProofs > 0) && (
              <div className="form-error">
                Pendências: {counts.pendente} entregas · {missingProofs} comprovantes.
                <label className="check-row">
                  <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
                  <span>Confirmo finalizar com pendências</span>
                </label>
              </div>
            )}
            {error && <p className="form-error">{error}</p>}
            <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={confirm}>
              {busy ? 'Finalizando…' : 'Confirmar finalização'}
            </button>
            <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => setStep('form')}>
              Corrigir KM
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
