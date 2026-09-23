from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "FINA-ENTERPRISE API"
    VERSION: str = "2.4.0"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings (PostgreSQL 16/18 + pgvector)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = Field(default="", description="Kata sandi PostgreSQL (disuplai melalui .env)")
    POSTGRES_DB: str = "fina_enterprise"
    
    # Asynchronous Database Connection URL for asyncpg
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Synchronous Database Connection URL for Alembic Migrations
    @property
    def SYNC_DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Security & Regulatory Settings (OWASP & RFC 8725 JWT Best Practices)
    # Bebas hardcode rahasia (Zero-Hardcoded Secrets) guna keamanan mutlak saat di-push ke GitHub
    SECRET_KEY: str = Field(default="", description="Kunci HMAC-SHA256 otentikasi JWT (wajib disuplai dari .env)")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours session lease
    
    # Compliance: UU PDP No. 27/2022 & IAI SAK EMKM
    ENFORCE_PII_MASKING: bool = True
    ENFORCE_DOUBLE_ENTRY_BALANCE: bool = True

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_security_credentials(self) -> "Settings":
        if not self.SECRET_KEY:
            raise ValueError(
                "CRITICAL SECURITY: 'SECRET_KEY' belum dikonfigurasi! "
                "Silakan setel nilai SECRET_KEY di berkas 'backend/.env' sebelum menjalankan aplikasi."
            )
        return self

settings = Settings()


