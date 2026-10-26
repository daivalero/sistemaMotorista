import { useState, type FormEvent } from 'react'
import { createExpense, fileToDataUrl } from '../../services/trips'
import { useStore } from '../../store'
import type { ExpenseCategory } from '../../types'
import { canEditTrip } from '../../logic'

const categories: { id: ExpenseCategory; label: string }[] = [
  { id: 'combustivel', label: 'Combustível' },
  { id: 'pedagio', label: 'Pedágio' },
  { id: 'estacionamento', label: 'Estacionamento' },
  { id: 'manutencao', label: 'Manutenção' },
  { id: 'outros', label: 'Outros' },
]

type Props = {
  tripId: string
  onClose: () => void
}

export function ExpenseSheet({ tripId, onClose }: Props) {
  const { state, dispatch, notify } = useStore()
  const trip = state.trips.find((t) => t.id === tripId)
  const editable = trip ? canEditTrip(trip) : false
  const [category, setCategory] = useState<ExpenseCategory>('combustivel')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [liters, setLiters] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [odometer, setOdometer] = useState('')
  const [stationName, setStationName] = useState('')
  const [proofPending, setProofPending] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [requestId] = useState(() => `req_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!trip) return null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editable) return
    const value = Number(amount.replace(',', '.'))
    if (!Number.isFinite(value) || value < 0) {
      setError('Informe um valor válido.')
      return
    }
    if (state.expenses.some((item) => item.clientRequestId === requestId)) {
      setError('Este gasto já foi enviado.')
      return
    }
    setBusy(true)
    setError('')
    try {
      let proofDataUrl: string | undefined
      if (proofFile) proofDataUrl = await fileToDataUrl(proofFile)
      const expense = createExpense({
        tripId,
        category,
        amount: value,
        expenseDate,
        notes,
        proofDataUrl,
        proofPending: proofPending || !proofDataUrl,
        liters: liters ? Number(liters.replace(',', '.')) : undefined,
        pricePerLiter: pricePerLiter ? Number(pricePerLiter.replace(',', '.')) : undefined,
        odometer: odometer ? Number(odometer.replace(',', '.')) : undefined,
        stationName,
        clientRequestId: requestId,
      })
      dispatch({ type: 'upsert-expense', expense })
      notify(
        expense.syncState === 'local'
          ? 'Gasto salvo neste aparelho.'
          : 'Gasto registrado na viagem.',
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar o gasto.')
      notify('O envio falhou. O registro pode estar só neste aparelho.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Registrar gasto" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Registrar gasto</h2>
        <p className="muted">O valor fica na viagem, não em cada entrega.</p>
        <form className="form-stack" onSubmit={(e) => void submit(e)}>
          <label className="field">
            <span>Categoria</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Valor (R$)</span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label className="field">
            <span>Data do gasto</span>
            <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
          </label>

          {category === 'combustivel' && (
            <>
              <label className="field">
                <span>Litros</span>
                <input inputMode="decimal" value={liters} onChange={(e) => setLiters(e.target.value)} />
              </label>
              <label className="field">
                <span>Preço por litro</span>
                <input inputMode="decimal" value={pricePerLiter} onChange={(e) => setPricePerLiter(e.target.value)} />
              </label>
              <label className="field">
                <span>KM no abastecimento</span>
                <input inputMode="decimal" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
              </label>
              <label className="field">
                <span>Posto</span>
                <input value={stationName} onChange={(e) => setStationName(e.target.value)} />
              </label>
            </>
          )}

          <label className="field">
            <span>Observações</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </label>
          <label className="field">
            <span>Foto do comprovante</span>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="check-row">
            <input type="checkbox" checked={proofPending} onChange={(e) => setProofPending(e.target.checked)} />
            <span>Comprovante pendente (anexar depois)</span>
          </label>

          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || !editable}>
            {busy ? 'Salvando…' : 'Salvar gasto'}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  )
}
