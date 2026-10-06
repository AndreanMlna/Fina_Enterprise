from typing import Optional
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.infrastructure.database import Base


class TenantAutomationSchedule(Base):
    """
    Model Konfigurasi & Jadwal Otomasi Operasional Multi-Tenant.
    Menyimpan preferensi jam eksekusi, status aktif/nonaktif, dan audit run-time.
    """
    __tablename__ = "tenant_automation_schedules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False)
    task_key: Mapped[str] = mapped_column(String(64), index=True, nullable=False)  # SWEEPING, AUDIT, DUNNING, STOCK_OPNAME
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_engine: Mapped[str] = mapped_column(String(128), default="FinOrchestrator AI")
    time_range: Mapped[str] = mapped_column(String(64), nullable=False)  # Contoh: "13:00 - 13:30"
    cron_expression: Mapped[str] = mapped_column(String(64), default="0 13 * * *")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    target_action_tab: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # montecarlo, ledger, ar_dunning
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
