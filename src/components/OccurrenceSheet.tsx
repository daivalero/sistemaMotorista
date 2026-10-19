import { useEffect, useState } from 'react'
import { motivos } from '../data'

type Props = {
  cliente: string
  onClose: () => void
  onSubmit: (motivo: string, nota: string) => void
}

export function OccurrenceSheet({ cliente, onClose, onSubmit }: Props) {
  const [motivo, setMotivo] = useState('')
  const [nota, setNota] = useState('')

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id="sheet-title">Registrar ocorrência</h2>
        <p className="muted">{cliente}</p>
        <div className="reason-list" role="radiogroup" aria-label="Motivo">
          {motivos.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={motivo === item}
              className={motivo === item ? 'reason active' : 'reason'}
              onClick={() => setMotivo(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Nota para a base</span>
          <textarea
            value={nota}
            onChange={(event) => setNota(event.target.value)}
            rows={3}
            placeholder="Opcional. Ex.: porteiro pediu retorno amanhã."
          />
        </label>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!motivo}
            onClick={() => onSubmit(motivo, nota.trim())}
          >
            Salvar ocorrência
          </button>
        </div>
      </div>
    </div>
  )
}
