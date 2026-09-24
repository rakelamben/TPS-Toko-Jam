# Rencana Pengetatan Hak Akses Fitur Jadwal Kerja & Kehadiran (Shifts)

Dokumen ini memuat hasil tinjauan komprehensif atas celah hak akses (*access control vulnerability*) pada modul Jadwal Kerja (`shifts`), serta rencana perbaikan di tingkat backend (FastAPI) dan frontend (React).

---

## 1. Hasil Tinjauan Masalah Hak Akses Saat Ini

Setelah meninjau kode `backend/app/routers/shifts.py` dan `frontend/src/pages/OfficePage.jsx`:

1. **Celah di Backend (`backend/app/routers/shifts.py`)**:
   - `POST /shifts` (`create_shift`):
     - Router hanya memeriksa `Depends(require_office_area("shifts"))`. Karena `staf_operasional` dan `staf_gudang` telah dimasukkan ke area `shifts`, staf mana pun saat ini **bisa menetapkan jadwal kerja** untuk siapa saja.
     - Pengecekan `payload.created_by != personnel["sub"]` hanya memastikan ID pembuat sesuai token, bukan memverifikasi apakah akun tersebut adalah manajer/admin.
   - `PATCH /shifts/{shift_id}` (`update_shift`):
     - Tidak ada verifikasi siapa yang memanggil endpoint.
     - Staf saat ini **bisa mengubah jam mulai, jam selesai, dan kehadiran** pada shift miliknya maupun shift orang lain.
   - `DELETE /shifts/{shift_id}` (`delete_shift`):
     - Tidak ada batasan role; staf bisa menghapus jadwal shift siapa pun.

2. **Celah di Frontend (`frontend/src/pages/OfficePage.jsx`)**:
   - Form *"Tetapkan Jadwal"* ditampilkan untuk semua user yang membuka tab jadwal kerja, termasuk staf kasir dan staf gudang.
   - Tabel menampilkan tombol *"Update Kehadiran"* dan *"Hapus"* di setiap baris tanpa membedakan apakah pengguna adalah atasan atau staf biasa.
   - Tombol *"Ekspor Rekap (CSV)"* dapat diakses oleh staf biasa, padahal data rekapitulasi kehadiran adalah data manajerial/HR.

---

## 2. Matriks Hak Akses Target (RBAC Matrix)

| Aksi / Fungsi | Endpoint Backend | Admin | Manager | Staf (Kasir & Gudang) |
|---|---|:---:|:---:|:---:|
| **Melihat Jadwal Shift** | `GET /shifts` | ✅ Semua | ✅ Semua | ✅ Semua (Read-Only) / Filter Jadwal Saya |
| **Membuat / Menetapkan Jadwal** | `POST /shifts` | ✅ Boleh | ✅ Boleh | ❌ **Ditolak (403 Forbidden)** |
| **Mengubah Jam Kerja (`jam_mulai`, `jam_selesai`)** | `PATCH /shifts/{id}` | ✅ Boleh | ✅ Boleh | ❌ **Ditolak (403 Forbidden)** |
| **Menghapus Jadwal** | `DELETE /shifts/{id}` | ✅ Boleh | ✅ Boleh | ❌ **Ditolak (403 Forbidden)** |
| **Mengubah Kehadiran Staf Lain** | `PATCH /shifts/{id}` | ✅ Boleh | ✅ Boleh | ❌ **Ditolak (403 Forbidden)** |
| **Konfirmasi Kehadiran Sendiri** | `PATCH /shifts/{id}` | ✅ Boleh | ✅ Boleh | ✅ **Hanya shift miliknya sendiri (`status_kehadiran`)** |
| **Ekspor Rekap Payroll (CSV)** | UI Action | ✅ Boleh | ✅ Boleh | ❌ **Disembunyikan** |

---

## 3. Rencana Perbaikan Detail

### A. Perubahan Backend ([backend/app/routers/shifts.py](file:///d:/web/kms/TPS-Toko-Jam/backend/app/routers/shifts.py))

1. **`POST /shifts` (Create Shift)**:
   - Ganti dependency menjadi `personnel: dict = Depends(require_roles("admin", "manager"))`.
   - Staf yang mencoba menembak API akan langsung mendapatkan respon `403 Forbidden: Role tidak memiliki akses ke endpoint ini`.

