from typing import Literal, Optional
from pydantic import BaseModel

StaffRole = Literal["staf_gudang", "staf_operasional"]


class StaffCreate(BaseModel):
    username: str
    password: str
    nama: str
    role: StaffRole
    manager_id: Optional[str] = None


class StaffUpdate(BaseModel):
    nama: Optional[str] = None
    role: Optional[StaffRole] = None
    manager_id: Optional[str] = None
    password: Optional[str] = None


class StaffOut(BaseModel):
    staff_id: str
    personnel_id: str
    username: str
    nama: str
    role: StaffRole
    manager_id: Optional[str] = None


class ManagerCreate(BaseModel):
    username: str
    password: str
    nama: str


class ManagerOut(BaseModel):
    manager_id: str
    personnel_id: str
    username: str
    nama: str


class PersonnelDirectoryOut(BaseModel):
    personnel_id: str
    personnel_type: Literal["admin", "staff", "manager"]
    username: str
    nama: str
    role: Optional[str] = None
