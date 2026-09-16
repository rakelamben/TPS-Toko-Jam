from typing import Literal, Optional
from pydantic import BaseModel

PersonnelType = Literal["admin", "staff", "manager"]


class PersonnelLogin(BaseModel):
    personnel_type: PersonnelType
    username: str
    password: str


class PersonnelOut(BaseModel):
    personnel_id: str
    personnel_type: PersonnelType
    username: str
    nama: str
    role: Optional[str] = None
    manager_id: Optional[str] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None
