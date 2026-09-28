from typing import Optional
from sqlalchemy import String, Numeric, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.infrastructure.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    cogs: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    unit: Mapped[str] = mapped_column(String(32), default="Porsi")
    image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="products")


class POSReceiptRecord(Base):
    __tablename__ = "pos_receipts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), index=True, nullable=False)
    receipt_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    journal_entry_number: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    cashier_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    total_discount: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    tax_pp55_estimated: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    grand_total: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(32), nullable=False)
    cash_tendered: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    change_amount: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    audit_merkle_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    items_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
