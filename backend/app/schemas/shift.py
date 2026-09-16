from typing import Literal, Optional
from datetime import date, time
from pydantic import BaseModel

StatusKehadiran = Literal["terjadwal", "hadir", "izin", "alpha"]


class ShiftCreate(BaseModel):
    personnel_id: str
    tanggal: date
    jam_mulai: time
    jam_selesai: time
    created_by: str


class ShiftUpdate(BaseModel):
    status_kehadiran: Optional[StatusKehadiran] = None
    jam_mulai: Optional[time] = None
    jam_selesai: Optional[time] = None


class ShiftOut(BaseModel):
    shift_id: str
    personnel_id: str
    tanggal: date
    jam_mulai: time
    jam_selesai: time
    status_kehadiran: StatusKehadiran
    created_by: str
