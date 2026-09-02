import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { identifyCustomer, getErrorMessage } from "../api/client";
import { useSession } from "../context/SessionContext";
import StatusMessage from "../components/StatusMessage";
import TransactionBuilder from "../components/TransactionBuilder";

export default function AdminNewTransactionPage() {
  const [noHp, setNoHp] = useState("");
  const [nama, setNama] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [pembeli, setPembeli] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { admin } = useSession();
  const navigate = useNavigate();

  async function handleIdentify(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const customer = await identifyCustomer(noHp.trim(), nama.trim() || undefined);
      setPembeli(customer);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes("nama")) {
        setNeedsName(true);
        setError("Nomor HP belum terdaftar. Masukkan nama untuk mendaftarkan pembeli baru.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCreated(invoice) {
    navigate(`/admin/transactions/${invoice.transaksi.transaction_id}`);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transaksi baru</h1>
          <p>Bantu pembeli bertransaksi langsung dari kasir.</p>
        </div>
      </div>

      {!pembeli ? (
        <div className="card" style={{ maxWidth: 420 }}>
          <h3 style={{ marginBottom: 14 }}>Identifikasi pembeli</h3>
          <StatusMessage error={error} />
          <form onSubmit={handleIdentify}>
            <div className="field">
              <label>Nomor HP pembeli</label>
              <input value={noHp} onChange={(e) => setNoHp(e.target.value)} required />
            </div>
            {needsName && (
              <div className="field">
                <label>Nama lengkap</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} required />
              </div>
            )}
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Lanjutkan"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{pembeli.nama}</div>
                <div style={{ fontSize: 13, color: "var(--slate)" }}>{pembeli.no_hp}</div>
              </div>
              <button className="ghost" onClick={() => setPembeli(null)}>
                Ganti pembeli
              </button>
            </div>
          </div>
          <TransactionBuilder
            customerId={pembeli.customer_id}
            adminId={admin.admin_id}
            onCreated={handleCreated}
          />
        </>
      )}
    </div>
  );
}
