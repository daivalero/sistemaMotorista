import { rideLabel } from "../store.jsx";

export function Badge({ status }) {
  return <span className={`badge badge-${status}`}>{rideLabel(status)}</span>;
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Money({ value }) {
  return (
    <span className="money">
      {value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </span>
  );
}
