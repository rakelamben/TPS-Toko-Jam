export function formatRupiah(n) {
  const num = Number(n) || 0;
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

export function formatTanggal(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
