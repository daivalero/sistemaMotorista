import { ArrowRight, ClipboardList, FilePlus2, Route } from 'lucide-react'
import { Card } from '../components/Card'
import { formatDateTime, formatLongDate, formatMoney } from '../data'
import { expenseTotal, expensesOf } from '../logic'
import { useStore } from '../store'

type Props = {
  onRegister: (id?: string) => void
  onOpenTrip: (id: string) => void
  onTrips: () => void
  onAdmin?: () => void
}

export function HomePage({ onRegister, onOpenTrip, onTrips, onAdmin }: Props) {
  const { state } = useStore()
  const profile = state.session.profile
  if (!profile) return null

  const myTrips = state.trips
    .filter((trip) => trip.driverId === profile.id || profile.role === 'admin')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const drafts = myTrips.filter((t) => t.status === 'rascunho' || t.status === 'em_andamento')
  const awaiting = myTrips.filter((t) => t.status === 'aguardando_conferencia').length
  const needsFix = myTrips.filter((t) => t.status === 'precisa_correcao').length

  return (
    <div className="home-dash">
      <header className="home-hello">
        <p className="home-hello-label">Olá,</p>
        <h1 className="home-hello-name">{profile.nome}</h1>
        <p className="home-hello-meta">
          {formatLongDate(new Date().toISOString())} ·{' '}
          {profile.role === 'admin' ? 'Administração' : 'Motorista agregado'}
        </p>
      </header>

      <Card
        as="button"
        type="button"
        interactive
        gradientTop
        padding="lg"
        className="home-hero"
        onClick={() => onRegister()}
      >
        <div className="home-hero-top">
          <span className="home-hero-icon" aria-hidden>
            <FilePlus2 size={22} />
          </span>
          <ArrowRight className="home-hero-arrow" size={18} aria-hidden />
        </div>
        <div className="home-hero-body">
          <p className="home-section-label">Registro rápido</p>
          <h2>Registrar viagem</h2>
          <p>Data, KM, relato, gastos e comprovantes em um único formulário.</p>
        </div>
        <span className="home-hero-cta">Abrir formulário</span>
      </Card>

      <section aria-labelledby="acoes-rapidas">
        <h2 id="acoes-rapidas" className="home-section-label">
          Ações rápidas
        </h2>
        <div className="home-actions">
          <Card as="button" type="button" interactive padding="md" className="home-action" onClick={onTrips}>
            <Route size={18} className="home-action-icon" aria-hidden />
            <strong>Meus registros</strong>
            <span>{myTrips.length} no histórico</span>
          </Card>
          <Card
            as="button"
            type="button"
            interactive
            padding="md"
            className="home-action"
            onClick={() => onRegister()}
          >
            <FilePlus2 size={18} className="home-action-icon" aria-hidden />
            <strong>Nova viagem</strong>
            <span>Formulário simples</span>
          </Card>
          {profile.role === 'admin' && onAdmin && (
            <Card as="button" type="button" interactive padding="md" className="home-action" onClick={onAdmin}>
              <ClipboardList size={18} className="home-action-icon" aria-hidden />
              <strong>Conferência</strong>
              <span>
                {awaiting} aguardando · {needsFix} correção
              </span>
            </Card>
          )}
        </div>
      </section>

      {drafts.length > 0 && (
        <section aria-labelledby="rascunhos">
          <h2 id="rascunhos" className="home-section-label">
            Continuar rascunho
          </h2>
          <Card padding="md">
            <ul className="home-routes">
              {drafts.slice(0, 4).map((trip) => (
                <li key={trip.id}>
                  <button type="button" onClick={() => onRegister(trip.id)}>
                    <span>
                      <strong>{trip.tripDate}</strong>
                      <small>
                        {expensesOf(state, trip.id).length} gastos ·{' '}
                        {formatMoney(expenseTotal(expensesOf(state, trip.id)))}
                      </small>
                    </span>
                    <span className="badge badge-rascunho">Rascunho</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {myTrips.length > 0 && (
        <section aria-labelledby="recentes">
          <div className="home-section-row">
            <h2 id="recentes" className="home-section-label">
              Recentes
            </h2>
            <button type="button" className="text-btn" onClick={onTrips}>
              Ver todas
            </button>
          </div>
          <Card padding="md">
            <ul className="home-routes">
              {myTrips.slice(0, 5).map((trip) => (
                <li key={trip.id}>
                  <button type="button" onClick={() => onOpenTrip(trip.id)}>
                    <span>
                      <strong>{trip.tripDate}</strong>
                      <small>
                        Atualizado {formatDateTime(trip.updatedAt)}
                        {trip.syncState === 'local' ? ' · neste aparelho' : ''}
                      </small>
                    </span>
                    <span className={`badge badge-${trip.status}`}>{statusLabel(trip.status)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
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
      return 'Enviado'
    case 'precisa_correcao':
      return 'Correção'
    case 'concluida':
      return 'Concluída'
    default:
      return status
  }
}
