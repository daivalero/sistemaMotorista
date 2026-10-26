import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { formatMoney } from '../data'
import {
  attachmentsOf,
  canEditTrip,
  expensesOf,
} from '../logic'
import { createId } from '../lib/id'
import { supabaseConfigured } from '../lib/supabase'
import {
  attachmentFromForm,
  buildTripFromForm,
  expenseFromForm,
  fileToDataUrl,
  newFormKey,
  type TripFormAttachment,
  type TripFormExpense,
} from '../services/trips'
import { useStore } from '../store'
import type { ExpenseCategory } from '../types'

const categories: { id: ExpenseCategory; label: string }[] = [
  { id: 'combustivel', label: 'Combustível' },
  { id: 'pedagio', label: 'Pedágio' },
  { id: 'estacionamento', label: 'Estacionamento' },
  { id: 'manutencao', label: 'Manutenção' },
  { id: 'outros', label: 'Outros' },
]

type Props = {
  tripId?: string
  onCancel: () => void
  onSaved: (tripId: string) => void
}

function emptyExpense(): TripFormExpense {
  return {
    localKey: newFormKey('exprow'),
    clientRequestId: createId('req'),
    category: 'combustivel',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: '',
    proofPending: false,
  }
}

function emptyAttachment(): TripFormAttachment {
  return {
    localKey: newFormKey('attrow'),
    clientRequestId: createId('req'),
    description: '',
    proofPending: false,
  }
}

