"""
Endpoint autentikasi terpusat untuk seluruh personel (admin/staff/manager).
personnel_type harus dikirim dari frontend (hasil pilihan dropdown peran),
karena username tidak unik lintas tabel admins/managers/staff.
"""
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.auth import PersonnelLogin, PersonnelOut
from app.utils.security import hash_password
from app.utils.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

TABLE_BY_TYPE = {
    "admin": "admins",
    "manager": "managers",
    "staff": "staff",
}


@router.post("/login", response_model=PersonnelOut)
def login(payload: PersonnelLogin, db: Client = Depends(get_db)):
    table = TABLE_BY_TYPE[payload.personnel_type]
    res = db.table(table).select("*").eq("username", payload.username).execute().data
    if not res:
        raise HTTPException(status_code=401, detail="Username tidak ditemukan")

    person = res[0]
    if hash_password(payload.password) != person["password_hash"]:
        raise HTTPException(status_code=401, detail="Password salah")

    personnel = {
        "personnel_id": person["personnel_id"],
        "personnel_type": payload.personnel_type,
        "username": person["username"],
        "nama": person["nama"],
        "role": person.get("role"),
        "manager_id": person.get("manager_id"),
    }
    return {
        **personnel,
        "access_token": create_access_token(personnel),
        "token_type": "bearer",
    }
