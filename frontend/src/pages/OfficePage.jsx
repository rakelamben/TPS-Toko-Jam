import { useEffect, useState } from "react";
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
  getErrorMessage,
} from "../api/client";

const TABS = [
  ["personnel", "Personel", ({ role }) => role === "admin"],
  ["documents", "Dokumen", ({ role, personnel }) => role === "admin" || role === "manager" || personnel?.role === "staf_operasional"],
  ["correspondence", "Persuratan", ({ role, personnel }) => role === "admin" || role === "manager" || personnel?.role === "staf_operasional"],
  ["workflow", "Approval", ({ role, personnel }) => role === "admin" || role === "manager" || personnel?.role === "staf_operasional"],
  ["communication", "Pesan", ({ role, personnel }) => ["admin", "manager"].includes(role) || ["staf_operasional", "staf_gudang"].includes(personnel?.role)],
  ["notifications", "Notifikasi", ({ role, personnel }) => ["admin", "manager"].includes(role) || personnel?.role === "staf_gudang"],
  ["shifts", "Jadwal kerja", ({ role, personnel }) => ["admin", "manager"].includes(role) || personnel?.role === "staf_gudang"],
  ["logs", "Audit log", ({ role }) => ["admin", "manager"].includes(role)],
];

function useOfficeStatus() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function clearStatus() { setError(""); setSuccess(""); }
  function showError(errorValue) { setError(getErrorMessage(errorValue)); setSuccess(""); }
  return { error, success, clearStatus, showError, setSuccess };
}

function Section({ title, description, children }) {
  return (
    <section className="office-section">
      <div className="section-heading">
        <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      </div>
      {children}
    </section>
  );
}

const REQUEST_TYPES = [
  { value: "pengadaan_barang", label: "Pengadaan barang", table: "products", referenceLabel: "ID produk terkait" },
  { value: "perubahan_stok", label: "Perubahan stok", table: "products", referenceLabel: "ID produk terkait" },
  { value: "dokumen_baru", label: "Dokumen baru", table: "documents", referenceLabel: "ID dokumen terkait" },
  { value: "surat_masuk_keluar", label: "Surat masuk / keluar", table: "correspondence", referenceLabel: "ID surat terkait" },
  { value: "jadwal_personel", label: "Jadwal personel", table: "shifts", referenceLabel: "ID shift terkait" },
  { value: "lainnya", label: "Lainnya", table: "", referenceLabel: "ID referensi (opsional)" },
];

function PersonnelPanel() {
  const { admin } = useSession();
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

  return <>
    <StatusMessage error={status.error} success={status.success} />
    <div className="office-grid two-columns">
      <Section title="Staff" description="Kelola akun dan penempatan staff operasional.">
        <form onSubmit={saveStaff} className="compact-form">
          <div className="form-grid"><div className="field"><label>Nama</label><input value={staffForm.nama} onChange={e => setStaffForm({ ...staffForm, nama: e.target.value })} required /></div>
            <div className="field"><label>Username</label><input value={staffForm.username} disabled={!!editing} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} required={!editing} /></div>
            <div className="field"><label>{editing ? "Password baru (opsional)" : "Password"}</label><input type="password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} required={!editing} /></div>
            <div className="field"><label>Peran</label><select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}><option value="staf_operasional">Staf operasional</option><option value="staf_gudang">Staf gudang</option></select></div>
            <div className="field"><label>Manager</label><select value={staffForm.manager_id} onChange={e => setStaffForm({ ...staffForm, manager_id: e.target.value })}><option value="">Belum ditentukan</option>{managers.map(m => <option key={m.manager_id} value={m.manager_id}>{m.nama}</option>)}</select></div>
          </div>
          <div className="toolbar"><button className="primary" type="submit">{editing ? "Simpan perubahan" : "Tambah staff"}</button>{editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setStaffForm({ username: "", password: "", nama: "", role: "staf_operasional", manager_id: "" }); }}>Batal</button>}</div>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Manager</th><th /></tr></thead><tbody>{staff.map(person => <tr key={person.staff_id}><td>{person.nama}</td><td>{person.username}</td><td>{person.role}</td><td>{managers.find(m => m.manager_id === person.manager_id)?.nama || "-"}</td><td><div className="row-actions"><button onClick={() => editStaff(person)}>Edit</button><button className="danger" onClick={() => removeStaff(person)}>Hapus</button></div></td></tr>)}</tbody></table></div>
      </Section>
      <Section title="Manager" description="Manager dapat menerima dan memutuskan approval.">
        <form onSubmit={saveManager} className="compact-form"><div className="field"><label>Nama</label><input value={managerForm.nama} onChange={e => setManagerForm({ ...managerForm, nama: e.target.value })} required /></div><div className="field"><label>Username</label><input value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} required /></div><div className="field"><label>Password</label><input type="password" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} required /></div><button className="primary" type="submit">Tambah manager</button></form>
        <div className="table-wrap"><table><thead><tr><th>Nama</th><th>Username</th></tr></thead><tbody>{managers.map(person => <tr key={person.manager_id}><td>{person.nama}</td><td>{person.username}</td></tr>)}</tbody></table></div>
      </Section>
    </div>
  </>;
}

