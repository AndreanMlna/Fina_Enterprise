from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "FINA-ENTERPRISE API"
    VERSION: str = "2.4.0"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings (PostgreSQL 16/18 + pgvector)
    # Direct Database URL (NeonDB Serverless PostgreSQL / Cloud Postgres)
    RAW_DATABASE_URL: str | None = Field(default=None, alias="DATABASE_URL", description="Koneksi URI langsung dari NeonDB / Cloud Postgres")

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = Field(default="", description="Kata sandi PostgreSQL (disuplai melalui .env)")
    POSTGRES_DB: str = "fina_enterprise"
    
    # Asynchronous Database Connection URL for asyncpg (Neon Serverless & Local)
    @property
    def DATABASE_URL(self) -> str:
        if self.RAW_DATABASE_URL:
            url = self.RAW_DATABASE_URL.strip()
            # Otomatis adaptasi skema driver asyncpg
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            # asyncpg mengharuskan parameter ssl=require (bukan sslmode=require dari libpq)
            if "sslmode=require" in url:
                url = url.replace("sslmode=require", "ssl=require")
            # asyncpg tidak menerima parameter channel_binding yang ditambahkan konsol Neon
            if "channel_binding=" in url:
                import re
                url = re.sub(r'[\?&]channel_binding=[^&]*', '', url)
                if '?' not in url and '&' in url:
                    url = url.replace('&', '?', 1)
            return url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Synchronous Database Connection URL for Alembic Migrations
    @property
    def SYNC_DATABASE_URL(self) -> str:
        if self.RAW_DATABASE_URL:
            url = self.RAW_DATABASE_URL.strip()
            if url.startswith("postgresql+asyncpg://"):
                url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            if "ssl=require" in url and "sslmode=require" not in url:
                url = url.replace("ssl=require", "sslmode=require")
            return url
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Security & Regulatory Settings (OWASP & RFC 8725 JWT Best Practices)
    # Bebas hardcode rahasia (Zero-Hardcoded Secrets) guna keamanan mutlak saat di-push ke GitHub
    SECRET_KEY: str = Field(default="", description="Kunci HMAC-SHA256 otentikasi JWT (wajib disuplai dari .env)")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours session lease
    
    # Compliance: UU PDP No. 27/2022 & IAI SAK EMKM
    ENFORCE_PII_MASKING: bool = True
    ENFORCE_DOUBLE_ENTRY_BALANCE: bool = True

    # AI Engine Settings (Google AI Studio Gemini API)
    # Model default: gemini-3.5-flash-lite (kuota tertinggi 500 RPD / 15 RPM di Google AI Studio) dengan fallback ke gemini-3.8-flash & gemini-3.6-flash
    GEMINI_API_KEY: str = Field(default="", description="Kunci API Google AI Studio Gemini")
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash-lite", description="Model Gemini resmi (default: gemini-3.5-flash-lite, fallback: gemini-3.8-flash, gemini-3.6-flash)")

    model_config = SettingsConfigDict(
        env_file=("backend/.env", ".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_security_credentials(self) -> "Settings":
        import os
        if not self.SECRET_KEY:
            typo_key = os.getenv("SECRFT_KEY")
            if typo_key:
                self.SECRET_KEY = typo_key
                return self
            raise ValueError(
                "CRITICAL SECURITY: 'SECRET_KEY' belum dikonfigurasi! "
                "Silakan setel nilai SECRET_KEY di berkas 'backend/.env' atau Vercel Environment Variables sebelum menjalankan aplikasi."
            )
        return self

settings = Settings()


