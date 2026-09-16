from typing import Literal, Optional
from pydantic import BaseModel

DocumentStatus = Literal["draft", "final", "arsip"]


class DocumentCreate(BaseModel):
    tipe_dokumen: str
    judul: str
    deskripsi: Optional[str] = None
    file_url: Optional[str] = None
    created_by: str  # personnel_id pembuat
    transaction_id: Optional[str] = None


class DocumentUpdate(BaseModel):
    judul: Optional[str] = None
    deskripsi: Optional[str] = None
    file_url: Optional[str] = None
    status: Optional[DocumentStatus] = None


class DocumentOut(BaseModel):
    document_id: str
    tipe_dokumen: str
    judul: str
    deskripsi: Optional[str] = None
    file_url: Optional[str] = None
    status: DocumentStatus
    created_by: str
    transaction_id: Optional[str] = None
