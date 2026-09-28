from sqlalchemy import String, Numeric, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import Optional
from app.infrastructure.database import Base


class LoanEvaluation(Base):
    """
    Model Evaluasi & Audit Pinjaman Anti-Predatory (PostgreSQL-backed).
    Menyimpan hasil konversi APR riil dan uji legalitas OJK per tenant.
    """
    __tablename__ = "loan_evaluations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False)
    provider_name: Mapped[str] = mapped_column(String(255), nullable=False)
    requested_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    admin_fee_percent: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    upfront_deduction: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    disbursed_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    daily_interest_rate: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)
    tenor_days: Mapped[int] = mapped_column(Integer, nullable=False)
    total_repayment: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    effective_annual_apr: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_legal_ojk: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    threat_level: Mapped[str] = mapped_column(String(32), default="MODERATE", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", backref="loan_evaluations")
