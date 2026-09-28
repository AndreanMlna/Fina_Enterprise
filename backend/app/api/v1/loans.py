"""
FINA-ENTERPRISE Anti-Predatory Loan Deobfuscator API Router
Endpoint evaluasi pinjaman digital, kalkulasi APR riil, dan audit legalitas OJK.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC)
Database: PostgreSQL 16 ('loan_evaluations' table)
"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import UserCredential, LoanEvaluation
from app.domain.services.ai_service import ai_service
from app.infrastructure.database import get_db

router = APIRouter(prefix="/loans", tags=["Anti-Predatory Loan Deobfuscator"])

_require_manager = require_role(["OWNER", "MANAGER"])


# --- Pydantic Schemas ---

class LoanEvaluationSchema(BaseModel):
    id: str
    provider_name: str
    requested_amount: float
    admin_fee_percent: float
    upfront_deduction: float
    disbursed_amount: float
    daily_interest_rate: float
    tenor_days: int
    total_repayment: float
    effective_annual_apr: float
    is_legal_ojk: bool
    threat_level: str
    notes: Optional[str] = None
    created_at: str


class CreateLoanEvaluationPayload(BaseModel):
    provider_name: str = Field(..., min_length=2, max_length=255)
    requested_amount: float = Field(..., gt=0)
    admin_fee_percent: float = Field(..., ge=0, le=100)
    daily_interest_rate: float = Field(..., ge=0)
    tenor_days: int = Field(..., gt=0)
    notes: Optional[str] = None


# --- Endpoints ---

@router.get(
    "/evaluations",
    response_model=List[LoanEvaluationSchema],
    summary="Daftar Evaluasi Pinjaman Tersimpan Tenant (PostgreSQL-backed)"
)
async def list_loan_evaluations(
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, le=100)
):
    """
    Mengambil riwayat evaluasi pinjaman yang pernah diuji oleh tenant.
    """
    stmt = (
        select(LoanEvaluation)
        .where(LoanEvaluation.tenant_id == current_user.tenant_id)
        .order_by(LoanEvaluation.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    return [
        LoanEvaluationSchema(
            id=rec.id,
            provider_name=rec.provider_name,
            requested_amount=float(rec.requested_amount),
            admin_fee_percent=float(rec.admin_fee_percent),
            upfront_deduction=float(rec.upfront_deduction),
            disbursed_amount=float(rec.disbursed_amount),
            daily_interest_rate=float(rec.daily_interest_rate),
            tenor_days=rec.tenor_days,
            total_repayment=float(rec.total_repayment),
            effective_annual_apr=float(rec.effective_annual_apr),
            is_legal_ojk=rec.is_legal_ojk,
            threat_level=rec.threat_level,
            notes=rec.notes,
            created_at=rec.created_at.isoformat() if rec.created_at else ""
        )
        for rec in records
    ]


@router.post(
    "/evaluations",
    response_model=LoanEvaluationSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Uji & Simpan Hasil Evaluasi Pinjaman ke Basis Data"
)
async def create_loan_evaluation(
    payload: CreateLoanEvaluationPayload,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghitung APR Efektif Riil Tahunan secara matematis dan menyimpannya ke database PostgreSQL.
    """
    upfront = (payload.requested_amount * payload.admin_fee_percent) / 100.0
    disbursed = max(1.0, payload.requested_amount - upfront)
    total_interest = payload.requested_amount * (payload.daily_interest_rate / 100.0) * payload.tenor_days
    total_repayment = payload.requested_amount + total_interest
    total_cost_of_borrowing = total_repayment - disbursed

    # Annual Effective APR formula: ((Total Cost / Disbursed) / Tenor Days) * 365 * 100
    effective_apr = round(((total_cost_of_borrowing / disbursed) / payload.tenor_days) * 365.0 * 100.0, 1)

    # Standar OJK: Bunga harian maks 0.3%/hari (~109.5% APR) & biaya admin maks 10%
    is_legal_ojk = effective_apr <= 110.0 and payload.admin_fee_percent <= 10.0

    if effective_apr > 150.0:
        threat_level = "PREDATORY_EXTREME"
    elif effective_apr > 50.0:
        threat_level = "MODERATE"
    else:
        threat_level = "SAFE"

    # Evaluasi naratif risiko & OJK dengan model Gemini AI
    ai_risk_notes = ai_service.evaluate_loan_threat(
        provider_name=payload.provider_name,
        requested_amount=payload.requested_amount,
        effective_apr=effective_apr,
        admin_fee_percent=payload.admin_fee_percent,
        daily_rate=payload.daily_interest_rate,
        notes=payload.notes
    )

    final_notes = f"{payload.notes} | AI Diagnosa: {ai_risk_notes}" if payload.notes else ai_risk_notes

    loan_id = f"loan-{uuid.uuid4().hex[:12]}"
    new_eval = LoanEvaluation(
        id=loan_id,
        tenant_id=current_user.tenant_id,
        provider_name=payload.provider_name.strip(),
        requested_amount=payload.requested_amount,
        admin_fee_percent=payload.admin_fee_percent,
        upfront_deduction=upfront,
        disbursed_amount=disbursed,
        daily_interest_rate=payload.daily_interest_rate,
        tenor_days=payload.tenor_days,
        total_repayment=total_repayment,
        effective_annual_apr=effective_apr,
        is_legal_ojk=is_legal_ojk,
        threat_level=threat_level,
        notes=final_notes,
        created_at=datetime.now(timezone.utc)
    )

    db.add(new_eval)
    await db.commit()
    await db.refresh(new_eval)

    return LoanEvaluationSchema(
        id=new_eval.id,
        provider_name=new_eval.provider_name,
        requested_amount=float(new_eval.requested_amount),
        admin_fee_percent=float(new_eval.admin_fee_percent),
        upfront_deduction=float(new_eval.upfront_deduction),
        disbursed_amount=float(new_eval.disbursed_amount),
        daily_interest_rate=float(new_eval.daily_interest_rate),
        tenor_days=new_eval.tenor_days,
        total_repayment=float(new_eval.total_repayment),
        effective_annual_apr=float(new_eval.effective_annual_apr),
        is_legal_ojk=new_eval.is_legal_ojk,
        threat_level=new_eval.threat_level,
        notes=new_eval.notes,
        created_at=new_eval.created_at.isoformat() if new_eval.created_at else ""
    )