function DocumentsPanel() {
  const { admin } = useSession(); const status = useOfficeStatus(); const [items, setItems] = useState([]); const [form, setForm] = useState({ tipe_dokumen: "", judul: "", deskripsi: "", file_url: "", transaction_id: "" }); const [editing, setEditing] = useState(null);
  async function load() { try { setItems(await listDocuments()); } catch (err) { status.showError(err); } }
  useEffect(() => { load(); }, []);
  async function save(event) { event.preventDefault(); status.clearStatus(); try { if (editing) await updateDocument(editing.document_id, { judul: form.judul, deskripsi: form.deskripsi || null, file_url: form.file_url || null, status: form.status }); else await createDocument({ ...form, deskripsi: form.deskripsi || null, file_url: form.file_url || null, transaction_id: form.transaction_id || null, created_by: admin.personnel_id }); setForm({ tipe_dokumen: "", judul: "", deskripsi: "", file_url: "", transaction_id: "" }); setEditing(null); status.setSuccess("Dokumen tersimpan."); await load(); } catch (err) { status.showError(err); } }
  async function remove(item) { if (!confirm(`Hapus dokumen ${item.judul}?`)) return; try { await deleteDocument(item.document_id); status.setSuccess("Dokumen dihapus."); await load(); } catch (err) { status.showError(err); } }
  function startEdit(item) { setEditing(item); setForm({ tipe_dokumen: item.tipe_dokumen, judul: item.judul, deskripsi: item.deskripsi || "", file_url: item.file_url || "", transaction_id: item.transaction_id || "", status: item.status }); }
  return <><StatusMessage error={status.error} success={status.success} /><Section title="Dokumen" description="Catat memo, invoice, SOP, dan dokumen operasional lainnya."><form onSubmit={save} className="compact-form"><div className="form-grid"><div className="field"><label>Tipe dokumen</label><input value={form.tipe_dokumen} disabled={!!editing} onChange={e => setForm({ ...form, tipe_dokumen: e.target.value })} required /></div><div className="field"><label>Judul</label><input value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} required /></div><div className="field"><label>URL file</label><input type="url" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} /></div>{editing && <div className="field"><label>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="final">Final</option><option value="arsip">Arsip</option></select></div>}</div><div className="field"><label>Deskripsi</label><textarea rows="2" value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></div><div className="toolbar"><button className="primary" type="submit">{editing ? "Simpan perubahan" : "Buat dokumen"}</button>{editing && <button type="button" className="ghost" onClick={() => setEditing(null)}>Batal</button>}</div></form><div className="table-wrap"><table><thead><tr><th>Judul</th><th>Tipe</th><th>Status</th><th>Pembuat</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.document_id}><td>{item.file_url ? <a href={item.file_url} target="_blank" rel="noreferrer">{item.judul}</a> : item.judul}</td><td>{item.tipe_dokumen}</td><td><span className={`badge ${item.status}`}>{item.status}</span></td><td>{item.created_by === admin.personnel_id ? "Saya" : item.created_by}</td><td><div className="row-actions"><button onClick={() => startEdit(item)}>Edit</button><button className="danger" onClick={() => remove(item)}>Hapus</button></div></td></tr>)}</tbody></table></div></Section></>;
}

