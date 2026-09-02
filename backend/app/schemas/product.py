from typing import Optional, Literal
from pydantic import BaseModel, Field

KategoriBarang = Literal["Jam Tangan", "Jam Dinding", "Jam Meja", "Jam Alarm", "Aksesoris"]


class ProductCreate(BaseModel):
    nama_barang: str
    kategori: KategoriBarang
    harga: float = Field(gt=0)
    stok: int = Field(ge=0)
    deskripsi: Optional[str] = None


class ProductUpdate(BaseModel):
    # Semua field opsional -> hanya field yang dikirim yang diupdate
    nama_barang: Optional[str] = None
    kategori: Optional[KategoriBarang] = None
    harga: Optional[float] = Field(default=None, gt=0)
    stok: Optional[int] = Field(default=None, ge=0)
    deskripsi: Optional[str] = None


class ProductOut(BaseModel):
    product_id: str
    nama_barang: str
    kategori: str
    harga: float
    stok: int
    deskripsi: Optional[str] = None
