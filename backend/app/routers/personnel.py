"""
Manajemen staff & manager (CRUD). Setiap staff/manager punya identitas umum
di tabel personnel (personnel_type), plus data login di tabel masing-masing.
Admin TIDAK bisa dibuat lewat endpoint ini (sengaja) — dibuat manual langsung
di database untuk keamanan, karena admin adalah level akses tertinggi.
"""
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.database import get_db
from app.schemas.personnel import (
    StaffCreate, StaffUpdate, StaffOut, ManagerCreate, ManagerOut,
    PersonnelDirectoryOut,
)
from app.utils.security import hash_password
from app.utils.auth import require_office_area, require_roles

router = APIRouter(prefix="/personnel", tags=["personnel"])


@router.get("/directory", response_model=list[PersonnelDirectoryOut])
def personnel_directory(
    db: Client = Depends(get_db),
    _: dict = Depends(require_office_area("communication")),
):
    people = []
    for table, personnel_type, fields in (
        ("admins", "admin", "personnel_id, username, nama"),
        ("managers", "manager", "personnel_id, username, nama"),
        ("staff", "staff", "personnel_id, username, nama, role"),
    ):
        rows = db.table(table).select(fields).order("nama").execute().data
        people.extend({**row, "personnel_type": personnel_type} for row in rows)
    return sorted(people, key=lambda person: person["nama"].lower())


@router.get("/staff", response_model=list[StaffOut])
def list_staff(db: Client = Depends(get_db), _: dict = Depends(require_roles("admin"))):
    return db.table("staff").select("*").order("nama").execute().data


@router.post("/staff", response_model=StaffOut, status_code=201)
def create_staff(payload: StaffCreate, db: Client = Depends(get_db), _: dict = Depends(require_roles("admin"))):
    personnel = db.table("personnel").insert({"personnel_type": "staff"}).execute().data
    personnel_id = personnel[0]["personnel_id"]
    try:
        res = db.table("staff").insert({
            "personnel_id": personnel_id,
            "username": payload.username,
            "password_hash": hash_password(payload.password),
            "nama": payload.nama,
            "role": payload.role,
            "manager_id": payload.manager_id,
        }).execute()
        return res.data[0]
    except Exception as e:
        db.table("personnel").delete().eq("personnel_id", personnel_id).execute()
        raise HTTPException(
            status_code=409,
            detail=f"Gagal membuat staff (username mungkin sudah dipakai): {e}",
        )


@router.patch("/staff/{staff_id}", response_model=StaffOut)
def update_staff(staff_id: str, payload: StaffUpdate, db: Client = Depends(get_db), _: dict = Depends(require_roles("admin"))):
    update_data = payload.model_dump(exclude_unset=True, exclude={"password"})
    if payload.password:
        update_data["password_hash"] = hash_password(payload.password)
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diubah")
    res = db.table("staff").update(update_data).eq("staff_id", staff_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")
    return res.data[0]


@router.delete("/staff/{staff_id}", status_code=204)
def delete_staff(staff_id: str, db: Client = Depends(get_db), _: dict = Depends(require_roles("admin"))):
    staff = db.table("staff").select("personnel_id").eq("staff_id", staff_id).execute().data
    if not staff:
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")
    db.table("staff").delete().eq("staff_id", staff_id).execute()
    db.table("personnel").delete().eq("personnel_id", staff[0]["personnel_id"]).execute()


@router.get("/managers", response_model=list[ManagerOut])
def list_managers(db: Client = Depends(get_db), _: dict = Depends(require_roles("admin"))):
    return db.table("managers").select("*").order("nama").execute().data


@router.post("/managers", response_model=ManagerOut, status_code=201)
def create_manager(payload: ManagerCreate, db: Client = Depends(get_db), _: dict = Depends(require_roles("admin"))):
    personnel = db.table("personnel").insert({"personnel_type": "manager"}).execute().data
    personnel_id = personnel[0]["personnel_id"]
    try:
        res = db.table("managers").insert({
            "personnel_id": personnel_id,
            "username": payload.username,
            "password_hash": hash_password(payload.password),
            "nama": payload.nama,
        }).execute()
        return res.data[0]
    except Exception as e:
        db.table("personnel").delete().eq("personnel_id", personnel_id).execute()
        raise HTTPException(
            status_code=409,
            detail=f"Gagal membuat manager (username mungkin sudah dipakai): {e}",
        )