function CorrespondencePanel() {
  const { admin } = useSession(); const status = useOfficeStatus(); const [items, setItems] = useState([]); const [selected, setSelected] = useState(null); const [dispositions, setDispositions] = useState([]); const [form, setForm] = useState({ nomor_agenda: "", tipe: "masuk", perihal: "", asal_tujuan: "", tanggal_surat: "", tanggal_terima: "", file_url: "" }); const [disposition, setDisposition] = useState({ disposisi_ke: "", instruksi: "" });
  async function load() { try { setItems(await listCorrespondence()); } catch (err) { status.showError(err); } }
  useEffect(() => { load(); }, []);
  async function save(event) { event.preventDefault(); try { await createCorrespondence({ ...form, tanggal_surat: form.tanggal_surat || null, tanggal_terima: form.tanggal_terima || null, file_url: form.file_url || null, created_by: admin.personnel_id }); setForm({ nomor_agenda: "", tipe: "masuk", perihal: "", asal_tujuan: "", tanggal_surat: "", tanggal_terima: "", file_url: "" }); status.setSuccess("Surat tersimpan."); await load(); } catch (err) { status.showError(err); } }
  async function choose(item) { setSelected(item); try { setDispositions(await listDispositions(item.correspondence_id)); } catch (err) { status.showError(err); } }
  async function changeStatus(item, value) { try { await updateCorrespondence(item.correspondence_id, { status: value }); status.setSuccess("Status surat diperbarui."); await load(); setSelected({ ...item, status: value }); } catch (err) { status.showError(err); } }
  async function addDisposition(event) { event.preventDefault(); try { await createDisposition(selected.correspondence_id, disposition); setDisposition({ disposisi_ke: "", instruksi: "" }); setDispositions(await listDispositions(selected.correspondence_id)); status.setSuccess("Disposisi ditambahkan."); } catch (err) { status.showError(err); } }
  async function updateDisp(item, value) { try { await updateDisposition(item.disposition_id, { status: value }); setDispositions(await listDispositions(selected.correspondence_id)); } catch (err) { status.showError(err); } }
  return <><StatusMessage error={status.error} success={status.success} /><Section title="Persuratan" description="Kelola surat masuk, surat keluar, dan disposisi tindak lanjut."><form onSubmit={save} className="compact-form"><div className="form-grid"><div className="field"><label>Nomor agenda</label><input value={form.nomor_agenda} onChange={e => setForm({ ...form, nomor_agenda: e.target.value })} required /></div><div className="field"><label>Tipe</label><select value={form.tipe} onChange={e => setForm({ ...form, tipe: e.target.value })}><option value="masuk">Surat masuk</option><option value="keluar">Surat keluar</option></select></div><div className="field"><label>Asal / tujuan</label><input value={form.asal_tujuan} onChange={e => setForm({ ...form, asal_tujuan: e.target.value })} required /></div><div className="field"><label>Tanggal surat</label><input type="date" value={form.tanggal_surat} onChange={e => setForm({ ...form, tanggal_surat: e.target.value })} /></div><div className="field"><label>Tanggal terima</label><input type="date" value={form.tanggal_terima} onChange={e => setForm({ ...form, tanggal_terima: e.target.value })} /></div></div><div className="field"><label>Perihal</label><input value={form.perihal} onChange={e => setForm({ ...form, perihal: e.target.value })} required /></div><div className="field"><label>URL file</label><input type="url" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} /></div><button className="primary" type="submit">Catat surat</button></form><div className="table-wrap"><table><thead><tr><th>Agenda</th><th>Tipe</th><th>Perihal</th><th>Asal/tujuan</th><th>Status</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.correspondence_id}><td>{item.nomor_agenda}</td><td>{item.tipe}</td><td>{item.perihal}</td><td>{item.asal_tujuan}</td><td><select value={item.status} onChange={e => changeStatus(item, e.target.value)}><option value="diterima">Diterima</option><option value="diproses">Diproses</option><option value="selesai">Selesai</option></select></td><td><button onClick={() => choose(item)}>Disposisi</button></td></tr>)}</tbody></table></div></Section>{selected && <Section title={`Disposisi: ${selected.nomor_agenda}`} description={selected.perihal}><form onSubmit={addDisposition} className="inline-form"><input placeholder="Personel tujuan" value={disposition.disposisi_ke} onChange={e => setDisposition({ ...disposition, disposisi_ke: e.target.value })} required /><input placeholder="Instruksi" value={disposition.instruksi} onChange={e => setDisposition({ ...disposition, instruksi: e.target.value })} /><button className="primary" type="submit">Tambah</button></form><div className="table-wrap"><table><thead><tr><th>Tujuan</th><th>Instruksi</th><th>Status</th></tr></thead><tbody>{dispositions.map(item => <tr key={item.disposition_id}><td>{item.disposisi_ke}</td><td>{item.instruksi || "-"}</td><td><select value={item.status} onChange={e => updateDisp(item, e.target.value)}><option value="belum">Belum</option><option value="sedang_diproses">Sedang diproses</option><option value="selesai">Selesai</option></select></td></tr>)}</tbody></table></div></Section>}</>;
}

