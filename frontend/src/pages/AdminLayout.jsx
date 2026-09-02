import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSession } from "../context/SessionContext";

const NAV_ITEMS = [
  { to: "/admin/products", label: "Barang" },
  { to: "/admin/transactions/new", label: "Transaksi baru" },
  { to: "/admin/transactions", label: "Semua transaksi", end: true },
  { to: "/admin/summary", label: "Ringkasan" },
];

export default function AdminLayout() {
  const { role } = useSession();
  if (role !== "admin") return <Navigate to="/admin/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar items={NAV_ITEMS} />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
