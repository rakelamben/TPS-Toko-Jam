import { formatRupiah, formatTanggal } from "../utils/format";

// data = { transaksi: {...}, items: [...] } — bentuk balikan endpoint invoice.
export default function InvoiceView({ data }) {
  if (!data) return null;
  const { transaksi, items } = data;
  const pembeli = transaksi.customers || {};

  return (
    <div className="invoice" id="invoice-print-area">
      <div className="invoice-header">
        <div className="shop">Toko Jam</div>
        <div className="tagline">Jam tangan · jam dinding · jam meja · aksesoris</div>
      </div>

      <div className="invoice-meta">
        <div>
          <span className="k">No. invoice</span>
          <div>{transaksi.no_invoice}</div>
        </div>
        <div>
          <span className="k">Tanggal</span>
          <div>{formatTanggal(transaksi.tanggal_transaksi)}</div>
        </div>
        <div>
          <span className="k">Pembeli</span>
          <div>{pembeli.nama || "-"}</div>
        </div>
        <div>
          <span className="k">No. HP</span>
          <div>{pembeli.no_hp || "-"}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Barang</th>
            <th style={{ textAlign: "right" }}>Qty</th>
            <th style={{ textAlign: "right" }}>Harga</th>
            <th style={{ textAlign: "right" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.transaction_item_id || `${it.product_id}-${it.qty}`}>
              <td>{it.nama_barang_snapshot}</td>
              <td style={{ textAlign: "right" }}>{it.qty}</td>
              <td style={{ textAlign: "right" }}>{formatRupiah(it.harga_satuan)}</td>
              <td style={{ textAlign: "right" }}>{formatRupiah(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-total">
        <span>Total</span>
        <span>{formatRupiah(transaksi.total_harga)}</span>
      </div>

      {transaksi.status === "dibatalkan" && (
        <div className="alert error" style={{ marginTop: 16 }}>
          Transaksi ini telah dibatalkan.
        </div>
      )}
    </div>
  );
}