function WorkflowPanel() {
  const { admin, role } = useSession();
  const status = useOfficeStatus();
  const [items, setItems] = useState([]);
  const [approval, setApproval] = useState({});
  const [form, setForm] = useState({
    tipe_request: REQUEST_TYPES[0].value,
    reference_table: REQUEST_TYPES[0].table,
    reference_id: "",
    deskripsi: "",
  });
  const selectedType = REQUEST_TYPES.find((item) => item.value === form.tipe_request) || REQUEST_TYPES[0];

  async function load() {
    try { setItems(await listWorkflowRequests()); } catch (err) { status.showError(err); }
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
      status.setSuccess("Request approval dibuat.");
      await load();
    } catch (err) { status.showError(err); }
  }

  async function review(item) {
    try { setApproval({ ...approval, [item.request_id]: await getWorkflowApproval(item.request_id) }); }
    catch (err) { status.showError(err); }
  }

  async function decide(item, decision) {
    try {
      await decideWorkflow(item.request_id, { approver_id: admin.personnel_id, status: decision, catatan: approval[item.request_id]?.catatan || null });
      status.setSuccess("Approval diputuskan.");
      await load();
      await review(item);
    } catch (err) { status.showError(err); }
  }

  return (
    <>
      <StatusMessage error={status.error} success={status.success} />
      <Section title="Workflow approval" description="Ajukan kebutuhan operasional dan pantau keputusan manager.">
        <form onSubmit={create} className="compact-form">
          <div className="form-grid">
            <div className="field">
              <label>Tipe request</label>
              <select value={form.tipe_request} onChange={(event) => changeType(event.target.value)}>
                {REQUEST_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tabel referensi</label>
              <input value={selectedType.table || "Tidak ada referensi tabel"} disabled />
            </div>
            <div className="field">
              <label>{selectedType.referenceLabel}</label>
              <input value={form.reference_id} onChange={(event) => setForm({ ...form, reference_id: event.target.value })} placeholder={selectedType.table ? "Tempel ID dari data terkait" : "Boleh dikosongkan"} />
            </div>
          </div>
          <div className="field">
            <label>Alasan / deskripsi</label>
            <textarea rows="3" value={form.deskripsi} onChange={(event) => setForm({ ...form, deskripsi: event.target.value })} required />
          </div>
          <button className="primary" type="submit">Ajukan request</button>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Tipe</th><th>Deskripsi</th><th>Pemohon</th><th>Status</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.request_id}><td>{REQUEST_TYPES.find((type) => type.value === item.tipe_request)?.label || item.tipe_request}</td><td>{item.deskripsi || "-"}</td><td>{item.requested_by}</td><td><span className={`badge ${item.current_status}`}>{item.current_status}</span></td><td>{item.current_status === "pending" && ["admin", "manager"].includes(role) ? <div className="row-actions"><button onClick={() => decide(item, "approved")}>Setujui</button><button className="danger" onClick={() => decide(item, "rejected")}>Tolak</button></div> : <button onClick={() => review(item)}>Detail</button>}</td></tr>)}</tbody></table></div>
        {Object.entries(approval).map(([id, item]) => <div className="detail-note" key={id}>Approval {id}: {item.status}{item.catatan ? ` - ${item.catatan}` : ""}</div>)}
      </Section>
    </>
  );
}

