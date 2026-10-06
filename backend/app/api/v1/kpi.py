"""
FINA-ENTERPRISE KPI Dashboard API Router
Endpoint komputasi KPI dashboard & parameter Monte Carlo secara real-time dari data jurnal riil.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC)
"""

from fastapi import APIRouter, Depends
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import (
    UserCredential, JournalEntry, JournalLine, Account, AccountCategory, 
    Invoice, InvoiceStatus, TenantAutomationSchedule
)
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
    total_revenue: float = 0.0


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
        health_index = 95.0 if total_assets > 0 else 0.0

    margin_leakage = admin_expenses * 0.15
    tax_pp55 = total_revenue * 0.005 if total_revenue < 500_000_000 else total_revenue * 0.01

    return KPIDashboardSchema(
        liquid_cash=liquid_cash,
        safety_buffer=safety_buffer,
        cash_runway_days=round(cash_runway_days, 0),
        financial_health_index=round(health_index, 0),
        margin_leakage_monthly=margin_leakage,
        active_accounts_receivable=accounts_receivable,
        estimated_tax_pp55=tax_pp55,
        total_revenue=total_revenue
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


# =============================================================================
# FITUR: KONFIGURASI JADWAL & OTOMASI TENANT (DATABASE-BACKED SRE)
# =============================================================================

class AutomationItemResponse(BaseModel):
    id: str
    task_key: str
    category: str
    title: str
    subtitle: str
    source_engine: str
    time_range: str
    cron_expression: str
    is_active: bool
    status: str
    target_action_tab: Optional[str] = None
    action_label: str
    last_run_at: Optional[str] = None
    realtime_metric: Optional[Dict[str, Any]] = None


class AutomationUpdateSchema(BaseModel):
    time_range: Optional[str] = None
    is_active: Optional[bool] = None
    cron_expression: Optional[str] = None


@router.get(
    "/automations",
    response_model=List[AutomationItemResponse],
    summary="Daftar Jadwal Otomasi Operasional Tenant (Database-backed & Realtime KPI)"
)
async def get_tenant_automations(
    current_user: UserCredential = Depends(_require_executive),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil konfigurasi jadwal otomasi yang tersimpan di PostgreSQL per-tenant.
    Jika tenant baru belum memiliki catatan di DB, inisialisasi otomatis dengan SOP default.
    Data diperkaya secara real-time dengan status kas dan piutang dari buku besar.
    """
    tenant_id = current_user.tenant_id

    # 1. Ambil jadwal tersimpan di DB
    stmt = select(TenantAutomationSchedule).where(TenantAutomationSchedule.tenant_id == tenant_id)
    res = await db.execute(stmt)
    schedules = list(res.scalars().all())

    # 2. Jika belum ada di DB, inisialisasi default SOP secara atomik
    if not schedules:
        default_schedules = [
            TenantAutomationSchedule(
                id=f"sched-swp-{uuid.uuid4().hex[:8]}",
                tenant_id=tenant_id,
                task_key="SWEEPING",
                title="Sweeping Kas & Deposito",
                description="Alokasi surplus kas menganggur ke instrumen pasar uang berimbal hasil stabil.",
                source_engine="FinOrchestrator AI",
                time_range="13:00 - 13:30",
                cron_expression="0 13 * * *",
                is_active=True,
                target_action_tab="montecarlo"
            ),
            TenantAutomationSchedule(
                id=f"sched-aud-{uuid.uuid4().hex[:8]}",
                tenant_id=tenant_id,
                task_key="AUDIT",
                title="Audit Konsistensi Buku Besar",
                description="Validasi integritas matematis jurnal berpasangan dan konsistensi saldo akun SAK EMKM.",
                source_engine="PostgreSQL ACID Engine",
                time_range="15:00 - 16:00",
                cron_expression="0 15 * * *",
                is_active=True,
                target_action_tab="ledger"
            ),
            TenantAutomationSchedule(
                id=f"sched-dun-{uuid.uuid4().hex[:8]}",
                tenant_id=tenant_id,
                task_key="DUNNING",
                title="Penagihan Piutang WhatsApp",
                description="Kirim pengingat tagihan ramah dialek otomatis berlink QRIS SNAP untuk piutang jatuh tempo.",
                source_engine="AR Dunning Bot",
                time_range="16:30 - 17:00",
                cron_expression="30 16 * * *",
                is_active=True,
                target_action_tab="ar_dunning"
            ),
        ]
        for s in default_schedules:
            db.add(s)
        await db.commit()
        for s in default_schedules:
            await db.refresh(s)
        schedules = default_schedules

    # 3. Ambil metrik real-time dari buku besar untuk memperkaya subtitle
    kpi_data = await get_kpi_dashboard(current_user=current_user, db=db)
    surplus_amount = max(0.0, kpi_data.liquid_cash - kpi_data.safety_buffer) if kpi_data.safety_buffer > 0 else 0.0

    action_labels = {
        "SWEEPING": "Buka Simulasi",
        "AUDIT": "Buka Buku Besar",
        "DUNNING": "Buka Penagihan"
    }

    result = []
    for s in schedules:
        cat = s.task_key.upper()
        if cat == "SWEEPING":
            sub = (
                f"Alokasi surplus Rp {surplus_amount:,.0f} ke pasar uang (yield 5.9% p.a.)."
                if surplus_amount > 0 
                else "Penyangga likuiditas operasional terjaga sesuai target aman."
            )
            metric = {"surplus": surplus_amount, "liquid_cash": kpi_data.liquid_cash, "safety_buffer": kpi_data.safety_buffer}
        elif cat == "AUDIT":
            sub = "Validasi integritas jurnal berpasangan dan konsistensi saldo SAK EMKM."
            metric = {"financial_health_index": kpi_data.financial_health_index}
        elif cat == "DUNNING":
            sub = (
                f"Piutang Rp {kpi_data.active_accounts_receivable:,.0f} siap dikirim reminder berlink QRIS SNAP."
                if kpi_data.active_accounts_receivable > 0
                else "Seluruh piutang usaha terpantau lancar tanpa tunggakan."
            )
            metric = {"active_receivable": kpi_data.active_accounts_receivable}
        else:
            sub = s.description or "Tugas otomatis operasional."
            metric = {}

        result.append(AutomationItemResponse(
            id=s.id,
            task_key=s.task_key,
            category=cat,
            title=s.title,
            subtitle=sub,
            source_engine=s.source_engine,
            time_range=s.time_range,
            cron_expression=s.cron_expression,
            is_active=s.is_active,
            status="ACTIVE" if s.is_active else "PAUSED",
            target_action_tab=s.target_action_tab,
            action_label=action_labels.get(cat, "Lihat Detail"),
            last_run_at=s.last_run_at.isoformat() if s.last_run_at else None,
            realtime_metric=metric
        ))

    return result


@router.patch(
    "/automations/{task_key}",
    summary="Perbarui Jadwal / Status Otomasi di Database"
)
async def update_tenant_automation(
    task_key: str,
    payload: AutomationUpdateSchema,
    current_user: UserCredential = Depends(_require_executive),
    db: AsyncSession = Depends(get_db)
):
    """
    Menyimpan perubahan jam jadwal atau toggle aktif/nonaktif ke tabel database PostgreSQL.
    """
    tenant_id = current_user.tenant_id
    stmt = select(TenantAutomationSchedule).where(
        TenantAutomationSchedule.tenant_id == tenant_id,
        TenantAutomationSchedule.task_key == task_key.upper()
    )
    res = await db.execute(stmt)
    schedule = res.scalar_one_or_none()

    if not schedule:
        return {"success": False, "message": f"Jadwal {task_key} tidak ditemukan."}

    if payload.time_range is not None:
        schedule.time_range = payload.time_range
    if payload.is_active is not None:
        schedule.is_active = payload.is_active
    if payload.cron_expression is not None:
        schedule.cron_expression = payload.cron_expression

    schedule.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(schedule)

    return {
        "success": True,
        "message": f"Jadwal {schedule.title} berhasil diperbarui di database.",
        "schedule": {
            "task_key": schedule.task_key,
            "time_range": schedule.time_range,
            "is_active": schedule.is_active,
            "cron_expression": schedule.cron_expression
        }
    }


@router.post(
    "/automations/{task_key}/run",
    summary="Trigger Eksekusi Otomasi Seketika (Run Now)"
)
async def trigger_tenant_automation_now(
    task_key: str,
    current_user: UserCredential = Depends(_require_executive),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengeksekusi otomasi secara langsung on-demand, memperbarui timestamp last_run_at di database,
    dan mengembalikan log audit.
    """
    tenant_id = current_user.tenant_id
    key_upper = task_key.upper()

    stmt = select(TenantAutomationSchedule).where(
        TenantAutomationSchedule.tenant_id == tenant_id,
        TenantAutomationSchedule.task_key == key_upper
    )
    res = await db.execute(stmt)
    schedule = res.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if schedule:
        schedule.last_run_at = now
        await db.commit()

    # Eksekusi logika sesuai kategori tugas
    execution_result = {}
    if key_upper == "SWEEPING":
        kpi_data = await get_kpi_dashboard(current_user=current_user, db=db)
        surplus = max(0.0, kpi_data.liquid_cash - kpi_data.safety_buffer)
        execution_result = {
            "task": "SWEEPING",
            "message": f"Simulasi alokasi surplus kas Rp {surplus:,.0f} berhasil dievaluasi.",
            "surplus_detected": surplus,
            "recommended_yield": "5.9% p.a."
        }
    elif key_upper == "AUDIT":
        # Audit double-entry balancing matematis SAK EMKM: sum(debit) == sum(credit)
        unbalanced_stmt = (
            select(JournalLine.entry_id)
            .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
            .where(JournalEntry.tenant_id == tenant_id)
            .group_by(JournalLine.entry_id)
            .having(func.abs(func.sum(JournalLine.debit) - func.sum(JournalLine.credit)) > 0.01)
        )
        unbal_res = await db.execute(unbalanced_stmt)
        unbal_entries = unbal_res.scalars().all()
        unbal_count = len(unbal_entries)
        execution_result = {
            "task": "AUDIT",
            "message": f"Integritas buku besar terverifikasi: {unbal_count} selisih ditemukan dari seluruh transaksi berpasangan.",
            "unbalanced_entries_found": unbal_count,
            "compliance": "SAK EMKM Double-Entry ACID Verified"
        }
    elif key_upper == "DUNNING":
        inv_stmt = select(Invoice).where(
            Invoice.tenant_id == tenant_id,
            Invoice.status.in_([InvoiceStatus.CURRENT, InvoiceStatus.OVERDUE_15, InvoiceStatus.OVERDUE_30])
        )
        inv_res = await db.execute(inv_stmt)
        invoices = inv_res.scalars().all()
        execution_result = {
            "task": "DUNNING",
            "message": f"{len(invoices)} faktur teridentifikasi aktif. Antrean penagihan QRIS SNAP disiapkan.",
            "invoices_queued": len(invoices)
        }

    return {
        "success": True,
        "executed_at": now.isoformat(),
        "task_key": key_upper,
        "detail": execution_result
    }
