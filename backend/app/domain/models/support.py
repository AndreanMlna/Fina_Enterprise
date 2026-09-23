from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import enum
from app.infrastructure.database import Base


class TicketCategory(str, enum.Enum):
    RECEIPT_OCR_FAILED = "RECEIPT_OCR_FAILED"
    VOICE_DIALECT_AMBIGUOUS = "VOICE_DIALECT_AMBIGUOUS"
    WHATSAPP_DUNNING_ERROR = "WHATSAPP_DUNNING_ERROR"
    TAX_PP55_INQUIRY = "TAX_PP55_INQUIRY"
    SYSTEM_BUG = "SYSTEM_BUG"

class TicketPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    ticket_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), index=True, nullable=False)
    user_phone: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[TicketCategory] = mapped_column(Enum(TicketCategory, native_enum=False), nullable=False)
    priority: Mapped[TicketPriority] = mapped_column(Enum(TicketPriority, native_enum=False), default=TicketPriority.MEDIUM)
    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus, native_enum=False), default=TicketStatus.OPEN)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    ai_confidence_score: Mapped[int] = mapped_column(Integer, default=75)
    suggested_resolution: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)


    # Relationships
    tenant = relationship("Tenant", back_populates="tickets")
