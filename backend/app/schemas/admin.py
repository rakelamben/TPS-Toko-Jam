from pydantic import BaseModel


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminOut(BaseModel):
    admin_id: str
    username: str
    nama: str
