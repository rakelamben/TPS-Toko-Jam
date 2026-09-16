from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.correspondence import (
    CorrespondenceCreate, CorrespondenceUpdate, CorrespondenceOut,
    DispositionCreate, DispositionUpdate, DispositionOut,
)
from app.utils.auth import require_office_area

router = APIRouter(
    prefix="/correspondence",
    tags=["correspondence"],
    dependencies=[Depends(require_office_area("correspondence"))],
)


@router.get("", response_model=list[CorrespondenceOut])
def list_correspondence(
    tipe: Optional[str] = None,
    status: Optional[str] = None,
    db: Client = Depends(get_db),
):
    query = db.table("correspondence").select("*").order("created_at", desc=True)
    if tipe:
        query = query.eq("tipe", tipe)
    if status:
        query = query.eq("status", status)
    return query.execute().data


@router.post("", response_model=CorrespondenceOut, status_code=201)
def create_correspondence(
    payload: CorrespondenceCreate,
    db: Client = Depends(get_db),
    personnel: dict = Depends(require_office_area("correspondence")),
):
    if payload.created_by != personnel["sub"]:
        raise HTTPException(status_code=403, detail="Pembuat surat harus sesuai token")
    data = payload.model_dump()
    for k in ("tanggal_surat", "tanggal_terima"):
        if data.get(k) is not None:
            data[k] = str(data[k])
    try:
        res = db.table("correspondence").insert(data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=409,
            detail=f"Gagal menyimpan surat (nomor agenda mungkin sudah dipakai): {e}",
        )


@router.patch("/{correspondence_id}", response_model=CorrespondenceOut)
def update_correspondence(correspondence_id: str, payload: CorrespondenceUpdate, db: Client = Depends(get_db)):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diubah")
    res = db.table("correspondence").update(update_data).eq("correspondence_id", correspondence_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Surat tidak ditemukan")
    return res.data[0]


@router.get("/{correspondence_id}/dispositions", response_model=list[DispositionOut])
def list_dispositions(correspondence_id: str, db: Client = Depends(get_db)):
    return db.table("correspondence_dispositions").select("*") \
        .eq("correspondence_id", correspondence_id).execute().data


@router.post("/{correspondence_id}/dispositions", response_model=DispositionOut, status_code=201)
def create_disposition(correspondence_id: str, payload: DispositionCreate, db: Client = Depends(get_db)):
    data = payload.model_dump()
    data["correspondence_id"] = correspondence_id
    res = db.table("correspondence_dispositions").insert(data).execute()
    return res.data[0]


@router.patch("/dispositions/{disposition_id}", response_model=DispositionOut)
def update_disposition(disposition_id: str, payload: DispositionUpdate, db: Client = Depends(get_db)):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diubah")
    res = db.table("correspondence_dispositions").update(update_data).eq("disposition_id", disposition_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Disposisi tidak ditemukan")
    return res.data[0]
