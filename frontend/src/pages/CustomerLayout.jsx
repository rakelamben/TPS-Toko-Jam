import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSession } from "../context/SessionContext";

const NAV_ITEMS = [
  { to: "/customer/products", label: "Lihat barang" },
  { to: "/customer/new-transaction", label: "Belanja" },
  { to: "/customer/history", label: "Riwayat saya" },
];

export default function CustomerLayout() {
  const { role } = useSession();
  if (role !== "customer") return <Navigate to="/customer/identify" replace />;

  return (
    <div className="app-shell">
      <Sidebar items={NAV_ITEMS} />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
