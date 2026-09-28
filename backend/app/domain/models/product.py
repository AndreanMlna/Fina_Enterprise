from typing import Optional, List
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
    
    # Biaya operasional langsung & faktor susut bahan (Yield Loss) untuk kalkulasi HPP presisi
    overhead_cost_per_unit: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    wastage_percent: Mapped[float] = mapped_column(Numeric(6, 2), default=0.0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="products")
    recipe_items = relationship(
        "ProductRecipeItem",
        foreign_keys="[ProductRecipeItem.product_id]",
        back_populates="product",
        cascade="all, delete-orphan"
    )
    production_batches = relationship(
        "ProductionBatchRecord",
        back_populates="product",
        cascade="all, delete-orphan"
    )


class ProductRecipeItem(Base):
    """
    Komposisi Bahan Baku (Bill of Materials / Resep Produk).
    Menghubungkan produk jadi dengan bahan-bahan yang dibeli beserta takaran per pcs.
    Digunakan untuk kalkulasi HPP dinamis setiap kali harga bahan berubah (recycle stock/restock).
    """
    __tablename__ = "product_recipe_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), index=True, nullable=False)
    product_id: Mapped[str] = mapped_column(String(64), ForeignKey("products.id"), index=True, nullable=False)
    material_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("products.id"), nullable=True)
    material_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity_required: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)  # e.g., 0.02 (kg/liter/pcs)
    unit: Mapped[str] = mapped_column(String(32), default="Pcs")
    cost_per_unit: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)  # Harga modal per satuan bahan
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    product = relationship("Product", foreign_keys=[product_id], back_populates="recipe_items")
    material = relationship("Product", foreign_keys=[material_id])


class ProductionBatchRecord(Base):
    """
    Catatan Batch Produksi Produk (Konversi Bahan Baku -> Produk Jadi).
    Merekam HPP riil per batch, pengurangan stok bahan, penambahan produk jadi,
    serta rekomendasi harga jual terkini dari AI agar UMKM terhindar dari margin leakage.
    """
    __tablename__ = "production_batches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), index=True, nullable=False)
    product_id: Mapped[str] = mapped_column(String(64), ForeignKey("products.id"), index=True, nullable=False)
    batch_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    quantity_produced: Mapped[int] = mapped_column(Integer, nullable=False)
    total_material_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    overhead_cost: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    wastage_percent: Mapped[float] = mapped_column(Numeric(6, 2), default=0.0)
    unit_cost_hpp: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    selling_price_at_production: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    recommended_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    margin_status: Mapped[str] = mapped_column(String(32), default="HEALTHY")  # 'HEALTHY', 'MARGIN_LEAKAGE', 'CRITICAL_LOSS'
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    product = relationship("Product", back_populates="production_batches")


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
