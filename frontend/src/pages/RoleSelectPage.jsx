import { useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark";

export default function RoleSelectPage() {
  const navigate = useNavigate();
  return (
    <div className="centered-screen">
      <div className="auth-card">
        <BrandMark />
        <h1 style={{ fontSize: 20 }}>Masuk sebagai</h1>
        <div className="role-choice">
          <button onClick={() => navigate("/admin/login")}>
            <span className="title">Personel toko</span>
            <span className="desc">Login sebagai admin, manager, atau staff untuk mengelola toko.</span>
          </button>
          <button onClick={() => navigate("/customer/identify")}>
            <span className="title">Pembeli</span>
            <span className="desc">Lihat barang, belanja, dan cek riwayat transaksi kamu.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
