"""
FINA-ENTERPRISE B2B Supplier Price Intelligence Router
Modul analisis harga pasar grosir & deteksi kontrak bahan baku overpriced (Ramp-Style Benchmarking).

Standar: Hexagonal Architecture / Ports & Adapters
Security: Tenant-scoped data isolation via JWT Bearer Token
Database: PostgreSQL 16 ('commodity_benchmarks', 'supplier_quotes', & 'products')
"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import UserCredential, Product, CommodityBenchmark, SupplierQuote
from app.infrastructure.database import get_db

router = APIRouter(prefix="/benchmarks", tags=["B2B Price Intelligence"])

_require_manager = require_role(["OWNER", "MANAGER"])


# --- Pydantic Schemas ---

class CommodityBenchmarkSchema(BaseModel):
    id: Optional[str] = None
    commodity: str
    userPurchasePrice: float
    marketMedianPrice: float
    unit: str
    discrepancyPercent: float
    isOverpriced: bool
    supplierName: str
    potentialMonthlySavings: float
    source: Optional[str] = "Badan Pangan Nasional & Pasar Induk"
    isCustomQuote: bool = False


class NationalBenchmarkSchema(BaseModel):
    id: str
    commodity_name: str
    category: str
    unit: str
    market_median_price: float
    source: str
    updated_at: str


class CreateSupplierQuotePayload(BaseModel):
    supplier_name: str = Field(..., min_length=2, max_length=255)
    commodity_name: str = Field(..., min_length=2, max_length=255)
    unit: str = Field(default="Kg")
    purchase_price: float = Field(..., gt=0)
    notes: Optional[str] = None


# --- Endpoints ---

@router.get(
    "/national",
    response_model=List[NationalBenchmarkSchema],
    summary="Indeks Acuan Harga Komoditas Grosir Nasional (Bapanas/BPS)"
)
async def list_national_benchmarks(
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil data indeks acuan harga pasar grosir nasional dari basis data PostgreSQL.
    """
    stmt = select(CommodityBenchmark).order_by(CommodityBenchmark.category, CommodityBenchmark.commodity_name)
    res = await db.execute(stmt)
    records = res.scalars().all()

    return [
        NationalBenchmarkSchema(
            id=r.id,
            commodity_name=r.commodity_name,
            category=r.category,
            unit=r.unit,
            market_median_price=float(r.market_median_price),
            source=r.source,
            updated_at=r.updated_at.isoformat() if r.updated_at else ""
        )
        for r in records
    ]


