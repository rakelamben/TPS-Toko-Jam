import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({ baseURL });

// Menerjemahkan error axios jadi pesan yang bisa ditampilkan ke pengguna,
// mengikuti bentuk error FastAPI: { detail: "..." }
export function getErrorMessage(err) {
  if (err?.response?.data?.detail) return err.response.data.detail;
  if (err?.message) return err.message;
  return "Terjadi kesalahan tak terduga.";
}

// ---------- Admin ----------
export const loginAdmin = (username, password) =>
  api.post("/admin/login", { username, password }).then((r) => r.data);

// ---------- Products ----------
export const listProducts = (q) =>
  api.get("/products", { params: q ? { q } : {} }).then((r) => r.data);

export const createProduct = (payload) =>
  api.post("/products", payload).then((r) => r.data);

export const updateProduct = (productId, payload) =>
  api.patch(`/products/${productId}`, payload).then((r) => r.data);

export const deleteProduct = (productId) =>
  api.delete(`/products/${productId}`);

// ---------- Customers ----------
export const identifyCustomer = (no_hp, nama) =>
  api.post("/customers/identify", { no_hp, nama }).then((r) => r.data);

// ---------- Transactions ----------
export const createTransaction = (payload) =>
  api.post("/transactions", payload).then((r) => r.data);

export const listTransactions = (customerId) =>
  api
    .get("/transactions", { params: customerId ? { customer_id: customerId } : {} })
    .then((r) => r.data);

export const getInvoice = (transactionId) =>
  api.get(`/transactions/${transactionId}/invoice`).then((r) => r.data);

export const getByNoInvoice = (noInvoice) =>
  api.get(`/transactions/by-invoice/${noInvoice}`).then((r) => r.data);

export const editTransaction = (noInvoice, items) =>
  api.patch(`/transactions/by-invoice/${noInvoice}`, { items }).then((r) => r.data);

export const cancelTransaction = (noInvoice) =>
  api.post(`/transactions/by-invoice/${noInvoice}/cancel`).then((r) => r.data);

export const getAdminSummary = () =>
  api.get("/transactions/summary/admin").then((r) => r.data);
