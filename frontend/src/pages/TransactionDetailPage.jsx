import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getInvoice,
  editTransaction,
  cancelTransaction,
  listProducts,
  getErrorMessage,
} from "../api/client";
import { formatRupiah } from "../utils/format";
import InvoiceView from "../components/InvoiceView";
import StatusMessage from "../components/StatusMessage";

// canManage: true untuk admin (boleh edit/batalkan), false untuk pembeli (lihat + print saja).
export default function TransactionDetailPage({ canManage, backPath }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [editItems, setEditItems] = useState([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const invoice = await getInvoice(id);
      setData(invoice);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit() {
    setEditItems(
      data.items.map((it) => ({
        product_id: it.product_id,
        nama_barang: it.nama_barang_snapshot,
        harga: it.harga_satuan,
        qty: it.qty,
      }))
    );
    setEditing(true);
    setSuccess("");
  }

  async function handleSearch(e) {
    e.preventDefault();
    try {
      const res = await listProducts(query.trim() || undefined);
      setResults(res);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function addItem(p) {
    setEditItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.product_id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product_id: p.product_id, nama_barang: p.nama_barang, harga: p.harga, qty: 1 }];
    });
  }

  function updateQty(productId, qty) {
    setEditItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, qty: Math.max(1, qty) } : i))
    );
  }

  function removeItem(productId) {
    setEditItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  async function saveEdit() {
    if (editItems.length === 0) {
      setError("Daftar barang tidak boleh kosong.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await editTransaction(
        data.transaksi.no_invoice,
        editItems.map((i) => ({ product_id: i.product_id, qty: i.qty }))
      );
      setSuccess("Transaksi berhasil diperbarui.");
      setEditing(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!confirm(`Batalkan transaksi ${data.transaksi.no_invoice}? Stok akan dikembalikan.`)) return;
    setError("");
    try {
      await cancelTransaction(data.transaksi.no_invoice);
      setSuccess("Transaksi berhasil dibatalkan.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <p style={{ color: "var(--slate)" }}>Memuat...</p>;
  if (error && !data) return <StatusMessage error={error} />;
  if (!data) return null;

  const isDibatalkan = data.transaksi.status === "dibatalkan";
  const editTotal = editItems.reduce((sum, i) => sum + i.harga * i.qty, 0);

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <h1>Invoice {data.transaksi.no_invoice}</h1>
          <p><Link to={backPath}>← Kembali ke daftar transaksi</Link></p>
        </div>
        <div className="toolbar">
          <button onClick={() => window.print()}>Cetak invoice</button>
          {canManage && !isDibatalkan && !editing && (
            <>
              <button onClick={startEdit}>Edit barang</button>
              <button className="danger" onClick={handleCancel}>
                Batalkan transaksi
              </button>
            </>
          )}
        </div>
      </div>

      <div className="no-print">
        <StatusMessage error={error} success={success} />
      </div>

      {editing ? (
        <div className="card no-print">
          <h3 style={{ marginBottom: 12 }}>Edit barang (daftar lama akan diganti seluruhnya)</h3>
          <form className="search-row" onSubmit={handleSearch}>
            <input
              placeholder="Cari nama barang..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Cari</button>
          </form>
          {results.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {results.map((p) => (
                <div className="product-pick" key={p.product_id}>
                  <div className="info">
                    <div className="name">{p.nama_barang}</div>
                    <div className="meta">{formatRupiah(p.harga)} · stok {p.stok}</div>
                  </div>
                  <button onClick={() => addItem(p)}>Tambah</button>
                </div>
              ))}
            </div>
          )}
          {editItems.map((i) => (
            <div className="cart-row" key={i.product_id}>
              <span className="name">{i.nama_barang}</span>
              <input
                className="qty"
                type="number"
                min="1"
                value={i.qty}
                onChange={(e) => updateQty(i.product_id, parseInt(e.target.value, 10) || 1)}
              />
              <span style={{ width: 120, textAlign: "right" }}>{formatRupiah(i.harga * i.qty)}</span>
              <button className="ghost" onClick={() => removeItem(i.product_id)}>
                Hapus
              </button>
            </div>
          ))}
          <div className="cart-total">
            <span>Total baru</span>
            <span className="value">{formatRupiah(editTotal)}</span>
          </div>
          <div className="toolbar" style={{ marginTop: 16 }}>
            <button className="primary" onClick={saveEdit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan perubahan"}
            </button>
            <button className="ghost" onClick={() => setEditing(false)}>
              Batal
            </button>
          </div>
        </div>
      ) : (
        <InvoiceView data={data} />
      )}
    </div>
  );
}
