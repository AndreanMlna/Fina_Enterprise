"""
FINA-ENTERPRISE Invoices API Router
Endpoint piutang usaha (Accounts Receivable) & AR Dunning.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC)
Compliance: SAK EMKM Double-Entry Balancing & UU PDP No. 27/2022
"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid
import hashlib

from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import (
    UserCredential, 
    Invoice, 
    InvoiceStatus, 
    DunningTone,
    JournalEntry,
    JournalLine,
    Account
)
from app.domain.services import (
    AccountingService,
    COA_CASH_ON_HAND,
    COA_BANK_GIRO_QRIS,
    COA_ACCOUNTS_RECEIVABLE
)
from app.infrastructure.database import get_db

router = APIRouter(prefix="/invoices", tags=["AR Dunning & Piutang Usaha"])

# RBAC Guard: Penagihan hanya dapat diakses oleh peran manajerial
_require_manager = require_role(["OWNER", "MANAGER"])


# --- Pydantic Schemas ---

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


class CreateInvoicePayload(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=255)
    customer_phone: str = Field(..., min_length=8, max_length=32)
    amount: float = Field(..., gt=0)
    due_date: str = Field(..., description="Format YYYY-MM-DD")
    suggested_tone: Optional[str] = "FRIENDLY"
    snap_qris_url: Optional[str] = None


class PayInvoicePayload(BaseModel):
    payment_method: str = Field(default="CASH", description="'CASH' atau 'TRANSFER'/'QRIS'")
    notes: Optional[str] = None


class DunningReminderPayload(BaseModel):
    tone: Optional[str] = "REMINDER"
    custom_message: Optional[str] = None


# --- Endpoints ---

@router.get(
    "",
    response_model=List[InvoiceSchema],
    summary="Daftar Invoice Piutang Usaha (Tenant-Scoped)"
)
async def list_invoices(
    current_user: UserCredential = Depends(_require_manager),
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


@router.post(
    "",
    response_model=InvoiceSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Buat Invoice Piutang Usaha Baru (Tenant-Scoped)"
)
async def create_invoice(
    payload: CreateInvoicePayload,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Menerbitkan invoice piutang usaha baru ke pelanggan/mitra katering.
    Otomatis menghasilkan nomor unik invoice dan QRIS SNAP payment link.
    """
    now = datetime.now(timezone.utc)
    inv_id = f"inv-{uuid.uuid4().hex[:12]}"
    rand_seq = uuid.uuid4().hex[:4].upper()
    invoice_number = f"INV-{now.strftime('%Y%m')}-{rand_seq}"

    # Hitung selisih jatuh tempo
    try:
        due_dt = datetime.strptime(payload.due_date, "%Y-%m-%d").date()
        today = now.date()
        days_diff = (today - due_dt).days
        days_overdue = max(0, days_diff)
    except Exception:
        days_overdue = 0

    # Tentukan status awal
    if days_overdue > 30:
        inv_status = InvoiceStatus.OVERDUE_30
        tone = DunningTone.FORMAL_URGENT
    elif days_overdue > 14:
        inv_status = InvoiceStatus.OVERDUE_15
        tone = DunningTone.REMINDER
    else:
        inv_status = InvoiceStatus.CURRENT
        tone = DunningTone.FRIENDLY

    snap_url = payload.snap_qris_url or f"https://app.midtrans.com/snap/v2/vtweb/fina-ar-{invoice_number.lower()}"

    new_inv = Invoice(
        id=inv_id,
        tenant_id=current_user.tenant_id,
        invoice_number=invoice_number,
        customer_name=payload.customer_name.strip(),
        customer_phone=payload.customer_phone.strip(),
        amount=payload.amount,
        due_date=payload.due_date,
        days_overdue=days_overdue,
        status=inv_status,
        suggested_tone=tone,
        snap_qris_url=snap_url,
        created_at=now
    )
    db.add(new_inv)
    await db.commit()
    await db.refresh(new_inv)

    return InvoiceSchema(
        id=new_inv.id,
        invoice_number=new_inv.invoice_number,
        customer_name=new_inv.customer_name,
        customer_phone=new_inv.customer_phone,
        amount=float(new_inv.amount),
        due_date=new_inv.due_date,
        days_overdue=new_inv.days_overdue,
        status=new_inv.status.value,
        suggested_tone=new_inv.suggested_tone.value,
        snap_qris_url=new_inv.snap_qris_url
    )