2. **`DELETE /shifts/{shift_id}` (Delete Shift)**:
   - Tambahkan dependency `personnel: dict = Depends(require_roles("admin", "manager"))`.
   - Hanya Admin dan Manager yang berhak membatalkan/menghapus jadwal shift.

3. **`PATCH /shifts/{shift_id}` (Update Shift & Kehadiran)**:
   - Ambil identitas pemanggil via `personnel: dict = Depends(get_current_personnel)`.
   - Jika role adalah `admin` atau `manager`:
     - Diizinkan mengubah `jam_mulai`, `jam_selesai`, maupun `status_kehadiran`.
   - Jika role adalah `staff`:
     - Query record shift saat ini di database: pastikan `shift.personnel_id == personnel["sub"]`. Jika tidak, lempar error `403 Forbidden: Staf hanya dapat mengonfirmasi kehadiran pada jadwal miliknya sendiri`.
     - Validasi payload: jika payload memuat `jam_mulai` atau `jam_selesai`, lempar error `403 Forbidden: Staf tidak berwenang mengubah jam kerja shift`.
     - Staf hanya diizinkan memperbarui `status_kehadiran` (misal dari `terjadwal` $\rightarrow$ `hadir` atau `izin`).

---

### B. Perubahan Frontend ([frontend/src/pages/OfficePage.jsx](file:///d:/web/kms/TPS-Toko-Jam/frontend/src/pages/OfficePage.jsx))

1. **Kondisional Tampilan Form Penetapan Jadwal**:
   - Periksa `isManagerOrAdmin = ["admin", "manager"].includes(role);`.
   - Jika `isManagerOrAdmin === true`:
     - Tampilkan form *"Tetapkan Jadwal Shift"* lengkap (pemilihan staf, tanggal, jam mulai, jam selesai).
     - Tampilkan tombol *"📥 Ekspor Rekap (CSV)"*.
   - Jika `isManagerOrAdmin === false` (Staf):
     - **Sembunyikan form penetapan jadwal**.
     - Tampilkan kotak info (*notice card*):
       > ℹ️ *Jadwal kerja Anda ditetapkan oleh Manajer toko. Anda dapat mengonfirmasi kehadiran pada shift yang ditugaskan kepada Anda.*
     - Sembunyikan tombol *"Ekspor Rekap (CSV)"*.

2. **Filter Tampilan Jadwal di Tabel**:
   - Tambahkan filter sederhana: `[Semua Shift Toko, Shift Saya]`.
   - Untuk staf, default tampilan adalah `Shift Saya` agar langsung melihat tugas kerjanya, dengan opsi melihat jadwal seluruh gerai.

3. **Row Actions di Tabel**:
   - Jika pengguna adalah **Manager / Admin**:
     - Tampilkan tombol *"Edit"* (buka modal/form edit jam dan status) dan tombol *"Hapus"* (danger).
   - Jika pengguna adalah **Staf**:
     - Pada baris milik staf lain: Kolom aksi kosong (*Read-Only*).
     - Pada baris milik staf itu sendiri:
       - Jika `status_kehadiran === "terjadwal"`: Sediakan tombol cepat *"Konfirmasi Hadir"* dan *"Lapor Izin"*.
       - Tidak ada tombol edit jam dan tidak ada tombol hapus.

---

## 4. Rencana Verifikasi

### Otomatis
- Jalankan verifikasi sintaks Python dengan compiler backend:
  ```bash
  backend/venv/Scripts/python.exe -m py_compile backend/app/routers/shifts.py
  ```
- Jalankan build frontend:
  ```bash
  npm run build
  ```

### Manual
1. **Login sebagai Staf Kasir / Gudang**:
   - Buka menu *Jadwal Kerja*:
     - Pastikan form "Tetapkan Jadwal" TIDAK muncul.
     - Pastikan tombol "Hapus" dan tombol "Ekspor CSV" TIDAK muncul.
     - Pastikan hanya muncul tombol konfirmasi kehadiran pada shift miliknya sendiri.
   - Coba lakukan request API `POST /shifts` atau `DELETE /shifts/{id}`: pastikan sistem merespon dengan `403 Forbidden`.
2. **Login sebagai Manager / Admin**:
   - Buka menu *Jadwal Kerja*:
     - Form "Tetapkan Jadwal" muncul normal dan dapat menambahkan shift staf.
     - Tombol "Edit", "Hapus", dan "Ekspor Rekap (CSV)" berfungsi penuh.