function WorkflowPanelLegacy() {
  const { admin, role } = useSession(); const status = useOfficeStatus(); const [items, setItems] = useState([]); const [form, setForm] = useState({ tipe_request: "", reference_table: "", reference_id: "", deskripsi: "" }); const [approval, setApproval] = useState({});
  async function load() { try { setItems(await listWorkflowRequests()); } catch (err) { status.showError(err); } }
  useEffect(() => { load(); }, []);
  async function create(event) { event.preventDefault(); try { await createWorkflowRequest({ ...form, reference_table: form.reference_table || null, reference_id: form.reference_id || null, deskripsi: form.deskripsi || null, requested_by: admin.personnel_id }); setForm({ tipe_request: "", reference_table: "", reference_id: "", deskripsi: "" }); status.setSuccess("Request approval dibuat."); await load(); } catch (err) { status.showError(err); } }
  async function review(item) { try { setApproval({ ...approval, [item.request_id]: await getWorkflowApproval(item.request_id) }); } catch (err) { status.showError(err); } }
  async function decide(item, decision) { try { await decideWorkflow(item.request_id, { approver_id: admin.personnel_id, status: decision, catatan: approval[item.request_id]?.catatan || null }); status.setSuccess("Approval diputuskan."); await load(); await review(item); } catch (err) { status.showError(err); } }
  return <><StatusMessage error={status.error} success={status.success} /><Section title="Workflow approval" description="Ajukan dan putuskan permintaan operasional satu tingkat."><form onSubmit={create} className="compact-form"><div className="form-grid"><div className="field"><label>Tipe request</label><input value={form.tipe_request} onChange={e => setForm({ ...form, tipe_request: e.target.value })} required /></div><div className="field"><label>Tabel referensi</label><input value={form.reference_table} onChange={e => setForm({ ...form, reference_table: e.target.value })} /></div><div className="field"><label>ID referensi</label><input value={form.reference_id} onChange={e => setForm({ ...form, reference_id: e.target.value })} /></div></div><div className="field"><label>Deskripsi</label><textarea rows="2" value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></div><button className="primary" type="submit">Ajukan request</button></form><div className="table-wrap"><table><thead><tr><th>Tipe</th><th>Deskripsi</th><th>Pemohon</th><th>Status</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.request_id}><td>{item.tipe_request}</td><td>{item.deskripsi || "-"}</td><td>{item.requested_by}</td><td><span className={`badge ${item.current_status}`}>{item.current_status}</span></td><td>{item.current_status === "pending" && ["admin", "manager"].includes(role) ? <div className="row-actions"><button onClick={() => decide(item, "approved")}>Setujui</button><button className="danger" onClick={() => decide(item, "rejected")}>Tolak</button></div> : <button onClick={() => review(item)}>Detail</button>}</td></tr>)}</tbody></table></div>{Object.entries(approval).map(([id, item]) => <div className="detail-note" key={id}>Approval {id}: {item.status}{item.catatan ? ` - ${item.catatan}` : ""}</div>)}</Section></>;
}

