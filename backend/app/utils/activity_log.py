"""
Helper untuk mencatat activity log dari router manapun. Contoh pakai (mis. di
routers/documents.py setelah create_document berhasil):

    from app.utils.activity_log import log_activity
    log_activity(db, payload.created_by, "create", "documents", doc["document_id"], doc)
"""
from typing import Optional, Any
from supabase import Client


def log_activity(
    db: Client,
    personnel_id: str,
    action: str,
    table_name: str,
    record_id: Optional[str] = None,
    detail: Optional[Any] = None,
):
    db.table("activity_logs").insert({
        "personnel_id": personnel_id,
        "action": action,
        "table_name": table_name,
        "record_id": record_id,
        "detail": detail,
    }).execute()
