import { useState, type FormEvent } from 'react'
import { createClient, createDelivery, fileToDataUrl } from '../../services/trips'
import { useStore } from '../../store'
import type { Delivery } from '../../types'
import { canEditTrip } from '../../logic'

type Props = {
  tripId: string
  delivery?: Delivery
  onClose: () => void
}

export function DeliverySheet({ tripId, delivery, onClose }: Props) {
  const { state, dispatch, notify } = useStore()
  const trip = state.trips.find((t) => t.id === tripId)
  const profile = state.session.profile
  const editable = trip ? canEditTrip(trip) : false

  const [clientName, setClientName] = useState(delivery?.clientName ?? '')
  const [address, setAddress] = useState(delivery?.address ?? '')
  const [orderRef, setOrderRef] = useState(delivery?.orderRef ?? '')
  const [notes, setNotes] = useState(delivery?.notes ?? '')
  const [clientId, setClientId] = useState(delivery?.clientId ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!trip || !profile) return null

  const pickClient = (id: string) => {
    setClientId(id)
    const client = state.clients.find((c) => c.id === id)
    if (client) {
      setClientName(client.name)
      setAddress(client.address)
    }
  }

  const saveNew = (event: FormEvent) => {
    event.preventDefault()
    if (!editable) return
    if (!clientName.trim() || !address.trim()) {
      setError('Informe cliente e endereço.')
      return
    }
    setBusy(true)
    let nextClientId = clientId || undefined
    if (!nextClientId) {
      const client = createClient({
        name: clientName,
        address,
        createdBy: profile.id,
      })
      dispatch({ type: 'upsert-client', client })
      nextClientId = client.id
    }
    const item = createDelivery({
      tripId,
      clientId: nextClientId,
      clientName,
      address,
      orderRef,
      notes,
    })
    dispatch({ type: 'upsert-delivery', delivery: item })
    notify(item.syncState === 'local' ? 'Entrega salva neste aparelho.' : 'Entrega salva.')
    setBusy(false)
    onClose()
  }

  const markDelivered = async () => {
    if (!delivery || !editable) return
    setBusy(true)
    const next: Delivery = {
      ...delivery,
      status: 'entregue',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: delivery.syncState === 'sincronizado' ? 'enviando' : delivery.syncState,
    }
    dispatch({ type: 'upsert-delivery', delivery: next })
    notify('Entrega marcada como entregue.')
    setBusy(false)
  }

  const markOccurrence = () => {
    if (!delivery || !editable) return
    const reason = window.prompt('Motivo da ocorrência / tentativa sem sucesso')
    if (!reason?.trim()) return
    const next: Delivery = {
      ...delivery,
      status: 'ocorrencia',
      occurrenceReason: reason.trim(),
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'upsert-delivery', delivery: next })
    notify('Ocorrência registrada.')
    onClose()
  }

  const attachProof = async (file?: File | null) => {
    if (!delivery || !editable || !file) return
    setBusy(true)
    try {
      const proofDataUrl = await fileToDataUrl(file)
      dispatch({
        type: 'upsert-delivery',
        delivery: {
          ...delivery,
          proofDataUrl,
          updatedAt: new Date().toISOString(),
        },
      })
      notify('Comprovante anexado à entrega.')
    } catch {
      notify('Falha ao anexar o comprovante.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={delivery ? 'Detalhe da entrega' : 'Nova entrega'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <h2>{delivery ? delivery.clientName : 'Adicionar entrega'}</h2>

        {!delivery && (
          <form className="form-stack" onSubmit={saveNew}>
            {state.clients.length > 0 && (
              <label className="field">
                <span>Cliente cadastrado</span>
                <select value={clientId} onChange={(e) => pickClient(e.target.value)}>
                  <option value="">Novo cliente</option>
                  {state.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              <span>Cliente ou empresa</span>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            </label>
            <label className="field">
              <span>Endereço</span>
              <input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </label>
            <label className="field">
              <span>Nº do pedido (opcional)</span>
              <input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} />
            </label>
            <label className="field">
              <span>Observações (opcional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy || !editable}>
              Salvar entrega
            </button>
          </form>
        )}

        {delivery && (
          <div className="form-stack">
            <p className="muted">{delivery.address}</p>
            {delivery.orderRef && <p className="fine left">Pedido {delivery.orderRef}</p>}
            {delivery.notes && <p>{delivery.notes}</p>}
            <p>
              Status: <strong>{delivery.status}</strong>
              {delivery.completedAt && <> · {new Date(delivery.completedAt).toLocaleString('pt-BR')}</>}
            </p>
            {delivery.proofRequired && !delivery.proofDataUrl && (
              <p className="form-error">Comprovante pendente</p>
            )}
            {delivery.proofDataUrl && (
              <img className="proof-thumb" src={delivery.proofDataUrl} alt="Comprovante da entrega" />
            )}
            {editable && (
              <>
                {delivery.status === 'pendente' && (
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void markDelivered()}>
                    Marcar como entregue
                  </button>
                )}
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={markOccurrence}>
                  Registrar ocorrência
                </button>
                <label className="field">
                  <span>Foto do comprovante</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={busy}
                    onChange={(e) => void attachProof(e.target.files?.[0])}
                  />
                </label>
              </>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
