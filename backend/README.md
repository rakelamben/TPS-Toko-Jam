# TPS Toko Jam — Backend (FastAPI)

Backend REST API untuk sistem kasir toko jam, hasil konversi dari script CLI
Python (`main.py` di Colab) ke FastAPI. Terhubung ke Supabase (schema `toko_jam`).

## Struktur folder

```
tps-toko-jam-api/
├── app/
│   ├── main.py              # entrypoint FastAPI, daftar semua router
│   ├── config.py            # baca environment variables
│   ├── database.py          # client Supabase (schema toko_jam)
│   ├── routers/
│   │   ├── products.py      # CRUD barang
│   │   ├── customers.py     # daftar/login pembeli via no HP
│   │   ├── transactions.py  # buat/lihat/edit/batalkan transaksi + invoice
│   │   └── admin.py         # login admin
│   ├── schemas/              # model Pydantic (request/response, ganti "input_angka" manual)
│   │   ├── product.py
│   │   ├── customer.py
│   │   ├── transaction.py
│   │   └── admin.py
│   └── utils/
│       └── security.py      # hash_password
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Setup lokal

```bash
cd tps-toko-jam-api
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env            # lalu isi SUPABASE_URL & SUPABASE_KEY di .env
# isi juga JWT_SECRET dengan secret acak panjang untuk token login personel

uvicorn app.main:app --reload
```

Buka `http://127.0.0.1:8000/docs` — Swagger UI otomatis, semua endpoint bisa
langsung dicoba dari sana (pengganti menu CLI kamu).

Endpoint personel/OAS membutuhkan header `Authorization: Bearer <access_token>`.
Token diterbitkan oleh `POST /auth/login` dan memiliki masa berlaku sesuai
`JWT_EXPIRE_MINUTES`. Role `admin`, `manager`, dan `staff` diperiksa di backend;
pembatasan menu frontend bukan satu-satunya lapisan keamanan.

## Ringkasan endpoint (vs menu CLI lama)

| Menu CLI lama              | Endpoint FastAPI                              |
|-----------------------------|------------------------------------------------|
| Input/lihat/edit/hapus barang | `POST/GET/PATCH/DELETE /products`           |
| Daftar/login pembeli        | `POST /customers/identify`                     |
| Buat transaksi               | `POST /transactions`                          |
| Lihat transaksi (admin/pembeli) | `GET /transactions?customer_id=`           |
| Cetak invoice                | `GET /transactions/{id}/invoice`              |
| Edit transaksi                | `PATCH /transactions/by-invoice/{no_invoice}` |
| Batalkan transaksi            | `POST /transactions/by-invoice/{no_invoice}/cancel` |
| Ringkasan admin                | `GET /transactions/summary/admin`            |
| Login admin                    | `POST /admin/login`                          |

## Langkah upload ke GitHub

1. **Buat repo baru** di GitHub (kosong, tanpa README/gitignore — biar tidak konflik).
2. Di folder project ini, jalankan:
   ```bash
   git init
   git add .
   git commit -m "initial commit: FastAPI backend TPS Toko Jam"
   git branch -M main
   git remote add origin https://github.com/<username>/<nama-repo>.git
   git push -u origin main
   ```
3. **Pastikan `.env` TIDAK ikut ter-push** (cek dengan `git status` sebelum commit —
   `.env` seharusnya tidak muncul karena sudah di `.gitignore`). Yang boleh ke GitHub
   hanya `.env.example`.
4. Kalau nanti mau deploy (Railway/Render/Fly.io dsb), isi `SUPABASE_URL` dan
   `SUPABASE_KEY` sebagai environment variable di platform tsb, bukan lewat file `.env`.

## Catatan / langkah lanjutan (opsional)

- **Auth**: `POST /admin/login` saat ini masih sama seperti versi CLI — cuma
  validasi username/password lalu balikin data admin, belum ada token. Kalau
  endpoint tulis (tambah/edit/hapus barang, batalkan transaksi) perlu diproteksi
  supaya cuma admin yang login yang bisa akses, tambahkan JWT (`python-jose`)
  dan `Depends(verify_token)` di router yang perlu.
- **RPC database**: `buat_transaksi`, `edit_transaksi_items`, `batalkan_transaksi`,
  `ringkasan_admin` diasumsikan sudah ada sebagai Postgres function di Supabase
  (persis seperti versi CLI) — kode ini cuma memanggilnya, tidak menduplikasi logikanya.
