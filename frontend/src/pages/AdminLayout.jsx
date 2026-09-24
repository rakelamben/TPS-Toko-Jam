import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSession } from "../context/SessionContext";

const TPS_ITEMS = [
  { to: "/admin/products", label: "Barang", access: ({ role, personnel }) => role === "admin" || personnel?.role === "staf_gudang" },
  { to: "/admin/transactions/new", label: "Transaksi baru", access: ({ role, personnel }) => role === "admin" || personnel?.role === "staf_operasional" },
  { to: "/admin/transactions", label: "Semua transaksi", end: true, access: ({ role, personnel }) => ["admin", "manager"].includes(role) || personnel?.role === "staf_operasional" },
  { to: "/admin/summary", label: "Ringkasan", access: ({ role, personnel }) => ["admin", "manager"].includes(role) || personnel?.role === "staf_operasional" },
];

const OAS_ITEMS = [
  {
    to: "/admin/office/communication",
    label: "Pesan",
    badgeKey: "messages",
    access: ({ role, personnel }) => ["admin", "manager"].includes(role) || ["staf_operasional", "staf_gudang"].includes(personnel?.role),
  },
  {
    to: "/admin/office/notifications",
    label: "Notifikasi",
    badgeKey: "notifications",
    access: ({ role, personnel }) => ["admin", "manager"].includes(role) || ["staf_gudang", "staf_operasional"].includes(personnel?.role),
  },
  {
    to: "/admin/office/documents",
    label: "Dokumen",
    access: ({ role, personnel }) => role === "admin" || role === "manager" || personnel?.role === "staf_operasional",
  },
  {
    to: "/admin/office/correspondence",
    label: "Persuratan",
    access: ({ role, personnel }) => role === "admin" || role === "manager" || personnel?.role === "staf_operasional",
  },
  {
    to: "/admin/office/workflow",
    label: "Approval",
    badgeKey: "workflow",
    access: ({ role, personnel }) => role === "admin" || role === "manager" || ["staf_operasional", "staf_gudang"].includes(personnel?.role),
  },
  {
    to: "/admin/office/shifts",
    label: "Jadwal kerja",
    access: ({ role, personnel }) => ["admin", "manager"].includes(role) || ["staf_gudang", "staf_operasional"].includes(personnel?.role),
  },
  {
    to: "/admin/office/personnel",
    label: "Personel",
    access: ({ role }) => role === "admin",
  },
  {
    to: "/admin/office/logs",
    label: "Audit log",
    access: ({ role }) => ["admin", "manager"].includes(role),
  },
];

export default function AdminLayout() {
  const { role, admin: personnel, badges } = useSession();
  const location = useLocation();

  const sections = [
    {
      title: "TRANSAKSI (TPS)",
      items: TPS_ITEMS.filter((item) => item.access({ role, personnel })),
    },
    {
      title: "OPERASIONAL (OAS)",
      items: OAS_ITEMS.map((item) => {
        let badgeCount = 0;
        if (item.badgeKey === "workflow") {
          badgeCount = ["admin", "manager"].includes(role) ? badges?.workflow || 0 : 0;
        } else if (item.badgeKey) {
          badgeCount = badges?.[item.badgeKey] || 0;
        }
        return {
          ...item,
          badge: badgeCount,
        };
      }).filter((item) => item.access({ role, personnel })),
    },
  ];

  const allVisibleItems = [...sections[0].items, ...sections[1].items];
  const defaultPath = allVisibleItems[0]?.to || "/admin/login";

  if (!["admin", "manager", "staff"].includes(role)) return <Navigate to="/admin/login" replace />;
  if (location.pathname === "/admin" || location.pathname === "/admin/") {
    return <Navigate to={defaultPath} replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar sections={sections} />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
