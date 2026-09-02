import { useEffect, useState } from "react";
import { getAdminSummary, getErrorMessage } from "../api/client";
import { formatRupiah } from "../utils/format";
import StatusMessage from "../components/StatusMessage";

export default function SummaryPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminSummary()
      .then(setSummary)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Ringkasan</h1>
          <p>Ringkasan transaksi selesai secara keseluruhan.</p>
        </div>
      </div>

      <StatusMessage error={error} />

      {loading ? (
        <p style={{ color: "var(--slate)" }}>Memuat...</p>
      ) : summary ? (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Total transaksi</div>
            <div className="value">{summary.total_transaksi}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total omzet</div>
            <div className="value">{formatRupiah(summary.total_omzet)}</div>
          </div>
          <div className="stat-card">
            <div className="label">Pembeli unik</div>
            <div className="value">{summary.jumlah_pembeli}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
