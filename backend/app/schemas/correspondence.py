from typing import Literal, Optional
from datetime import date
from pydantic import BaseModel

CorrespondenceTipe = Literal["masuk", "keluar"]
CorrespondenceStatus = Literal["diterima", "diproses", "selesai"]
DispositionStatus = Literal["belum", "sedang_diproses", "selesai"]


class CorrespondenceCreate(BaseModel):
    nomor_agenda: str
    tipe: CorrespondenceTipe
    perihal: str
    asal_tujuan: str
    tanggal_surat: Optional[date] = None
    tanggal_terima: Optional[date] = None
    file_url: Optional[str] = None
    created_by: str


class CorrespondenceUpdate(BaseModel):
    perihal: Optional[str] = None
    status: Optional[CorrespondenceStatus] = None
    file_url: Optional[str] = None


class CorrespondenceOut(BaseModel):
    correspondence_id: str
    nomor_agenda: str
    tipe: CorrespondenceTipe
    perihal: str
    asal_tujuan: str
    tanggal_surat: Optional[date] = None
    tanggal_terima: Optional[date] = None
    file_url: Optional[str] = None
    status: CorrespondenceStatus
    created_by: str


class DispositionCreate(BaseModel):
    disposisi_ke: str
    instruksi: Optional[str] = None


class DispositionUpdate(BaseModel):
    status: Optional[DispositionStatus] = None
    catatan: Optional[str] = None


class DispositionOut(BaseModel):
    disposition_id: str
    correspondence_id: str
    disposisi_ke: str
    instruksi: Optional[str] = None
    status: DispositionStatus
    catatan: Optional[str] = None
