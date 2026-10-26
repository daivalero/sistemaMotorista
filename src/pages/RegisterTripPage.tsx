import { useMemo, useState } from 'react'
import { formatMoney } from '../data'
import {
  attachmentsOf,
  canEditTrip,
  deliveriesOf,
  expensesOf,
} from '../logic'
import { createId } from '../lib/id'
import { supabaseConfigured } from '../lib/supabase'
import {
  attachmentFromForm,
  buildTripFromForm,
  deliveryFromForm,
  expenseFromForm,
  fileToDataUrl,
  newFormKey,
  type TripFormAttachment,
  type TripFormDelivery,
  type TripFormExpense,
} from '../services/trips'
import { useStore } from '../store'
import type { DeliveryStatus, ExpenseCategory } from '../types'

const categories: { id: ExpenseCategory; label: string }[] = [
  { id: 'combustivel', label: 'Combustível' },
  { id: 'pedagio', label: 'Pedágio' },
  { id: 'estacionamento', label: 'Estacionamento' },
  { id: 'manutencao', label: 'Manutenção' },
  { id: 'outros', label: 'Outros' },
]

const deliveryStatuses: { id: DeliveryStatus; label: string }[] = [
  { id: 'pendente', label: 'Pendente' },
  { id: 'entregue', label: 'Entregue' },
  { id: 'ocorrencia', label: 'Ocorrência' },
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

function emptyDelivery(): TripFormDelivery {
  return {
    localKey: newFormKey('delrow'),
    clientRequestId: createId('req'),
    clientName: '',
    address: '',
    orderRef: '',
    notes: '',
    status: 'pendente',
    proofPending: false,
  }
}

function statusLabel(status: DeliveryStatus) {
  return deliveryStatuses.find((item) => item.id === status)?.label ?? status
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
  const [fieldError, setFieldError] = useState<Record<string, string>>({})
  const [deliveries, setDeliveries] = useState<TripFormDelivery[]>(() => {
    if (!existing) return []
    return deliveriesOf(state, existing.id).map((item) => ({
      localKey: item.id,
      id: item.id,
      clientRequestId: item.clientRequestId,
      clientName: item.clientName,
      address: item.address ?? '',
      orderRef: item.orderRef ?? '',
      notes: item.notes ?? '',
      status: item.status,
      proofDataUrl: item.proofDataUrl,
      proofPending: item.proofPending,
    }))
  })
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
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null)

  if (!profile) return null

  const locked = existing ? !canEditTrip(existing) : false
  const total = expenses.reduce((sum, row) => {
    const value = Number(String(row.amount).replace(',', '.'))
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)
  const distance = (() => {
    const a = Number(String(kmStart).replace(',', '.'))
    const b = Number(String(kmEnd).replace(',', '.'))
    if (!Number.isFinite(a) || !Number.isFinite(b) || kmEnd === '' || kmStart === '') return null
    return Math.max(0, Number((b - a).toFixed(1)))
  })()

  const proofAttached =
    deliveries.filter((d) => Boolean(d.proofDataUrl)).length +
    expenses.filter((e) => Boolean(e.proofDataUrl)).length +
    attachments.filter((a) => Boolean(a.proofDataUrl)).length

  const proofPendingCount =
    deliveries.filter((d) => d.proofPending || (d.status === 'entregue' && !d.proofDataUrl)).length +
    expenses.filter((e) => e.proofPending || !e.proofDataUrl).length +
    attachments.filter((a) => a.proofPending || !a.proofDataUrl).length

  const clientCount = new Set(
    deliveries.map((d) => d.clientName.trim().toLowerCase()).filter(Boolean),
  ).size

  const syncHint = (() => {
    if (!existing) return 'Ainda não salvo'
    if (existing.syncState === 'sincronizado') return 'Sincronizado'
    if (existing.syncState === 'enviando') return 'Enviando…'
    if (existing.syncState === 'erro') return 'Erro de sincronização'
    return 'Salvo neste aparelho'
  })()

  const updateDelivery = (localKey: string, patch: Partial<TripFormDelivery>) => {
    setDeliveries((rows) =>
      rows.map((item) => (item.localKey === localKey ? { ...item, ...patch } : item)),
    )
  }

  const updateExpense = (localKey: string, patch: Partial<TripFormExpense>) => {
    setExpenses((rows) =>
      rows.map((item) => (item.localKey === localKey ? { ...item, ...patch } : item)),
    )
  }

  const updateAttachment = (localKey: string, patch: Partial<TripFormAttachment>) => {
    setAttachments((rows) =>
      rows.map((item) => (item.localKey === localKey ? { ...item, ...patch } : item)),
    )
  }

  const onPickFile = (
    file: File | undefined,
    apply: (proofDataUrl: string) => void,
  ) => {
    if (!file) return
    void fileToDataUrl(file).then(apply)
  }

  const save = async (asDraft: boolean) => {
    if (locked || busy) return
    setError('')
    setFieldError({})

    const nextErrors: Record<string, string> = {}
    if (!vehicleId) nextErrors.vehicleId = 'Selecione o veículo.'
    if (!tripDate) nextErrors.tripDate = 'Informe a data.'

    const start = kmStart === '' ? undefined : Number(String(kmStart).replace(',', '.'))
    const end = kmEnd === '' ? undefined : Number(String(kmEnd).replace(',', '.'))

    if (!asDraft) {
      if (start == null || !Number.isFinite(start) || start < 0) {
        nextErrors.kmStart = 'Informe o KM inicial.'
      }
      if (end == null || !Number.isFinite(end) || end < 0) {
        nextErrors.kmEnd = 'Informe o KM final.'
      }
      if (start != null && end != null && end < start) {
        nextErrors.kmEnd = 'KM final menor que o inicial.'
      }
      for (const row of expenses) {
        const value = Number(String(row.amount).replace(',', '.'))
        if (row.amount !== '' && (!Number.isFinite(value) || value < 0)) {
          nextErrors[`expense-${row.localKey}`] = 'Valor inválido.'
        }
      }
      for (const row of deliveries) {
        if (!row.clientName.trim()) {
          nextErrors[`delivery-${row.localKey}`] = 'Informe o cliente.'
        }
      }
    }

    if (Object.keys(nextErrors).length) {
      setFieldError(nextErrors)
      setError('Revise os campos marcados.')
      return
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

      const keepDeliveryIds = new Set(deliveries.map((d) => d.clientRequestId))
      state.deliveries
        .filter((d) => d.tripId === trip.id && !keepDeliveryIds.has(d.clientRequestId))
        .forEach((d) => dispatch({ type: 'remove-delivery', id: d.id }))

      const keepExpenseIds = new Set(expenses.map((e) => e.clientRequestId))
      state.expenses
        .filter((e) => e.tripId === trip.id && !keepExpenseIds.has(e.clientRequestId))
        .forEach((e) => dispatch({ type: 'remove-expense', id: e.id }))

      const keepAttIds = new Set(attachments.map((a) => a.clientRequestId))
      state.attachments
        .filter((a) => a.tripId === trip.id && !keepAttIds.has(a.clientRequestId))
        .forEach((a) => dispatch({ type: 'remove-attachment', id: a.id }))

      deliveries.forEach((row) => {
        if (!row.clientName.trim() && !row.address && !row.orderRef && !row.notes && !row.proofDataUrl) {
          return
        }
        dispatch({ type: 'upsert-delivery', delivery: deliveryFromForm(trip.id, row) })
      })

      expenses.forEach((row) => {
        if (row.amount === '' && !row.notes && !row.proofDataUrl) return
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
        ? 'Enviando ao servidor… (só confirme o envio quando o status mudar).'
        : 'Salvo neste aparelho (ainda não sincronizado com o servidor).'

      notify(asDraft ? `Rascunho salvo. ${syncMsg}` : `Registro salvo. ${syncMsg}`)
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
      <header className="register-hero">
        <p className="register-kicker">Registro</p>
        <h1>Registrar viagem</h1>
        <p className="register-lede">
          Preencha o que tiver agora. Você pode salvar rascunho e continuar depois.
        </p>
        <span className={`register-sync register-sync--${existing?.syncState ?? 'local'}`}>
          {busy ? 'Salvando…' : syncHint}
        </span>
      </header>

      {/* A. Dados da viagem */}
      <section className="register-section" aria-labelledby="sec-dados">
        <div className="register-section-head">
          <span className="register-section-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M8 3.5v3M16 3.5v3M4 10h16" />
            </svg>
          </span>
          <div>
            <h2 id="sec-dados">Dados da viagem</h2>
            <p>Data, motorista, veículo e quilometragem</p>
          </div>
        </div>

        <div className="register-fields">
          <label className="register-field">
            <span>
              Data da viagem <em className="req">obrigatório</em>
            </span>
            <input
              type="date"
              value={tripDate}
              disabled={locked}
              onChange={(e) => setTripDate(e.target.value)}
            />
            {fieldError.tripDate && <small className="register-field-error">{fieldError.tripDate}</small>}
          </label>

          <label className="register-field">
            <span>Motorista</span>
            <input value={profile.nome} disabled readOnly />
          </label>

          <label className="register-field">
            <span>
              Veículo <em className="req">obrigatório</em>
            </span>
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
            {fieldError.vehicleId && (
              <small className="register-field-error">{fieldError.vehicleId}</small>
            )}
          </label>

          <div className="register-km-row">
            <label className="register-field">
              <span>KM inicial</span>
              <input
                inputMode="decimal"
                value={kmStart}
                disabled={locked}
                onChange={(e) => setKmStart(e.target.value)}
                placeholder="Ex.: 45210"
              />
              {fieldError.kmStart && (
                <small className="register-field-error">{fieldError.kmStart}</small>
              )}
            </label>
            <label className="register-field">
              <span>KM final</span>
              <input
                inputMode="decimal"
                value={kmEnd}
                disabled={locked}
                onChange={(e) => setKmEnd(e.target.value)}
                placeholder="Ex.: 45380"
              />
              {fieldError.kmEnd && (
                <small className="register-field-error">{fieldError.kmEnd}</small>
              )}
            </label>
          </div>

          {distance != null && (
            <p className="register-hint">Distância calculada: <strong>{distance} km</strong></p>
          )}

          <label className="register-field">
            <span>
              Relato da viagem <em>opcional</em>
            </span>
            <textarea
              rows={4}
              value={relato}
              disabled={locked}
              onChange={(e) => setRelato(e.target.value)}
              placeholder="Ex.: trânsito na BR, atraso no cliente, etc."
            />
          </label>
        </div>
      </section>

      {/* B. Clientes e entregas */}
      <section className="register-section" aria-labelledby="sec-entregas">
        <div className="register-section-head">
          <span className="register-section-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16v12H4z" />
              <path d="M8 7V5h8v2M9 12h6M9 16h4" />
            </svg>
          </span>
          <div>
            <h2 id="sec-entregas">Clientes e entregas</h2>
            <p>Uma ou várias entregas nesta viagem</p>
          </div>
        </div>

        {deliveries.length === 0 ? (
          <p className="register-empty">Nenhuma entrega ainda. Toque em adicionar para registrar um cliente.</p>
        ) : (
          <ul className="delivery-list">
            {deliveries.map((row, index) => {
              const open = expandedDelivery === row.localKey
              return (
                <li key={row.localKey} className={`delivery-card delivery-card--${row.status}`}>
                  <button
                    type="button"
                    className="delivery-card-summary"
                    onClick={() =>
                      setExpandedDelivery(open ? null : row.localKey)
                    }
                    disabled={locked && !open}
                  >
                    <span className="delivery-card-main">
                      <strong>{row.clientName.trim() || `Entrega ${index + 1}`}</strong>
                      <small>{row.address.trim() || 'Endereço não informado'}</small>
                    </span>
                    <span className={`delivery-status delivery-status--${row.status}`}>
                      {statusLabel(row.status)}
                    </span>
                  </button>

                  {open && (
                    <div className="delivery-card-body">
                      <label className="register-field">
                        <span>
                          Cliente ou empresa <em className="req">obrigatório</em>
                        </span>
                        <input
                          value={row.clientName}
                          disabled={locked}
                          placeholder="Ex.: Mercado Central"
                          onChange={(e) => updateDelivery(row.localKey, { clientName: e.target.value })}
                        />
                        {fieldError[`delivery-${row.localKey}`] && (
                          <small className="register-field-error">
                            {fieldError[`delivery-${row.localKey}`]}
                          </small>
                        )}
                      </label>

                      <label className="register-field">
                        <span>
                          Endereço da entrega <em>opcional</em>
                        </span>
                        <input
                          value={row.address}
                          disabled={locked}
                          placeholder="Ex.: Rua das Flores, 120"
                          onChange={(e) => updateDelivery(row.localKey, { address: e.target.value })}
                        />
                      </label>

                      <label className="register-field">
                        <span>
                          Pedido ou NF <em>opcional</em>
                        </span>
                        <input
                          value={row.orderRef}
                          disabled={locked}
                          placeholder="Ex.: NF 4521"
                          onChange={(e) => updateDelivery(row.localKey, { orderRef: e.target.value })}
                        />
                      </label>

                      <label className="register-field">
                        <span>Status</span>
                        <select
                          value={row.status}
                          disabled={locked}
                          onChange={(e) =>
                            updateDelivery(row.localKey, {
                              status: e.target.value as DeliveryStatus,
                            })
                          }
                        >
                          {deliveryStatuses.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="register-field">
                        <span>
                          Observações <em>opcional</em>
                        </span>
                        <textarea
                          rows={2}
                          value={row.notes}
                          disabled={locked}
                          placeholder="Ex.: recebedor ausente, deixado na portaria"
                          onChange={(e) => updateDelivery(row.localKey, { notes: e.target.value })}
                        />
                      </label>

                      <div className="register-proof">
                        <span className="register-proof-label">
                          Foto do canhoto / comprovante <em>opcional</em>
                        </span>
                        <div className="register-proof-actions">
                          <label className="register-file-btn">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              disabled={locked}
                              onChange={(e) => {
                                onPickFile(e.target.files?.[0], (proofDataUrl) =>
                                  updateDelivery(row.localKey, {
                                    proofDataUrl,
                                    proofPending: false,
                                  }),
                                )
                                e.target.value = ''
                              }}
                            />
                            {row.proofDataUrl ? 'Trocar foto' : 'Fotografar ou escolher'}
                          </label>
                          {row.proofDataUrl && !locked && (
                            <button
                              type="button"
                              className="register-text-btn"
                              onClick={() =>
                                updateDelivery(row.localKey, {
                                  proofDataUrl: undefined,
                                  proofPending: true,
                                })
                              }
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        {row.proofDataUrl && (
                          <img
                            className="register-thumb"
                            src={row.proofDataUrl}
                            alt={`Comprovante ${row.clientName || index + 1}`}
                          />
                        )}
                        <label className="register-check">
                          <input
                            type="checkbox"
                            checked={row.proofPending}
                            disabled={locked}
                            onChange={(e) =>
                              updateDelivery(row.localKey, { proofPending: e.target.checked })
                            }
                          />
                          <span>Comprovante pendente</span>
                        </label>
                      </div>

                      {!locked && (
                        <button
                          type="button"
                          className="register-remove-btn"
                          onClick={() => {
                            setDeliveries((rows) =>
                              rows.filter((item) => item.localKey !== row.localKey),
                            )
                            setExpandedDelivery(null)
                          }}
                        >
                          Remover entrega
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {!locked && (
          <button
            type="button"
            className="register-add-btn"
            onClick={() => {
              const next = emptyDelivery()
              setDeliveries((rows) => [...rows, next])
              setExpandedDelivery(next.localKey)
            }}
          >
            + Adicionar entrega
          </button>
        )}
      </section>

      {/* C. Gastos */}
      <section className="register-section" aria-labelledby="sec-gastos">
        <div className="register-section-head">
          <span className="register-section-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.6c0 2-4 1.4-4 3.4 0 1 .9 1.6 2 1.6s1.8-.4 2.4-1.2" />
            </svg>
          </span>
          <div>
            <h2 id="sec-gastos">Gastos</h2>
            <p>Combustível, pedágio e outros</p>
          </div>
          <strong className="register-total-pill">{formatMoney(total)}</strong>
        </div>

        {expenses.length === 0 ? (
          <p className="register-empty">Nenhum gasto. Adicione quando precisar.</p>
        ) : (
          <ul className="expense-list">
            {expenses.map((row, index) => (
              <li key={row.localKey} className="expense-card">
                <div className="expense-card-head">
                  <strong>Gasto {index + 1}</strong>
                  {!locked && (
                    <button
                      type="button"
                      className="register-text-btn"
                      onClick={() =>
                        setExpenses((rows) =>
                          rows.filter((item) => item.localKey !== row.localKey),
                        )
                      }
                    >
                      Remover
                    </button>
                  )}
                </div>

                <label className="register-field">
                  <span>Categoria</span>
                  <select
                    value={row.category}
                    disabled={locked}
                    onChange={(e) =>
                      updateExpense(row.localKey, {
                        category: e.target.value as ExpenseCategory,
                      })
                    }
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="register-km-row">
                  <label className="register-field">
                    <span>Valor (R$)</span>
                    <input
                      inputMode="decimal"
                      value={row.amount}
                      disabled={locked}
                      placeholder="0,00"
                      onChange={(e) => updateExpense(row.localKey, { amount: e.target.value })}
                    />
                    {fieldError[`expense-${row.localKey}`] && (
                      <small className="register-field-error">
                        {fieldError[`expense-${row.localKey}`]}
                      </small>
                    )}
                  </label>
                  <label className="register-field">
                    <span>Data</span>
                    <input
                      type="date"
                      value={row.expenseDate}
                      disabled={locked}
                      onChange={(e) =>
                        updateExpense(row.localKey, { expenseDate: e.target.value })
                      }
                    />
                  </label>
                </div>

                <label className="register-field">
                  <span>
                    Descrição <em>opcional</em>
                  </span>
                  <input
                    value={row.notes}
                    disabled={locked}
                    placeholder="Ex.: posto Shell km 45"
                    onChange={(e) => updateExpense(row.localKey, { notes: e.target.value })}
                  />
                </label>

                <div className="register-proof">
                  <span className="register-proof-label">Comprovante</span>
                  <div className="register-proof-actions">
                    <label className="register-file-btn">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={locked}
                        onChange={(e) => {
                          onPickFile(e.target.files?.[0], (proofDataUrl) =>
                            updateExpense(row.localKey, {
                              proofDataUrl,
                              proofPending: false,
                            }),
                          )
                          e.target.value = ''
                        }}
                      />
                      {row.proofDataUrl ? 'Trocar foto' : 'Fotografar ou escolher'}
                    </label>
                    {row.proofDataUrl && !locked && (
                      <button
                        type="button"
                        className="register-text-btn"
                        onClick={() =>
                          updateExpense(row.localKey, {
                            proofDataUrl: undefined,
                            proofPending: true,
                          })
                        }
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  {row.proofDataUrl && (
                    <img
                      className="register-thumb"
                      src={row.proofDataUrl}
                      alt={`Comprovante gasto ${index + 1}`}
                    />
                  )}
                  <label className="register-check">
                    <input
                      type="checkbox"
                      checked={row.proofPending}
                      disabled={locked}
                      onChange={(e) =>
                        updateExpense(row.localKey, { proofPending: e.target.checked })
                      }
                    />
                    <span>Comprovante pendente</span>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!locked && (
          <button
            type="button"
            className="register-add-btn register-add-btn--ghost"
            onClick={() => setExpenses((rows) => [...rows, emptyExpense()])}
          >
            + Adicionar gasto
          </button>
        )}
      </section>

      {/* D. Documentos e comprovantes */}
      <section className="register-section" aria-labelledby="sec-docs">
        <div className="register-section-head">
          <span className="register-section-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 4h7l5 5v11H8z" />
              <path d="M15 4v5h5M10 13h6M10 17h4" />
            </svg>
          </span>
          <div>
            <h2 id="sec-docs">Documentos e comprovantes</h2>
            <p>Arquivos gerais da viagem</p>
          </div>
        </div>

        {attachments.length === 0 ? (
          <p className="register-empty">Nenhum arquivo geral. Canhotos também podem ir em cada entrega.</p>
        ) : (
          <ul className="attachment-list">
            {attachments.map((row, index) => (
              <li key={row.localKey} className="attachment-card">
                <div className="expense-card-head">
                  <strong>{row.description.trim() || `Arquivo ${index + 1}`}</strong>
                  <span
                    className={
                      row.proofDataUrl && !row.proofPending
                        ? 'attach-pill attach-pill--ok'
                        : 'attach-pill attach-pill--pending'
                    }
                  >
                    {row.proofDataUrl && !row.proofPending ? 'Anexado' : 'Pendente'}
                  </span>
                </div>

                <label className="register-field">
                  <span>
                    Nome do arquivo <em>opcional</em>
                  </span>
                  <input
                    value={row.description}
                    disabled={locked}
                    placeholder="Ex.: canhoto extra, ticket pedágio"
                    onChange={(e) =>
                      updateAttachment(row.localKey, { description: e.target.value })
                    }
                  />
                </label>

                <div className="register-proof">
                  <div className="register-proof-actions">
                    <label className="register-file-btn">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={locked}
                        onChange={(e) => {
                          onPickFile(e.target.files?.[0], (proofDataUrl) =>
                            updateAttachment(row.localKey, {
                              proofDataUrl,
                              proofPending: false,
                            }),
                          )
                          e.target.value = ''
                        }}
                      />
                      {row.proofDataUrl ? 'Trocar foto' : 'Fotografar ou escolher'}
                    </label>
                    {!locked && (
                      <button
                        type="button"
                        className="register-text-btn"
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
                  {row.proofDataUrl && (
                    <img
                      className="register-thumb"
                      src={row.proofDataUrl}
                      alt={row.description || `Anexo ${index + 1}`}
                    />
                  )}
                  <label className="register-check">
                    <input
                      type="checkbox"
                      checked={row.proofPending}
                      disabled={locked}
                      onChange={(e) =>
                        updateAttachment(row.localKey, { proofPending: e.target.checked })
                      }
                    />
                    <span>Arquivo pendente</span>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!locked && (
          <button
            type="button"
            className="register-add-btn register-add-btn--ghost"
            onClick={() => setAttachments((rows) => [...rows, emptyAttachment()])}
          >
            + Adicionar arquivo
          </button>
        )}
      </section>

      {/* E. Resumo */}
      <section className="register-section register-summary" aria-labelledby="sec-resumo">
        <div className="register-section-head">
          <span className="register-section-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 6h14M5 12h14M5 18h9" />
            </svg>
          </span>
          <div>
            <h2 id="sec-resumo">Resumo</h2>
            <p>Atualizado conforme você preenche</p>
          </div>
        </div>

        <ul className="register-summary-grid">
          <li>
            <span>Clientes</span>
            <strong>{clientCount}</strong>
          </li>
          <li>
            <span>Entregas</span>
            <strong>{deliveries.length}</strong>
          </li>
          <li>
            <span>Distância</span>
            <strong>{distance != null ? `${distance} km` : '—'}</strong>
          </li>
          <li>
            <span>Total de gastos</span>
            <strong>{formatMoney(total)}</strong>
          </li>
          <li>
            <span>Comprovantes anexados</span>
            <strong>{proofAttached}</strong>
          </li>
          <li>
            <span>Comprovantes pendentes</span>
            <strong>{proofPendingCount}</strong>
          </li>
        </ul>

        <p className="register-hint">
          {supabaseConfigured
            ? 'Ao salvar, o app tenta sincronizar. Só considere enviado quando o status confirmar.'
            : 'Sem Supabase configurado: o registro fica neste aparelho.'}
        </p>

        {error && (
          <p className="register-alert" role="alert">
            {error}
          </p>
        )}

        {!locked && (
          <div className="register-actions register-actions--desktop">
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
      </section>

      {!locked && (
        <div className="register-sticky" role="region" aria-label="Ações rápidas">
          <div className="register-sticky-total">
            <span>Total de gastos</span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <div className="register-sticky-actions">
            <button
              type="button"
              className="btn btn-ghost register-sticky-draft"
              disabled={busy}
              onClick={() => void save(true)}
            >
              Rascunho
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void save(false)}
            >
              {busy ? 'Salvando…' : 'Salvar registro'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
