from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    products, customers, transactions, auth,
    personnel, documents, messages, notifications, shifts, workflow, correspondence, activity_logs,
)

app = FastAPI(
    title="TPS + OAS Toko Jam API",
    description="Backend transaksi (TPS) + office automation (OAS) untuk toko jam",
    version="2.0.0",
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TPS (sudah ada sebelumnya)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(transactions.router)
app.include_router(auth.router)

# OAS (baru)
app.include_router(personnel.router)
app.include_router(documents.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(shifts.router)
app.include_router(workflow.router)
app.include_router(correspondence.router)
app.include_router(activity_logs.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "TPS + OAS Toko Jam API berjalan. Lihat /docs untuk dokumentasi."}
