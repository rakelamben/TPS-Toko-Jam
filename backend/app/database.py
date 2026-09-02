"""
Client Supabase, sudah terikat ke schema "toko_jam".
Gunakan `db` ini untuk semua panggilan .table()/.rpc() di seluruh project,
menggantikan client Supabase mentah.

CATATAN: SUPABASE_KEY WAJIB service_role key (bukan anon key), karena RPC
(buat_transaksi, batalkan_transaksi, dll) dan operasi admin butuh akses
penuh yang melewati RLS. JANGAN commit key ini ke GitHub — taruh di .env
(sudah ada di .gitignore) atau di environment variables platform hosting.
"""
from functools import lru_cache
from supabase import create_client, Client
from app.config import get_settings


@lru_cache
def get_db() -> Client:
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return supabase.schema(settings.SUPABASE_SCHEMA)
