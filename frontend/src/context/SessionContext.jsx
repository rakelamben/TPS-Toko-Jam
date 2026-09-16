import { createContext, useContext, useEffect, useState } from "react";

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
      value={{ role, admin, personnel: admin, customer, loginAsAdmin, loginAsPersonnel, loginAsCustomer, logout }}
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
