import { supabaseConfigured } from '../lib/supabase'
import { useStore } from '../store'

type Props = {
  onLogout: () => void
}

export function ProfilePage({ onLogout }: Props) {
  const { state } = useStore()
  const profile = state.session.profile
  if (!profile) return null

  const vehicles = state.vehicles.filter((v) => v.driverId === profile.id)

  return (
    <div className="profile-grid">
      <section className="panel identity">
        <span className="avatar large" aria-hidden="true">
          {profile.nome
            .split(' ')
            .slice(0, 2)
            .map((p) => p[0])
            .join('')
            .toUpperCase()}
        </span>
        <div>
          <h2>{profile.nome}</h2>
          <p className="muted">
            Matrícula {profile.matricula} · {profile.role}
          </p>
          {profile.telefone && <p>{profile.telefone}</p>}
        </div>
      </section>

      {vehicles.length > 0 && (
        <section className="panel">
          <h2>Veículos associados</h2>
          <dl className="spec">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id}>
                <dt>{vehicle.plate}</dt>
                <dd>
                  {vehicle.model}
                  {vehicle.year ? ` · ${vehicle.year}` : ''}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="panel">
        <h2>Persistência</h2>
        <p className="muted">
          {supabaseConfigured
            ? 'Supabase configurado. Os envios usam o servidor quando houver conexão.'
            : 'Supabase ainda não configurado. Os registros ficam neste aparelho (não inventamos viagens de demonstração).'}
        </p>
      </section>

      <section className="panel actions-panel">
        <h2>Sessão</h2>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onLogout}>
            Sair
          </button>
        </div>
      </section>
    </div>
  )
}
