"""
Konfigurasi aplikasi — baca variabel environment (SUPABASE_URL, SUPABASE_KEY, dll)
"""
import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")
    SUPABASE_SCHEMA: str = os.environ.get("SUPABASE_SCHEMA", "toko_jam")
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "")
    JWT_EXPIRE_MINUTES: int = int(os.environ.get("JWT_EXPIRE_MINUTES", "480"))
    CORS_ORIGINS: list[str] = os.environ.get("CORS_ORIGINS", "*").split(",")

    def validate(self):
        if not self.SUPABASE_URL or not self.SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_KEY belum diset. "
                "Set di file .env (lihat .env.example)."
            )
        if not self.JWT_SECRET:
            raise RuntimeError(
                "JWT_SECRET belum diset. Set secret acak di file .env "
                "(lihat .env.example)."
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate()
    return settings
