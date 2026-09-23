from sqlalchemy import String, Numeric, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import enum
from app.infrastructure.database import Base


class InvoiceStatus(str, enum.Enum):
    CURRENT = "CURRENT"
    OVERDUE_15 = "OVERDUE_15"
    OVERDUE_30 = "OVERDUE_30"
    PAID = "PAID"

class DunningTone(str, enum.Enum):
    FRIENDLY = "FRIENDLY"
    REMINDER = "REMINDER"
    FORMAL_URGENT = "FORMAL_URGENT"

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), index=True, nullable=False)
    invoice_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(64), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    due_date: Mapped[str] = mapped_column(String(32), nullable=False)
    days_overdue: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus, native_enum=False), default=InvoiceStatus.CURRENT)
    suggested_tone: Mapped[DunningTone] = mapped_column(Enum(DunningTone, native_enum=False), default=DunningTone.FRIENDLY)
    snap_qris_url: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships

    tenant = relationship("Tenant", back_populates="invoices")
