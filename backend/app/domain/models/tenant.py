from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.infrastructure.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    branch_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    npwp: Mapped[str] = mapped_column(String(64), nullable=False)
    address: Mapped[str] = mapped_column(String(512), nullable=False)
    active_license: Mapped[str] = mapped_column(String(64), default="ENTERPRISE_LIFETIME")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


    # Relationships
    users = relationship("UserCredential", back_populates="tenant", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="tenant", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="tenant", cascade="all, delete-orphan")
    tickets = relationship("SupportTicket", back_populates="tenant", cascade="all, delete-orphan")
