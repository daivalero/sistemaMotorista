import { formatLongDate } from '../data'
import { canFinish, countDone } from '../logic'
import type { Trip } from '../types'
import { Badge, Progress } from '../components/Ui'

type Props = {
  trip: Trip | undefined
  onStart: () => void
  onDeliver: (stopId: string) => void
  onReport: (stopId: string) => void
  onFinish: () => void
}

export function TripPage({ trip, onStart, onDeliver, onReport, onFinish }: Props) {
  if (!trip) {
    return (
      <section className="empty-hero">
        <h2>Viagem não encontrada</h2>
        <p>Essa rota não está mais na sua lista.</p>
      </section>
    )
  }

  const ready = canFinish(trip)
  const current = trip.paradas.find((stop) => stop.status === 'em_rota')

  return (
    <div className={ready ? 'detail has-finish' : 'detail'}>
      <div className="detail-grid">
        <div>
          <p className="eyebrow">{formatLongDate(trip.data)}</p>
          <div className="detail-title">
            <h2>
              {trip.origem} → {trip.regiao}
            </h2>
            <Badge status={trip.status} />
          </div>
          <p className="lede tight">
            Saída {trip.saida} · {trip.km} km · {countDone(trip)} de {trip.paradas.length} paradas
            resolvidas
          </p>
          <Progress value={countDone(trip)} max={trip.paradas.length} />

          {trip.status === 'agendada' && (
            <button type="button" className="btn btn-primary start-btn" onClick={onStart}>
              Iniciar viagem
            </button>
          )}

          <ol className="stops">
            {trip.paradas.map((stop, index) => (
              <li key={stop.id} className={`stop stop-${stop.status}`}>
                <div className="stop-rail" aria-hidden="true">
                  <span>{index + 1}</span>
                </div>
                <div className="stop-body">
                  <div className="stop-head">
                    <div>
                      <strong>{stop.cliente}</strong>
                      <span className="muted">{stop.janela}</span>
                    </div>
                    <Badge status={stop.status} />
                  </div>
                  <p>
                    {stop.endereco}
                    <br />
                    {stop.bairro} · {stop.volumes} {stop.volumes === 1 ? 'volume' : 'volumes'}
                  </p>
                  {stop.status === 'ocorrencia' && stop.motivo && (
                    <p className="note">
                      {stop.motivo}
                      {stop.nota ? ` — ${stop.nota}` : ''}
                    </p>
                  )}
                  {stop.status === 'em_rota' && trip.status === 'em_andamento' && (
                    <div className="actions">
                      <button type="button" className="btn btn-primary" onClick={() => onDeliver(stop.id)}>
                        Marcar entrega
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => onReport(stop.id)}>
                        Ocorrência
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="detail-side">
          <section className="panel">
            <h2>Resumo</h2>
            <dl className="spec">
              <div>
                <dt>Código</dt>
                <dd>{trip.codigo}</dd>
              </div>
              <div>
                <dt>Veículo</dt>
                <dd>{trip.veiculo}</dd>
              </div>
              <div>
                <dt>Placa</dt>
                <dd>{trip.placa}</dd>
              </div>
              <div>
                <dt>Agora</dt>
                <dd>{current ? current.cliente : trip.status === 'concluida' ? 'Rota encerrada' : 'Ainda não iniciada'}</dd>
              </div>
            </dl>
            {ready && (
              <button type="button" className="btn btn-primary btn-block finish-desktop" onClick={onFinish}>
                Encerrar viagem
              </button>
            )}
            {trip.status === 'concluida' && <p className="muted">Viagem encerrada e enviada para a base.</p>}
          </section>
        </aside>
      </div>

      {ready && (
        <div className="finish-mobile">
          <button type="button" className="btn btn-primary btn-block" onClick={onFinish}>
            Encerrar viagem
          </button>
        </div>
      )}
    </div>
  )
}
