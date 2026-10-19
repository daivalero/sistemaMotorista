import { useMemo, useState } from "react";
import { RideCard } from "../components/RideCard.jsx";
import { EmptyState } from "../components/ui.jsx";
import { useStore } from "../store.jsx";

const filters = [
  { id: "abertas", label: "Abertas" },
  { id: "minhas", label: "Minhas" },
  { id: "historico", label: "Histórico" },
];

export function Rides({ onOpenRide }) {
  const { state, currentDriver } = useStore();
  const driver = currentDriver();
  const [filter, setFilter] = useState("abertas");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return state.rides
      .filter((ride) => {
        if (filter === "abertas") return ride.status === "disponivel";
        if (filter === "minhas") {
          return (
            ride.driverId === driver.id &&
            ["aceita", "em_andamento"].includes(ride.status)
          );
        }
        return ride.driverId === driver.id && ride.status === "concluida";
      })
      .filter((ride) => {
        const blob = `${ride.origin} ${ride.dest} ${ride.client}`.toLowerCase();
        return blob.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => new Date(b.when) - new Date(a.when));
  }, [state.rides, filter, query, driver.id]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1>Corridas</h1>
        </div>
      </header>

      <label className="search">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar origem, destino ou cliente"
        />
      </label>

      <div className="chips" role="tablist">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className={filter === item.id ? "active" : ""}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="stack">
        {list.length === 0 ? (
          <EmptyState
            title="Nada por aqui"
            text="Ajuste o filtro ou aguarde um novo chamado."
          />
        ) : (
          list.map((ride) => (
            <RideCard key={ride.id} ride={ride} onOpen={onOpenRide} />
          ))
        )}
      </div>
    </section>
  );
}
