import { useState } from "react";
import { listProducts, createTransaction, getErrorMessage } from "../api/client";
import { formatRupiah } from "../utils/format";
import StatusMessage from "./StatusMessage";

// Dipakai baik di menu admin (kasir bantu pembeli) maupun menu pembeli
// (transaksi mandiri). adminId null berarti transaksi dibuat sendiri oleh pembeli.
export default function TransactionBuilder({ customerId, adminId = null, onCreated }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    setError("");
    try {
      const data = await listProducts(query.trim() || undefined);
      setResults(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) {
        if (existing.qty >= product.stok) return prev;
        return prev.map((i) =>
          i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(productId, qty, stok) {
    const clamped = Math.max(1, Math.min(qty, stok));
    setCart((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, qty: clamped } : i))
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }

  const total = cart.reduce((sum, i) => sum + i.harga * i.qty, 0);

  async function handleSubmit() {
    if (cart.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        customer_id: customerId,
        personnel_id: adminId,
        items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty })),
      };
      const invoice = await createTransaction(payload);
      setCart([]);
      onCreated(invoice);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <StatusMessage error={error} />

      <form className="search-row" onSubmit={handleSearch}>
        <input
          placeholder="Cari nama barang (kosongkan untuk lihat semua)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={searching}>
          {searching ? "Mencari..." : "Cari"}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {results.map((p) => {
            const inCart = cart.find((i) => i.product_id === p.product_id);
            const habis = p.stok <= 0 || (inCart && inCart.qty >= p.stok);
            return (
              <div className="product-pick" key={p.product_id}>
                <div className="info">
                  <div className="name">{p.nama_barang}</div>
                  <div className="meta">
                    {p.kategori} · {formatRupiah(p.harga)} · stok {p.stok}
                  </div>
                </div>
                <button onClick={() => addToCart(p)} disabled={habis}>
                  {p.stok <= 0 ? "Stok habis" : "Tambah"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Keranjang</h3>
        {cart.length === 0 ? (
          <p style={{ color: "var(--slate)", fontSize: 14 }}>Belum ada barang dipilih.</p>
        ) : (
          <>
            {cart.map((i) => (
              <div className="cart-row" key={i.product_id}>
                <span className="name">{i.nama_barang}</span>
                <input
                  className="qty"
                  type="number"
                  min="1"
                  max={i.stok}
                  value={i.qty}
                  onChange={(e) =>
                    updateQty(i.product_id, parseInt(e.target.value, 10) || 1, i.stok)
                  }
                />
                <span style={{ width: 120, textAlign: "right" }}>
                  {formatRupiah(i.harga * i.qty)}
                </span>
                <button className="ghost" onClick={() => removeFromCart(i.product_id)}>
                  Hapus
                </button>
              </div>
            ))}
            <div className="cart-total">
              <span>Total</span>
              <span className="value">{formatRupiah(total)}</span>
            </div>
          </>
        )}
        <div style={{ marginTop: 16 }}>
          <button
            className="primary"
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
          >
            {submitting ? "Memproses..." : "Buat transaksi"}
          </button>
        </div>
      </div>
    </div>
  );
}
