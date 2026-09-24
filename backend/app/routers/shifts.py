from typing import Optional
from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.shift import ShiftCreate, ShiftUpdate, ShiftOut
from app.utils.auth import require_office_area, require_roles, get_current_personnel

router = APIRouter(
    prefix="/shifts",
    tags=["shifts"],
    dependencies=[Depends(require_office_area("shifts"))],
)


@router.get("", response_model=list[ShiftOut])
def list_shifts(
    personnel_id: Optional[str] = None,
    tanggal: Optional[date] = None,
    db: Client = Depends(get_db),
):
    query = db.table("shifts").select("*").order("tanggal")
    if personnel_id:
        query = query.eq("personnel_id", personnel_id)
    if tanggal:
        query = query.eq("tanggal", str(tanggal))
    return query.execute().data


@router.post("", response_model=ShiftOut, status_code=201)
def create_shift(
    payload: ShiftCreate,
    db: Client = Depends(get_db),
    personnel: dict = Depends(require_roles("admin", "manager")),
):
    if payload.created_by != personnel["sub"]:
        raise HTTPException(status_code=403, detail="Pembuat jadwal harus sesuai token")
    assigned_staff = db.table("staff").select("personnel_id").eq("personnel_id", payload.personnel_id).execute().data
    if not assigned_staff:
        raise HTTPException(status_code=400, detail="Shift hanya dapat ditetapkan kepada staf")
    data = payload.model_dump()
    data["tanggal"] = str(data["tanggal"])
    data["jam_mulai"] = str(data["jam_mulai"])
    data["jam_selesai"] = str(data["jam_selesai"])
    res = db.table("shifts").insert(data).execute()
    return res.data[0]


@router.patch("/{shift_id}", response_model=ShiftOut)
def update_shift(
    shift_id: str,
    payload: ShiftUpdate,
    db: Client = Depends(get_db),
    personnel: dict = Depends(get_current_personnel),
):
    existing = db.table("shifts").select("*").eq("shift_id", shift_id).execute().data
    if not existing:
        raise HTTPException(status_code=404, detail="Shift tidak ditemukan")
    shift = existing[0]

    is_admin_or_manager = personnel.get("personnel_type") in ("admin", "manager")
    update_data = payload.model_dump(exclude_unset=True)

    if not is_admin_or_manager:
        if shift.get("personnel_id") != personnel.get("sub"):
            raise HTTPException(
                status_code=403,
                detail="Staf hanya dapat mengonfirmasi kehadiran pada jadwal miliknya sendiri",
            )
        if "jam_mulai" in update_data or "jam_selesai" in update_data:
            raise HTTPException(
                status_code=403,
                detail="Staf tidak berwenang mengubah jam kerja shift",
            )
        if update_data.get("status_kehadiran") not in ("hadir", "izin"):
            raise HTTPException(
                status_code=403,
                detail="Staf hanya dapat mengonfirmasi hadir atau melaporkan izin",
            )
        if shift.get("status_kehadiran") != "terjadwal":
            raise HTTPException(
                status_code=403,
                detail="Kehadiran pada shift ini sudah tercatat",
            )

    for k in ("jam_mulai", "jam_selesai"):
        if update_data.get(k) is not None:
            update_data[k] = str(update_data[k])
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diubah")

    res = db.table("shifts").update(update_data).eq("shift_id", shift_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Shift tidak ditemukan")
    return res.data[0]


@router.delete("/{shift_id}", status_code=204)
def delete_shift(
    shift_id: str,
    db: Client = Depends(get_db),
    _: dict = Depends(require_roles("admin", "manager")),
):
    db.table("shifts").delete().eq("shift_id", shift_id).execute()
