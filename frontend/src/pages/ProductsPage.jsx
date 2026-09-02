import { useEffect, useState } from "react";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getErrorMessage,
} from "../api/client";
import { formatRupiah } from "../utils/format";
import StatusMessage from "../components/StatusMessage";

const KATEGORI = ["Jam Tangan", "Jam Dinding", "Jam Meja", "Jam Alarm", "Aksesoris"];

const emptyForm = { nama_barang: "", kategori: KATEGORI[0], harga: "", stok: "", deskripsi: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(q) {
    setLoading(true);
    setError("");
    try {
      const data = await listProducts(q || undefined);
      setProducts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load(query.trim());
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setSuccess("");
  }

  function openEdit(p) {
    setEditingId(p.product_id);
    setForm({
      nama_barang: p.nama_barang,
      kategori: p.kategori,
      harga: String(p.harga),
      stok: String(p.stok),
      deskripsi: p.deskripsi || "",
    });
    setShowForm(true);
    setSuccess("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nama_barang: form.nama_barang.trim(),
        kategori: form.kategori,
        harga: parseFloat(form.harga),
        stok: parseInt(form.stok, 10),
        deskripsi: form.deskripsi.trim() || null,
      };
      if (editingId) {
        await updateProduct(editingId, payload);
        setSuccess("Barang berhasil diperbarui.");
      } else {
        await createProduct(payload);
        setSuccess("Barang berhasil ditambahkan.");
      }
      setShowForm(false);
      load(query.trim());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!confirm(`Yakin hapus "${p.nama_barang}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteProduct(p.product_id);
      setSuccess("Barang berhasil dihapus.");
      load(query.trim());
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Barang</h1>
          <p>Kelola daftar jam dan aksesoris yang dijual.</p>
        </div>
        <button className="primary" onClick={openAdd}>
          Tambah barang
        </button>
      </div>

      <StatusMessage error={error} success={success} />

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14 }}>{editingId ? "Edit barang" : "Tambah barang baru"}</h3>
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Nama barang</label>
              <input
                value={form.nama_barang}
                onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              >
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Harga (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.harga}
                  onChange={(e) => setForm({ ...form, harga: e.target.value })}
                  required
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Stok</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stok}
                  onChange={(e) => setForm({ ...form, stok: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Deskripsi (boleh kosong)</label>
              <textarea
                rows="2"
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              />
            </div>
            <div className="toolbar">
              <button className="primary" type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button type="button" className="ghost" onClick={() => setShowForm(false)}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <form className="search-row" onSubmit={handleSearch}>
          <input
            placeholder="Cari nama barang..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Cari</button>
          {query && (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setQuery("");
                load();
              }}
            >
              Reset
            </button>
          )}
        </form>

        {loading ? (
          <p style={{ color: "var(--slate)" }}>Memuat...</p>
        ) : products.length === 0 ? (
          <div className="empty-state">Belum ada barang yang cocok.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th style={{ textAlign: "right" }}>Harga</th>
                <th style={{ textAlign: "right" }}>Stok</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.nama_barang}</td>
                  <td>{p.kategori}</td>
                  <td style={{ textAlign: "right" }}>{formatRupiah(p.harga)}</td>
                  <td style={{ textAlign: "right" }}>{p.stok}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => openEdit(p)}>Edit</button>
                      <button className="danger" onClick={() => handleDelete(p)}>
                        Hapus
                      </button>
                    </div>
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
