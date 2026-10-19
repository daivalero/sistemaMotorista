import { formatWhen } from "../store.jsx";
import { Badge, Money } from "./ui.jsx";
import { IconClock, IconPin } from "../icons.jsx";

export function RideCard({ ride, onOpen, compact = false }) {
  return (
    <button type="button" className="ride-card" onClick={() => onOpen(ride.id)}>
      <div className="ride-card-top">
        <Badge status={ride.status} />
        <Money value={ride.value} />
      </div>
      <div className="ride-route">
        <span className="dot start" />
        <p>{ride.origin}</p>
      </div>
      <div className="ride-route">
        <span className="dot end" />
        <p>{ride.dest}</p>
      </div>
      {!compact && (
        <div className="ride-meta">
          <span>
            <IconPin /> {ride.distance}
          </span>
          <span>
            <IconClock /> {formatWhen(ride.when)}
          </span>
        </div>
      )}
    </button>
  );
}
