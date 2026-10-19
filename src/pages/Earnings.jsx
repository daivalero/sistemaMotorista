import { formatMoney, isToday, useStore } from "../store.jsx";

function weekday(iso) {
  return new Date(iso)
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .slice(0, 3);
}

export function Earnings() {
  const { state, currentDriver } = useStore();
  const driver = currentDriver();
  const rides = state.rides.filter(
    (ride) => ride.driverId === driver.id && ride.status === "concluida"
  );
  const todayTotal = rides
    .filter((ride) => isToday(ride.when))
    .reduce((sum, ride) => sum + ride.value, 0);
  const weekTotal = rides.reduce((sum, ride) => sum + ride.value, 0);

  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    const total = rides
      .filter((ride) => new Date(ride.when).toDateString() === key)
      .reduce((sum, ride) => sum + ride.value, 0);
    return { label: weekday(date.toISOString()), total };
  });
  const max = Math.max(...buckets.map((item) => item.total), 1);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Financeiro</p>
          <h1>Ganhos</h1>
        </div>
      </header>

      <div className="stat-grid two">
        <article className="stat highlight">
          <small>Hoje</small>
          <strong>{formatMoney(todayTotal)}</strong>
        </article>
        <article className="stat">
          <small>Últimos 7 dias</small>
          <strong>{formatMoney(weekTotal)}</strong>
        </article>
      </div>

      <article className="chart-card">
        <div className="section-head">
          <h2>Semana</h2>
        </div>
        <div className="bars" aria-hidden="true">
          {buckets.map((item) => (
            <div key={item.label} className="bar-col">
              <div
                className="bar"
                style={{ height: `${Math.max(8, (item.total / max) * 120)}px` }}
              />
              <small>{item.label.replace(".", "")}</small>
            </div>
          ))}
        </div>
      </article>

      <div className="section-head">
        <h2>Lançamentos</h2>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Rota</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride.id}>
                <td data-label="Cliente">{ride.client}</td>
                <td data-label="Rota">
                  {ride.origin.split("—")[0]} → {ride.dest.split("—")[0]}
                </td>
                <td data-label="Valor">{formatMoney(ride.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
