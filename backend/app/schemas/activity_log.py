from typing import Literal, Optional, Any
from pydantic import BaseModel

ActivityAction = Literal["create", "update", "delete"]


class ActivityLogOut(BaseModel):
    log_id: str
    personnel_id: str
    action: ActivityAction
    table_name: str
    record_id: Optional[str] = None
    detail: Optional[Any] = None
