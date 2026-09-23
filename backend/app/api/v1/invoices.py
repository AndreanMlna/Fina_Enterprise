"""
FINA-ENTERPRISE Invoices API Router
Endpoint piutang usaha (Accounts Receivable) & AR Dunning.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.auth import get_current_user
from app.domain.models import UserCredential, Invoice, InvoiceStatus, DunningTone
from app.infrastructure.database import get_db

router = APIRouter(prefix="/invoices", tags=["AR Dunning & Piutang Usaha"])


# --- Pydantic Response Schemas ---

class InvoiceSchema(BaseModel):
    id: str
    invoice_number: str
    customer_name: str
    customer_phone: str
    amount: float
    due_date: str
    days_overdue: int
    status: str
    suggested_tone: str
    snap_qris_url: str


# --- Endpoints ---

@router.get(
    "",
    response_model=List[InvoiceSchema],
    summary="Daftar Invoice Piutang Usaha (Tenant-Scoped)"
)
async def list_invoices(
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0)
):
    """
    Mengambil daftar invoice piutang usaha milik tenant terotentikasi.
    Mendukung filter berdasarkan status (CURRENT, OVERDUE_15, OVERDUE_30, PAID).
    """
    stmt = (
        select(Invoice)
        .where(Invoice.tenant_id == current_user.tenant_id)
        .order_by(Invoice.due_date.desc())
        .limit(limit)
        .offset(offset)
    )

    if status_filter:
        stmt = stmt.where(Invoice.status == status_filter)

    result = await db.execute(stmt)
    invoices = result.scalars().all()

    return [
        InvoiceSchema(
            id=inv.id,
            invoice_number=inv.invoice_number,
            customer_name=inv.customer_name,
            customer_phone=inv.customer_phone,
            amount=float(inv.amount),
            due_date=inv.due_date,
            days_overdue=inv.days_overdue,
            status=inv.status.value if isinstance(inv.status, InvoiceStatus) else str(inv.status),
            suggested_tone=inv.suggested_tone.value if isinstance(inv.suggested_tone, DunningTone) else str(inv.suggested_tone),
            snap_qris_url=inv.snap_qris_url
        )
        for inv in invoices
    ]
