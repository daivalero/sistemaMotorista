import { IconLogout } from "../icons.jsx";
import { useStore } from "../store.jsx";

export function Profile() {
  const { state, currentUser, currentDriver, logout } = useStore();
  const user = currentUser();
  const driver = currentDriver();
  const vehicle = state.vehicles.find((item) => item.id === driver?.vehicleId);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Conta</p>
          <h1>Perfil</h1>
        </div>
      </header>

      <article className="profile-hero">
        <div className="avatar">{user.name.slice(0, 1)}</div>
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </article>

      <div className="info-list">
        <div>
          <small>Telefone</small>
          <p>{driver.phone}</p>
        </div>
        <div>
          <small>CNH</small>
          <p>
            {driver.cnh} · Categoria {driver.category}
          </p>
        </div>
        <div>
          <small>Cidade</small>
          <p>{driver.city}</p>
        </div>
        <div>
          <small>Veículo</small>
          <p>
            {vehicle
              ? `${vehicle.model} · ${vehicle.plate}`
              : "Nenhum veículo vinculado"}
          </p>
        </div>
      </div>

      <button className="btn btn-ghost btn-block" type="button" onClick={logout}>
        <IconLogout /> Sair
      </button>
    </section>
  );
}
