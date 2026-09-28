from sqlalchemy import String, Numeric, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import Optional
from app.infrastructure.database import Base


class CommodityBenchmark(Base):
    """
    Indeks Acuan Harga Pasar Grosir Komoditas Nasional (Bapanas / BPS / PIHPS).
    Digunakan sebagai acuan benchmark harga beli wajar industri UMKM.
    """
    __tablename__ = "commodity_benchmarks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    commodity_name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)  # SEMBAKO, DAGING, BUMBU, MINYAK, dll
    unit: Mapped[str] = mapped_column(String(32), default="Kg", nullable=False)
    market_median_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    source: Mapped[str] = mapped_column(String(255), default="Bapanas & Pasar Induk Nasional")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class SupplierQuote(Base):
    """
    Pencatatan Kontrak & Penawaran Harga Beli Bahan Baku dari Supplier Tenant (PostgreSQL-backed).
    Memungkinkan komparasi langsung antara harga kontrak aktual tenant vs indeks acuan pasar.
    """
    __tablename__ = "supplier_quotes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False)
    commodity_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str] = mapped_column(String(32), default="Kg", nullable=False)
    purchase_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    is_contract_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", backref="supplier_quotes")
