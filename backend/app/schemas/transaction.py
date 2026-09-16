from typing import Optional
from pydantic import BaseModel, Field


class KeranjangItem(BaseModel):
    product_id: str
    qty: int = Field(gt=0)


class TransaksiCreate(BaseModel):
    customer_id: str
    personnel_id: Optional[str] = None  # id dari tabel personnel (admin/staff kasir); None = transaksi mandiri oleh pembeli
    items: list[KeranjangItem]


class TransaksiEdit(BaseModel):
    items: list[KeranjangItem]


class RingkasanAdmin(BaseModel):
    total_transaksi: int
    total_omzet: float
    jumlah_pembeli: int
