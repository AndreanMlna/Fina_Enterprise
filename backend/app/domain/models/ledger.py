from sqlalchemy import String, Numeric, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import enum
from app.infrastructure.database import Base


class AccountCategory(str, enum.Enum):
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"

class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)  # e.g., '1101'
    name: Mapped[str] = mapped_column(String(255), nullable=False)                           # e.g., 'Kas Tunai Kasir'
    category: Mapped[AccountCategory] = mapped_column(Enum(AccountCategory, native_enum=False), nullable=False)
    normal_balance: Mapped[str] = mapped_column(String(8), nullable=False)                  # 'DEBIT' or 'CREDIT'
    balance: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)

    # Relationships
    journal_lines = relationship("JournalLine", back_populates="account")

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), index=True, nullable=False)
    entry_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    entry_date: Mapped[str] = mapped_column(String(32), nullable=False)                      # 'YYYY-MM-DD'
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="POSTED")                       # 'POSTED', 'PENDING_HITL', 'VOID'
    audit_merkle_hash: Mapped[str] = mapped_column(String(128), nullable=False)            # SHA-256 Merkle Chaining
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


    # Relationships
    tenant = relationship("Tenant", back_populates="journal_entries")
    lines = relationship("JournalLine", back_populates="entry", cascade="all, delete-orphan")

class JournalLine(Base):
    __tablename__ = "journal_lines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    entry_id: Mapped[str] = mapped_column(String(64), ForeignKey("journal_entries.id"), index=True, nullable=False)
    account_id: Mapped[str] = mapped_column(String(64), ForeignKey("accounts.id"), index=True, nullable=False)
    debit: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    credit: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0)
    memo: Mapped[str] = mapped_column(String(255), nullable=True)

    # Relationships
    entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("Account", back_populates="journal_lines")
