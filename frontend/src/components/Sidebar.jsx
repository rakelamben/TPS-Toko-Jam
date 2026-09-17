import { NavLink } from "react-router-dom";
import BrandMark from "./BrandMark";
import { useSession } from "../context/SessionContext";

export default function Sidebar({ items }) {
  const { role, admin, customer, logout } = useSession();
  const who = role === "admin" ? admin?.nama : customer?.nama;

  return (
    <aside className="sidebar no-print">
      <BrandMark />
      <nav>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="who">
          {role === "admin" ? "Admin" : "Pembeli"} · {who}
        </div>
        <button className="ghost" style={{ width: "100%", color: "var(--parchment)" }} onClick={logout}>
          Keluar
        </button>
      </div>
    </aside>
  );
}
