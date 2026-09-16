import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tps_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Menerjemahkan error axios jadi pesan yang bisa ditampilkan ke pengguna,
// mengikuti bentuk error FastAPI: { detail: "..." }
export function getErrorMessage(err) {
  if (err?.response?.data?.detail) return err.response.data.detail;
  if (err?.message) return err.message;
  return "Terjadi kesalahan tak terduga.";
}

// ---------- Admin ----------
// ---------- Auth ----------
export const loginPersonnel = (personnelType, username, password) =>
  api
    .post("/auth/login", { personnel_type: personnelType, username, password })
    .then((r) => r.data);

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

// ---------- Office automation ----------
export const listStaff = () => api.get("/personnel/staff").then((r) => r.data);
export const createStaff = (payload) => api.post("/personnel/staff", payload).then((r) => r.data);
export const updateStaff = (staffId, payload) =>
  api.patch(`/personnel/staff/${staffId}`, payload).then((r) => r.data);
export const deleteStaff = (staffId) => api.delete(`/personnel/staff/${staffId}`);
export const listManagers = () => api.get("/personnel/managers").then((r) => r.data);
export const createManager = (payload) =>
  api.post("/personnel/managers", payload).then((r) => r.data);
export const listPersonnelDirectory = () =>
  api.get("/personnel/directory").then((r) => r.data);

export const listDocuments = (params = {}) => api.get("/documents", { params }).then((r) => r.data);
export const createDocument = (payload) => api.post("/documents", payload).then((r) => r.data);
export const updateDocument = (documentId, payload) =>
  api.patch(`/documents/${documentId}`, payload).then((r) => r.data);
export const deleteDocument = (documentId) => api.delete(`/documents/${documentId}`);

export const sendMessage = (payload) => api.post("/messages", payload).then((r) => r.data);
export const getInbox = (personnelId) =>
  api.get(`/messages/inbox/${personnelId}`).then((r) => r.data);
export const markMessageRead = (messageId) =>
  api.post(`/messages/${messageId}/read`).then((r) => r.data);

export const listNotifications = (personnelId) =>
  api.get(`/notifications/${personnelId}`).then((r) => r.data);
export const markNotificationRead = (notificationId) =>
  api.post(`/notifications/${notificationId}/read`).then((r) => r.data);

export const listShifts = (params = {}) => api.get("/shifts", { params }).then((r) => r.data);
export const createShift = (payload) => api.post("/shifts", payload).then((r) => r.data);
export const updateShift = (shiftId, payload) =>
  api.patch(`/shifts/${shiftId}`, payload).then((r) => r.data);
export const deleteShift = (shiftId) => api.delete(`/shifts/${shiftId}`);

export const listWorkflowRequests = (params = {}) =>
  api.get("/workflow/requests", { params }).then((r) => r.data);
export const createWorkflowRequest = (payload) =>
  api.post("/workflow/requests", payload).then((r) => r.data);
export const getWorkflowApproval = (requestId) =>
  api.get(`/workflow/requests/${requestId}/approval`).then((r) => r.data);
export const decideWorkflow = (requestId, payload) =>
  api.post(`/workflow/requests/${requestId}/decision`, payload).then((r) => r.data);

export const listCorrespondence = (params = {}) =>
  api.get("/correspondence", { params }).then((r) => r.data);
export const createCorrespondence = (payload) =>
  api.post("/correspondence", payload).then((r) => r.data);
export const updateCorrespondence = (correspondenceId, payload) =>
  api.patch(`/correspondence/${correspondenceId}`, payload).then((r) => r.data);
export const listDispositions = (correspondenceId) =>
  api.get(`/correspondence/${correspondenceId}/dispositions`).then((r) => r.data);
export const createDisposition = (correspondenceId, payload) =>
  api.post(`/correspondence/${correspondenceId}/dispositions`, payload).then((r) => r.data);
export const updateDisposition = (dispositionId, payload) =>
  api.patch(`/correspondence/dispositions/${dispositionId}`, payload).then((r) => r.data);

export const listActivityLogs = (params = {}) =>
  api.get("/activity-logs", { params }).then((r) => r.data);
