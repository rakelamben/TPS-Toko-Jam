"""
Read-only viewer untuk activity log. Pencatatan log dilakukan lewat helper
log_activity() di app/utils/activity_log.py, dipanggil dari router lain yang
ingin diaudit (belum dipasang otomatis di semua endpoint — lihat catatan).
"""
from typing import Optional
from fastapi import APIRouter, Depends
from supabase import Client

from app.database import get_db
from app.schemas.activity_log import ActivityLogOut
from app.utils.auth import require_roles

router = APIRouter(
    prefix="/activity-logs",
    tags=["activity-logs"],
    dependencies=[Depends(require_roles("admin", "manager"))],
)


@router.get("", response_model=list[ActivityLogOut])
def list_logs(
    personnel_id: Optional[str] = None,
    table_name: Optional[str] = None,
    db: Client = Depends(get_db),
):
    query = db.table("activity_logs").select("*").order("created_at", desc=True).limit(200)
    if personnel_id:
        query = query.eq("personnel_id", personnel_id)
    if table_name:
        query = query.eq("table_name", table_name)
    return query.execute().data
