"""
FINA-ENTERPRISE Ledger API Router
Endpoint jurnal pembukuan, Chart of Accounts (COA), dan Laporan SAK EMKM.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC)
Compliance: SAK EMKM Double-Entry Balancing & UU PDP No. 27/2022
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user
from app.domain.models import UserCredential, JournalEntry, JournalLine, Account, AccountCategory
from app.infrastructure.database import get_db

router = APIRouter(prefix="/ledger", tags=["Ledger & Buku Besar SAK EMKM"])


# --- Pydantic Response Schemas ---

class JournalLineSchema(BaseModel):
    id: str
    account_id: str
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    debit: float
    credit: float
    memo: Optional[str] = None


class JournalEntrySchema(BaseModel):
    id: str
    entry_number: str
    entry_date: str
    description: str
    status: str
    audit_merkle_hash: str
    lines: List[JournalLineSchema] = []


class AccountSchema(BaseModel):
    id: str
    code: str
    name: str
    category: str
    normal_balance: str
    balance: float


class FinancialLineItem(BaseModel):
    name: str
    amount: float


class SAKEMKMReportSchema(BaseModel):
    period: str
    total_assets: float
    total_liabilities_and_equity: float
    current_assets: List[FinancialLineItem]
    non_current_assets: List[FinancialLineItem]
    liabilities: List[FinancialLineItem]
    equity: List[FinancialLineItem]
    revenue: float
    cogs: float
    gross_profit: float
    operational_expenses: List[FinancialLineItem]
    net_income_before_tax: float
    is_balanced: bool
    audit_merkle_hash: str


# --- Endpoints ---

@router.get(
    "/entries",
    response_model=List[JournalEntrySchema],
    summary="Daftar Jurnal Pembukuan Tenant (Tenant-Scoped)"
)
async def list_journal_entries(
    current_user: UserCredential = Depends(get_current_user),
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
    current_user: UserCredential = Depends(get_current_user),
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
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghitung laporan keuangan SAK EMKM secara real-time dari data jurnal aktual.
    Laporan ini di-compute langsung dari tabel journal_lines yang sudah di-posting,
    bukan dari data statis.
    """
    # Ambil semua akun dengan saldo terkini
    stmt = select(Account).order_by(Account.code)
    result = await db.execute(stmt)
    accounts = result.scalars().all()

    # Hitung saldo riil dari journal lines milik tenant ini
    lines_stmt = (
        select(JournalLine.account_id, func.sum(JournalLine.debit).label("total_debit"), func.sum(JournalLine.credit).label("total_credit"))
        .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
        .where(JournalEntry.tenant_id == current_user.tenant_id)
        .group_by(JournalLine.account_id)
    )
    lines_result = await db.execute(lines_stmt)
    account_balances = {row.account_id: {"debit": float(row.total_debit or 0), "credit": float(row.total_credit or 0)} for row in lines_result}

    current_assets = []
    non_current_assets = []
    liabilities = []
    equity = []
    revenues = []
    expenses = []

    for acct in accounts:
        bal = account_balances.get(acct.id, {"debit": 0, "credit": 0})
        cat = acct.category.value if isinstance(acct.category, AccountCategory) else str(acct.category)

        # Hitung saldo netto berdasarkan normal balance
        if acct.normal_balance == "DEBIT":
            net = bal["debit"] - bal["credit"]
        else:
            net = bal["credit"] - bal["debit"]

        item = FinancialLineItem(name=f"{acct.code} - {acct.name}", amount=net)

        if cat == "ASSET":
            if acct.code.startswith("12"):
                non_current_assets.append(item)
            else:
                current_assets.append(item)
        elif cat == "LIABILITY":
            liabilities.append(item)
        elif cat == "EQUITY":
            equity.append(item)
        elif cat == "REVENUE":
            revenues.append(item)
        elif cat == "EXPENSE":
            expenses.append(item)

    total_assets = sum(a.amount for a in current_assets) + sum(a.amount for a in non_current_assets)
    total_liabilities = sum(l.amount for l in liabilities)
    total_equity = sum(e.amount for e in equity)
    total_revenue = sum(r.amount for r in revenues)
    total_expenses = sum(e.amount for e in expenses)

    gross_profit = total_revenue
    net_income = total_revenue - total_expenses

    import hashlib
    hash_input = f"{total_assets}:{total_liabilities}:{total_equity}:{net_income}"
    audit_hash = f"sha256:{hashlib.sha256(hash_input.encode()).hexdigest()}"

    return SAKEMKMReportSchema(
        period="Periode Berjalan (1 Januari 2026 s.d. Hari Ini)",
        total_assets=total_assets,
        total_liabilities_and_equity=total_liabilities + total_equity + net_income,
        current_assets=current_assets,
        non_current_assets=non_current_assets,
        liabilities=liabilities,
        equity=equity,
        revenue=total_revenue,
        cogs=0,
        gross_profit=gross_profit,
        operational_expenses=expenses,
        net_income_before_tax=net_income,
        is_balanced=abs(total_assets - (total_liabilities + total_equity + net_income)) < 0.01,
        audit_merkle_hash=audit_hash
    )
