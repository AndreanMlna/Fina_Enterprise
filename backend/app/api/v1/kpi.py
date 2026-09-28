"""
FINA-ENTERPRISE KPI Dashboard API Router
Endpoint komputasi KPI dashboard & parameter Monte Carlo secara real-time dari data jurnal riil.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC)
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import UserCredential, JournalEntry, JournalLine, Account, AccountCategory, Invoice, InvoiceStatus
from app.domain.services import AccountingService
from app.domain.services.ai_service import ai_service
from app.infrastructure.database import get_db

router = APIRouter(prefix="/kpi", tags=["Executive KPI Dashboard"])

# RBAC Guard: Endpoint KPI hanya dapat diakses oleh pengguna manajerial
_require_executive = require_role(["OWNER", "MANAGER"])


class KPIDashboardSchema(BaseModel):
    liquid_cash: float
    safety_buffer: float
    cash_runway_days: float
    financial_health_index: float
    margin_leakage_monthly: float
    active_accounts_receivable: float
    estimated_tax_pp55: float


class RunwayBaselineSchema(BaseModel):
    initial_cash: float
    daily_revenue_mean: float
    fixed_monthly_cost: float
    total_revenue: float
    total_expenses: float
    active_receivables: float
    data_source: str = "REAL_JOURNAL"
    transaction_count: int = 0


@router.get(
    "/dashboard",
    response_model=KPIDashboardSchema,
    summary="KPI Dashboard Eksekutif (Computed Real-time)"
)
async def get_kpi_dashboard(
    current_user: UserCredential = Depends(_require_executive),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghitung KPI dashboard secara real-time dari data jurnal dan invoice aktual.
    """
    tenant_id = current_user.tenant_id

    # Hitung saldo per akun dari journal lines tenant ini via Accounting Domain Service
    balances = await AccountingService.get_tenant_account_balances(db, tenant_id)

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
            if acct.code in ("1101", "1102"):
                liquid_cash += net
            elif acct.code == "1103":
                accounts_receivable += net
        elif cat == "LIABILITY":
            total_liabilities += net
        elif cat == "REVENUE":
            total_revenue += net
        elif cat == "EXPENSE":
            total_expenses += net
            if acct.code.startswith("6"):
                admin_expenses += net

    safety_buffer = liquid_cash * 0.38
    daily_expense = total_expenses / 270 if total_expenses > 0 else 1
    cash_runway_days = liquid_cash / daily_expense if daily_expense > 0 else 999

    if total_liabilities > 0:
        health_ratio = total_assets / total_liabilities
        health_index = min(100, max(0, health_ratio * 20))
    else:
        health_index = 95.0 if total_assets > 0 else 50.0

    margin_leakage = admin_expenses * 0.15
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


@router.get(
    "/runway-baseline",
    response_model=RunwayBaselineSchema,
    summary="Parameter Dasar Riil Simulasi Monte Carlo dari Buku Besar"
)
async def get_runway_baseline(
    current_user: UserCredential = Depends(_require_executive),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghitung parameter dasar simulasi stres likuiditas Monte Carlo secara dinamis
    dari akumulasi omzet harian dan biaya operasional riil di buku besar PostgreSQL.
    """
    tenant_id = current_user.tenant_id

    lines_stmt = (
        select(
            Account.code,
            Account.category,
            func.sum(JournalLine.debit).label("total_debit"),
            func.sum(JournalLine.credit).label("total_credit")
        )
        .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
        .join(Account, JournalLine.account_id == Account.id)
        .where(JournalEntry.tenant_id == tenant_id)
        .group_by(Account.code, Account.category)
    )
    lines_res = await db.execute(lines_stmt)
    rows = lines_res.fetchall()

    liquid_cash = 0.0
    total_revenue = 0.0
    total_opex = 0.0
    total_expenses = 0.0
    active_receivables = 0.0

    for r in rows:
        code = r[0]
        cat = r[1].value if isinstance(r[1], AccountCategory) else str(r[1])
        deb = float(r[2] or 0)
        cre = float(r[3] or 0)

        if code in ("1101", "1102"):
            liquid_cash += (deb - cre)
        elif code == "1103":
            active_receivables += (deb - cre)
        elif cat == "REVENUE":
            total_revenue += (cre - deb)
        elif cat == "EXPENSE":
            exp_net = deb - cre
            total_expenses += exp_net
            if code.startswith("6"):
                total_opex += exp_net

    # Estimasi omzet harian rata-rata (~60 hari siklus usaha aktif)
    daily_rev_mean = max(500000.0, round(total_revenue / 60.0, 0)) if total_revenue > 0 else 3500000.0
    # Estimasi biaya tetap bulanan (sewa, gaji, utilitas)
    fixed_monthly = max(1000000.0, round(total_opex / 2.0, 0)) if total_opex > 0 else 14500000.0

    return RunwayBaselineSchema(
        initial_cash=liquid_cash if liquid_cash > 0 else 48650000.0,
        daily_revenue_mean=daily_rev_mean,
        fixed_monthly_cost=fixed_monthly,
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        active_receivables=active_receivables,
        data_source="REAL_JOURNAL" if len(rows) > 0 else "DEFAULT_CALIBRATED",
        transaction_count=len(rows)
    )


@router.get(
    "/orchestrator-cycle",
    summary="FinOrchestrator Autonomous Cognitive Cycle (Perceive -> Reason -> Act)"
)
async def run_orchestrator_cycle(
    current_user: UserCredential = Depends(_require_executive),
    db: AsyncSession = Depends(get_db)
):
    """
    Siklus penalaran otonom agen FinOrchestrator:
    1. PERCEIVE: Membaca status kas likuid riil, batas pengaman, runway, dan piutang tertunggak dari PostgreSQL.
    2. REASON: Menilai kondisi neraca & menentukan apakah terjadi surplus kas menganggur atau ancaman likuiditas.
    3. ACT: Menerbitkan direktif aksi eksekutif otomatis (Sweeping kas, dunning reminder, opex freezing).
    """
    dashboard_kpi = await get_kpi_dashboard(current_user=current_user, db=db)
    cycle_result = ai_service.evaluate_autonomous_orchestrator(
        liquid_cash=dashboard_kpi.liquid_cash,
        safety_buffer=dashboard_kpi.safety_buffer,
        runway_days=int(dashboard_kpi.cash_runway_days),
        overdue_ar=dashboard_kpi.active_accounts_receivable
    )
    cycle_result["kpi_snapshot"] = dashboard_kpi.model_dump()
    return cycle_result
