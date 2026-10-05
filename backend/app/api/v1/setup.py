"""
FINA-ENTERPRISE Setup API Router — Initial Capital Balance (Modal Awal)
Endpoint untuk konfigurasi awal saldo kas, persediaan, aset tetap, dan utang usaha
saat UMKM pertama kali menggunakan sistem ERP.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC OWNER-only)
Compliance: SAK EMKM Double-Entry Balancing & UU PDP No. 27/2022
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import UserCredential, Tenant, Product, Account, JournalEntry, JournalLine
from app.domain.services import AccountingService
from app.domain.rules.sak_emkm_rules import SAKEMKMValidationError
from app.infrastructure.database import get_db
from app.schemas.setup import (
    InventoryItemPayload,
    FixedAssetPayload,
    InitialBalancePayload,
    InitialBalanceResponse,
    SetupStatusResponse,
    SetupAIRecommendationRequest,
    SetupAIRecommendationResponse,
)
from app.domain.services.ai_service import ai_service

router = APIRouter(prefix="/setup", tags=["Setup Saldo Awal (Modal Awal)"])

# RBAC Guard: Hanya OWNER yang boleh melakukan setup awal
_require_owner = require_role(["OWNER"])


# --- Endpoints ---

@router.get(
    "/status",
    response_model=SetupStatusResponse,
    summary="Cek Status Setup Saldo Awal & Monitoring Modal Tenant"
)
async def check_setup_status(
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mengecek apakah tenant dari pengguna yang terautentikasi
    sudah menyelesaikan setup saldo awal (Initial Capital Balance)
    atau sudah dalam tahap aktif berjalan (Monitoring & Evaluasi Usaha).
    """
    tenant = await db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant tidak ditemukan."
        )

    # 1. Cek total entri jurnal yang telah dibukukan oleh tenant
    journal_count_res = await db.execute(
        select(func.count(JournalEntry.id)).where(JournalEntry.tenant_id == tenant.id)
    )
    total_journals = journal_count_res.scalar() or 0

    # 2. Invarian: Jika tenant sudah memiliki jurnal transaksi, maka otomatis setup selesai
    is_complete = tenant.is_setup_complete or total_journals > 0
    if is_complete and not tenant.is_setup_complete:
        tenant.is_setup_complete = True
        await db.commit()

    initial_equity = 0.0
    initial_cash_bank = 0.0
    initial_fixed_assets = 0.0
    current_total_assets = 0.0
    initial_date = None
    journal_entry_number = None
    audit_merkle_hash = None

    if is_complete:
        # Kalkulasi modal awal dari akun 3101
        eq_res = await db.execute(
            select(func.sum(JournalLine.credit - JournalLine.debit))
            .join(Account, JournalLine.account_id == Account.id)
            .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
            .where(
                JournalEntry.tenant_id == tenant.id,
                Account.code == "3101"
            )
        )
        initial_equity = float(eq_res.scalar() or 0.0)

        # Kas & Bank awal
        cash_res = await db.execute(
            select(func.sum(JournalLine.debit - JournalLine.credit))
            .join(Account, JournalLine.account_id == Account.id)
            .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
            .where(
                JournalEntry.tenant_id == tenant.id,
                Account.code.in_(["1101", "1102"]),
                JournalEntry.entry_number.like("%OB%")
            )
        )
        initial_cash_bank = float(cash_res.scalar() or 0.0)

        # Aset tetap awal
        fa_res = await db.execute(
            select(func.sum(JournalLine.debit - JournalLine.credit))
            .join(Account, JournalLine.account_id == Account.id)
            .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
            .where(
                JournalEntry.tenant_id == tenant.id,
                Account.code.in_(["1201", "1203"]),
                JournalEntry.entry_number.like("%OB%")
            )
        )
        initial_fixed_assets = float(fa_res.scalar() or 0.0)

        # Total aset berjalan saat ini (kategori ASSET)
        curr_asset_res = await db.execute(
            select(func.sum(JournalLine.debit - JournalLine.credit))
            .join(Account, JournalLine.account_id == Account.id)
            .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
            .where(
                JournalEntry.tenant_id == tenant.id,
                Account.category == "ASSET"
            )
        )
        current_total_assets = float(curr_asset_res.scalar() or 0.0)

        # Jurnal pembukuan awal pertama
        first_entry_res = await db.execute(
            select(JournalEntry)
            .where(JournalEntry.tenant_id == tenant.id)
            .order_by(JournalEntry.entry_date)
            .limit(1)
        )
        first_entry = first_entry_res.scalar_one_or_none()
        if first_entry:
            initial_date = first_entry.entry_date
            journal_entry_number = first_entry.entry_number
            audit_merkle_hash = first_entry.audit_merkle_hash

    return SetupStatusResponse(
        is_setup_complete=is_complete,
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        operating_status="OPERATIONAL" if is_complete else "ONBOARDING",
        initial_equity=initial_equity,
        initial_cash_bank=initial_cash_bank,
        initial_fixed_assets=initial_fixed_assets,
        current_total_assets=current_total_assets,
        initial_date=initial_date,
        journal_entry_number=journal_entry_number,
        audit_merkle_hash=audit_merkle_hash,
        total_journals_count=total_journals,
    )