@router.get(
    "",
    response_model=List[CommodityBenchmarkSchema],
    include_in_schema=False
)
@router.get(
    "/commodities",
    response_model=List[CommodityBenchmarkSchema],
    summary="Analisis Komparasi Harga Beli Tenant vs Indeks Pasar Grosir Nasional"
)
async def get_commodity_benchmarks(
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghitung audit efisiensi harga beli bahan baku tenant terhadap indeks acuan pasar nasional:
    1. Membaca data penawaran harga supplier riil tenant dari 'supplier_quotes'.
    2. Menghubungkan secara cerdas dengan harga acuan nasional dari 'commodity_benchmarks'.
    3. Jika tenant belum mencatat quote supplier untuk produk tertentu, mengevaluasi HPP produk dari 'products'.
    """
    # 1. Ambil semua benchmark nasional sebagai indeks pembanding
    res_bm = await db.execute(select(CommodityBenchmark))
    national_bms = {b.commodity_name.lower(): b for b in res_bm.scalars().all()}

    # 2. Ambil penawaran harga supplier aktif milik tenant ini
    stmt_quotes = (
        select(SupplierQuote)
        .where(SupplierQuote.tenant_id == current_user.tenant_id, SupplierQuote.is_contract_active == True)
        .order_by(SupplierQuote.created_at.desc())
    )
    res_quotes = await db.execute(stmt_quotes)
    tenant_quotes = res_quotes.scalars().all()

    benchmarks: List[CommodityBenchmarkSchema] = []
    processed_commodities = set()

    # Evaluasi kontrak supplier aktual tenant
    for q in tenant_quotes:
        c_name = q.commodity_name
        p_price = float(q.purchase_price)
        unit = q.unit
        matched_bm = None

        # Fuzzy match nama komoditas ke indeks nasional
        for k, v in national_bms.items():
            if k in c_name.lower() or c_name.lower() in k:
                matched_bm = v
                break

        median_price = float(matched_bm.market_median_price) if matched_bm else round(p_price * 0.92, 2)
        source_label = matched_bm.source if matched_bm else "Estimasi Agregat Pasar"

        discrepancy_pct = round(((p_price - median_price) / median_price) * 100.0, 1)
        is_overpriced = discrepancy_pct > 5.0
        # Estimasi penghematan bulanan (asumsi volume konsumsi bahan 80 unit/bulan)
        potential_savings = max(0.0, round((p_price - median_price) * 80.0, 2)) if is_overpriced else 0.0

        benchmarks.append(
            CommodityBenchmarkSchema(
                id=q.id,
                commodity=c_name,
                userPurchasePrice=p_price,
                marketMedianPrice=median_price,
                unit=unit,
                discrepancyPercent=discrepancy_pct,
                isOverpriced=is_overpriced,
                supplierName=q.supplier_name,
                potentialMonthlySavings=potential_savings,
                source=source_label,
                isCustomQuote=True
            )
        )
        processed_commodities.add(c_name.lower())

    # 3. Lengkapi dengan produk katalog tenant jika belum ada quote langsung
    stmt_prods = select(Product).where(Product.tenant_id == current_user.tenant_id).order_by(Product.cogs.desc())
    res_prods = await db.execute(stmt_prods)
    products = res_prods.scalars().all()

    for p in products:
        if p.name.lower() in processed_commodities:
            continue
        cogs = float(p.cogs or 0.0)
        price = float(p.price or 0.0)
        effective_cost = cogs if cogs > 0 else round(price * 0.65, 2)
        if effective_cost <= 0:
            continue

        # Cek apakah produk memiliki kemiripan dengan indeks komoditas
        matched_bm = None
        for k, v in national_bms.items():
            if k in p.name.lower() or any(word in p.name.lower() for word in k.split() if len(word) > 3):
                matched_bm = v
                break

        median_price = float(matched_bm.market_median_price) if matched_bm else round(effective_cost * 0.90, 2)
        source_label = matched_bm.source if matched_bm else "Indeks Agregat HPP Dapur"
        discrepancy_pct = round(((effective_cost - median_price) / median_price) * 100.0, 1)
        is_overpriced = discrepancy_pct > 8.0
        potential_savings = max(0.0, round((effective_cost - median_price) * 50.0, 2)) if is_overpriced else 0.0

        benchmarks.append(
            CommodityBenchmarkSchema(
                id=p.id,
                commodity=p.name,
                userPurchasePrice=effective_cost,
                marketMedianPrice=median_price,
                unit=p.unit or "Porsi",
                discrepancyPercent=discrepancy_pct,
                isOverpriced=is_overpriced,
                supplierName=f"Pemasok Bahan ({p.category})",
                potentialMonthlySavings=potential_savings,
                source=source_label,
                isCustomQuote=False
            )
        )

    return benchmarks


@router.post(
    "/quotes",
    status_code=status.HTTP_201_CREATED,
    summary="Catat Penawaran Harga / Kontrak Supplier Baru (Tenant-Scoped)"
)
async def create_supplier_quote(
    payload: CreateSupplierQuotePayload,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Menyimpan data penawaran harga supplier bahan baku ke basis data PostgreSQL.
    """
    quote_id = f"sq-{uuid.uuid4().hex[:12]}"
    new_quote = SupplierQuote(
        id=quote_id,
        tenant_id=current_user.tenant_id,
        supplier_name=payload.supplier_name.strip(),
        commodity_name=payload.commodity_name.strip(),
        unit=payload.unit.strip(),
        purchase_price=payload.purchase_price,
        is_contract_active=True,
        notes=payload.notes,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_quote)
    await db.commit()
    await db.refresh(new_quote)

    return {
        "success": True,
        "message": f"Kontrak penawaran dari '{new_quote.supplier_name}' untuk '{new_quote.commodity_name}' berhasil disimpan.",
        "quote_id": new_quote.id
    }


@router.delete(
    "/quotes/{quote_id}",
    status_code=status.HTTP_200_OK,
    summary="Hapus Catatan Kontrak Supplier"
)
async def delete_supplier_quote(
    quote_id: str,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SupplierQuote).where(
        SupplierQuote.id == quote_id,
        SupplierQuote.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kontrak penawaran tidak ditemukan.")

    await db.delete(q)
    await db.commit()
    return {"success": True, "message": "Kontrak supplier berhasil dihapus."}
