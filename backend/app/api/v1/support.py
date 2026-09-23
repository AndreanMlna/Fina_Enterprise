"""
FINA-ENTERPRISE Support Tickets API Router
Endpoint tiket dukungan pelanggan UMKM (PostgreSQL-backed).

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation
"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.auth import get_current_user
from app.domain.models import UserCredential, SupportTicket as SupportTicketModel, TicketCategory, TicketPriority, TicketStatus
from app.infrastructure.database import get_db

router = APIRouter(prefix="/support", tags=["Customer Support & HITL Desk"])


# --- Pydantic Schemas ---

class TicketCreateSchema(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    category: str = Field(default="SYSTEM_BUG", examples=["RECEIPT_OCR_FAILED"])
    description: str = Field(..., min_length=10)
    priority: str = Field(default="MEDIUM", examples=["HIGH"])
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None


class TicketResponseSchema(BaseModel):
    id: str
    ticket_number: str
    tenant_id: str
    user_phone: str
    category: str
    priority: str
    status: str
    subject: str
    description: str
    ai_confidence_score: int
    suggested_resolution: Optional[str] = None
    created_at: str
    reporter_name: Optional[str] = None


class TicketStatusUpdateSchema(BaseModel):
    status: str = Field(..., examples=["RESOLVED"])
    assigned_to: Optional[str] = None


# --- Endpoints ---

@router.get(
    "/tickets",
    response_model=List[TicketResponseSchema],
    summary="Daftar Tiket Support (Tenant-Scoped)"
)
async def list_tickets(
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(default=50, le=200)
):
    """
    Mengambil daftar tiket dukungan dari database PostgreSQL.
    Untuk role OWNER: hanya tiket milik tenant sendiri.
    Untuk role CS_STAFF: semua tiket.
    """
    stmt = select(SupportTicketModel).order_by(SupportTicketModel.created_at.desc()).limit(limit)

    if current_user.role != "CS_STAFF":
        stmt = stmt.where(SupportTicketModel.tenant_id == current_user.tenant_id)

    if status_filter:
        stmt = stmt.where(SupportTicketModel.status == status_filter)

    result = await db.execute(stmt)
    tickets = result.scalars().all()

    return [
        TicketResponseSchema(
            id=t.id,
            ticket_number=t.ticket_number,
            tenant_id=t.tenant_id,
            user_phone=t.user_phone,
            category=t.category.value if isinstance(t.category, TicketCategory) else str(t.category),
            priority=t.priority.value if isinstance(t.priority, TicketPriority) else str(t.priority),
            status=t.status.value if isinstance(t.status, TicketStatus) else str(t.status),
            subject=t.subject,
            description=t.description,
            ai_confidence_score=t.ai_confidence_score,
            suggested_resolution=t.suggested_resolution,
            created_at=t.created_at.isoformat() if t.created_at else "",
        )
        for t in tickets
    ]


@router.post(
    "/tickets",
    response_model=TicketResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Buat Tiket Support Baru"
)
async def create_ticket(
    payload: TicketCreateSchema,
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Membuat tiket dukungan baru yang tersimpan di PostgreSQL (bukan in-memory).
    Tenant ID otomatis diambil dari JWT token pengguna terotentikasi.
    """
    ticket_id = f"TCK-{uuid.uuid4().hex[:6].upper()}"
    ticket_number = f"TCK-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"

    # Map category string ke enum (fallback ke SYSTEM_BUG)
    try:
        cat_enum = TicketCategory(payload.category)
    except ValueError:
        cat_enum = TicketCategory.SYSTEM_BUG

    try:
        prio_enum = TicketPriority(payload.priority)
    except ValueError:
        prio_enum = TicketPriority.MEDIUM

    new_ticket = SupportTicketModel(
        id=ticket_id,
        ticket_number=ticket_number,
        tenant_id=current_user.tenant_id,
        user_phone=payload.reporter_phone or current_user.phone_number,
        category=cat_enum,
        priority=prio_enum,
        status=TicketStatus.OPEN,
        subject=payload.title,
        description=payload.description,
        ai_confidence_score=75,
        suggested_resolution=None,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_ticket)
    await db.flush()

    return TicketResponseSchema(
        id=new_ticket.id,
        ticket_number=new_ticket.ticket_number,
        tenant_id=new_ticket.tenant_id,
        user_phone=new_ticket.user_phone,
        category=cat_enum.value,
        priority=prio_enum.value,
        status=TicketStatus.OPEN.value,
        subject=new_ticket.subject,
        description=new_ticket.description,
        ai_confidence_score=75,
        suggested_resolution=None,
        created_at=new_ticket.created_at.isoformat()
    )


@router.patch(
    "/tickets/{ticket_id}/status",
    summary="Update Status Tiket"
)
async def update_ticket_status(
    ticket_id: str,
    payload: TicketStatusUpdateSchema,
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Memperbarui status tiket. Hanya CS_STAFF atau pemilik tenant yang diperbolehkan.
    """
    stmt = select(SupportTicketModel).where(SupportTicketModel.id == ticket_id)
    ticket = await db.scalar(stmt)

    if not ticket:
        raise HTTPException(status_code=404, detail="Tiket tidak ditemukan.")

    # Authorization check
    if current_user.role != "CS_STAFF" and ticket.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke tiket ini.")

    try:
        ticket.status = TicketStatus(payload.status)
    except ValueError:
        ticket.status = TicketStatus.OPEN

    if payload.status == "RESOLVED":
        ticket.resolved_at = datetime.now(timezone.utc)

    return {"success": True, "ticket_id": ticket.id, "new_status": ticket.status.value}
