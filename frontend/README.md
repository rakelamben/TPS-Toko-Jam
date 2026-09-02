# TPS Toko Jam — Frontend (React + Vite)

Frontend untuk sistem kasir toko jam, dipasangkan dengan backend FastAPI
(`../backend`). Mendukung dua peran: **Admin** (kelola barang, transaksi,
ringkasan) dan **Pembeli** (lihat barang, belanja mandiri, riwayat transaksi
+ cetak invoice).

## Struktur folder

```
frontend/
├── src/
│   ├── api/client.js         # semua pemanggilan endpoint FastAPI (axios)
│   ├── context/
│   │   └── SessionContext.jsx # state login admin/pembeli, persist ke localStorage
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── BrandMark.jsx
│   │   ├── StatusMessage.jsx
│   │   ├── TransactionBuilder.jsx  # pencarian barang + keranjang, dipakai admin & pembeli
│   │   └── InvoiceView.jsx         # tampilan invoice, siap di-print
│   ├── pages/
│   │   ├── RoleSelectPage.jsx
│   │   ├── AdminLoginPage.jsx / CustomerIdentifyPage.jsx
│   │   ├── AdminLayout.jsx / CustomerLayout.jsx    # sidebar + <Outlet/>
│   │   ├── ProductsPage.jsx            # CRUD barang (admin)
│   │   ├── CustomerProductsPage.jsx    # lihat barang (pembeli, read-only)
│   │   ├── AdminNewTransactionPage.jsx # kasir bantu pembeli
│   │   ├── CustomerNewTransactionPage.jsx # pembeli belanja mandiri
│   │   ├── TransactionsPage.jsx        # daftar transaksi (dipakai admin & pembeli)
│   │   ├── TransactionDetailPage.jsx   # invoice + edit/batalkan (admin) / lihat saja (pembeli)
│   │   └── SummaryPage.jsx             # ringkasan admin
│   ├── utils/format.js       # formatRupiah, formatTanggal
│   ├── styles/index.css      # design tokens + semua styling (tanpa framework CSS)
│   ├── App.jsx                # routing (react-router-dom)
│   └── main.jsx
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── .gitignore
```

## Setup lokal

```bash
cd frontend
npm install
cp .env.example .env      # isi VITE_API_BASE_URL kalau backend tidak di localhost:8000
npm run dev
```

Buka `http://localhost:5173`. Pastikan backend FastAPI (`../backend`) sudah
jalan di `http://127.0.0.1:8000` (atau sesuaikan `.env`), dan `CORS_ORIGINS`
di `.env` backend sudah mengizinkan `http://localhost:5173`.

## Alur pemakaian

- **Admin**: login di `/admin/login` → kelola barang → buat transaksi baru
  sebagai kasir (cari/daftar pembeli dulu) → lihat semua transaksi → buka
  invoice untuk edit barang, batalkan, atau cetak → lihat ringkasan omzet.
- **Pembeli**: identifikasi diri via no HP di `/customer/identify` (otomatis
  daftar kalau nomor belum ada) → lihat katalog barang → belanja sendiri →
  lihat riwayat transaksi sendiri → buka invoice untuk cetak.

Cetak invoice memakai `window.print()` bawaan browser — CSS di
`styles/index.css` sudah menyembunyikan sidebar dan tombol-tombol saat mode
print (`@media print`), jadi yang tercetak cuma invoice-nya.

## Build untuk production

```bash
npm run build
```

Hasilnya ada di folder `dist/` — bisa di-deploy ke Vercel, Netlify, atau
static hosting lain. Jangan lupa set environment variable
`VITE_API_BASE_URL` ke URL backend production kamu di platform hosting.

## Langkah upload ke GitHub

Sama seperti backend — dari folder `frontend`:
```bash
git init
git add .
git commit -m "initial commit: React frontend TPS Toko Jam"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo-frontend>.git
git push -u origin main
```
(Kalau frontend & backend mau ada di satu repo yang sama, cukup `git init`
di folder `web/` yang membungkus keduanya, bukan di masing-masing folder.)
