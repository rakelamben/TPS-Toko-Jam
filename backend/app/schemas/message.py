from typing import Optional
from pydantic import BaseModel


class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: Optional[str] = None  # None = broadcast ke semua personel
    subject: Optional[str] = None
    body: str


class MessageOut(BaseModel):
    message_id: str
    sender_id: str
    receiver_id: Optional[str] = None
    subject: Optional[str] = None
    body: str
    is_read: bool
