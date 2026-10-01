"""
FINA-ENTERPRISE Ledger API Router
Endpoint jurnal pembukuan, Chart of Accounts (COA), dan Laporan SAK EMKM.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC)
Compliance: SAK EMKM Double-Entry Balancing & UU PDP No. 27/2022
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import UserCredential, JournalEntry, JournalLine, Account, AccountCategory
from app.domain.services import AccountingService
from app.infrastructure.database import get_db
from app.schemas.ledger import (
    JournalLineSchema,
    JournalEntrySchema,
    AccountSchema,
    FinancialLineItem,
    SAKEMKMReportSchema,
)

router = APIRouter(prefix="/ledger", tags=["Ledger & Buku Besar SAK EMKM"])

# RBAC Guard: Buku besar hanya dapat diakses oleh peran manajerial dan auditor
_require_ledger_access = require_role(["OWNER", "MANAGER", "AUDITOR"])


# --- Endpoints ---

@router.get(
    "/entries",
    response_model=List[JournalEntrySchema],
    summary="Daftar Jurnal Pembukuan Tenant (Tenant-Scoped)"
)
async def list_journal_entries(
    current_user: UserCredential = Depends(_require_ledger_access),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0)
):
    """
    Mengambil daftar jurnal pembukuan berpasangan (double-entry) yang dimiliki
    oleh tenant dari pengguna terotentikasi. Data di-filter secara ketat
    berdasarkan tenant_id dari klaim JWT untuk menjaga isolasi multi-tenant.
    """
    stmt = (
        select(JournalEntry)
        .options(selectinload(JournalEntry.lines).selectinload(JournalLine.account))
        .where(JournalEntry.tenant_id == current_user.tenant_id)
        .order_by(JournalEntry.entry_date.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    entries = result.scalars().unique().all()

    response = []
    for entry in entries:
        lines = []
        for line in entry.lines:
            lines.append(JournalLineSchema(
                id=line.id,
                account_id=line.account_id,
                account_code=line.account.code if line.account else None,
                account_name=line.account.name if line.account else None,
                debit=float(line.debit or 0),
                credit=float(line.credit or 0),
                memo=line.memo
            ))
        response.append(JournalEntrySchema(
            id=entry.id,
            entry_number=entry.entry_number,
            entry_date=entry.entry_date,
            description=entry.description,
            status=entry.status,
            audit_merkle_hash=entry.audit_merkle_hash,
            lines=lines
        ))

    return response


@router.get(
    "/accounts",
    response_model=List[AccountSchema],
    summary="Chart of Accounts (COA) Bagan Akun Standar SAK EMKM"
)
async def list_accounts(
    current_user: UserCredential = Depends(_require_ledger_access),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil seluruh bagan akun (Chart of Accounts) standar SAK EMKM.
    COA bersifat global (dipakai bersama seluruh tenant).
    """
    stmt = select(Account).order_by(Account.code)
    result = await db.execute(stmt)
    accounts = result.scalars().all()

    return [
        AccountSchema(
            id=a.id,
            code=a.code,
            name=a.name,
            category=a.category.value if isinstance(a.category, AccountCategory) else str(a.category),
            normal_balance=a.normal_balance,
            balance=float(a.balance or 0)
        )
        for a in accounts
    ]


@router.get(
    "/sak-emkm-report",
    response_model=SAKEMKMReportSchema,
    summary="Laporan Keuangan SAK EMKM (Computed dari Database Riil)"
)
async def get_sak_emkm_report(
    current_user: UserCredential = Depends(_require_ledger_access),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghitung laporan keuangan SAK EMKM secara real-time dari data jurnal aktual.
    Komputasi dan pembuktian matematis didelegasikan ke Accounting Domain Service (Clean Architecture).
    """
    report_data = await AccountingService.compute_sak_emkm_report(db, current_user.tenant_id)
    return SAKEMKMReportSchema(**report_data)

