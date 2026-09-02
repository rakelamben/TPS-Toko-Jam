from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import products, customers, transactions, admin

app = FastAPI(
    title="TPS Toko Jam API",
    description="Backend transaction processing system untuk toko jam (jam tangan, jam dinding, dll)",
    version="1.0.0",
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(transactions.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "TPS Toko Jam API berjalan. Lihat /docs untuk dokumentasi."}