export function RegisterTripPage({ tripId, onCancel, onSaved }: Props) {
  const { state, dispatch, notify } = useStore()
  const profile = state.session.profile
  const existing = tripId ? state.trips.find((t) => t.id === tripId) : undefined
  const vehicles = useMemo(
    () => state.vehicles.filter((v) => v.driverId === profile?.id && v.active),
    [state.vehicles, profile?.id],
  )

  const [tripRequestId] = useState(() => existing?.clientRequestId ?? createId('req'))
  const [tripDate, setTripDate] = useState(
    existing?.tripDate ?? new Date().toISOString().slice(0, 10),
  )
  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? vehicles[0]?.id ?? '')
  const [kmStart, setKmStart] = useState(
    existing?.kmStart != null ? String(existing.kmStart) : '',
  )
  const [kmEnd, setKmEnd] = useState(existing?.kmEnd != null ? String(existing.kmEnd) : '')
  const [relato, setRelato] = useState(existing?.relato ?? '')
  const [expenses, setExpenses] = useState<TripFormExpense[]>(() => {
    if (!existing) return []
    return expensesOf(state, existing.id).map((item) => ({
      localKey: item.id,
      id: item.id,
      clientRequestId: item.clientRequestId,
      category: item.category,
      amount: String(item.amount),
      expenseDate: item.expenseDate,
      notes: item.notes ?? '',
      proofDataUrl: item.proofDataUrl,
      proofPending: item.proofPending,
    }))
  })
  const [attachments, setAttachments] = useState<TripFormAttachment[]>(() => {
    if (!existing) return []
    return attachmentsOf(state, existing.id).map((item) => ({
      localKey: item.id,
      id: item.id,
      clientRequestId: item.clientRequestId,
      description: item.description ?? '',
      proofDataUrl: item.proofDataUrl,
      proofPending: item.proofPending,
    }))
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!profile) return null

  const locked = existing ? !canEditTrip(existing) : false
  const total = expenses.reduce((sum, row) => {
    const value = Number(String(row.amount).replace(',', '.'))
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)
  const distance = (() => {
    const a = Number(String(kmStart).replace(',', '.'))
    const b = Number(String(kmEnd).replace(',', '.'))
    if (!Number.isFinite(a) || !Number.isFinite(b) || kmEnd === '') return null
    return Math.max(0, Number((b - a).toFixed(1)))
  })()

  const save = async (asDraft: boolean) => {
    if (locked || busy) return
    setError('')

    if (!vehicleId) {
      setError('Selecione o veículo.')
      return
    }
    if (!tripDate) {
      setError('Informe a data da viagem.')
      return
    }

    const start = kmStart === '' ? undefined : Number(String(kmStart).replace(',', '.'))
    const end = kmEnd === '' ? undefined : Number(String(kmEnd).replace(',', '.'))

    if (!asDraft) {
      if (start == null || !Number.isFinite(start) || start < 0) {
        setError('Informe a quilometragem inicial para salvar o registro.')
        return
      }
      if (end == null || !Number.isFinite(end) || end < 0) {
        setError('Informe a quilometragem final para salvar o registro.')
        return
      }
      if (end < start) {
        setError('A quilometragem final não pode ser menor que a inicial.')
        return
      }
      for (const row of expenses) {
        const value = Number(String(row.amount).replace(',', '.'))
        if (!Number.isFinite(value) || value < 0) {
          setError('Há gasto com valor inválido.')
          return
        }
      }
    }

    setBusy(true)
    try {
      const { trip, event } = buildTripFromForm({
        existing,
        driverId: profile.id,
        vehicleId,
        tripDate,
        kmStart: start,
        kmEnd: end,
        relato,
        status: asDraft ? 'rascunho' : 'aguardando_conferencia',
        clientRequestId: tripRequestId,
      })

      dispatch({ type: 'upsert-trip', trip })
      dispatch({ type: 'add-event', event })

      // replace expenses/attachments for this trip from form (by clientRequestId, no dup)
      const keepExpenseIds = new Set(expenses.map((e) => e.clientRequestId))
      state.expenses
        .filter((e) => e.tripId === trip.id && !keepExpenseIds.has(e.clientRequestId))
        .forEach((e) => dispatch({ type: 'remove-expense', id: e.id }))

      const keepAttIds = new Set(attachments.map((a) => a.clientRequestId))
      state.attachments
        .filter((a) => a.tripId === trip.id && !keepAttIds.has(a.clientRequestId))
        .forEach((a) => dispatch({ type: 'remove-attachment', id: a.id }))

      expenses.forEach((row) => {
        if (row.amount === '' && !row.notes && !row.proofDataUrl && !asDraft) return
        if (row.amount === '' && asDraft && !row.notes && !row.proofDataUrl) return
        dispatch({ type: 'upsert-expense', expense: expenseFromForm(trip.id, row) })
      })

      attachments.forEach((row) => {
        if (!row.proofDataUrl && !row.description && !row.proofPending) return
        dispatch({
          type: 'upsert-attachment',
          attachment: attachmentFromForm(trip.id, row),
        })
      })

      const syncMsg = supabaseConfigured
        ? trip.syncState === 'sincronizado'
          ? 'Sincronizado com o servidor.'
          : 'Enviando ao servidor…'
        : 'Salvo neste aparelho (ainda não sincronizado com o servidor).'

      notify(
        asDraft
          ? `Rascunho salvo. ${syncMsg}`
          : `Registro salvo. ${syncMsg}`,
      )
      onSaved(trip.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
      notify('Falha ao salvar. Confira a conexão e tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack register-form">
      <header className="page-intro">
        <p className="home-section-label">Registro</p>
        <h1>Registrar viagem</h1>
        <p className="muted">
          Preencha o que tiver. Gastos e comprovantes ficam nesta mesma tela.
        </p>
      </header>

      <Card padding="md">
        <h2 className="form-section-title">Informações da viagem</h2>
        <div className="form-stack">
          <label className="field">
            <span>Data da viagem</span>
            <input
              type="date"
              value={tripDate}
              disabled={locked}
              onChange={(e) => setTripDate(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Motorista</span>
            <input value={profile.nome} disabled readOnly />
          </label>
          <label className="field">
            <span>Veículo</span>
            <select
              value={vehicleId}
              disabled={locked}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              {vehicles.length === 0 && <option value="">Nenhum veículo</option>}
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} · {vehicle.model}
                </option>
              ))}
            </select>
          </label>
          <div className="form-two">
            <label className="field">
              <span>KM inicial</span>
              <input
                inputMode="decimal"
                value={kmStart}
                disabled={locked}
                onChange={(e) => setKmStart(e.target.value)}
                placeholder="Opcional no rascunho"
              />
            </label>
            <label className="field">
              <span>KM final</span>
              <input
                inputMode="decimal"
                value={kmEnd}
                disabled={locked}
                onChange={(e) => setKmEnd(e.target.value)}
                placeholder="Opcional no rascunho"
              />
            </label>
          </div>
          {distance != null && (
            <p className="fine left">Distância calculada: {distance} km</p>
          )}
          <label className="field">
            <span>Relato da viagem</span>
            <textarea
              rows={5}
              value={relato}
              disabled={locked}
              onChange={(e) => setRelato(e.target.value)}
              placeholder="Entregas, ocorrências, problemas ou qualquer informação relevante"
            />
          </label>
        </div>
      </Card>

      <Card padding="md">
        <div className="block-head">
          <h2 className="form-section-title">Gastos</h2>
          {!locked && (
            <button type="button" className="text-btn" onClick={() => setExpenses((rows) => [...rows, emptyExpense()])}>
              Adicionar gasto
            </button>
          )}
        </div>
        {expenses.length === 0 ? (
          <p className="muted">Nenhum gasto ainda. Use “Adicionar gasto” quando precisar.</p>
        ) : (
          <div className="form-stack">
            {expenses.map((row, index) => (
              <div key={row.localKey} className="nested-card">
                <div className="block-head">
                  <strong>Gasto {index + 1}</strong>
                  {!locked && (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() =>
                        setExpenses((rows) => rows.filter((item) => item.localKey !== row.localKey))
                      }
                    >
                      Remover
                    </button>
                  )}
                </div>
                <label className="field">
                  <span>Categoria</span>
                  <select
                    value={row.category}
                    disabled={locked}
                    onChange={(e) =>
                      setExpenses((rows) =>
                        rows.map((item) =>
                          item.localKey === row.localKey
                            ? { ...item, category: e.target.value as ExpenseCategory }
                            : item,
                        ),
                      )
                    }
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-two">
                  <label className="field">
                    <span>Valor (R$)</span>
                    <input
                      inputMode="decimal"
                      value={row.amount}
                      disabled={locked}
                      onChange={(e) =>
                        setExpenses((rows) =>
                          rows.map((item) =>
                            item.localKey === row.localKey
                              ? { ...item, amount: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Data</span>
                    <input
                      type="date"
                      value={row.expenseDate}
                      disabled={locked}
                      onChange={(e) =>
                        setExpenses((rows) =>
                          rows.map((item) =>
                            item.localKey === row.localKey
                              ? { ...item, expenseDate: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Descrição (opcional)</span>
                  <input
                    value={row.notes}
                    disabled={locked}
                    onChange={(e) =>
                      setExpenses((rows) =>
                        rows.map((item) =>
                          item.localKey === row.localKey ? { ...item, notes: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className="field">
                  <span>Foto do comprovante</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={locked}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void fileToDataUrl(file).then((proofDataUrl) => {
                        setExpenses((rows) =>
                          rows.map((item) =>
                            item.localKey === row.localKey
                              ? { ...item, proofDataUrl, proofPending: false }
                              : item,
                          ),
                        )
                      })
                    }}
                  />
                </label>
                {row.proofDataUrl && (
                  <img className="proof-thumb" src={row.proofDataUrl} alt={`Comprovante gasto ${index + 1}`} />
                )}
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={row.proofPending}
                    disabled={locked}
                    onChange={(e) =>
                      setExpenses((rows) =>
                        rows.map((item) =>
                          item.localKey === row.localKey
                            ? { ...item, proofPending: e.target.checked }
                            : item,
                        ),
                      )
                    }
                  />
                  <span>Comprovante pendente</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md">
        <div className="block-head">
          <h2 className="form-section-title">Comprovantes e entregas</h2>
          {!locked && (
            <button
              type="button"
              className="text-btn"
              onClick={() => setAttachments((rows) => [...rows, emptyAttachment()])}
            >
              Adicionar arquivo
            </button>
          )}
        </div>
        {attachments.length === 0 ? (
          <p className="muted">Anexe notas, canhotos ou fotos quando tiver.</p>
        ) : (
          <div className="form-stack">
            {attachments.map((row, index) => (
              <div key={row.localKey} className="nested-card">
                <div className="block-head">
                  <strong>Arquivo {index + 1}</strong>
                  {!locked && (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() =>
                        setAttachments((rows) =>
                          rows.filter((item) => item.localKey !== row.localKey),
                        )
                      }
                    >
                      Remover
                    </button>
                  )}
                </div>
                <label className="field">
                  <span>Descrição</span>
                  <input
                    value={row.description}
                    disabled={locked}
                    placeholder="Ex.: canhoto cliente X"
                    onChange={(e) =>
                      setAttachments((rows) =>
                        rows.map((item) =>
                          item.localKey === row.localKey
                            ? { ...item, description: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className="field">
                  <span>Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={locked}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void fileToDataUrl(file).then((proofDataUrl) => {
                        setAttachments((rows) =>
                          rows.map((item) =>
                            item.localKey === row.localKey
                              ? { ...item, proofDataUrl, proofPending: false }
                              : item,
                          ),
                        )
                      })
                    }}
                  />
                </label>
                {row.proofDataUrl && (
                  <img className="proof-thumb" src={row.proofDataUrl} alt={`Anexo ${index + 1}`} />
                )}
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={row.proofPending}
                    disabled={locked}
                    onChange={(e) =>
                      setAttachments((rows) =>
                        rows.map((item) =>
                          item.localKey === row.localKey
                            ? { ...item, proofPending: e.target.checked }
                            : item,
                        ),
                      )
                    }
                  />
                  <span>Arquivo pendente</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md" gradientTop>
        <h2 className="form-section-title">Resumo</h2>
        <ul className="home-summary">
          <li>
            <span>Data</span>
            <strong>{tripDate || '—'}</strong>
          </li>
          <li>
            <span>Motorista</span>
            <strong>{profile.nome}</strong>
          </li>
          <li>
            <span>Gastos</span>
            <strong>
              {expenses.length} · {formatMoney(total)}
            </strong>
          </li>
          <li>
            <span>Anexos</span>
            <strong>{attachments.length}</strong>
          </li>
          <li>
            <span>Distância</span>
            <strong>{distance != null ? `${distance} km` : '—'}</strong>
          </li>
        </ul>
        <p className="fine left">
          {supabaseConfigured
            ? 'Ao salvar, o app tentará sincronizar com o servidor.'
            : 'Sem Supabase configurado: o registro fica neste aparelho e isso será mostrado após salvar.'}
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!locked && (
          <div className="ticket-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void save(false)}
            >
              {busy ? 'Salvando…' : 'Salvar registro'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => void save(true)}
            >
              Salvar rascunho
            </button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={onCancel}>
              Cancelar
            </button>
          </div>
        )}
        {locked && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Voltar
          </button>
        )}
      </Card>
    </div>
  )
}
