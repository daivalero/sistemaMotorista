import { Card } from '../components/Card'
import { formatDateTime, formatMoney } from '../data'
import {
  attachmentsOf,
  canEditTrip,
  deliveriesOf,
  expenseTotal,
  expenseTotalsByCategory,
  expensesOf,
  pendingProofs,
  tripDistance,
} from '../logic'
import { useStore } from '../store'

const categoryLabel: Record<string, string> = {
  combustivel: 'Combustível',
  pedagio: 'Pedágio',
  estacionamento: 'Estacionamento',
  manutencao: 'Manutenção',
  outros: 'Outros',
}

type Props = {
  tripId: string
  onEdit: () => void
}

export function TripPage({ tripId, onEdit }: Props) {
  const { state } = useStore()
  const trip = state.trips.find((item) => item.id === tripId)
  const vehicle = state.vehicles.find((item) => item.id === trip?.vehicleId)
  const expenses = expensesOf(state, tripId)
  const attachments = attachmentsOf(state, tripId)
  const deliveries = deliveriesOf(state, tripId)
  const byCategory = expenseTotalsByCategory(expenses)
  const editable = trip ? canEditTrip(trip) : false
  const pending = pendingProofs(expenses, attachments, deliveries)

  if (!trip) {
    return (
      <div className="empty-hero">
        <h2>Registro não encontrado</h2>
        <p>Ele pode ter sido removido ou ainda não está neste aparelho.</p>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <header className="page-intro">
        <p className="home-section-label">Consulta</p>
        <h1>{trip.tripDate}</h1>
        <p className="muted">
          {vehicle ? `${vehicle.plate} · ${vehicle.model}` : 'Veículo'} ·{' '}
          <span className={`badge badge-${trip.status}`}>{statusLabel(trip.status)}</span>
        </p>
        {trip.syncState === 'local' && (
          <p className="sync-pill">Salvo neste aparelho — ainda não sincronizado com o servidor</p>
        )}
        {trip.syncState === 'enviando' && (
          <p className="sync-pill">Enviando ao servidor…</p>
        )}
        {trip.syncState === 'sincronizado' && (
          <p className="sync-pill">Sincronizado com o servidor</p>
        )}
        {trip.syncState === 'erro' && (
          <p className="form-error">Falha de sincronização: {trip.syncError ?? 'tente novamente.'}</p>
        )}
        {trip.correctionNotes && (
          <p className="form-error">Correção solicitada: {trip.correctionNotes}</p>
        )}
      </header>

      <Card padding="md">
        <ul className="home-summary">
          <li>
            <span>KM inicial</span>
            <strong>{trip.kmStart ?? '—'}</strong>
          </li>
          <li>
            <span>KM final</span>
            <strong>{trip.kmEnd ?? '—'}</strong>
          </li>
          <li>
            <span>Distância</span>
            <strong>{tripDistance(trip) != null ? `${tripDistance(trip)} km` : '—'}</strong>
          </li>
          <li>
            <span>Total de gastos</span>
            <strong>{formatMoney(expenseTotal(expenses))}</strong>
          </li>
          <li>
            <span>Comprovantes pendentes</span>
            <strong>{pending}</strong>
          </li>
        </ul>
      </Card>

      {trip.relato && (
        <Card padding="md">
          <h2 className="form-section-title">Relato</h2>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{trip.relato}</p>
        </Card>
      )}

      <Card padding="md">
        <h2 className="form-section-title">Clientes e entregas</h2>
        {deliveries.length === 0 ? (
          <p className="muted">Nenhuma entrega neste registro.</p>
        ) : (
          <ul className="home-routes">
            {deliveries.map((item) => (
              <li key={item.id}>
                <button type="button">
                  <span>
                    <strong>{item.clientName}</strong>
                    <small>
                      {item.address || 'Sem endereço'} · {item.status}
                      {item.proofPending || !item.proofDataUrl
                        ? item.status === 'entregue'
                          ? ' · comprovante pendente'
                          : ''
                        : ' · comprovante ok'}
                    </small>
                  </span>
                  <span className={`badge badge-${item.status}`}>{item.status}</span>
                </button>
                {item.proofDataUrl && (
                  <img className="proof-thumb" src={item.proofDataUrl} alt={`Canhoto ${item.clientName}`} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="md">
        <h2 className="form-section-title">Gastos</h2>
        {expenses.length === 0 ? (
          <p className="muted">Nenhum gasto neste registro.</p>
        ) : (
          <>
            <ul className="home-summary">
              {Object.entries(byCategory).map(([cat, total]) => (
                <li key={cat}>
                  <span>{categoryLabel[cat] ?? cat}</span>
                  <strong>{formatMoney(total)}</strong>
                </li>
              ))}
            </ul>
            <ul className="home-routes">
              {expenses.map((expense) => (
                <li key={expense.id}>
                  <button type="button">
                    <span>
                      <strong>
                        {categoryLabel[expense.category]} · {formatMoney(expense.amount)}
                      </strong>
                      <small>
                        {expense.expenseDate}
                        {expense.proofPending || !expense.proofDataUrl
                          ? ' · comprovante pendente'
                          : ' · comprovante ok'}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card padding="md">
        <h2 className="form-section-title">Anexos</h2>
        {attachments.length === 0 ? (
          <p className="muted">Nenhum arquivo anexado.</p>
        ) : (
          <ul className="home-routes">
            {attachments.map((item) => (
              <li key={item.id}>
                <button type="button">
                  <span>
                    <strong>{item.description || 'Arquivo'}</strong>
                    <small>
                      {item.proofPending || !item.proofDataUrl ? 'Pendente' : 'Anexado'} ·{' '}
                      {formatDateTime(item.createdAt)}
                    </small>
                  </span>
                </button>
                {item.proofDataUrl && (
                  <img className="proof-thumb" src={item.proofDataUrl} alt={item.description || 'Anexo'} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editable && (
        <button type="button" className="btn btn-primary btn-block" onClick={onEdit}>
          Continuar preenchendo
        </button>
      )}
    </div>
  )
}

function statusLabel(status: string) {
  switch (status) {
    case 'rascunho':
    case 'em_andamento':
      return 'Rascunho'
    case 'aguardando_conferencia':
      return 'Aguardando conferência'
    case 'precisa_correcao':
      return 'Precisa de correção'
    case 'concluida':
      return 'Concluída'
    default:
      return status
  }
}
