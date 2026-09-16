from typing import Literal, Optional
from pydantic import BaseModel

NotificationType = Literal["stok_rendah", "transaksi_baru", "dokumen_baru", "workflow", "surat_masuk"]


class NotificationOut(BaseModel):
    notification_id: str
    tipe: NotificationType
    reference_table: Optional[str] = None
    reference_id: Optional[str] = None
    message: str
    is_read: bool
    target_personnel_id: Optional[str] = None
