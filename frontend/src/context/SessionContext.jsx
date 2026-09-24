import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getInbox, listNotifications, listWorkflowRequests } from "../api/client";

const SessionContext = createContext(null);

// Session disimpan di localStorage supaya tidak hilang saat refresh halaman.
// role: "admin" | "manager" | "staff" | "customer" | null
export function SessionProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem("tps_role") || null);
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem("tps_personnel") || localStorage.getItem("tps_admin");
    return raw ? JSON.parse(raw) : null;
  });
  const [customer, setCustomer] = useState(() => {
    const raw = localStorage.getItem("tps_customer");
    return raw ? JSON.parse(raw) : null;
  });
  const [badges, setBadges] = useState({ messages: 0, notifications: 0, workflow: 0 });

  const refreshBadges = useCallback(async () => {
    if (!admin?.personnel_id) return;
    try {
      const isManagerOrAdmin = ["admin", "manager"].includes(role);
      const isWarehouse = admin?.role === "staf_gudang";
      const isOperational = admin?.role === "staf_operasional";

      const promises = [
        getInbox(admin.personnel_id).catch(() => []),
      ];

      if (isManagerOrAdmin || isWarehouse || isOperational) {
        promises.push(listNotifications(admin.personnel_id).catch(() => []));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (isManagerOrAdmin) {
        promises.push(listWorkflowRequests({ status: "pending" }).catch(() => []));
      } else {
        promises.push(Promise.resolve([]));
      }

      const [inboxRes, notifRes, wfRes] = await Promise.all(promises);
      const unreadMsgs = Array.isArray(inboxRes) ? inboxRes.filter((m) => !m.is_read).length : 0;
      const unreadNotifs = Array.isArray(notifRes) ? notifRes.filter((n) => !n.is_read).length : 0;
      const pendingWf = Array.isArray(wfRes) ? wfRes.filter((w) => w.current_status === "pending").length : 0;

      setBadges({ messages: unreadMsgs, notifications: unreadNotifs, workflow: pendingWf });
    } catch {
      // ignore
    }
  }, [admin?.personnel_id, role, admin?.role]);

  useEffect(() => {
    if (!admin?.personnel_id) {
      setBadges({ messages: 0, notifications: 0, workflow: 0 });
      return;
    }
    refreshBadges();
    const timer = setInterval(refreshBadges, 40000);
    return () => clearInterval(timer);
  }, [admin?.personnel_id, refreshBadges]);

  useEffect(() => {
    if (role) localStorage.setItem("tps_role", role);
    else localStorage.removeItem("tps_role");
  }, [role]);

  useEffect(() => {
    if (admin) {
      localStorage.setItem("tps_personnel", JSON.stringify(admin));
      if (admin.access_token) localStorage.setItem("tps_access_token", admin.access_token);
    }
    else {
      localStorage.removeItem("tps_personnel");
      localStorage.removeItem("tps_admin");
      localStorage.removeItem("tps_access_token");
    }
  }, [admin]);

  useEffect(() => {
    if (customer) localStorage.setItem("tps_customer", JSON.stringify(customer));
    else localStorage.removeItem("tps_customer");
  }, [customer]);

  function loginAsPersonnel(personnelData) {
    setAdmin(personnelData);
    setCustomer(null);
    setRole(personnelData.personnel_type);
  }

  function loginAsAdmin(adminData) {
    loginAsPersonnel(adminData);
  }

  function loginAsCustomer(customerData) {
    setCustomer(customerData);
    setRole("customer");
  }

  function logout() {
    setAdmin(null);
    setCustomer(null);
    setRole(null);
  }

  return (
    <SessionContext.Provider
      value={{
        role,
        admin,
        personnel: admin,
        customer,
        badges,
        refreshBadges,
        loginAsAdmin,
        loginAsPersonnel,
        loginAsCustomer,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession harus dipakai di dalam SessionProvider");
  return ctx;
}