@router.post(
    "/recommend-supplies",
    response_model=SetupAIRecommendationResponse,
    summary="Rekomendasi AI LLM Bahan & Alat Usaha serta Kalkulasi Harga Jual Anti-Rugi",
    status_code=status.HTTP_200_OK,
)
async def recommend_startup_supplies(
    payload: SetupAIRecommendationRequest,
    current_user: UserCredential = Depends(get_current_user),
):
    """
    Rekomendasi cerdas berbasis Google Gemini AI (LLM) untuk menentukan
    kebutuhan bahan baku, alat kerja, dan estimasi harga jual anti-rugi
    sesuai jenis usaha UMKM dan estimasi budget modal pemilik.
    """
    try:
        recommendation = await ai_service.recommend_startup_supplies_and_pricing(
            query=payload.query,
            budget_estimate=payload.budget_estimate,
            target_margin=payload.target_margin,
        )
        return recommendation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memproses rekomendasi AI: {str(e)}"
        )


@router.post(
    "/initial-balance",
    response_model=InitialBalanceResponse,
    summary="Posting Saldo Awal (Modal Awal) UMKM — SAK EMKM",
    status_code=status.HTTP_201_CREATED,
)
async def post_initial_balance(
    payload: InitialBalancePayload,
    current_user: UserCredential = Depends(_require_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Membukukan saldo awal (Opening Balance) untuk UMKM yang baru pertama kali
    menggunakan sistem ERP FINA-ENTERPRISE.

    Alur Bisnis:
    1. Validasi: tenant belum pernah setup (idempotency guard)
    2. Hitung total aset, utang, dan modal pemilik (auto-computed)
    3. Buat jurnal saldo awal multi-line (Double-Entry SAK EMKM)
    4. Buat record Product untuk setiap item persediaan
    5. Tandai tenant sebagai `is_setup_complete = True`

    Persamaan Dasar Akuntansi SAK EMKM:
        Aset = Kewajiban + Modal Pemilik
        Modal Pemilik = Σ Aset - Σ Kewajiban  (auto-computed)
    """
    # 1. Idempotency guard: cegah setup ganda
    tenant = await db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant tidak ditemukan."
        )

    if tenant.is_setup_complete:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Setup saldo awal sudah pernah dilakukan untuk tenant ini. "
                   "Tidak dapat melakukan setup ulang (idempotency protection)."
        )

    # 2. Kalkulasi komponen saldo awal
    total_inventory = sum(
        item.quantity * item.unit_cost for item in payload.inventory_items
    )
    total_equipment = sum(
        a.value for a in payload.fixed_assets if a.asset_type == "equipment"
    )
    total_vehicles = sum(
        a.value for a in payload.fixed_assets if a.asset_type == "vehicle"
    )

    total_assets = (
        payload.cash_on_hand
        + payload.bank_balance
        + total_inventory
        + total_equipment
        + total_vehicles
    )
    total_liabilities = payload.opening_payables
    owner_equity = total_assets - total_liabilities

    if owner_equity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Modal pemilik tidak boleh negatif atau nol. "
                   f"Total Aset (Rp {total_assets:,.0f}) harus lebih besar dari "
                   f"Total Utang (Rp {total_liabilities:,.0f})."
        )

    if total_assets <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Total aset harus lebih besar dari 0. "
                   "Masukkan minimal saldo kas atau stok barang."
        )

    # 3. Susun baris jurnal saldo awal (Opening Balance)
    journal_lines = []

    if payload.cash_on_hand > 0:
        journal_lines.append({
            "account_code": "1101",
            "debit": payload.cash_on_hand,
            "credit": 0,
            "memo": "Saldo awal kas tunai di laci/dompet"
        })

    if payload.bank_balance > 0:
        journal_lines.append({
            "account_code": "1102",
            "debit": payload.bank_balance,
            "credit": 0,
            "memo": "Saldo awal rekening bank/e-wallet"
        })

    if total_inventory > 0:
        journal_lines.append({
            "account_code": "1104",
            "debit": total_inventory,
            "credit": 0,
            "memo": f"Saldo awal persediaan ({len(payload.inventory_items)} item)"
        })

    if total_equipment > 0:
        journal_lines.append({
            "account_code": "1201",
            "debit": total_equipment,
            "credit": 0,
            "memo": "Saldo awal peralatan usaha"
        })

    if total_vehicles > 0:
        journal_lines.append({
            "account_code": "1203",
            "debit": total_vehicles,
            "credit": 0,
            "memo": "Saldo awal kendaraan operasional"
        })

    if payload.opening_payables > 0:
        journal_lines.append({
            "account_code": "2101",
            "debit": 0,
            "credit": payload.opening_payables,
            "memo": "Saldo awal utang usaha pemasok"
        })

    # Modal pemilik (auto-computed sebagai penyeimbang)
    journal_lines.append({
        "account_code": "3101",
        "debit": 0,
        "credit": owner_equity,
        "memo": "Modal pemilik awal (auto-computed: Aset - Kewajiban)"
    })

    # 4. Posting jurnal atomik ACID via AccountingService
    try:
        entry = await AccountingService.post_opening_balance(
            db=db,
            tenant_id=current_user.tenant_id,
            lines=journal_lines,
            effective_date=payload.effective_date,
            description=f"Saldo Awal Usaha per {payload.effective_date} — Setup Modal Awal",
        )
    except SAKEMKMValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

    # 5. Buat record Product untuk setiap item persediaan
    products_created = 0
    for item in payload.inventory_items:
        product = Product(
            id=f"prod-{uuid.uuid4().hex[:12]}",
            tenant_id=current_user.tenant_id,
            name=item.name,
            sku=f"SKU-{uuid.uuid4().hex[:6].upper()}",
            category=item.category,
            price=item.selling_price if item.selling_price > 0 else item.unit_cost * 1.3,
            cogs=item.unit_cost,
            stock=item.quantity,
            unit=item.unit,
        )
        db.add(product)
        products_created += 1

    # 6. Tandai setup selesai (idempotency flag)
    tenant.is_setup_complete = True

    await db.commit()

    return InitialBalanceResponse(
        success=True,
        message=f"Saldo awal berhasil dibukukan. Modal pemilik: Rp {owner_equity:,.0f}",
        journal_entry_number=entry.entry_number,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        owner_equity=owner_equity,
        products_created=products_created,
        audit_merkle_hash=entry.audit_merkle_hash,
    )
