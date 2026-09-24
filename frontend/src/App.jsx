import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";

import RoleSelectPage from "./pages/RoleSelectPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import CustomerIdentifyPage from "./pages/CustomerIdentifyPage";
import AdminLayout from "./pages/AdminLayout";
import CustomerLayout from "./pages/CustomerLayout";
import ProductsPage from "./pages/ProductsPage";
import AdminNewTransactionPage from "./pages/AdminNewTransactionPage";
import TransactionsPage from "./pages/TransactionsPage";
import TransactionDetailPage from "./pages/TransactionDetailPage";
import SummaryPage from "./pages/SummaryPage";
import CustomerProductsPage from "./pages/CustomerProductsPage";
import CustomerNewTransactionPage from "./pages/CustomerNewTransactionPage";
import OfficePage from "./pages/OfficePage";
import { useSession } from "./context/SessionContext";

function CapabilityGate({ capability, children }) {
  const { role, admin: personnel } = useSession();
  const isOperationalStaff = role === "staff" && personnel?.role === "staf_operasional";
  const isWarehouseStaff = role === "staff" && personnel?.role === "staf_gudang";
  const allowed = capability === "office"
    ? ["admin", "manager", "staff"].includes(role)
    : capability === "inventory"
    ? role === "admin" || isWarehouseStaff
    : capability === "operator"
      ? role === "admin" || isOperationalStaff
      : role === "admin" || role === "manager" || isOperationalStaff;
  return allowed ? children : <Navigate to="/admin/office" replace />;
}

function PersonnelTransactionDetail() {
  const { role } = useSession();
  return (
    <CapabilityGate capability="viewer">
      <TransactionDetailPage canManage={role === "admin"} backPath="/admin/transactions" />
    </CapabilityGate>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelectPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/customer/identify" element={<CustomerIdentifyPage />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<CapabilityGate capability="inventory"><ProductsPage /></CapabilityGate>} />
            <Route path="transactions/new" element={<CapabilityGate capability="operator"><AdminNewTransactionPage /></CapabilityGate>} />
            <Route
              path="transactions"
              element={<CapabilityGate capability="viewer"><TransactionsPage basePath="/admin/transactions" /></CapabilityGate>}
            />
            <Route
              path="transactions/:id"
              element={<PersonnelTransactionDetail />}
            />
            <Route path="office" element={<CapabilityGate capability="office"><Navigate to="/admin/office/communication" replace /></CapabilityGate>} />
            <Route path="office/:tab" element={<CapabilityGate capability="office"><OfficePage /></CapabilityGate>} />
          </Route>

          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<CustomerProductsPage />} />
            <Route path="new-transaction" element={<CustomerNewTransactionPage />} />
            <Route path="history" element={<CustomerHistory />} />
            <Route
              path="transactions/:id"
              element={<TransactionDetailPage canManage={false} backPath="/customer/history" />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}

function CustomerHistory() {
  const { customer } = useSession();
  return (
    <TransactionsPage customerId={customer.customer_id} basePath="/customer/transactions" />
  );
}
