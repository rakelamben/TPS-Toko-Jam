from typing import Optional
from pydantic import BaseModel, Field


class KeranjangItem(BaseModel):
    product_id: str
    qty: int = Field(gt=0)


class TransaksiCreate(BaseModel):
    customer_id: str
    admin_id: Optional[str] = None  # None = pembeli transaksi mandiri
    items: list[KeranjangItem]


class TransaksiEdit(BaseModel):
    items: list[KeranjangItem]


class RingkasanAdmin(BaseModel):
    total_transaksi: int
    total_omzet: float
    jumlah_pembeli: int
