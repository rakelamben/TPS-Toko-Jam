"""
Helper untuk membuat notifikasi dari router manapun.
Contoh pakai (di router documents.py setelah create_document):
    from app.utils.notify import create_notification
    create_notification(db, "dokumen_baru", "documents", doc["document_id"],
                         f"Dokumen baru: {doc['judul']}")
"""
from typing import Optional
from supabase import Client


def create_notification(
    db: Client,
    tipe: str,
    reference_table: Optional[str],
    reference_id: Optional[str],
    message: str,
    target_personnel_id: Optional[str] = None,  # None = broadcast ke semua
):
    db.table("notifications").insert({
        "tipe": tipe,
        "reference_table": reference_table,
        "reference_id": reference_id,
        "message": message,
        "target_personnel_id": target_personnel_id,
    }).execute()
