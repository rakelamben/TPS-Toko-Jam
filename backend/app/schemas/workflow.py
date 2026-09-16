from typing import Literal, Optional
from pydantic import BaseModel

WorkflowStatus = Literal["pending", "approved", "rejected"]


class WorkflowRequestCreate(BaseModel):
    tipe_request: str
    reference_table: Optional[str] = None
    reference_id: Optional[str] = None
    deskripsi: Optional[str] = None
    requested_by: str


class WorkflowRequestOut(BaseModel):
    request_id: str
    tipe_request: str
    reference_table: Optional[str] = None
    reference_id: Optional[str] = None
    deskripsi: Optional[str] = None
    requested_by: str
    current_status: WorkflowStatus


class WorkflowApprovalAction(BaseModel):
    approver_id: str
    status: Literal["approved", "rejected"]
    catatan: Optional[str] = None


class WorkflowApprovalOut(BaseModel):
    approval_id: str
    request_id: str
    approver_id: Optional[str] = None
    status: WorkflowStatus
    catatan: Optional[str] = None
