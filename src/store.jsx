import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "sistema-motorista-v1";

function todayAt(hours, minutes = 0) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function daysAgo(days, hours = 10, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

const seed = {
  users: [
    {
      id: "u1",
      role: "motorista",
      name: "Carlos Mendes",
      email: "motorista@rota.app",
      password: "1234",
      driverId: "d1",
    },
    {
      id: "u2",
      role: "admin",
      name: "Ana Ribeiro",
      email: "admin@rota.app",
      password: "1234",
    },
  ],
  drivers: [
    {
      id: "d1",
      name: "Carlos Mendes",
      phone: "(11) 98876-1200",
      cnh: "01234567890",
      category: "D",
      status: "ativo",
      rating: 4.9,
      vehicleId: "v1",
      city: "São Paulo",
      online: true,
    },
    {
      id: "d2",
      name: "Juliana Costa",
      phone: "(11) 99721-3344",
      cnh: "09876543210",
      category: "E",
      status: "ativo",
      rating: 4.8,
      vehicleId: "v2",
      city: "Guarulhos",
      online: false,
    },
    {
      id: "d3",
      name: "Rafael Souza",
      phone: "(11) 97654-8899",
      cnh: "11223344556",
      category: "D",
      status: "inativo",
      rating: 4.6,
      vehicleId: "v3",
      city: "Osasco",
      online: false,
    },
  ],
  vehicles: [
    {
      id: "v1",
      plate: "ABC1D23",
      model: "Fiat Fiorino",
      year: 2022,
      color: "Branco",
      km: 48200,
      status: "operando",
    },
    {
      id: "v2",
      plate: "EFG4H56",
      model: "Renault Master",
      year: 2021,
      color: "Prata",
      km: 76310,
      status: "operando",
    },
    {
      id: "v3",
      plate: "IJK7L89",
      model: "VW Delivery",
      year: 2020,
      color: "Azul",
      km: 120440,
      status: "oficina",
    },
  ],
  rides: [
    {
      id: "r1",
      origin: "Av. Paulista, 1578 — Bela Vista",
      dest: "Aeroporto de Congonhas",
      when: todayAt(14, 20),
      value: 48.9,
      status: "disponivel",
      distance: "12 km",
      eta: "18 min",
      driverId: null,
      client: "Marina Lopes",
    },
    {
      id: "r2",
      origin: "Shopping Morumbi",
      dest: "Rua Augusta, 2500 — Consolação",
      when: todayAt(15, 5),
      value: 36.5,
      status: "disponivel",
      distance: "9 km",
      eta: "22 min",
      driverId: null,
      client: "Pedro Nunes",
    },
    {
      id: "r3",
      origin: "Rua da Consolação, 200",
      dest: "Terminal Tietê",
      when: todayAt(11, 10),
      value: 52.0,
      status: "em_andamento",
      distance: "14 km",
      eta: "8 min",
      driverId: "d1",
      client: "Equipe LogiSul",
    },
    {
      id: "r4",
      origin: "Mercado Municipal",
      dest: "Av. Ibirapuera, 3103",
      when: todayAt(8, 40),
      value: 41.2,
      status: "concluida",
      distance: "8 km",
      eta: "16 min",
      driverId: "d1",
      client: "Padaria São João",
    },
    {
      id: "r5",
      origin: "Av. Faria Lima, 3477",
      dest: "Vila Olímpia, 500",
      when: daysAgo(1, 16, 15),
      value: 29.8,
      status: "concluida",
      distance: "4 km",
      eta: "11 min",
      driverId: "d1",
      client: "Studio Norte",
    },
    {
      id: "r6",
      origin: "Moema",
      dest: "Brooklin",
      when: daysAgo(1, 9, 30),
      value: 33.4,
      status: "concluida",
      distance: "6 km",
      eta: "14 min",
      driverId: "d2",
      client: "Casa Verde Entregas",
    },
    {
      id: "r7",
      origin: "Lapa",
      dest: "Pinheiros",
      when: daysAgo(2, 13, 0),
      value: 27.0,
      status: "concluida",
      distance: "7 km",
      eta: "19 min",
      driverId: "d1",
      client: "Clínica Vida",
    },
    {
      id: "r8",
      origin: "Santana",
      dest: "Centro",
      when: daysAgo(3, 18, 45),
      value: 38.6,
      status: "concluida",
      distance: "10 km",
      eta: "25 min",
      driverId: "d1",
      client: "Banco União",
    },
  ],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(seed),
      ...parsed,
      session: parsed.session ?? null,
    };
  } catch {
    return structuredClone(seed);
  }
}

function persist(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      drivers: state.drivers,
      vehicles: state.vehicles,
      rides: state.rides,
      session: state.session,
    })
  );
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState);

  const api = useMemo(() => {
    const update = (mutator) => {
      setState((current) => {
        const next = mutator({ ...current });
        persist(next);
        return next;
      });
    };

    return {
      state,
      login(email, password) {
        const user = state.users.find(
          (item) =>
            item.email.toLowerCase() === email.trim().toLowerCase() &&
            item.password === password
        );
        if (!user) return { ok: false, error: "E-mail ou senha inválidos." };
        update((current) => ({
          ...current,
          session: { userId: user.id, role: user.role },
        }));
        return { ok: true, user };
      },
      logout() {
        update((current) => ({ ...current, session: null }));
      },
      currentUser() {
        return state.users.find((user) => user.id === state.session?.userId) ?? null;
      },
      currentDriver() {
        const user = state.users.find((item) => item.id === state.session?.userId);
        return state.drivers.find((driver) => driver.id === user?.driverId) ?? null;
      },
      toggleOnline(driverId) {
        update((current) => ({
          ...current,
          drivers: current.drivers.map((driver) =>
            driver.id === driverId ? { ...driver, online: !driver.online } : driver
          ),
        }));
      },
      updateRide(rideId, patch) {
        update((current) => ({
          ...current,
          rides: current.rides.map((ride) =>
            ride.id === rideId ? { ...ride, ...patch } : ride
          ),
        }));
      },
      addDriver(driver) {
        update((current) => ({
          ...current,
          drivers: [
            {
              id: `d${Date.now()}`,
              status: "ativo",
              rating: 5,
              online: false,
              ...driver,
            },
            ...current.drivers,
          ],
        }));
      },
      addVehicle(vehicle) {
        update((current) => ({
          ...current,
          vehicles: [
            {
              id: `v${Date.now()}`,
              status: "operando",
              ...vehicle,
            },
            ...current.vehicles,
          ],
        }));
      },
      addRide(ride) {
        update((current) => ({
          ...current,
          rides: [
            {
              id: `r${Date.now()}`,
              status: "disponivel",
              driverId: ride.driverId || null,
              ...ride,
            },
            ...current.rides,
          ],
        }));
      },
    };
  }, [state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("Store ausente");
  return value;
}

export function formatMoney(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatWhen(iso) {
  const date = new Date(iso);
  const sameDay = new Date().toDateString() === date.toDateString();
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) return `Hoje, ${time}`;
  return `${date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })} · ${time}`;
}

export function rideLabel(status) {
  return {
    disponivel: "Disponível",
    aceita: "Aceita",
    em_andamento: "Em rota",
    concluida: "Concluída",
    cancelada: "Cancelada",
  }[status];
}

export function isToday(iso) {
  return new Date(iso).toDateString() === new Date().toDateString();
}
