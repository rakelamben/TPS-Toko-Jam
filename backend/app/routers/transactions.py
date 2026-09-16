"""
Endpoint transaksi. Menggantikan: input_transaksi, cetak_invoice, lihat_transaksi,
edit_transaksi, hapus_transaksi, lihat_total_transaksi dari main.py CLI.

Semua operasi tulis (buat/edit/batal) tetap lewat RPC di database (buat_transaksi,
edit_transaksi_items, batalkan_transaksi) supaya atomik — logika bisnisnya
sengaja TIDAK dipindah ke Python, cukup dipanggil dari sini.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from supabase import Client

from app.database import get_db
from app.schemas.transaction import TransaksiCreate, TransaksiEdit, RingkasanAdmin
from app.utils.auth import (
    get_optional_personnel,
    require_roles,
    require_tps_operator,
    require_tps_viewer,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("", status_code=201)
def buat_transaksi(
    payload: TransaksiCreate,
    db: Client = Depends(get_db),
    personnel: dict | None = Depends(get_optional_personnel),
):
    if payload.personnel_id:
        if personnel is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login personel TPS diperlukan")
        is_admin = personnel.get("personnel_type") == "admin"
        is_operational_staff = (
            personnel.get("personnel_type") == "staff"
            and personnel.get("role") == "staf_operasional"
        )
        if not (is_admin or is_operational_staff):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role tidak dapat membuat transaksi")
        if payload.personnel_id != personnel.get("sub"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Personel transaksi tidak sesuai token")
    try:
        res = db.rpc("buat_transaksi", {
            "p_customer_id": payload.customer_id,
            "p_personnel_id": payload.personnel_id,
            "p_items": [item.model_dump() for item in payload.items],
        }).execute()
        transaction_id = res.data[0]["out_transaction_id"]
        return get_invoice(transaction_id, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transaksi GAGAL: {e}")


@router.get("")
def lihat_transaksi(
    customer_id: Optional[str] = None,
    db: Client = Depends(get_db),
    personnel: dict | None = Depends(get_optional_personnel),
):
    """Semua transaksi (admin), atau hanya milik satu pembeli via ?customer_id=."""
    if personnel is None:
        if not customer_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login diperlukan")
    else:
        is_tps_viewer = personnel.get("personnel_type") in ("admin", "manager")
        is_operational_staff = (
            personnel.get("personnel_type") == "staff"
            and personnel.get("role") == "staf_operasional"
        )
        if not (is_tps_viewer or is_operational_staff):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role tidak dapat melihat transaksi")
    query = db.table("transactions").select("*, customers(nama, no_hp)") \
        .order("tanggal_transaksi", desc=True)
    if customer_id:
        query = query.eq("customer_id", customer_id)
    return query.execute().data


@router.get("/summary/admin", response_model=RingkasanAdmin)
def lihat_total_transaksi(
    db: Client = Depends(get_db),
    _: dict = Depends(require_tps_viewer),
):
    res = db.rpc("ringkasan_admin", {}).execute()
    data = res.data[0] if res.data else {}
    return {
        "total_transaksi": data.get("total_transaksi", 0),
        "total_omzet": data.get("total_omzet", 0),
        "jumlah_pembeli": data.get("jumlah_pembeli", 0),
    }


@router.get("/by-invoice/{no_invoice}")
def get_by_no_invoice(no_invoice: str, db: Client = Depends(get_db)):
    res = db.table("transactions").select("*").eq("no_invoice", no_invoice).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    return res.data[0]


@router.patch("/by-invoice/{no_invoice}")
def edit_transaksi(
    no_invoice: str,
    payload: TransaksiEdit,
    db: Client = Depends(get_db),
    _: dict = Depends(require_roles("admin")),
):
    """Item transaksi lama DIGANTI seluruhnya dengan daftar baru (sesuai logika CLI)."""
    trx = db.table("transactions").select("*").eq("no_invoice", no_invoice).execute().data
    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    trx = trx[0]
    if trx["status"] == "dibatalkan":
        raise HTTPException(status_code=409, detail="Transaksi sudah dibatalkan, tidak bisa diedit")

    try:
        res = db.rpc("edit_transaksi_items", {
            "p_transaction_id": trx["transaction_id"],
            "p_items": [item.model_dump() for item in payload.items],
        }).execute()
        return {"total_baru": res.data, "invoice": get_invoice(trx["transaction_id"], db)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal mengedit transaksi: {e}")


@router.post("/by-invoice/{no_invoice}/cancel")
def hapus_transaksi(
    no_invoice: str,
    db: Client = Depends(get_db),
    _: dict = Depends(require_roles("admin")),
):
    """Transaksi tidak dihapus permanen, hanya ditandai 'dibatalkan' + stok dikembalikan."""
    trx = db.table("transactions").select("*").eq("no_invoice", no_invoice).execute().data
    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")

    try:
        db.rpc("batalkan_transaksi", {"p_transaction_id": trx[0]["transaction_id"]}).execute()
        return {"message": "Transaksi berhasil dibatalkan, stok telah dikembalikan"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membatalkan transaksi: {e}")


@router.get("/{transaction_id}/invoice")
def get_invoice(transaction_id: str, db: Client = Depends(get_db)):
    trx = db.table("transactions").select("*, customers(nama, no_hp)") \
        .eq("transaction_id", transaction_id).single().execute().data
    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    items = db.table("transaction_items").select("*") \
        .eq("transaction_id", transaction_id).execute().data
    return {"transaksi": trx, "items": items}
