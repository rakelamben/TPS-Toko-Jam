import { createContext, useContext, useEffect, useState } from "react";

const SessionContext = createContext(null);

// Session disimpan di localStorage supaya tidak hilang saat refresh halaman.
// role: "admin" | "customer" | null
export function SessionProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem("tps_role") || null);
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem("tps_admin");
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
    if (admin) localStorage.setItem("tps_admin", JSON.stringify(admin));
    else localStorage.removeItem("tps_admin");
  }, [admin]);

  useEffect(() => {
    if (customer) localStorage.setItem("tps_customer", JSON.stringify(customer));
    else localStorage.removeItem("tps_customer");
  }, [customer]);

  function loginAsAdmin(adminData) {
    setAdmin(adminData);
    setRole("admin");
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
      value={{ role, admin, customer, loginAsAdmin, loginAsCustomer, logout }}
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
