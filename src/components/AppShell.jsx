import {
  IconCar,
  IconGrid,
  IconHome,
  IconUser,
  IconWallet,
  IconWheel,
} from "../icons.jsx";

const driverTabs = [
  { id: "home", label: "Início", Icon: IconHome },
  { id: "rides", label: "Corridas", Icon: IconWheel },
  { id: "earnings", label: "Ganhos", Icon: IconWallet },
  { id: "profile", label: "Perfil", Icon: IconUser },
];

const adminTabs = [
  { id: "admin", label: "Painel", Icon: IconGrid },
  { id: "admin-rides", label: "Corridas", Icon: IconWheel },
  { id: "admin-drivers", label: "Motoristas", Icon: IconUser },
  { id: "admin-vehicles", label: "Veículos", Icon: IconCar },
];

export function AppShell({ role, page, onNavigate, userName, children }) {
  const tabs = role === "admin" ? adminTabs : driverTabs;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">SM</span>
          <div>
            <strong>Sistema Motorista</strong>
            <small>{role === "admin" ? "Central da frota" : "Painel do motorista"}</small>
          </div>
        </div>
        <nav className="side-nav">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={page === id ? "active" : ""}
              onClick={() => onNavigate(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        <p className="sidebar-user">{userName}</p>
      </aside>

      <div className="shell-main">
        <div className="page-wrap">{children}</div>
      </div>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={page === id ? "active" : ""}
            onClick={() => onNavigate(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
