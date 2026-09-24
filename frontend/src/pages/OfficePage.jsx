import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import StatusMessage from "../components/StatusMessage";
import {
  listStaff, createStaff, updateStaff, deleteStaff, listManagers, createManager,
  listPersonnelDirectory,
  listDocuments, createDocument, updateDocument, deleteDocument,
  sendMessage, getInbox, markMessageRead, listNotifications, markNotificationRead,
  listShifts, createShift, updateShift, deleteShift,
  listWorkflowRequests, createWorkflowRequest, getWorkflowApproval, decideWorkflow,
  listCorrespondence, createCorrespondence, updateCorrespondence,
  listDispositions, createDisposition, updateDisposition, listActivityLogs,
  listProducts, listTransactions,
  getErrorMessage,
} from "../api/client";

const TAB_CONFIG = {
  communication: {
    title: "Pesan Internal",
    description: "Kirim pesan langsung ke personel toko atau siaran umum.",
    canAccess: ({ role, personnel }) =>
      ["admin", "manager"].includes(role) || ["staf_operasional", "staf_gudang"].includes(personnel?.role),
  },
  notifications: {
    title: "Notifikasi Sistem",
    description: "Pemberitahuan otomatis transaksi, stok menipis, dan peringatan operasional.",
    canAccess: ({ role, personnel }) =>
      ["admin", "manager"].includes(role) || ["staf_gudang", "staf_operasional"].includes(personnel?.role),
  },
  documents: {
    title: "Dokumen Gerai",
    description: "Pengarsipan memo, SOP, dan berkas transaksi toko jam.",
    canAccess: ({ role, personnel }) =>
      role === "admin" || role === "manager" || personnel?.role === "staf_operasional",
  },
  correspondence: {
    title: "Persuratan & Disposisi",
    description: "Pencatatan surat masuk, keluar, dan pendelegasian instruksi kerja.",
    canAccess: ({ role, personnel }) =>
      role === "admin" || role === "manager" || personnel?.role === "staf_operasional",
  },
  workflow: {
    title: "Workflow Approval",
    description: "Pengajuan pengadaan barang, perubahan stok, dan persetujuan manajerial.",
    canAccess: ({ role, personnel }) =>
      role === "admin" || role === "manager" || ["staf_operasional", "staf_gudang"].includes(personnel?.role),
  },
  shifts: {
    title: "Jadwal Kerja & Shift",
    description: "Penjadwalan shift kasir/gudang dan rekap presensi kehadiran.",
    canAccess: ({ role, personnel }) =>
      ["admin", "manager"].includes(role) || ["staf_gudang", "staf_operasional"].includes(personnel?.role),
  },
  personnel: {
    title: "Manajemen Personel",
    description: "Pengelolaan akun manajer dan staf toko jam tangan.",
    canAccess: ({ role }) => role === "admin",
  },
  logs: {
    title: "Audit Trail (Log Aktivitas)",
    description: "Riwayat kronologis mutasi data untuk pengawasan dan audit kepatuhan.",
    canAccess: ({ role }) => ["admin", "manager"].includes(role),
  },
};

const REQUEST_TYPES = [
  { value: "pengadaan_barang", label: "Pengadaan barang (Restock)", table: "products" },
  { value: "perubahan_stok", label: "Penyesuaian stok fisik", table: "products" },
  { value: "dokumen_baru", label: "Pengesahan dokumen baru", table: "documents" },
  { value: "surat_masuk_keluar", label: "Disposisi surat khusus", table: "correspondence" },
  { value: "jadwal_personel", label: "Perubahan jadwal shift", table: "shifts" },
  { value: "lainnya", label: "Lainnya (Umum)", table: "" },
];

function useOfficeStatus() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function clearStatus() { setError(""); setSuccess(""); }
  function showError(errorValue) { setError(getErrorMessage(errorValue)); setSuccess(""); }
  return { error, success, clearStatus, showError, setSuccess };
}

