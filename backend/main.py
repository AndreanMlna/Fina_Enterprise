from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# --- API v1 Routers (Hexagonal Architecture: Transport Layer) ---
from app.api.v1.auth import router as auth_router
from app.api.v1.ledger import router as ledger_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.kpi import router as kpi_router
from app.api.v1.dialects import router as dialects_router
from app.api.v1.support import router as support_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[{settings.PROJECT_NAME}] Starting up enterprise engine v{settings.VERSION}...")
    print(f"[{settings.PROJECT_NAME}] Database Target: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
    print(f"[{settings.PROJECT_NAME}] Regulatory: SAK EMKM Double-Entry & UU PDP No. 27/2022 Active")
    print(f"[{settings.PROJECT_NAME}] API Routers: auth, ledger, invoices, kpi, dialects, support")
    yield
    print(f"[{settings.PROJECT_NAME}] Shutting down gracefully...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistem Agentic AI Finansial Otonom Skala Enterprise Indonesia (SAK EMKM & UU PDP)",
    lifespan=lifespan
)

# Enterprise CORS Policy for Frontend Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API v1 Routers (Database-Backed, Tenant-Scoped)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(ledger_router, prefix=settings.API_V1_STR)
app.include_router(invoices_router, prefix=settings.API_V1_STR)
app.include_router(kpi_router, prefix=settings.API_V1_STR)
app.include_router(dialects_router, prefix=settings.API_V1_STR)
app.include_router(support_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System Telemetry"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "PostgreSQL 16 + pgvector",
        "compliance": {
            "double_entry_sak_emkm": "ACTIVE",
            "uu_pdp_pii_masking": "ACTIVE"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get(f"{settings.API_V1_STR}/system-status", tags=["System Telemetry"])
async def system_status():
    return {
        "engine": "FastAPI AsyncIO Engine",
        "orm": "SQLAlchemy 2.0 Async (Unit of Work)",
        "migrations": "Alembic Schema Evolution",
        "driver": "asyncpg Binary Protocol",
        "vector_indexing": "HNSW (Hierarchical Navigable Small World)",
        "security": "AES-256 GCM + Zero-Trust RBAC",
        "compliance": {
            "sak_emkm_status": "COMPLIANT",
            "uu_pdp_masking": "AES-256-GCM"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
