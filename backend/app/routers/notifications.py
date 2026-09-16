"""
Notifikasi biasanya dibuat otomatis oleh sistem (stok rendah, transaksi baru,
dsb) lewat helper create_notification() di app/utils/notify.py — dipanggil dari
router lain, bukan langsung dari client. Router ini hanya untuk membaca &
menandai sudah dibaca.
"""
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.notification import NotificationOut
from app.utils.auth import require_office_area

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    dependencies=[Depends(require_office_area("notifications"))],
)


@router.get("/{personnel_id}", response_model=list[NotificationOut])
def list_notifications(
    personnel_id: str,
    db: Client = Depends(get_db),
    personnel: dict = Depends(require_office_area("notifications")),
):
    """Notifikasi langsung ke personnel_id ini, ditambah broadcast (target kosong)."""
    if personnel_id != personnel["sub"] and personnel.get("personnel_type") not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Tidak dapat membaca notifikasi personel lain")
    direct = db.table("notifications").select("*").eq("target_personnel_id", personnel_id).execute().data
    broadcast = db.table("notifications").select("*").is_("target_personnel_id", "null").execute().data
    combined = direct + broadcast
    combined.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    return combined


@router.post("/{notification_id}/read")
def mark_read(notification_id: str, db: Client = Depends(get_db)):
    res = db.table("notifications").update({"is_read": True}).eq("notification_id", notification_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    return {"message": "Ditandai sudah dibaca"}
