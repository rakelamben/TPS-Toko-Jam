import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSession } from "../context/SessionContext";

const NAV_ITEMS = [
  { to: "/admin/products", label: "Barang", access: ({ role, personnel }) => role === "admin" || personnel?.role === "staf_gudang" },
  { to: "/admin/transactions/new", label: "Transaksi baru", access: ({ role, personnel }) => role === "admin" || personnel?.role === "staf_operasional" },
  { to: "/admin/transactions", label: "Semua transaksi", end: true, access: ({ role, personnel }) => ["admin", "manager"].includes(role) || personnel?.role === "staf_operasional" },
  { to: "/admin/summary", label: "Ringkasan", access: ({ role, personnel }) => ["admin", "manager"].includes(role) || personnel?.role === "staf_operasional" },
  { to: "/admin/office", label: "Operasional kantor", access: ({ role }) => ["admin", "manager", "staff"].includes(role) },
];

export default function AdminLayout() {
  const { role, admin: personnel } = useSession();
  const location = useLocation();
  const items = NAV_ITEMS.filter((item) => item.access({ role, personnel }));
  const defaultPath = items[0]?.to || "/admin/login";
  if (!["admin", "manager", "staff"].includes(role)) return <Navigate to="/admin/login" replace />;
  if (location.pathname === "/admin" || location.pathname === "/admin/") {
    return <Navigate to={defaultPath} replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar items={items} />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
