from sqlalchemy import String, Numeric, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import Optional
from app.infrastructure.database import Base


class ReceiptForensicsRecord(Base):
    """
    Model Audit Digital Forensik Nota & Struk Belanja UMKM (PostgreSQL-backed).
    Menyimpan hasil ekstraksi Vision OCR, analisis anomali Error Level Analysis (ELA),
    dan status pembukuan ke buku besar SAK EMKM.
    """
    __tablename__ = "receipt_forensics"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False)
    receipt_number: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    merchant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    transaction_date: Mapped[str] = mapped_column(String(32), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0, nullable=False)
    grand_total: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    ela_integrity_score: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    is_tampered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tampering_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    items_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of extracted items
    audit_merkle_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="VERIFIED", nullable=False)  # 'VERIFIED', 'TAMPERED', 'POSTED_TO_LEDGER'
    journal_entry_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", backref="forensics_records")
