"""
Endpoint admin. Menggantikan: login_admin dari main.py CLI.

CATATAN: ini masih login sederhana (cek username + password hash, lalu
kembalikan data admin) — SAMA seperti versi CLI, belum pakai token/session.
Untuk production sebaiknya endpoint ini mengembalikan JWT dan endpoint
lain (products/transactions tulis) dilindungi Depends(verify_token).
Ditandai sebagai langkah lanjutan di README.
"""
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.admin import AdminLogin, AdminOut
from app.utils.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminOut)
def login_admin(payload: AdminLogin, db: Client = Depends(get_db)):
    res = db.table("admins").select("*").eq("username", payload.username).execute().data
    if not res:
        raise HTTPException(status_code=401, detail="Username tidak ditemukan")

    admin = res[0]
    if hash_password(payload.password) != admin["password_hash"]:
        raise HTTPException(status_code=401, detail="Password salah")

    return admin
