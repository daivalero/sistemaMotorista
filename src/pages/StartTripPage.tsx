import { useMemo, useState, type FormEvent } from 'react'
import { createTrip } from '../services/trips'
import { useStore } from '../store'

type Props = {
  onCancel: () => void
  onStarted: (tripId: string) => void
}

export function StartTripPage({ onCancel, onStarted }: Props) {
  const { state, dispatch, notify } = useStore()
  const profile = state.session.profile
  const vehicles = useMemo(
    () => state.vehicles.filter((v) => v.driverId === profile?.id && v.active),
    [state.vehicles, profile?.id],
  )
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '')
  const [kmStart, setKmStart] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!profile) return null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const km = Number(kmStart.replace(',', '.'))
    if (!vehicleId) {
      setError('Selecione o veículo.')
      return
    }
    if (!Number.isFinite(km) || km < 0) {
      setError('Informe a quilometragem inicial.')
      return
    }
    const active = state.trips.find(
      (t) => t.driverId === profile.id && t.status === 'em_andamento',
    )
    if (active) {
      setError('Já existe uma viagem em andamento.')
      return
    }

    setSubmitting(true)
    try {
      const { trip, event: tripEvent } = createTrip({
        driverId: profile.id,
        vehicleId,
        kmStart: km,
      })
      dispatch({ type: 'upsert-trip', trip })
      dispatch({ type: 'add-event', event: tripEvent })
      notify(
        trip.syncState === 'local'
          ? 'Viagem iniciada e salva neste aparelho.'
          : 'Viagem iniciada.',
      )
      onStarted(trip.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <header className="page-intro">
        <p className="home-section-label">Nova viagem</p>
        <h1>Iniciar viagem</h1>
        <p className="muted">
          Data e horário serão registrados agora. Você adiciona entregas e gastos depois.
        </p>
      </header>

      <form className="panel form-stack" onSubmit={submit}>
        <label className="field">
          <span>Veículo</span>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            required
          >
            {vehicles.length === 0 && <option value="">Nenhum veículo</option>}
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate} · {vehicle.model}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Quilometragem inicial</span>
          <input
            inputMode="decimal"
            value={kmStart}
            onChange={(e) => setKmStart(e.target.value)}
            placeholder="Ex.: 148320"
            required
          />
        </label>

        <p className="fine left">
          Início: {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())} ·{' '}
          {profile.nome}
        </p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="ticket-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Confirmar início'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