function Section({ title, description, children, action }) {
  return (
    <section className="office-section">
      <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}

// Hook untuk mendapatkan direktori nama personel toko
function usePersonnelDirectory() {
  const [directory, setDirectory] = useState([]);
  const [map, setMap] = useState({});

  useEffect(() => {
    listPersonnelDirectory()
      .then((data) => {
        const list = data || [];
        setDirectory(list);
        const m = {};
        for (const p of list) {
          m[p.personnel_id] = p;
        }
        setMap(m);
      })
      .catch(() => {});
  }, []);

  return { directory, map };
}

// ==========================================
// 1. PANEL PERSONEL
// ==========================================
function PersonnelPanel() {
  const status = useOfficeStatus();
  const [staff, setStaff] = useState([]);
  const [managers, setManagers] = useState([]);
  const [staffForm, setStaffForm] = useState({ username: "", password: "", nama: "", role: "staf_operasional", manager_id: "" });
  const [managerForm, setManagerForm] = useState({ username: "", password: "", nama: "" });
  const [editing, setEditing] = useState(null);

  async function load() {
    try { setStaff(await listStaff()); setManagers(await listManagers()); } catch (err) { status.showError(err); }
  }
  useEffect(() => { load(); }, []);

  async function saveStaff(event) {
    event.preventDefault(); status.clearStatus();
    try {
      const payload = { ...staffForm, manager_id: staffForm.manager_id || null };
      if (editing) await updateStaff(editing.staff_id, { nama: payload.nama, role: payload.role, manager_id: payload.manager_id, password: payload.password || undefined });
      else await createStaff(payload);
      setStaffForm({ username: "", password: "", nama: "", role: "staf_operasional", manager_id: "" });
      setEditing(null); status.setSuccess(editing ? "Data staff diperbarui." : "Staff berhasil dibuat."); await load();
    } catch (err) { status.showError(err); }
  }

  async function saveManager(event) {
    event.preventDefault(); status.clearStatus();
    try { await createManager(managerForm); setManagerForm({ username: "", password: "", nama: "" }); status.setSuccess("Manager berhasil dibuat."); await load(); }
    catch (err) { status.showError(err); }
  }

  function editStaff(person) {
    setEditing(person);
    setStaffForm({ username: person.username, password: "", nama: person.nama, role: person.role, manager_id: person.manager_id || "" });
  }

  async function removeStaff(person) {
    if (!confirm(`Hapus staff ${person.nama}?`)) return;
    try { await deleteStaff(person.staff_id); status.setSuccess("Staff dihapus."); await load(); } catch (err) { status.showError(err); }
  }

  return (
    <>
      <StatusMessage error={status.error} success={status.success} />
      <div className="office-grid two-columns">
        <Section title="Daftar Staf Gerai" description="Kelola staf kasir/operasional dan staf gudang.">
          <form onSubmit={saveStaff} className="compact-form">
            <div className="form-grid">
              <div className="field"><label>Nama Lengkap</label><input value={staffForm.nama} onChange={e => setStaffForm({ ...staffForm, nama: e.target.value })} required /></div>
              <div className="field"><label>Username</label><input value={staffForm.username} disabled={!!editing} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} required={!editing} /></div>
              <div className="field"><label>{editing ? "Password baru (opsional)" : "Password"}</label><input type="password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} required={!editing} /></div>
              <div className="field"><label>Peran Penugasan</label><select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}><option value="staf_operasional">Staf Operasional (Kasir)</option><option value="staf_gudang">Staf Gudang (Inventaris)</option></select></div>
              <div className="field"><label>Atasan (Manager)</label><select value={staffForm.manager_id} onChange={e => setStaffForm({ ...staffForm, manager_id: e.target.value })}><option value="">Belum ditentukan</option>{managers.map(m => <option key={m.manager_id} value={m.manager_id}>{m.nama}</option>)}</select></div>
            </div>
            <div className="toolbar"><button className="primary" type="submit">{editing ? "Simpan perubahan" : "Tambah staf"}</button>{editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setStaffForm({ username: "", password: "", nama: "", role: "staf_operasional", manager_id: "" }); }}>Batal</button>}</div>
          </form>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Atasan</th><th /></tr></thead>
              <tbody>
                {staff.map(person => (
                  <tr key={person.staff_id}>
                    <td><strong>{person.nama}</strong></td>
                    <td><code>{person.username}</code></td>
                    <td><span className="badge">{person.role === "staf_gudang" ? "Gudang" : "Operasional"}</span></td>
                    <td>{managers.find(m => m.manager_id === person.manager_id)?.nama || "-"}</td>
                    <td><div className="row-actions"><button onClick={() => editStaff(person)}>Edit</button><button className="danger" onClick={() => removeStaff(person)}>Hapus</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="Daftar Manajer Toko" description="Manajer menerima wewenang persetujuan (approval) operasional.">
          <form onSubmit={saveManager} className="compact-form">
            <div className="field"><label>Nama Manajer</label><input value={managerForm.nama} onChange={e => setManagerForm({ ...managerForm, nama: e.target.value })} required /></div>
            <div className="field"><label>Username</label><input value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} required /></div>
            <div className="field"><label>Password</label><input type="password" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} required /></div>
            <button className="primary" type="submit">Tambah Manajer</button>
          </form>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nama</th><th>Username</th></tr></thead>
              <tbody>
                {managers.map(person => (
                  <tr key={person.manager_id}>
                    <td><strong>{person.nama}</strong></td>
                    <td><code>{person.username}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </>
  );
}

// ==========================================
// 2. PANEL DOKUMEN
// ==========================================
function DocumentsPanel() {
  const { admin } = useSession();
  const status = useOfficeStatus();
  const { map: directoryMap } = usePersonnelDirectory();
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ tipe_dokumen: "laporan_stok", judul: "", deskripsi: "", file_url: "", transaction_id: "" });
  const [editing, setEditing] = useState(null);

  async function load() {
    try {
      setItems(await listDocuments());
      listTransactions().then(setTransactions).catch(() => {});
    } catch (err) { status.showError(err); }
  }
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault(); status.clearStatus();
    try {
      if (editing) {
        await updateDocument(editing.document_id, {
          judul: form.judul,
          deskripsi: form.deskripsi || null,
          file_url: form.file_url || null,
          status: form.status,
        });
      } else {
        await createDocument({
          ...form,
          deskripsi: form.deskripsi || null,
          file_url: form.file_url || null,
          transaction_id: form.transaction_id || null,
          created_by: admin.personnel_id,
        });
      }
      setForm({ tipe_dokumen: "laporan_stok", judul: "", deskripsi: "", file_url: "", transaction_id: "" });
      setEditing(null);
      status.setSuccess("Dokumen berhasil disimpan.");
      await load();
    } catch (err) { status.showError(err); }
  }

  async function remove(item) {
    if (!confirm(`Hapus dokumen "${item.judul}"?`)) return;
    try { await deleteDocument(item.document_id); status.setSuccess("Dokumen dihapus."); await load(); } catch (err) { status.showError(err); }
  }

  function startEdit(item) {
    setEditing(item);
    setForm({
      tipe_dokumen: item.tipe_dokumen,
      judul: item.judul,
      deskripsi: item.deskripsi || "",
      file_url: item.file_url || "",
      transaction_id: item.transaction_id || "",
      status: item.status,
    });
  }

  return (
    <>
      <StatusMessage error={status.error} success={status.success} />
      <Section title="Pengarsipan Dokumen Toko" description="Catat memo gerai, SOP pelayanan, berita acara, atau lampiran retur transaksi.">
        <form onSubmit={save} className="compact-form">
          <div className="form-grid">
            <div className="field">
              <label>Tipe Dokumen</label>
              <select value={form.tipe_dokumen} disabled={!!editing} onChange={e => setForm({ ...form, tipe_dokumen: e.target.value })} required>
                <option value="laporan_stok">Laporan Stok</option>
                <option value="memo_internal">Memo Internal</option>
                <option value="sop">SOP Toko</option>
                <option value="berita_acara">Berita Acara</option>
                <option value="garansi_retur">Klaim Garansi / Retur</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div className="field"><label>Judul Dokumen</label><input value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} required /></div>
            <div className="field"><label>Tautkan Transaksi Terkait (Opsional)</label>
              <select value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })}>
                <option value="">-- Tanpa Kaitan Transaksi --</option>
                {transactions.slice(0, 30).map(t => (
                  <option key={t.transaction_id} value={t.transaction_id}>
                    {t.no_invoice} - {t.customers?.nama || "Pelanggan"} (Rp{t.total?.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>
            <div className="field"><label>Tautan Berkas (URL File Lampiran)</label><input type="url" placeholder="https://..." value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} /></div>
            {editing && (
              <div className="field"><label>Status Dokumen</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="final">Final (Resmi)</option>
                  <option value="arsip">Arsip</option>
                </select>
              </div>
            )}
          </div>
          <div className="field"><label>Keterangan / Ringkasan Dokumen</label><textarea rows="2" value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></div>
          <div className="toolbar">
            <button className="primary" type="submit">{editing ? "Simpan Perubahan" : "Simpan Dokumen"}</button>
            {editing && <button type="button" className="ghost" onClick={() => setEditing(null)}>Batal</button>}
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Judul & Tautan</th><th>Tipe</th><th>Status</th><th>Pembuat</th><th /></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.document_id}>
                  <td>
                    {item.file_url ? (
                      <a href={item.file_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "var(--brass)" }}>
                        {item.judul} 🔗
                      </a>
                    ) : (
                      <strong>{item.judul}</strong>
                    )}
                    {item.deskripsi && <small style={{ display: "block", color: "var(--slate)" }}>{item.deskripsi}</small>}
                  </td>
                  <td><span className="badge">{item.tipe_dokumen}</span></td>
                  <td><span className={`badge ${item.status}`}>{item.status.toUpperCase()}</span></td>
                  <td>{directoryMap[item.created_by]?.nama || (item.created_by === admin.personnel_id ? "Saya" : "Personel")}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => startEdit(item)}>Edit</button>
                      <button className="danger" onClick={() => remove(item)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

// ==========================================
// 3. PANEL PERSURATAN & DISPOSISI
// ==========================================
function CorrespondencePanel() {
  const { admin } = useSession();
  const status = useOfficeStatus();
  const { directory, map: directoryMap } = usePersonnelDirectory();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dispositions, setDispositions] = useState([]);
  const [form, setForm] = useState({ nomor_agenda: "", tipe: "masuk", perihal: "", asal_tujuan: "", tanggal_surat: "", tanggal_terima: "", file_url: "" });
  const [disposition, setDisposition] = useState({ disposisi_ke: "", instruksi: "" });

  async function load() {
    try { setItems(await listCorrespondence()); } catch (err) { status.showError(err); }
  }
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    try {
      await createCorrespondence({
        ...form,
        tanggal_surat: form.tanggal_surat || null,
        tanggal_terima: form.tanggal_terima || null,
        file_url: form.file_url || null,
        created_by: admin.personnel_id,
      });
      setForm({ nomor_agenda: "", tipe: "masuk", perihal: "", asal_tujuan: "", tanggal_surat: "", tanggal_terima: "", file_url: "" });
      status.setSuccess("Surat berhasil dicatat.");
      await load();
    } catch (err) { status.showError(err); }
  }

  async function choose(item) {
    setSelected(item);
    try { setDispositions(await listDispositions(item.correspondence_id)); } catch (err) { status.showError(err); }
  }

  async function changeStatus(item, value) {
    try {
      await updateCorrespondence(item.correspondence_id, { status: value });
      status.setSuccess("Status surat diperbarui.");
      await load();
      setSelected((prev) => (prev?.correspondence_id === item.correspondence_id ? { ...prev, status: value } : prev));
    } catch (err) { status.showError(err); }
  }

  async function addDisposition(event) {
    event.preventDefault();
    try {
      await createDisposition(selected.correspondence_id, disposition);
      setDisposition({ disposisi_ke: "", instruksi: "" });
      setDispositions(await listDispositions(selected.correspondence_id));
      status.setSuccess("Disposisi berhasil ditambahkan.");
    } catch (err) { status.showError(err); }
  }

  async function updateDisp(item, value) {
    try {
      await updateDisposition(item.disposition_id, { status: value });
      setDispositions(await listDispositions(selected.correspondence_id));
    } catch (err) { status.showError(err); }
  }

  return (
    <>
      <StatusMessage error={status.error} success={status.success} />
      <Section title="Buku Agenda Surat Masuk / Keluar" description="Catat nomor agenda resmi surat dari supplier, instansi, atau pelanggan.">
        <form onSubmit={save} className="compact-form">
          <div className="form-grid">
            <div className="field"><label>Nomor Agenda Resmi</label><input placeholder="Contoh: AGD/2026/042" value={form.nomor_agenda} onChange={e => setForm({ ...form, nomor_agenda: e.target.value })} required /></div>
            <div className="field"><label>Jenis Surat</label><select value={form.tipe} onChange={e => setForm({ ...form, tipe: e.target.value })}><option value="masuk">Surat Masuk</option><option value="keluar">Surat Keluar</option></select></div>
            <div className="field"><label>Asal / Tujuan Instansi</label><input placeholder="Contoh: PT Casio Indonesia / Distributor Garmin" value={form.asal_tujuan} onChange={e => setForm({ ...form, asal_tujuan: e.target.value })} required /></div>
            <div className="field"><label>Tanggal Surat</label><input type="date" value={form.tanggal_surat} onChange={e => setForm({ ...form, tanggal_surat: e.target.value })} /></div>
            <div className="field"><label>Tanggal Terima / Kirim</label><input type="date" value={form.tanggal_terima} onChange={e => setForm({ ...form, tanggal_terima: e.target.value })} /></div>
            <div className="field"><label>URL Berkas Pindaian (Scan)</label><input type="url" placeholder="https://..." value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} /></div>
          </div>
          <div className="field"><label>Perihal Surat</label><input placeholder="Contoh: Penawaran Harga Seri G-Shock Baru" value={form.perihal} onChange={e => setForm({ ...form, perihal: e.target.value })} required /></div>
          <button className="primary" type="submit">Catat Surat</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>No. Agenda</th><th>Tipe</th><th>Perihal & Instansi</th><th>Status Surat</th><th>Aksi</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.correspondence_id} style={{ background: selected?.correspondence_id === item.correspondence_id ? "rgba(184, 134, 63, 0.08)" : undefined }}>
                  <td><strong>{item.nomor_agenda}</strong></td>
                  <td><span className={`badge ${item.tipe}`}>{item.tipe === "masuk" ? "Masuk" : "Keluar"}</span></td>
                  <td>
                    {item.perihal}
                    <small style={{ display: "block", color: "var(--slate)" }}>{item.asal_tujuan}</small>
                  </td>
                  <td>
                    <select value={item.status} onChange={e => changeStatus(item, e.target.value)}>
                      <option value="diterima">Diterima</option>
                      <option value="diproses">Diproses</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </td>
                  <td>
                    <button className={selected?.correspondence_id === item.correspondence_id ? "primary" : ""} onClick={() => choose(item)}>
                      Disposisi ({item.status})
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {selected && (
        <Section
          title={`Disposisi Tugas: Agenda ${selected.nomor_agenda}`}
          description={`Perihal: ${selected.perihal} (${selected.asal_tujuan})`}
          action={<button className="ghost" onClick={() => setSelected(null)}>Tutup Disposisi</button>}
        >
          <form onSubmit={addDisposition} className="inline-form" style={{ marginBottom: 16 }}>
            <select
              value={disposition.disposisi_ke}
              onChange={e => setDisposition({ ...disposition, disposisi_ke: e.target.value })}
              required
              style={{ minWidth: 220 }}
            >
              <option value="">-- Tugaskan ke Personel --</option>
              {directory.map(p => (
                <option key={p.personnel_id} value={p.personnel_id}>
                  {p.nama} ({p.role ? p.role : p.personnel_type})
                </option>
              ))}
            </select>
            <input
              placeholder="Instruksi tindak lanjut (misal: Siapkan pengecekan stok di gudang)"
              value={disposition.instruksi}
              onChange={e => setDisposition({ ...disposition, instruksi: e.target.value })}
              required
            />
            <button className="primary" type="submit">Tambah Disposisi</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Penerima Tugas</th><th>Instruksi</th><th>Status Pengerjaan</th></tr></thead>
              <tbody>
                {dispositions.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--slate)" }}>Belum ada disposisi instruksi untuk surat ini.</td></tr>
                )}
                {dispositions.map(item => (
                  <tr key={item.disposition_id}>
                    <td><strong>{directoryMap[item.disposisi_ke]?.nama || item.disposisi_ke}</strong></td>
                    <td>{item.instruksi || "-"}</td>
                    <td>
                      <select value={item.status} onChange={e => updateDisp(item, e.target.value)}>
                        <option value="belum">Belum Dikerjakan</option>
                        <option value="sedang_diproses">Sedang Diproses</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  );
}

// ==========================================
// 4. PANEL WORKFLOW APPROVAL
// ==========================================
function WorkflowPanel() {
  const { admin, role, refreshBadges } = useSession();
  const status = useOfficeStatus();
  const { map: directoryMap } = usePersonnelDirectory();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [approval, setApproval] = useState({});
  const [decisionModal, setDecisionModal] = useState({ open: false, item: null, decision: "approved", catatan: "" });
  const [form, setForm] = useState({
    tipe_request: REQUEST_TYPES[0].value,
    reference_table: REQUEST_TYPES[0].table,
    reference_id: "",
    deskripsi: "",
  });

  const selectedType = REQUEST_TYPES.find((item) => item.value === form.tipe_request) || REQUEST_TYPES[0];

  async function load() {
    try {
      setItems(await listWorkflowRequests());
      listProducts().then(setProducts).catch(() => {});
    } catch (err) { status.showError(err); }
  }
  useEffect(() => { load(); }, []);

  function changeType(value) {
    const next = REQUEST_TYPES.find((item) => item.value === value) || REQUEST_TYPES[0];
    setForm({ ...form, tipe_request: next.value, reference_table: next.table, reference_id: "" });
  }

  async function create(event) {
    event.preventDefault();
    try {
      await createWorkflowRequest({
        ...form,
        reference_table: form.reference_table || null,
        reference_id: form.reference_id || null,
        deskripsi: form.deskripsi || null,
        requested_by: admin.personnel_id,
      });
      setForm({ tipe_request: REQUEST_TYPES[0].value, reference_table: REQUEST_TYPES[0].table, reference_id: "", deskripsi: "" });
      status.setSuccess("Permohonan approval berhasil diajukan.");
      refreshBadges();
      await load();
    } catch (err) { status.showError(err); }
  }

  async function review(item) {
    try {
      const res = await getWorkflowApproval(item.request_id);
      setApproval(prev => ({ ...prev, [item.request_id]: res }));
    } catch (err) { status.showError(err); }
  }

  function openDecision(item, decision) {
    setDecisionModal({ open: true, item, decision, catatan: "" });
  }

  async function submitDecision() {
    if (!decisionModal.item) return;
    try {
      await decideWorkflow(decisionModal.item.request_id, {
        approver_id: admin.personnel_id,
        status: decisionModal.decision,
        catatan: decisionModal.catatan || null,
      });
      status.setSuccess(`Permohonan telah di-${decisionModal.decision === "approved" ? "setujui" : "tolak"}.`);
      setDecisionModal({ open: false, item: null, decision: "approved", catatan: "" });
      refreshBadges();
      await load();
    } catch (err) { status.showError(err); }
  }

  return (
    <>
      <StatusMessage error={status.error} success={status.success} />
      <Section title="Pengajuan Approval Operasional" description="Ajukan kebutuhan restock jam tangan, penyesuaian stok, atau pengesahan dokumen gerai.">
        <form onSubmit={create} className="compact-form">
          <div className="form-grid">
            <div className="field">
              <label>Tipe Permohonan</label>
              <select value={form.tipe_request} onChange={(event) => changeType(event.target.value)}>
                {REQUEST_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            {selectedType.table === "products" ? (
              <div className="field">
                <label>Pilih Jam Tangan Terkait</label>
                <select value={form.reference_id} onChange={e => setForm({ ...form, reference_id: e.target.value })} required>
                  <option value="">-- Pilih Produk Jam Tangan --</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.nama_barang} (Sisa Stok: {p.stok})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="field">
                <label>ID Referensi Terkait (Opsional)</label>
                <input
                  value={form.reference_id}
                  onChange={(event) => setForm({ ...form, reference_id: event.target.value })}
                  placeholder={selectedType.table ? "ID data terkait" : "Boleh dikosongkan"}
                />
              </div>
            )}
          </div>
          <div className="field">
            <label>Rincian Alasan / Kebutuhan</label>
            <textarea
              rows="3"
              placeholder="Contoh: Permohonan restock 10 unit Seiko Presage untuk memenuhi display etalase depan..."
              value={form.deskripsi}
              onChange={(event) => setForm({ ...form, deskripsi: event.target.value })}
              required
            />
          </div>
          <button className="primary" type="submit">Ajukan Permohonan</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Tipe</th><th>Rincian Kebutuhan</th><th>Pemohon</th><th>Status</th><th>Keputusan</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.request_id}>
                  <td><strong>{REQUEST_TYPES.find((type) => type.value === item.tipe_request)?.label || item.tipe_request}</strong></td>
                  <td>
                    {item.deskripsi || "-"}
                    {item.reference_table === "products" && item.reference_id && (
                      <small style={{ display: "block", color: "var(--brass)" }}>
                        Produk: {products.find(p => p.product_id === item.reference_id)?.nama_barang || item.reference_id}
                      </small>
                    )}
                  </td>
                  <td>{directoryMap[item.requested_by]?.nama || item.requested_by}</td>
                  <td><span className={`badge ${item.current_status}`}>{item.current_status.toUpperCase()}</span></td>
                  <td>
                    {item.current_status === "pending" && ["admin", "manager"].includes(role) ? (
                      <div className="row-actions">
                        <button className="primary" onClick={() => openDecision(item, "approved")}>Setujui</button>
                        <button className="danger" onClick={() => openDecision(item, "rejected")}>Tolak</button>
                      </div>
                    ) : (
                      <button onClick={() => review(item)}>Lihat Catatan</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Object.entries(approval).map(([id, item]) => (
          <div className="detail-note" key={id} style={{ marginTop: 12 }}>
            <strong>Keputusan Permohonan:</strong> Status {item.status.toUpperCase()}
            {item.catatan ? ` | Catatan: "${item.catatan}"` : ""}
            {item.approver_id && ` | Oleh: ${directoryMap[item.approver_id]?.nama || item.approver_id}`}
          </div>
        ))}
      </Section>

      {/* MODAL KEPUTUSAN APPROVAL */}
      {decisionModal.open && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Konfirmasi Keputusan {decisionModal.decision === "approved" ? "Persetujuan" : "Penolakan"}</h3>
            <p>
              Tindak lanjuti permohonan <strong>{decisionModal.item?.tipe_request}</strong> yang diajukan oleh{" "}
              <strong>{directoryMap[decisionModal.item?.requested_by]?.nama || "Personel"}</strong>.
            </p>
            <div className="field">
              <label>Catatan Keputusan / Instruksi (Wajib jika menolak):</label>
              <textarea
                rows="3"
                placeholder={decisionModal.decision === "approved" ? "Catatan persetujuan (opsional)..." : "Tuliskan alasan penolakan..."}
                value={decisionModal.catatan}
                onChange={e => setDecisionModal({ ...decisionModal, catatan: e.target.value })}
                required={decisionModal.decision === "rejected"}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setDecisionModal({ open: false, item: null, decision: "approved", catatan: "" })}>
                Batal
              </button>
              <button
                type="button"
                className={decisionModal.decision === "approved" ? "primary" : "danger"}
                onClick={submitDecision}
              >
                Konfirmasi {decisionModal.decision === "approved" ? "Setujui" : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// 5. PANEL KOMUNIKASI & NOTIFIKASI
// ==========================================
function CommunicationPanel({ notificationsOnly = false }) {
  const { admin, role, refreshBadges } = useSession();
  const navigate = useNavigate();
  const status = useOfficeStatus();
  const { map: directoryMap } = usePersonnelDirectory();
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [form, setForm] = useState({ receiver_id: "", subject: "", body: "" });

  const canSeeNotifications = role !== "staff" || ["staf_gudang", "staf_operasional"].includes(admin?.role);

  async function load() {
    try {
      if (!notificationsOnly) {
        setMessages(await getInbox(admin.personnel_id));
        setRecipients(await listPersonnelDirectory());
      }
      if (canSeeNotifications) {
        setNotifications(await listNotifications(admin.personnel_id));
      }
    } catch (err) { status.showError(err); }
  }
  useEffect(() => { load(); }, [admin.personnel_id]);

  async function send(event) {
    event.preventDefault();
    try {
      await sendMessage({ ...form, sender_id: admin.personnel_id, receiver_id: form.receiver_id || null, subject: form.subject || null });
      setForm({ receiver_id: "", subject: "", body: "" });
      status.setSuccess("Pesan berhasil dikirim.");
      refreshBadges();
      await load();
    } catch (err) { status.showError(err); }
  }

  async function readMessage(id) {
    try {
      await markMessageRead(id);
      refreshBadges();
      await load();
    } catch (err) { status.showError(err); }
  }

  async function readNotification(id) {
    try {
      await markNotificationRead(id);
      refreshBadges();
      await load();
    } catch (err) { status.showError(err); }
  }

  async function markAllNotificationsRead() {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => markNotificationRead(n.notification_id)));
      refreshBadges();
      await load();
      status.setSuccess("Semua notifikasi ditandai sudah dibaca.");
    } catch (err) { status.showError(err); }
  }

  if (notificationsOnly) {
    return (
      <>
        <StatusMessage error={status.error} success={status.success} />
        <Section
          title="Pemberitahuan Sistem"
          description="Peringatan stok barang, transaksi toko, dan update status pengajuan."
          action={
            notifications.some(n => !n.is_read) && (
              <button className="ghost" onClick={markAllNotificationsRead}>Tandai Semua Dibaca</button>
            )
          }
        >
          <NotificationList
            notifications={notifications}
            onRead={readNotification}
            onActionRestock={() => navigate("/admin/office/workflow")}
          />
        </Section>
      </>
    );
  }

  return (
    <>
      <StatusMessage error={status.error} success={status.success} />
      <div className="office-grid two-columns">
        <Section title="Kirim Pesan Internal" description="Komunikasi langsung atau pengumuman broadcast ke seluruh rekan kerja.">
          <form onSubmit={send} className="compact-form">
            <div className="field">
              <label>Penerima Pesan</label>
              <select value={form.receiver_id} onChange={e => setForm({ ...form, receiver_id: e.target.value })}>
                <option value="">Semua Personel (Broadcast)</option>
                {recipients
                  .filter(person => person.personnel_id !== admin.personnel_id)
                  .map(person => (
                    <option key={person.personnel_id} value={person.personnel_id}>
                      {person.nama} · {person.role ? person.role : person.personnel_type}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field"><label>Subjek Pesan</label><input placeholder="Contoh: Cek fisik jam Casio G-Shock..." value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="field"><label>Isi Pesan</label><textarea rows="4" placeholder="Tuliskan isi pesan..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required /></div>
            <button className="primary" type="submit">Kirim Pesan</button>
          </form>
        </Section>

        <Section title="Kotak Masuk Pesan" description="Pesan langsung dan siaran yang ditujukan ke akun ini.">
          <MessageList messages={messages} onRead={readMessage} directoryMap={directoryMap} />
        </Section>
      </div>
    </>
  );
}

function NotificationList({ notifications, onRead, onActionRestock }) {
  return (
    <div className="notice-list">
      {notifications.length === 0 && <div className="empty-state">Belum ada notifikasi baru.</div>}
      {notifications.map(item => (
        <div className={`notice ${item.is_read ? "read" : ""}`} key={item.notification_id}>
          <div>
            <strong>{item.tipe === "stok_rendah" ? "⚠️ Peringatan Stok Menipis" : item.tipe}</strong>
            <p>{item.message}</p>
            {item.reference_table === "products" && onActionRestock && (
              <button
                type="button"
                className="primary"
                style={{ marginTop: 8, padding: "4px 10px", fontSize: 12 }}
                onClick={onActionRestock}
              >
                Ajukan Pengadaan (Restock) ➔
              </button>
            )}
          </div>
          {!item.is_read && <button onClick={() => onRead(item.notification_id)}>Tandai Dibaca</button>}
        </div>
      ))}
    </div>
  );
}

function MessageList({ messages, onRead, directoryMap }) {
  return (
    <div className="notice-list">
      {messages.length === 0 && <div className="empty-state">Kotak masuk kosong.</div>}
      {messages.map(item => (
        <div className={`notice ${item.is_read ? "read" : ""}`} key={item.message_id}>
          <div>
            <strong>{item.subject || "Tanpa Subjek"}</strong>
            <p>{item.body}</p>
            <small>
              Dari: <strong>{directoryMap[item.sender_id]?.nama || item.sender_id}</strong>
              {item.receiver_id === null && " · (Siaran Seluruh Toko)"}
            </small>
          </div>
          {!item.is_read && <button onClick={() => onRead(item.message_id)}>Tandai Dibaca</button>}
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 6. PANEL SHIFTS & JADWAL KERJA
// ==========================================
function ShiftsPanel() {
  const { admin, role } = useSession();
  const isManagerOrAdmin = ["admin", "manager"].includes(role);
  const status = useOfficeStatus();
  const { directory, map: directoryMap } = usePersonnelDirectory();
  const [items, setItems] = useState([]);
  const [filterMode, setFilterMode] = useState(isManagerOrAdmin ? "all" : "mine");
  const [form, setForm] = useState({ personnel_id: "", tanggal: "", jam_mulai: "09:00", jam_selesai: "17:00", status_kehadiran: "terjadwal" });
  const [editing, setEditing] = useState(null);

  async function load() {
    try { setItems(await listShifts()); } catch (err) { status.showError(err); }
  }
  useEffect(() => { load(); }, []);

  const displayedItems = useMemo(() => {
    if (filterMode === "mine") {
      return items.filter(item => item.personnel_id === admin?.personnel_id);
    }
    return items;
  }, [items, filterMode, admin?.personnel_id]);

  async function save(event) {
    event.preventDefault();
    try {
      if (editing) {
        await updateShift(editing.shift_id, {
          status_kehadiran: form.status_kehadiran,
          jam_mulai: form.jam_mulai,
          jam_selesai: form.jam_selesai,
        });
      } else {
        await createShift({
          personnel_id: form.personnel_id || admin.personnel_id,
          tanggal: form.tanggal,
          jam_mulai: form.jam_mulai,
          jam_selesai: form.jam_selesai,
          created_by: admin.personnel_id,
        });
      }
      setEditing(null);
      setForm({ personnel_id: "", tanggal: "", jam_mulai: "09:00", jam_selesai: "17:00", status_kehadiran: "terjadwal" });
      status.setSuccess("Jadwal shift berhasil disimpan.");
      await load();
    } catch (err) { status.showError(err); }
  }

  async function remove(item) {
    if (!confirm("Hapus jadwal ini?")) return;
    try { await deleteShift(item.shift_id); status.setSuccess("Jadwal dihapus."); await load(); } catch (err) { status.showError(err); }
  }

  // Khusus staf: konfirmasi kehadiran mandiri tanpa ubah jam
  async function quickAttendance(shift_id, statusKehadiran) {
    try {
      await updateShift(shift_id, { status_kehadiran: statusKehadiran });
      status.setSuccess(`Kehadiran berhasil dicatat sebagai "${statusKehadiran}".`);
      await load();
    } catch (err) { status.showError(err); }
  }

  function exportPayrollCSV() {
    if (items.length === 0) return alert("Belum ada data jadwal untuk diekspor.");
    const headers = ["ID Shift", "Nama Personel", "Peran", "Tanggal", "Jam Mulai", "Jam Selesai", "Status Kehadiran"];
    const rows = items.map(item => {
      const p = directoryMap[item.personnel_id];
      return [
        item.shift_id,
        `"${p?.nama || item.personnel_id}"`,
        `"${p?.role || p?.personnel_type || ''}"`,
        item.tanggal,
        item.jam_mulai,
        item.jam_selesai,
        item.status_kehadiran,
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rekap_shift_toko_jam_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <StatusMessage error={status.error} success={status.success} />
      <Section
        title="Jadwal Kerja & Presensi Gerai"
        description={
          isManagerOrAdmin
            ? "Atur dan tetapkan penugasan shift gerai kasir dan gudang, serta ekspor rekap presensi untuk payroll."
            : "Lihat jadwal penugasan kerja Anda dan konfirmasi kehadiran harian pada shift yang ditugaskan."
        }
        action={
          isManagerOrAdmin && (
            <button type="button" className="ghost" onClick={exportPayrollCSV}>
              📥 Ekspor Rekap (CSV)
            </button>
          )
        }
      >
        {isManagerOrAdmin ? (
          <form onSubmit={save} className="compact-form">
            <h4 style={{ marginBottom: 12, color: "var(--brass)" }}>
              {editing ? "✏️ Edit Jadwal / Kehadiran Staf" : "➕ Tetapkan Jadwal Shift Baru"}
            </h4>
            <div className="form-grid">
              <div className="field">
                <label>Pilih Personel Staf</label>
                <select
                  value={form.personnel_id}
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, personnel_id: e.target.value })}
                  required={!editing}
                >
                  <option value="">-- Pilih Staf Gerai --</option>
                  {directory.filter(p => p.personnel_type === "staff").map(p => (
                    <option key={p.personnel_id} value={p.personnel_id}>
                      {p.nama} ({p.role ? p.role : p.personnel_type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field"><label>Tanggal Shift</label><input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required /></div>
              <div className="field"><label>Jam Mulai</label><input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} required /></div>
              <div className="field"><label>Jam Selesai</label><input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} required /></div>
              {editing && (
                <div className="field">
                  <label>Status Kehadiran</label>
                  <select value={form.status_kehadiran} onChange={e => setForm({ ...form, status_kehadiran: e.target.value })}>
                    <option value="terjadwal">Terjadwal</option>
                    <option value="hadir">Hadir (Tepat Waktu)</option>
                    <option value="izin">Izin / Sakit</option>
                    <option value="alpha">Alpha (Tanpa Keterangan)</option>
                  </select>
                </div>
              )}
            </div>
            <div className="toolbar">
              <button className="primary" type="submit">{editing ? "Simpan Perubahan" : "Tetapkan Jadwal"}</button>
              {editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setForm({ personnel_id: "", tanggal: "", jam_mulai: "09:00", jam_selesai: "17:00", status_kehadiran: "terjadwal" }); }}>Batal</button>}
            </div>
          </form>
        ) : (
          <div style={{ background: "rgba(184, 134, 63, 0.08)", border: "1px solid var(--line)", borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
            <strong>ℹ️ Informasi Shift Staf</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--slate)" }}>
              Jadwal shift kerja Anda diatur dan ditetapkan oleh Manajer toko. Anda dapat mengonfirmasi kehadiran (Hadir/Izin) pada shift yang ditugaskan kepada Anda.
            </p>
          </div>
        )}

        {/* Filter View Toggle */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Tampilkan:</label>
          <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
            <option value="mine">Shift Saya Saja</option>
            <option value="all">Semua Shift Gerai Toko</option>
          </select>
          <small style={{ color: "var(--slate)" }}>({displayedItems.length} jadwal ditemukan)</small>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama Personel</th><th>Tanggal</th><th>Jam Kerja</th><th>Kehadiran</th><th>Aksi</th></tr></thead>
            <tbody>
              {displayedItems.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--slate)", padding: "18px" }}>Tidak ada jadwal shift yang sesuai dengan filter.</td></tr>
              )}
              {displayedItems.map(item => {
                const isMine = item.personnel_id === admin?.personnel_id;
                return (
                  <tr key={item.shift_id} style={{ background: isMine && !isManagerOrAdmin ? "rgba(184, 134, 63, 0.05)" : undefined }}>
                    <td>
                      <strong>{directoryMap[item.personnel_id]?.nama || item.personnel_id}</strong>
                      {isMine && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--brass)", fontWeight: "bold" }}>(Saya)</span>}
                      <small style={{ display: "block", color: "var(--slate)" }}>
                        {directoryMap[item.personnel_id]?.role || directoryMap[item.personnel_id]?.personnel_type || ""}
                      </small>
                    </td>
                    <td>{item.tanggal}</td>
                    <td>{item.jam_mulai} - {item.jam_selesai}</td>
                    <td><span className={`badge ${item.status_kehadiran}`}>{item.status_kehadiran.toUpperCase()}</span></td>
                    <td>
                      {isManagerOrAdmin ? (
                        <div className="row-actions">
                          <button onClick={() => {
                            setEditing(item);
                            setForm({
                              personnel_id: item.personnel_id,
                              tanggal: item.tanggal,
                              jam_mulai: item.jam_mulai,
                              jam_selesai: item.jam_selesai,
                              status_kehadiran: item.status_kehadiran,
                            });
                          }}>
                            Edit Jadwal
                          </button>
                          <button className="danger" onClick={() => remove(item)}>Hapus</button>
                        </div>
                      ) : isMine ? (
                        item.status_kehadiran === "terjadwal" ? (
                          <div className="row-actions">
                            <button className="primary" onClick={() => quickAttendance(item.shift_id, "hadir")}>
                              Hadir (Check-in)
                            </button>
                            <button className="ghost" onClick={() => quickAttendance(item.shift_id, "izin")}>
                              Izin
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--slate)" }}>Tercatat ({item.status_kehadiran})</span>
                        )
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--slate)" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

// ==========================================
// 7. PANEL AUDIT LOGS
// ==========================================
function LogsPanel() {
  const status = useOfficeStatus();
  const { directory, map: directoryMap } = usePersonnelDirectory();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ personnel_id: "", table_name: "" });

  async function load(params = filters) {
    try {
      setItems(await listActivityLogs({
        personnel_id: params.personnel_id || undefined,
        table_name: params.table_name || undefined,
      }));
    } catch (err) { status.showError(err); }
  }
  useEffect(() => { load(); }, []);

  function formatDetail(detail) {
    if (!detail) return "-";
    if (typeof detail === "object") {
      return Object.entries(detail)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join(" | ");
    }
    return String(detail);
  }

  return (
    <>
      <StatusMessage error={status.error} />
      <Section title="Audit Trail Keamanan & Aktivitas" description="Pemantauan perubahan data transaksional dan operasional toko jam (Maks 200 log).">
        <form className="inline-form" onSubmit={e => { e.preventDefault(); load(); }}>
          <select value={filters.personnel_id} onChange={e => setFilters({ ...filters, personnel_id: e.target.value })}>
            <option value="">-- Semua Personel (Aktor) --</option>
            {directory.map(p => (
              <option key={p.personnel_id} value={p.personnel_id}>
                {p.nama} ({p.role ? p.role : p.personnel_type})
              </option>
            ))}
          </select>
          <select value={filters.table_name} onChange={e => setFilters({ ...filters, table_name: e.target.value })}>
            <option value="">-- Semua Tabel Target --</option>
            <option value="products">Produk Jam Tangan (products)</option>
            <option value="transactions">Transaksi Kasir (transactions)</option>
            <option value="documents">Dokumen (documents)</option>
            <option value="correspondence">Persuratan (correspondence)</option>
            <option value="workflow_requests">Approval (workflow_requests)</option>
            <option value="shifts">Jadwal Shift (shifts)</option>
          </select>
          <button className="primary" type="submit">Filter Log</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Aksi</th><th>Tabel</th><th>Record Terkait</th><th>Pelaksana (Aktor)</th><th>Detail Perubahan</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.log_id}>
                  <td><span className={`badge ${item.action}`}>{item.action.toUpperCase()}</span></td>
                  <td><code>{item.table_name}</code></td>
                  <td><small>{item.record_id || "-"}</small></td>
                  <td><strong>{directoryMap[item.personnel_id]?.nama || item.personnel_id}</strong></td>
                  <td><code style={{ fontSize: 11 }}>{formatDetail(item.detail)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

// ==========================================
// UTAMA: OFFICE PAGE
// ==========================================
export default function OfficePage() {
  const { tab = "communication" } = useParams();
  const navigate = useNavigate();
  const { role, admin: personnel } = useSession();

  const currentTab = tab in TAB_CONFIG ? tab : "communication";
  const config = TAB_CONFIG[currentTab];

  // Proteksi izin akses rute
  useEffect(() => {
    if (config && !config.canAccess({ role, personnel })) {
      navigate("/admin/office/communication", { replace: true });
    }
  }, [currentTab, config, role, personnel, navigate]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{config?.title || "Operasional Kantor"}</h1>
          <p>{config?.description || "Area kerja dan otomasi operasional toko jam tangan."}</p>
        </div>
      </div>

      {currentTab === "personnel" && <PersonnelPanel />}
      {currentTab === "documents" && <DocumentsPanel />}
      {currentTab === "correspondence" && <CorrespondencePanel />}
      {currentTab === "workflow" && <WorkflowPanel />}
      {currentTab === "communication" && <CommunicationPanel />}
      {currentTab === "notifications" && <CommunicationPanel notificationsOnly />}
      {currentTab === "shifts" && <ShiftsPanel />}
      {currentTab === "logs" && <LogsPanel />}
    </div>
  );
}
