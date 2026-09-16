from typing import Optional
from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.shift import ShiftCreate, ShiftUpdate, ShiftOut
from app.utils.auth import require_office_area

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
    personnel: dict = Depends(require_office_area("shifts")),
):
    if payload.created_by != personnel["sub"]:
        raise HTTPException(status_code=403, detail="Pembuat jadwal harus sesuai token")
    data = payload.model_dump()
    data["tanggal"] = str(data["tanggal"])
    data["jam_mulai"] = str(data["jam_mulai"])
    data["jam_selesai"] = str(data["jam_selesai"])
    res = db.table("shifts").insert(data).execute()
    return res.data[0]


@router.patch("/{shift_id}", response_model=ShiftOut)
def update_shift(shift_id: str, payload: ShiftUpdate, db: Client = Depends(get_db)):
    update_data = payload.model_dump(exclude_unset=True)
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
def delete_shift(shift_id: str, db: Client = Depends(get_db)):
    db.table("shifts").delete().eq("shift_id", shift_id).execute()