function CommunicationPanel({ notificationsOnly = false }) {
  const { admin, role } = useSession(); const status = useOfficeStatus(); const [messages, setMessages] = useState([]); const [notifications, setNotifications] = useState([]); const [recipients, setRecipients] = useState([]); const [form, setForm] = useState({ receiver_id: "", subject: "", body: "" });
  const canSeeNotifications = role !== "staff" || admin?.role === "staf_gudang";
  async function load() { try { setMessages(await getInbox(admin.personnel_id)); if (!notificationsOnly) setRecipients(await listPersonnelDirectory()); if (canSeeNotifications) setNotifications(await listNotifications(admin.personnel_id)); } catch (err) { status.showError(err); } }
  useEffect(() => { load(); }, [admin.personnel_id]);
  async function send(event) { event.preventDefault(); try { await sendMessage({ ...form, sender_id: admin.personnel_id, receiver_id: form.receiver_id || null, subject: form.subject || null }); setForm({ receiver_id: "", subject: "", body: "" }); status.setSuccess("Pesan dikirim."); await load(); } catch (err) { status.showError(err); } }
  async function readMessage(id) { try { await markMessageRead(id); await load(); } catch (err) { status.showError(err); } }
  async function readNotification(id) { try { await markNotificationRead(id); await load(); } catch (err) { status.showError(err); } }
  return <><StatusMessage error={status.error} success={status.success} />{!notificationsOnly && <div className="office-grid two-columns"><Section title="Kirim pesan" description="Kirim pesan langsung atau broadcast ke semua personel."><form onSubmit={send} className="compact-form"><div className="field"><label>Penerima</label><select value={form.receiver_id} onChange={e => setForm({ ...form, receiver_id: e.target.value })}><option value="">Semua personel (broadcast)</option>{recipients.filter(person => person.personnel_id !== admin.personnel_id).map(person => <option key={person.personnel_id} value={person.personnel_id}>{person.nama} · {person.personnel_type}{person.role ? ` · ${person.role}` : ""}</option>)}</select></div><div className="field"><label>Subjek</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div><div className="field"><label>Isi pesan</label><textarea rows="4" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required /></div><button className="primary" type="submit">Kirim pesan</button></form></Section>{canSeeNotifications && <Section title="Notifikasi" description="Pemberitahuan sistem untuk akun ini."><NotificationList notifications={notifications} onRead={readNotification} /></Section>}</div>}{notificationsOnly && canSeeNotifications ? <Section title="Notifikasi" description="Pemberitahuan sistem untuk akun ini."><NotificationList notifications={notifications} onRead={readNotification} /></Section> : !notificationsOnly && <Section title="Kotak masuk" description="Pesan langsung dan broadcast yang diterima akun ini."><MessageList messages={messages} onRead={readMessage} /></Section>}</>;
}

function NotificationList({ notifications, onRead }) {
  return <div className="notice-list">{notifications.length === 0 && <div className="empty-state">Belum ada notifikasi.</div>}{notifications.map(item => <div className={`notice ${item.is_read ? "read" : ""}`} key={item.notification_id}><div><strong>{item.tipe}</strong><p>{item.message}</p></div>{!item.is_read && <button onClick={() => onRead(item.notification_id)}>Tandai dibaca</button>}</div>)}</div>;
}

function MessageList({ messages, onRead }) {
  return <div className="notice-list">{messages.length === 0 && <div className="empty-state">Kotak masuk kosong.</div>}{messages.map(item => <div className={`notice ${item.is_read ? "read" : ""}`} key={item.message_id}><div><strong>{item.subject || "Tanpa subjek"}</strong><p>{item.body}</p><small>Dari: {item.sender_id}</small></div>{!item.is_read && <button onClick={() => onRead(item.message_id)}>Tandai dibaca</button>}</div>)}</div>;
}

