from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentOut
from app.utils.auth import require_office_area

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    dependencies=[Depends(require_office_area("documents"))],
)


@router.get("", response_model=list[DocumentOut])
def list_documents(
    status: Optional[str] = None,
    created_by: Optional[str] = None,
    transaction_id: Optional[str] = None,
    db: Client = Depends(get_db),
):
    query = db.table("documents").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    if created_by:
        query = query.eq("created_by", created_by)
    if transaction_id:
        query = query.eq("transaction_id", transaction_id)
    return query.execute().data


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: str, db: Client = Depends(get_db)):
    res = db.table("documents").select("*").eq("document_id", document_id).execute().data
    if not res:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    return res[0]


@router.post("", response_model=DocumentOut, status_code=201)
def create_document(
    payload: DocumentCreate,
    db: Client = Depends(get_db),
    personnel: dict = Depends(require_office_area("documents")),
):
    if payload.created_by != personnel["sub"]:
        raise HTTPException(status_code=403, detail="Pembuat dokumen harus sesuai token")
    res = db.table("documents").insert(payload.model_dump()).execute()
    return res.data[0]


@router.patch("/{document_id}", response_model=DocumentOut)
def update_document(document_id: str, payload: DocumentUpdate, db: Client = Depends(get_db)):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diubah")
    res = db.table("documents").update(update_data).eq("document_id", document_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    return res.data[0]


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: str, db: Client = Depends(get_db)):
    db.table("documents").delete().eq("document_id", document_id).execute()
