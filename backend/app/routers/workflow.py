"""
Alur approval single-level: siapapun bisa mengajukan request (requested_by),
1 baris approval otomatis dibuat berstatus pending, lalu manager (atau siapa
pun yang berwenang di level aplikasi) approve/reject lewat /decision.
"""
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.workflow import (
    WorkflowRequestCreate, WorkflowRequestOut,
    WorkflowApprovalAction, WorkflowApprovalOut,
)
from app.utils.auth import require_office_area, require_roles

router = APIRouter(
    prefix="/workflow",
    tags=["workflow"],
    dependencies=[Depends(require_office_area("workflow"))],
)


@router.get("/requests", response_model=list[WorkflowRequestOut])
def list_requests(
    status: Optional[str] = None,
    requested_by: Optional[str] = None,
    db: Client = Depends(get_db),
):
    query = db.table("workflow_requests").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("current_status", status)
    if requested_by:
        query = query.eq("requested_by", requested_by)
    return query.execute().data


@router.post("/requests", response_model=WorkflowRequestOut, status_code=201)
def create_request(
    payload: WorkflowRequestCreate,
    db: Client = Depends(get_db),
    personnel: dict = Depends(require_office_area("workflow")),
):
    if payload.requested_by != personnel["sub"]:
        raise HTTPException(status_code=403, detail="Pemohon harus sesuai token")
    res = db.table("workflow_requests").insert(payload.model_dump()).execute()
    request = res.data[0]
    db.table("workflow_approvals").insert({
        "request_id": request["request_id"],
        "status": "pending",
    }).execute()
    return request


@router.get("/requests/{request_id}/approval", response_model=WorkflowApprovalOut)
def get_approval(request_id: str, db: Client = Depends(get_db)):
    res = db.table("workflow_approvals").select("*").eq("request_id", request_id).execute().data
    if not res:
        raise HTTPException(status_code=404, detail="Approval tidak ditemukan")
    return res[0]


@router.post("/requests/{request_id}/decision", response_model=WorkflowApprovalOut)
def decide(
    request_id: str,
    payload: WorkflowApprovalAction,
    db: Client = Depends(get_db),
    personnel: dict = Depends(require_roles("admin", "manager")),
):
    existing = db.table("workflow_approvals").select("*").eq("request_id", request_id).execute().data
    if not existing:
        raise HTTPException(status_code=404, detail="Approval tidak ditemukan")
    if existing[0]["status"] != "pending":
        raise HTTPException(status_code=409, detail="Request ini sudah diputuskan sebelumnya")

    db.table("workflow_approvals").update({
        "approver_id": personnel["sub"],
        "status": payload.status,
        "catatan": payload.catatan,
        "approved_at": datetime.now(timezone.utc).isoformat(),
    }).eq("request_id", request_id).execute()

    db.table("workflow_requests").update(
        {"current_status": payload.status}
    ).eq("request_id", request_id).execute()

    return db.table("workflow_approvals").select("*").eq("request_id", request_id).execute().data[0]
