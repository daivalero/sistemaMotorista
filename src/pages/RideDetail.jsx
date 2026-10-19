import { IconBack, IconClock, IconPin } from "../icons.jsx";
import { Badge, Money } from "../components/ui.jsx";
import { formatWhen, useStore } from "../store.jsx";

export function RideDetail({ rideId, onBack }) {
  const { state, currentDriver, updateRide } = useStore();
  const ride = state.rides.find((item) => item.id === rideId);
  const driver = currentDriver();
  const vehicle = state.vehicles.find((item) => item.id === driver?.vehicleId);

  if (!ride) {
    return (
      <section className="page">
        <p>Corrida não encontrada.</p>
        <button className="btn" type="button" onClick={onBack}>
          Voltar
        </button>
      </section>
    );
  }

  const mine = ride.driverId === driver?.id;
  const canAccept = ride.status === "disponivel" && driver;
  const canStart = mine && ride.status === "aceita";
  const canFinish = mine && ride.status === "em_andamento";

  return (
    <section className="page">
      <header className="page-header">
        <button className="icon-btn" type="button" onClick={onBack} aria-label="Voltar">
          <IconBack />
        </button>
        <div className="header-grow">
          <p className="eyebrow">Detalhe</p>
          <h1>Corrida</h1>
        </div>
        <Badge status={ride.status} />
      </header>

      <article className="detail-card">
        <div className="detail-price">
          <small>Valor estimado</small>
          <Money value={ride.value} />
        </div>
        <div className="route-block">
          <div className="ride-route">
            <span className="dot start" />
            <div>
              <small>Origem</small>
              <p>{ride.origin}</p>
            </div>
          </div>
          <div className="ride-route">
            <span className="dot end" />
            <div>
              <small>Destino</small>
              <p>{ride.dest}</p>
            </div>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <small>Cliente</small>
            <p>{ride.client}</p>
          </div>
          <div>
            <small>Horário</small>
            <p>
              <IconClock /> {formatWhen(ride.when)}
            </p>
          </div>
          <div>
            <small>Distância</small>
            <p>
              <IconPin /> {ride.distance} · {ride.eta}
            </p>
          </div>
          {vehicle && (
            <div>
              <small>Veículo</small>
              <p>
                {vehicle.model} · {vehicle.plate}
              </p>
            </div>
          )}
        </div>
      </article>

      <div className="action-bar">
        {canAccept && (
          <button
            className="btn btn-primary btn-block"
            type="button"
            onClick={() =>
              updateRide(ride.id, { status: "aceita", driverId: driver.id })
            }
          >
            Aceitar corrida
          </button>
        )}
        {canStart && (
          <button
            className="btn btn-primary btn-block"
            type="button"
            onClick={() => updateRide(ride.id, { status: "em_andamento" })}
          >
            Iniciar rota
          </button>
        )}
        {canFinish && (
          <button
            className="btn btn-primary btn-block"
            type="button"
            onClick={() => updateRide(ride.id, { status: "concluida" })}
          >
            Concluir corrida
          </button>
        )}
        {ride.status === "concluida" && (
          <p className="hint">Esta corrida já foi finalizada.</p>
        )}
      </div>
    </section>
  );
}
