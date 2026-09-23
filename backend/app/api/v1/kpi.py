"""
FINA-ENTERPRISE KPI Dashboard API Router
Endpoint komputasi KPI dashboard secara real-time dari data jurnal riil.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC)
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.v1.auth import get_current_user
from app.domain.models import UserCredential, JournalEntry, JournalLine, Account, AccountCategory, Invoice, InvoiceStatus
from app.infrastructure.database import get_db

router = APIRouter(prefix="/kpi", tags=["Executive KPI Dashboard"])


class KPIDashboardSchema(BaseModel):
    liquid_cash: float
    safety_buffer: float
    cash_runway_days: float
    financial_health_index: float
    margin_leakage_monthly: float
    active_accounts_receivable: float
    estimated_tax_pp55: float


@router.get(
    "/dashboard",
    response_model=KPIDashboardSchema,
    summary="KPI Dashboard Eksekutif (Computed Real-time)"
)
async def get_kpi_dashboard(
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghitung KPI dashboard secara real-time dari data jurnal dan invoice aktual.
    
    Metrik yang dihitung:
    - liquid_cash: Saldo kas & setara kas (akun 11xx)
    - safety_buffer: Estimasi 38% dari liquid_cash sebagai penyangga operasional
    - cash_runway_days: Estimasi berapa hari kas bertahan dengan laju pengeluaran saat ini
    - financial_health_index: Skor kesehatan (0-100) berdasarkan rasio aset vs kewajiban
    - margin_leakage_monthly: Estimasi kebocoran margin dari biaya non-esensial
    - active_accounts_receivable: Total piutang usaha aktif (akun 1103)
    - estimated_tax_pp55: Estimasi pajak PP 55/2022 (0.5% dari omzet < Rp 500jt)
    """
    tenant_id = current_user.tenant_id

    # Hitung saldo per akun dari journal lines tenant ini
    lines_stmt = (
        select(
            JournalLine.account_id,
            func.sum(JournalLine.debit).label("total_debit"),
            func.sum(JournalLine.credit).label("total_credit")
        )
        .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
        .where(JournalEntry.tenant_id == tenant_id)
        .group_by(JournalLine.account_id)
    )
    lines_result = await db.execute(lines_stmt)
    balances = {row.account_id: {"debit": float(row.total_debit or 0), "credit": float(row.total_credit or 0)} for row in lines_result}

    # Ambil semua akun
    accounts_stmt = select(Account)
    accounts_result = await db.execute(accounts_stmt)
    accounts = accounts_result.scalars().all()

    liquid_cash = 0.0
    accounts_receivable = 0.0
    total_revenue = 0.0
    total_expenses = 0.0
    total_assets = 0.0
    total_liabilities = 0.0
    admin_expenses = 0.0

    for acct in accounts:
        bal = balances.get(acct.id, {"debit": 0, "credit": 0})
        cat = acct.category.value if isinstance(acct.category, AccountCategory) else str(acct.category)

        if acct.normal_balance == "DEBIT":
            net = bal["debit"] - bal["credit"]
        else:
            net = bal["credit"] - bal["debit"]

        if cat == "ASSET":
            total_assets += net
            # Kas & setara kas: akun 1101, 1102
            if acct.code in ("1101", "1102"):
                liquid_cash += net
            # Piutang usaha: akun 1103
            elif acct.code == "1103":
                accounts_receivable += net
        elif cat == "LIABILITY":
            total_liabilities += net
        elif cat == "REVENUE":
            total_revenue += net
        elif cat == "EXPENSE":
            total_expenses += net
            # Admin/non-esensial: akun 6xxx
            if acct.code.startswith("6"):
                admin_expenses += net

    # Hitung metrik turunan
    safety_buffer = liquid_cash * 0.38
    daily_expense = total_expenses / 270 if total_expenses > 0 else 1  # ~270 hari kerja dalam setahun
    cash_runway_days = liquid_cash / daily_expense if daily_expense > 0 else 999

    # Financial Health Index (0-100)
    if total_liabilities > 0:
        health_ratio = total_assets / total_liabilities
        health_index = min(100, max(0, health_ratio * 20))
    else:
        health_index = 95.0 if total_assets > 0 else 50.0

    # Margin leakage: biaya admin yang bisa ditekan
    margin_leakage = admin_expenses * 0.15  # 15% dari biaya admin dianggap potensi penghematan

    # Estimasi PPh Final PP 55/2022 (0.5% dari omzet kotor < Rp 500jt)
    tax_pp55 = total_revenue * 0.005 if total_revenue < 500_000_000 else total_revenue * 0.01

    return KPIDashboardSchema(
        liquid_cash=liquid_cash,
        safety_buffer=safety_buffer,
        cash_runway_days=round(cash_runway_days, 0),
        financial_health_index=round(health_index, 0),
        margin_leakage_monthly=margin_leakage,
        active_accounts_receivable=accounts_receivable,
        estimated_tax_pp55=tax_pp55
    )
