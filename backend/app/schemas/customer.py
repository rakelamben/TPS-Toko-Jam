from pydantic import BaseModel


class CustomerIdentify(BaseModel):
    """Body untuk daftar-atau-login pembeli via no HP."""
    no_hp: str
    nama: str | None = None  # hanya dipakai kalau no_hp belum terdaftar


class CustomerOut(BaseModel):
    customer_id: str
    nama: str
    no_hp: str
