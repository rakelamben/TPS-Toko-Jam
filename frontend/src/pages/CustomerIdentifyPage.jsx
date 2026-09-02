import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { identifyCustomer, getErrorMessage } from "../api/client";
import { useSession } from "../context/SessionContext";
import BrandMark from "../components/BrandMark";
import StatusMessage from "../components/StatusMessage";

export default function CustomerIdentifyPage() {
  const [noHp, setNoHp] = useState("");
  const [nama, setNama] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginAsCustomer } = useSession();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const customer = await identifyCustomer(noHp.trim(), nama.trim() || undefined);
      loginAsCustomer(customer);
      navigate("/customer/products");
    } catch (err) {
      const msg = getErrorMessage(err);
      // Backend membalas 400 kalau no HP belum terdaftar dan nama belum diisi.
      if (msg.toLowerCase().includes("nama")) {
        setNeedsName(true);
        setError("Nomor HP belum terdaftar. Masukkan nama untuk mendaftar.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centered-screen">
      <div className="auth-card">
        <BrandMark />
        <h1 style={{ fontSize: 20, marginBottom: 20 }}>Identifikasi pembeli</h1>
        <StatusMessage error={error} />
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nomor HP</label>
            <input value={noHp} onChange={(e) => setNoHp(e.target.value)} required />
          </div>
          {needsName && (
            <div className="field">
              <label>Nama lengkap</label>
              <input value={nama} onChange={(e) => setNama(e.target.value)} required />
            </div>
          )}
          <button className="primary" type="submit" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Memproses..." : "Lanjutkan"}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          <Link to="/">Kembali ke pilihan peran</Link>
        </p>
      </div>
    </div>
  );
}