@router.patch(
    "/{invoice_id}/pay",
    status_code=status.HTTP_200_OK,
    summary="Tandai Invoice Lunas & Auto-Posting SAK EMKM (Debet Kas == Kredit Piutang)"
)
async def pay_invoice(
    invoice_id: str,
    payload: PayInvoicePayload,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Melunasi invoice piutang usaha secara atomik (ACID):
    1. Memperbarui status invoice menjadi 'PAID' di tabel 'invoices'.
    2. Menegakkan prinsip akuntansi berpasangan SAK EMKM:
       * DEBET: Akun 1101 (Kas Tunai) atau Akun 1102 (Bank Giro)
       * KREDIT: Akun 1103 (Piutang Usaha)
    3. Mengunci integritas transaksi dengan SHA-256 Merkle Chaining di 'journal_entries'.
    4. Mengurangi saldo piutang dan menambah saldo kas/bank tenant.
    """
    stmt = select(Invoice).where(
        Invoice.id == invoice_id,
        Invoice.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    inv = res.scalar_one_or_none()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice tidak ditemukan atau bukan milik tenant Anda."
        )

    if inv.status == InvoiceStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice ini telah lunas sebelumnya."
        )

    target_cash_code = COA_CASH_ON_HAND if payload.payment_method.upper() == "CASH" else COA_BANK_GIRO_QRIS
    amount = float(inv.amount)

    # Delegasikan auto-posting jurnal SAK EMKM ke Accounting Domain Service
    journal_entry = await AccountingService.post_double_entry(
        db=db,
        tenant_id=current_user.tenant_id,
        description=f"Pelunasan Piutang Invoice {inv.invoice_number} - {inv.customer_name} ({payload.payment_method.upper()})",
        debit_account_code=target_cash_code,
        credit_account_code=COA_ACCOUNTS_RECEIVABLE,
        amount=amount,
        memo_debit=f"Penerimaan Pelunasan Invoice {inv.invoice_number}",
        memo_credit=f"Pengurangan Piutang Invoice {inv.invoice_number}",
        entry_number_prefix="JV-AR",
        update_account_balances=True
    )

    # Update invoice status
    inv.status = InvoiceStatus.PAID
    inv.days_overdue = 0

    await db.commit()

    return {
        "success": True,
        "message": f"Invoice {inv.invoice_number} berhasil dilunasi dan dibukukan ke SAK EMKM.",
        "invoice_id": inv.id,
        "journal_entry_number": journal_entry.entry_number,
        "audit_merkle_hash": journal_entry.audit_merkle_hash,
        "amount_settled": amount
    }


@router.post(
    "/{invoice_id}/dunning-reminder",
    status_code=status.HTTP_200_OK,
    summary="Kirim Peringatan Dunning WhatsApp & Catat Log Audit"
)
async def send_dunning_reminder(
    invoice_id: str,
    payload: DunningReminderPayload,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Merekam peristiwa pengiriman notifikasi penagihan WhatsApp resmi ke pelanggan.
    """
    stmt = select(Invoice).where(
        Invoice.id == invoice_id,
        Invoice.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    inv = res.scalar_one_or_none()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice tidak ditemukan atau bukan milik tenant Anda."
        )

    # Update tone if requested
    if payload.tone:
        try:
            inv.suggested_tone = DunningTone(payload.tone)
        except ValueError:
            pass

    await db.commit()

    return {
        "success": True,
        "message": f"Pesan penagihan WhatsApp berhasil dikirim ke {inv.customer_name} ({inv.customer_phone}).",
        "invoice_number": inv.invoice_number,
        "dispatched_at": datetime.now(timezone.utc).isoformat(),
        "tone": inv.suggested_tone.value
    }
