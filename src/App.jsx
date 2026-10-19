import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { Login } from "./pages/Login.jsx";
import { Home } from "./pages/Home.jsx";
import { Rides } from "./pages/Rides.jsx";
import { RideDetail } from "./pages/RideDetail.jsx";
import { Earnings } from "./pages/Earnings.jsx";
import { Profile } from "./pages/Profile.jsx";
import {
  AdminDashboard,
  AdminDrivers,
  AdminRideDetail,
  AdminRides,
  AdminVehicles,
} from "./pages/Admin.jsx";
import { useStore } from "./store.jsx";

export default function App() {
  const { state, currentUser } = useStore();
  const [page, setPage] = useState(null);
  const [rideId, setRideId] = useState(null);
  const user = currentUser();

  useEffect(() => {
    setPage(null);
    setRideId(null);
  }, [state.session?.userId]);

  if (!state.session || !user) {
    return <Login />;
  }

  const role = user.role;
  const homePage = role === "admin" ? "admin" : "home";
  const currentPage = page || homePage;

  function openRide(id) {
    setRideId(id);
    setPage(role === "admin" ? "admin-ride" : "ride");
  }

  const content = {
    home: <Home onOpenRide={openRide} />,
    rides: <Rides onOpenRide={openRide} />,
    ride: <RideDetail rideId={rideId} onBack={() => setPage("rides")} />,
    earnings: <Earnings />,
    profile: <Profile />,
    admin: <AdminDashboard onOpenRide={openRide} />,
    "admin-drivers": <AdminDrivers />,
    "admin-vehicles": <AdminVehicles />,
    "admin-rides": <AdminRides onOpenRide={openRide} />,
    "admin-ride": <AdminRideDetail rideId={rideId} onBack={() => setPage("admin-rides")} />,
  }[currentPage] ?? (role === "admin" ? <AdminDashboard onOpenRide={openRide} /> : <Home onOpenRide={openRide} />);

  const navPage =
    currentPage === "admin-ride" ? "admin-rides" : currentPage === "ride" ? "rides" : currentPage;

  return (
    <AppShell
      role={role}
      page={navPage}
      onNavigate={(next) => {
        setRideId(null);
        setPage(next);
      }}
      userName={user.name}
    >
      {content}
    </AppShell>
  );
}
