import { useEffect, useState } from "react";
import { listProducts, getErrorMessage } from "../api/client";
import { formatRupiah } from "../utils/format";
import StatusMessage from "../components/StatusMessage";

export default function CustomerProductsPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load(q) {
    setLoading(true);
    listProducts(q || undefined)
      .then(setProducts)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lihat barang</h1>
          <p>Katalog jam dan aksesoris yang tersedia.</p>
        </div>
      </div>

      <StatusMessage error={error} />

      <div className="card">
        <form
          className="search-row"
          onSubmit={(e) => {
            e.preventDefault();
            load(query.trim());
          }}
        >
          <input
            placeholder="Cari nama barang..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Cari</button>
        </form>

        {loading ? (
          <p style={{ color: "var(--slate)" }}>Memuat...</p>
        ) : products.length === 0 ? (
          <div className="empty-state">Tidak ada barang yang cocok.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th style={{ textAlign: "right" }}>Harga</th>
                <th style={{ textAlign: "right" }}>Stok</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.nama_barang}</td>
                  <td>{p.kategori}</td>
                  <td style={{ textAlign: "right" }}>{formatRupiah(p.harga)}</td>
                  <td style={{ textAlign: "right" }}>{p.stok}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
