from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.message import MessageCreate, MessageOut
from app.utils.auth import require_office_area

router = APIRouter(
    prefix="/messages",
    tags=["messages"],
    dependencies=[Depends(require_office_area("communication"))],
)


@router.post("", response_model=MessageOut, status_code=201)
def send_message(
    payload: MessageCreate,
    db: Client = Depends(get_db),
    personnel: dict = Depends(require_office_area("communication")),
):
    if payload.sender_id != personnel["sub"]:
        raise HTTPException(status_code=403, detail="Pengirim pesan harus sesuai token")
    res = db.table("messages").insert(payload.model_dump()).execute()
    return res.data[0]


@router.get("/inbox/{personnel_id}", response_model=list[MessageOut])
def inbox(
    personnel_id: str,
    db: Client = Depends(get_db),
    personnel: dict = Depends(require_office_area("communication")),
):
    """Pesan langsung ke personnel_id ini, ditambah pesan broadcast (receiver_id kosong)."""
    if personnel_id != personnel["sub"] and personnel.get("personnel_type") not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Tidak dapat membaca inbox personel lain")
    direct = db.table("messages").select("*").eq("receiver_id", personnel_id).execute().data
    broadcast = db.table("messages").select("*").is_("receiver_id", "null").execute().data
    combined = direct + broadcast
    combined.sort(key=lambda m: m.get("created_at", ""), reverse=True)
    return combined


@router.post("/{message_id}/read")
def mark_read(message_id: str, db: Client = Depends(get_db)):
    res = db.table("messages").update({"is_read": True}).eq("message_id", message_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")
    return {"message": "Ditandai sudah dibaca"}
