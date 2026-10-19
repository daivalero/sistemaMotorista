import { useState } from "react";
import { RideCard } from "../components/RideCard.jsx";
import { EmptyState, Field } from "../components/ui.jsx";
import { formatMoney, useStore } from "../store.jsx";
import { IconLogout, IconPlus } from "../icons.jsx";

export function AdminDashboard({ onOpenRide }) {
  const { state, logout } = useStore();
  const online = state.drivers.filter((driver) => driver.online).length;
  const openRides = state.rides.filter((ride) => ride.status === "disponivel");
  const done = state.rides.filter((ride) => ride.status === "concluida");
  const revenue = done.reduce((sum, ride) => sum + ride.value, 0);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Painel da frota</h1>
        </div>
        <button className="icon-btn" type="button" onClick={logout} aria-label="Sair">
          <IconLogout />
        </button>
      </header>

      <div className="stat-grid">
        <article className="stat">
          <small>Motoristas online</small>
          <strong>
            {online}/{state.drivers.length}
          </strong>
        </article>
        <article className="stat">
          <small>Corridas abertas</small>
          <strong>{openRides.length}</strong>
        </article>
        <article className="stat highlight">
          <small>Faturamento</small>
          <strong>{formatMoney(revenue)}</strong>
        </article>
      </div>

      <div className="section-head">
        <h2>Fila de chamados</h2>
      </div>
      <div className="card-grid">
        {openRides.length === 0 ? (
          <EmptyState title="Fila vazia" text="Nenhuma corrida disponível agora." />
        ) : (
          openRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} onOpen={onOpenRide} />
          ))
        )}
      </div>
    </section>
  );
}

export function AdminDrivers() {
  const { state, addDriver } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    cnh: "",
    category: "D",
    city: "",
    vehicleId: "",
  });

  function submit(event) {
    event.preventDefault();
    addDriver(form);
    setForm({ name: "", phone: "", cnh: "", category: "D", city: "", vehicleId: "" });
    setOpen(false);
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Equipe</p>
          <h1>Motoristas</h1>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
          <IconPlus /> Novo
        </button>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cidade</th>
              <th>CNH</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {state.drivers.map((driver) => (
              <tr key={driver.id}>
                <td data-label="Nome">{driver.name}</td>
                <td data-label="Cidade">{driver.city}</td>
                <td data-label="CNH">
                  {driver.category} · {driver.cnh}
                </td>
                <td data-label="Status">
                  <span className={`pill ${driver.online ? "ok" : ""}`}>
                    {driver.status === "ativo"
                      ? driver.online
                        ? "Online"
                        : "Offline"
                      : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <FormSheet title="Novo motorista" onClose={() => setOpen(false)}>
          <form className="form" onSubmit={submit}>
            <Field label="Nome">
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <div className="form-grid">
              <Field label="Telefone">
                <input
                  required
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </Field>
              <Field label="Cidade">
                <input
                  required
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="CNH">
                <input
                  required
                  value={form.cnh}
                  onChange={(event) => setForm({ ...form, cnh: event.target.value })}
                />
              </Field>
              <Field label="Categoria">
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  <option>B</option>
                  <option>C</option>
                  <option>D</option>
                  <option>E</option>
                </select>
              </Field>
            </div>
            <Field label="Veículo">
              <select
                value={form.vehicleId}
                onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}
              >
                <option value="">Sem veículo</option>
                {state.vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.model} · {vehicle.plate}
                  </option>
                ))}
              </select>
            </Field>
            <button className="btn btn-primary btn-block" type="submit">
              Salvar motorista
            </button>
          </form>
        </FormSheet>
      )}
    </section>
  );
}

