"""
Endpoint pembeli. Menggantikan: cari_pembeli_by_no_hp, daftar_atau_login_pembeli.
"""
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.customer import CustomerIdentify, CustomerOut

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/identify", response_model=CustomerOut)
def daftar_atau_login_pembeli(payload: CustomerIdentify, db: Client = Depends(get_db)):
    """
    no_hp unik: kalau sudah terdaftar -> dianggap login (data lama dikembalikan).
    Kalau belum -> daftar baru (butuh field `nama` di body).
    """
    existing = db.table("customers").select("*").eq("no_hp", payload.no_hp).execute()
    if existing.data:
        return existing.data[0]

    if not payload.nama:
        raise HTTPException(
            status_code=400,
            detail="Nomor HP belum terdaftar. Sertakan field 'nama' untuk mendaftar.",
        )

    try:
        res = db.table("customers").insert(
            {"nama": payload.nama, "no_hp": payload.no_hp}
        ).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=409, detail=f"Gagal mendaftar (no HP mungkin sudah dipakai): {e}"
        )


@router.get("/{no_hp}", response_model=CustomerOut)
def cari_pembeli_by_no_hp(no_hp: str, db: Client = Depends(get_db)):
    res = db.table("customers").select("*").eq("no_hp", no_hp).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Pembeli tidak ditemukan")
    return res.data[0]