function ShiftsPanel() {
  const { admin } = useSession(); const status = useOfficeStatus(); const [items, setItems] = useState([]); const [form, setForm] = useState({ personnel_id: "", tanggal: "", jam_mulai: "09:00", jam_selesai: "17:00", status_kehadiran: "terjadwal" }); const [editing, setEditing] = useState(null);
  async function load() { try { setItems(await listShifts()); } catch (err) { status.showError(err); } }
  useEffect(() => { load(); }, []);
  async function save(event) { event.preventDefault(); try { if (editing) await updateShift(editing.shift_id, { status_kehadiran: form.status_kehadiran, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai }); else await createShift({ personnel_id: form.personnel_id || admin.personnel_id, tanggal: form.tanggal, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai, created_by: admin.personnel_id }); setEditing(null); setForm({ personnel_id: "", tanggal: "", jam_mulai: "09:00", jam_selesai: "17:00", status_kehadiran: "terjadwal" }); status.setSuccess("Jadwal tersimpan."); await load(); } catch (err) { status.showError(err); } }
  async function remove(item) { if (!confirm("Hapus jadwal ini?")) return; try { await deleteShift(item.shift_id); status.setSuccess("Jadwal dihapus."); await load(); } catch (err) { status.showError(err); } }
  return <><StatusMessage error={status.error} success={status.success} /><Section title="Jadwal kerja" description="Atur shift personel dan kehadiran harian."><form onSubmit={save} className="compact-form"><div className="form-grid"><div className="field"><label>ID personel</label><input value={form.personnel_id} disabled={!!editing} onChange={e => setForm({ ...form, personnel_id: e.target.value })} placeholder={admin.personnel_id} /></div><div className="field"><label>Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required /></div><div className="field"><label>Mulai</label><input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} required /></div><div className="field"><label>Selesai</label><input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} required /></div>{editing && <div className="field"><label>Kehadiran</label><select value={form.status_kehadiran} onChange={e => setForm({ ...form, status_kehadiran: e.target.value })}><option value="terjadwal">Terjadwal</option><option value="hadir">Hadir</option><option value="izin">Izin</option><option value="alpha">Alpha</option></select></div>}</div><div className="toolbar"><button className="primary" type="submit">{editing ? "Simpan perubahan" : "Tambah jadwal"}</button>{editing && <button type="button" className="ghost" onClick={() => setEditing(null)}>Batal</button>}</div></form><div className="table-wrap"><table><thead><tr><th>Personel</th><th>Tanggal</th><th>Jam</th><th>Kehadiran</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.shift_id}><td>{item.personnel_id}</td><td>{item.tanggal}</td><td>{item.jam_mulai} - {item.jam_selesai}</td><td><span className={`badge ${item.status_kehadiran}`}>{item.status_kehadiran}</span></td><td><div className="row-actions"><button onClick={() => { setEditing(item); setForm({ personnel_id: item.personnel_id, tanggal: item.tanggal, jam_mulai: item.jam_mulai, jam_selesai: item.jam_selesai, status_kehadiran: item.status_kehadiran }); }}>Edit</button><button className="danger" onClick={() => remove(item)}>Hapus</button></div></td></tr>)}</tbody></table></div></Section></>;
}

function LogsPanel() {
  const status = useOfficeStatus(); const [items, setItems] = useState([]); const [filters, setFilters] = useState({ personnel_id: "", table_name: "" });
  async function load(params = filters) { try { setItems(await listActivityLogs({ personnel_id: params.personnel_id || undefined, table_name: params.table_name || undefined })); } catch (err) { status.showError(err); } }
  useEffect(() => { load(); }, []);
  return <><StatusMessage error={status.error} /><Section title="Audit log" description="Riwayat aktivitas yang sudah dicatat oleh backend. Maksimal 200 log terbaru."><form className="inline-form" onSubmit={e => { e.preventDefault(); load(); }}><input placeholder="ID personel" value={filters.personnel_id} onChange={e => setFilters({ ...filters, personnel_id: e.target.value })} /><input placeholder="Nama tabel" value={filters.table_name} onChange={e => setFilters({ ...filters, table_name: e.target.value })} /><button className="primary" type="submit">Filter</button></form><div className="table-wrap"><table><thead><tr><th>Aksi</th><th>Tabel</th><th>Record</th><th>Personel</th><th>Detail</th></tr></thead><tbody>{items.map(item => <tr key={item.log_id}><td><span className={`badge ${item.action}`}>{item.action}</span></td><td>{item.table_name}</td><td>{item.record_id || "-"}</td><td>{item.personnel_id}</td><td><code>{JSON.stringify(item.detail || {})}</code></td></tr>)}</tbody></table></div></Section></>;
}

export default function OfficePage() {
  const { role } = useSession();
  const personnel = useSession().admin;
  const visibleTabs = TABS.filter(([, , canAccess]) => canAccess({ role, personnel }));
  const [tab, setTab] = useState(visibleTabs[0][0]);
  return <div><div className="page-header"><div><h1>Operasional kantor</h1><p>Kelola area kerja sesuai tanggung jawab personel.</p></div></div><div className="office-tabs">{visibleTabs.map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</div>{tab === "personnel" && <PersonnelPanel />}{tab === "documents" && <DocumentsPanel />}{tab === "correspondence" && <CorrespondencePanel />}{tab === "workflow" && <WorkflowPanel />}{tab === "communication" && <CommunicationPanel />}{tab === "notifications" && <CommunicationPanel notificationsOnly />}{tab === "shifts" && <ShiftsPanel />}{tab === "logs" && <LogsPanel />}</div>;
}
