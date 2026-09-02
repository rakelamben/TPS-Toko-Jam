import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTransactions, getErrorMessage } from "../api/client";
import { formatRupiah, formatTanggal } from "../utils/format";
import StatusMessage from "../components/StatusMessage";

// customerId: kalau diisi, hanya tampilkan transaksi milik pembeli itu
// (dipakai dari menu pembeli). Kalau tidak, tampilkan semua (menu admin).
export default function TransactionsPage({ customerId, basePath }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    listTransactions(customerId)
      .then((data) => active && setTransactions(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [customerId]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{customerId ? "Riwayat transaksi saya" : "Semua transaksi"}</h1>
          <p>{customerId ? "Transaksi yang pernah kamu buat." : "Seluruh transaksi pembeli di toko."}</p>
        </div>
      </div>

      <StatusMessage error={error} />

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--slate)" }}>Memuat...</p>
        ) : transactions.length === 0 ? (
          <div className="empty-state">Belum ada transaksi.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No. invoice</th>
                {!customerId && <th>Pembeli</th>}
                <th>Tanggal</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr
                  key={t.transaction_id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`${basePath}/${t.transaction_id}`)}
                >
                  <td>{t.no_invoice}</td>
                  {!customerId && <td>{t.customers?.nama || "-"}</td>}
                  <td>{formatTanggal(t.tanggal_transaksi)}</td>
                  <td style={{ textAlign: "right" }}>{formatRupiah(t.total_harga)}</td>
                  <td>
                    <span className={`badge ${t.status}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
