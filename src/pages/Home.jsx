import { IconBell, IconStar } from "../icons.jsx";
import { RideCard } from "../components/RideCard.jsx";
import { EmptyState } from "../components/ui.jsx";
import { formatMoney, isToday, useStore } from "../store.jsx";

export function Home({ onOpenRide }) {
  const { state, currentUser, currentDriver, toggleOnline } = useStore();
  const driver = currentDriver();
  const user = currentUser();

  if (!driver) return null;

  const myRides = state.rides.filter((ride) => ride.driverId === driver.id);
  const todayRides = myRides.filter(
    (ride) => isToday(ride.when) && ride.status === "concluida"
  );
  const todayTotal = todayRides.reduce((sum, ride) => sum + ride.value, 0);
  const active = myRides.find((ride) =>
    ["aceita", "em_andamento"].includes(ride.status)
  );
  const nextAvailable = state.rides.find((ride) => ride.status === "disponivel");

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Olá,</p>
          <h1>{user.name.split(" ")[0]}</h1>
        </div>
        <button className="icon-btn" type="button" aria-label="Notificações">
          <IconBell />
        </button>
      </header>

      <article className={`status-card ${driver.online ? "online" : "offline"}`}>
        <div>
          <p>{driver.online ? "Você está online" : "Você está offline"}</p>
          <small>
            {driver.online
              ? "Novas corridas aparecem na sua lista"
              : "Fique online para receber chamadas"}
          </small>
        </div>
        <button
          type="button"
          className={`toggle ${driver.online ? "on" : ""}`}
          onClick={() => toggleOnline(driver.id)}
          aria-pressed={driver.online}
        >
          <span />
        </button>
      </article>

      <div className="stat-grid">
        <article className="stat">
          <small>Corridas hoje</small>
          <strong>{todayRides.length}</strong>
        </article>
        <article className="stat">
          <small>Ganhos de hoje</small>
          <strong>{formatMoney(todayTotal)}</strong>
        </article>
        <article className="stat">
          <small>Avaliação</small>
          <strong className="stat-rating">
            {driver.rating.toFixed(1)} <IconStar />
          </strong>
        </article>
      </div>

      <div className="section-head">
        <h2>{active ? "Corrida atual" : "Próxima oportunidade"}</h2>
      </div>
      {active || nextAvailable ? (
        <RideCard ride={active || nextAvailable} onOpen={onOpenRide} />
      ) : (
        <EmptyState
          title="Nenhuma corrida no momento"
          text="Quando surgir um chamado, ele aparece aqui."
        />
      )}
    </section>
  );
}