@router.post(
    "/evaluate-preview",
    response_model=LoanEvaluationSchema,
    summary="Simulasi Diagnosa Pinjaman Tanpa Menyimpan ke Basis Data"
)
async def preview_loan_evaluation(
    payload: CreateLoanEvaluationPayload,
    current_user: UserCredential = Depends(_require_manager)
):
    """
    Menghitung APR Efektif dan menghasilkan diagnosa hukum/finansial seketika
    tanpa menyimpan ke PostgreSQL (mode kalkulator interaktif).
    """
    upfront = (payload.requested_amount * payload.admin_fee_percent) / 100.0
    disbursed = max(1.0, payload.requested_amount - upfront)
    total_interest = payload.requested_amount * (payload.daily_interest_rate / 100.0) * payload.tenor_days
    total_repayment = payload.requested_amount + total_interest
    total_cost = total_repayment - disbursed

    effective_apr = round(((total_cost / disbursed) / payload.tenor_days) * 365.0 * 100.0, 1)
    is_legal_ojk = effective_apr <= 110.0 and payload.admin_fee_percent <= 10.0

    if effective_apr > 150.0:
        threat_level = "PREDATORY_EXTREME"
    elif effective_apr > 50.0:
        threat_level = "MODERATE"
    else:
        threat_level = "SAFE"

    ai_risk = ai_service.evaluate_loan_threat(
        provider_name=payload.provider_name,
        requested_amount=payload.requested_amount,
        effective_apr=effective_apr,
        admin_fee_percent=payload.admin_fee_percent,
        daily_rate=payload.daily_interest_rate,
        notes=payload.notes
    )

    return LoanEvaluationSchema(
        id="preview",
        provider_name=payload.provider_name.strip(),
        requested_amount=payload.requested_amount,
        admin_fee_percent=payload.admin_fee_percent,
        upfront_deduction=upfront,
        disbursed_amount=disbursed,
        daily_interest_rate=payload.daily_interest_rate,
        tenor_days=payload.tenor_days,
        total_repayment=total_repayment,
        effective_annual_apr=effective_apr,
        is_legal_ojk=is_legal_ojk,
        threat_level=threat_level,
        notes=ai_risk,
        created_at=datetime.now(timezone.utc).isoformat()
    )


@router.delete(
    "/evaluations/{loan_id}",
    status_code=status.HTTP_200_OK,
    summary="Hapus Riwayat Evaluasi Pinjaman"
)
async def delete_loan_evaluation(
    loan_id: str,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(LoanEvaluation).where(
        LoanEvaluation.id == loan_id,
        LoanEvaluation.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()

    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data evaluasi tidak ditemukan.")

    await db.delete(rec)
    await db.commit()
    return {"success": True, "message": "Evaluasi pinjaman berhasil dihapus."}
