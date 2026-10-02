from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

class Base(DeclarativeBase):
    pass

# Initialize Async Engine with Production & Serverless Connection Pooling
connect_args: dict = {}
if "ssl=require" in settings.DATABASE_URL or "neon.tech" in settings.DATABASE_URL:
    connect_args["ssl"] = True
if "pooler" in settings.DATABASE_URL or "neon.tech" in settings.DATABASE_URL:
    connect_args["statement_cache_size"] = 0

import os
from sqlalchemy.pool import NullPool

# Serverless (Vercel) vs Persistent Container pool tuning (SRE Best Practice)
is_vercel = bool(os.getenv("VERCEL"))

if is_vercel:
    # Pada runtime Serverless, NullPool mencegah koneksi tertahan antar-event loop yang berbeda
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,
        connect_args=connect_args
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,      # Wajib untuk NeonDB: mendeteksi compute yang baru bangun dari status suspend
        pool_recycle=300,        # 5 menit recycle: selaras dengan default window auto-suspend NeonDB
        connect_args=connect_args
    )

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# FastAPI Dependency for Database Sessions
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
