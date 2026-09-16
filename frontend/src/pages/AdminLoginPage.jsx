import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginPersonnel, getErrorMessage } from "../api/client";
import { useSession } from "../context/SessionContext";
import BrandMark from "../components/BrandMark";
import StatusMessage from "../components/StatusMessage";

export default function AdminLoginPage() {
  const [personnelType, setPersonnelType] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginAsPersonnel } = useSession();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const personnel = await loginPersonnel(personnelType, username, password);
      loginAsPersonnel(personnel);
      navigate("/admin/products");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centered-screen">
      <div className="auth-card">
        <BrandMark />
        <h1 style={{ fontSize: 20, marginBottom: 20 }}>Login personel</h1>
        <StatusMessage error={error} />
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Masuk sebagai</label>
            <select value={personnelType} onChange={(e) => setPersonnelType(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="field">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="primary" type="submit" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          <Link to="/">Kembali ke pilihan peran</Link>
        </p>
      </div>
    </div>
  );
}
