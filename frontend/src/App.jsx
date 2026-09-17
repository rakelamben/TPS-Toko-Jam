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
import { useSession } from "./context/SessionContext";

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
            <Route path="products" element={<ProductsPage />} />
            <Route path="transactions/new" element={<AdminNewTransactionPage />} />
            <Route
              path="transactions"
              element={<TransactionsPage basePath="/admin/transactions" />}
            />
            <Route
              path="transactions/:id"
              element={<TransactionDetailPage canManage backPath="/admin/transactions" />}
            />
            <Route path="summary" element={<SummaryPage />} />
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
