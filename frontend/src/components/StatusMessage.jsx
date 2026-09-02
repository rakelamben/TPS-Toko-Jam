// Kotak pesan sukses/error yang dipakai berulang di banyak halaman.
export default function StatusMessage({ error, success }) {
  if (!error && !success) return null;
  return (
    <div className={`alert ${error ? "error" : "success"}`}>
      {error || success}
    </div>
  );
}
