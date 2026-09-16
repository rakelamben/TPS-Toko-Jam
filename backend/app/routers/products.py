"""
Endpoint barang. Menggantikan: input_barang, lihat_barang, edit_barang,
hapus_barang, cari_barang_by_nama dari main.py CLI.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.utils.auth import require_inventory_operator

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
def lihat_barang(q: Optional[str] = None, db: Client = Depends(get_db)):
    """Lihat semua barang, atau cari dengan ?q=kata_kunci (setara cari_barang_by_nama)."""
    query = db.table("products").select("*").order("nama_barang")
    if q:
        query = query.ilike("nama_barang", f"%{q}%")
    res = query.execute()
    return res.data


@router.get("/{product_id}", response_model=ProductOut)
def detail_barang(product_id: str, db: Client = Depends(get_db)):
    res = db.table("products").select("*").eq("product_id", product_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    return res.data[0]


@router.post("", response_model=ProductOut, status_code=201)
def input_barang(
    payload: ProductCreate,
    db: Client = Depends(get_db),
    _: dict = Depends(require_inventory_operator),
):
    res = db.table("products").insert(payload.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Gagal menambahkan barang")
    return res.data[0]


@router.patch("/{product_id}", response_model=ProductOut)
def edit_barang(
    product_id: str,
    payload: ProductUpdate,
    db: Client = Depends(get_db),
    _: dict = Depends(require_inventory_operator),
):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diubah")

    res = db.table("products").update(update_data).eq("product_id", product_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    return res.data[0]


@router.delete("/{product_id}", status_code=204)
def hapus_barang(
    product_id: str,
    db: Client = Depends(get_db),
    _: dict = Depends(require_inventory_operator),
):
    try:
        db.table("products").delete().eq("product_id", product_id).execute()
    except Exception as e:
        # Kemungkinan gagal karena barang masih direferensikan di transaction_items (FK)
        raise HTTPException(
            status_code=409,
            detail=f"Gagal menghapus barang. Kemungkinan sudah pernah terjual "
                   f"dan tercatat di riwayat transaksi. Detail: {e}",
        )