export function AdminVehicles() {
  const { state, addVehicle } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    plate: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    km: 0,
  });

  function submit(event) {
    event.preventDefault();
    addVehicle({ ...form, year: Number(form.year), km: Number(form.km) });
    setForm({ plate: "", model: "", year: new Date().getFullYear(), color: "", km: 0 });
    setOpen(false);
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Frota</p>
          <h1>Veículos</h1>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
          <IconPlus /> Novo
        </button>
      </header>

      <div className="card-grid">
        {state.vehicles.map((vehicle) => (
          <article key={vehicle.id} className="vehicle-card">
            <div className="vehicle-top">
              <strong>{vehicle.model}</strong>
              <span className={`pill ${vehicle.status === "operando" ? "ok" : "warn"}`}>
                {vehicle.status}
              </span>
            </div>
            <p className="plate">{vehicle.plate}</p>
            <div className="vehicle-meta">
              <span>{vehicle.year}</span>
              <span>{vehicle.color}</span>
              <span>{vehicle.km.toLocaleString("pt-BR")} km</span>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <FormSheet title="Novo veículo" onClose={() => setOpen(false)}>
          <form className="form" onSubmit={submit}>
            <Field label="Modelo">
              <input
                required
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
              />
            </Field>
            <div className="form-grid">
              <Field label="Placa">
                <input
                  required
                  value={form.plate}
                  onChange={(event) => setForm({ ...form, plate: event.target.value })}
                />
              </Field>
              <Field label="Ano">
                <input
                  required
                  type="number"
                  value={form.year}
                  onChange={(event) => setForm({ ...form, year: event.target.value })}
                />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Cor">
                <input
                  required
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                />
              </Field>
              <Field label="Quilometragem">
                <input
                  required
                  type="number"
                  value={form.km}
                  onChange={(event) => setForm({ ...form, km: event.target.value })}
                />
              </Field>
            </div>
            <button className="btn btn-primary btn-block" type="submit">
              Salvar veículo
            </button>
          </form>
        </FormSheet>
      )}
    </section>
  );
}

export function AdminRides({ onOpenRide }) {
  const { state, addRide } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    origin: "",
    dest: "",
    client: "",
    value: "",
    distance: "",
    eta: "",
    driverId: "",
  });

  function submit(event) {
    event.preventDefault();
    addRide({
      ...form,
      value: Number(form.value),
      when: new Date().toISOString(),
      driverId: form.driverId || null,
      status: form.driverId ? "aceita" : "disponivel",
    });
    setForm({
      origin: "",
      dest: "",
      client: "",
      value: "",
      distance: "",
      eta: "",
      driverId: "",
    });
    setOpen(false);
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operação</p>
          <h1>Corridas</h1>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
          <IconPlus /> Nova
        </button>
      </header>

      <div className="card-grid">
        {state.rides.map((ride) => (
          <RideCard key={ride.id} ride={ride} onOpen={onOpenRide} />
        ))}
      </div>

      {open && (
        <FormSheet title="Nova corrida" onClose={() => setOpen(false)}>
          <form className="form" onSubmit={submit}>
            <Field label="Cliente">
              <input
                required
                value={form.client}
                onChange={(event) => setForm({ ...form, client: event.target.value })}
              />
            </Field>
            <Field label="Origem">
              <input
                required
                value={form.origin}
                onChange={(event) => setForm({ ...form, origin: event.target.value })}
              />
            </Field>
            <Field label="Destino">
              <input
                required
                value={form.dest}
                onChange={(event) => setForm({ ...form, dest: event.target.value })}
              />
            </Field>
            <div className="form-grid">
              <Field label="Valor">
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(event) => setForm({ ...form, value: event.target.value })}
                />
              </Field>
              <Field label="Distância">
                <input
                  required
                  value={form.distance}
                  placeholder="12 km"
                  onChange={(event) => setForm({ ...form, distance: event.target.value })}
                />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Tempo estimado">
                <input
                  required
                  value={form.eta}
                  placeholder="18 min"
                  onChange={(event) => setForm({ ...form, eta: event.target.value })}
                />
              </Field>
              <Field label="Motorista">
                <select
                  value={form.driverId}
                  onChange={(event) => setForm({ ...form, driverId: event.target.value })}
                >
                  <option value="">Fila livre</option>
                  {state.drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button className="btn btn-primary btn-block" type="submit">
              Publicar corrida
            </button>
          </form>
        </FormSheet>
      )}
    </section>
  );
}

function FormSheet({ title, onClose, children }) {
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminRideDetail({ rideId, onBack }) {
  const { state } = useStore();
  const ride = state.rides.find((item) => item.id === rideId);
  const driver = state.drivers.find((item) => item.id === ride?.driverId);

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

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operação</p>
          <h1>Corrida</h1>
        </div>
        <button className="btn" type="button" onClick={onBack}>
          Voltar
        </button>
      </header>
      <article className="detail-card">
        <p>
          <strong>{ride.client}</strong>
        </p>
        <p>
          {ride.origin} → {ride.dest}
        </p>
        <p>Motorista: {driver ? driver.name : "Sem atribuição"}</p>
        <p>Valor: {formatMoney(ride.value)}</p>
      </article>
    </section>
  );
}
