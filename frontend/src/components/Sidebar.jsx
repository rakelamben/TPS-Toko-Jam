import { NavLink } from "react-router-dom";
import BrandMark from "./BrandMark";
import { useSession } from "../context/SessionContext";

export default function Sidebar({ items, sections }) {
  const { role, admin, customer, logout } = useSession();
  const isPersonnel = ["admin", "manager", "staff"].includes(role);
  const who = isPersonnel ? admin?.nama : customer?.nama;

  const content = sections
    ? sections
        .filter((sec) => sec.items && sec.items.length > 0)
        .map((sec, idx) => (
          <div key={sec.title || idx} className="nav-section">
            {sec.title && <div className="nav-section-title">{sec.title}</div>}
            {sec.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              >
                <span>{item.label}</span>
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))
    : items?.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
        >
          <span>{item.label}</span>
          {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
        </NavLink>
      ));

  return (
    <aside className="sidebar no-print">
      <BrandMark />
      <nav>{content}</nav>
      <div className="sidebar-footer">
        <div className="who">
          {isPersonnel ? role[0].toUpperCase() + role.slice(1) : "Pembeli"} · {who}
        </div>
        <button className="ghost" style={{ width: "100%", color: "var(--parchment)" }} onClick={logout}>
          Keluar
        </button>
      </div>
    </aside>
  );
}
