"""
FINA-ENTERPRISE POS (Point of Sale) API Router
Modul transaksi kasir cepat untuk toko fisik, gerai, dan operasional UMKM.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC), Server-Side Price Verification
Compliance: SAK EMKM Double-Entry Balancing & UU PDP No. 27/2022
Database: PostgreSQL 16 + pgvector (Tabel fisik: 'products', 'pos_receipts', 'journal_entries', 'accounts')
"""

from typing import List, Optional, Tuple, Dict, Any
import uuid
import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import (
    UserCredential,
    JournalEntry,
    JournalLine,
    Account,
    Product,
    POSReceiptRecord,
    ProductRecipeItem,
    ProductionBatchRecord
)
from app.domain.services import (
    AccountingService,
    InventoryService,
    inventory_service,
    COA_CASH_ON_HAND,
    COA_BANK_GIRO_QRIS,
    COA_SALES_REVENUE,
    COA_INVENTORY_RAW,
    COA_COGS
)
from app.domain.services.ai_service import ai_service
from app.domain.services.startup_heuristics import get_startup_heuristic_recommendation
from app.infrastructure.database import get_db
from app.schemas.pos import (
    POSProductSchema,
    CreatePOSProductPayload,
    UpdatePOSProductPayload,
    CartItemPayload,
    POSCheckoutPayload,
    ReceiptItemSchema,
    POSReceiptResponse,
    RecipeItemPayload,
    SaveRecipePayload,
    RestockInventoryPayload,
    ProductionBatchPayload,
    ApplyPricePayload,
)

__all__ = [
    "POSProductSchema",
    "CreatePOSProductPayload",
    "UpdatePOSProductPayload",
    "CartItemPayload",
    "POSCheckoutPayload",
    "ReceiptItemSchema",
    "POSReceiptResponse",
    "RecipeItemPayload",
    "SaveRecipePayload",
    "RestockInventoryPayload",
    "ProductionBatchPayload",
    "ApplyPricePayload",
    "router",
]

router = APIRouter(prefix="/pos", tags=["Point of Sale (POS) & Kasir UMKM"])

# RBAC Guard: Dependency instance untuk endpoint manajerial POS
_require_manager = require_role(["OWNER", "MANAGER"])

# --- Domain & Regulatory Constants ---
PP55_FINAL_TAX_RATE: float = 0.005  # PPh Final PP 55/2022 (0.5% Omzet Bruto)
NON_SALEABLE_CATEGORIES: List[str] = [
    "alat kerja", "kemasan", "operasional", "peralatan & mesin", "peralatan", "aset", "equipment", "bahan baku"
]


# --- POS Domain Helpers ---

async def _ensure_saleable_pos_catalog(
    db: AsyncSession,
    tenant_id: str,
    non_saleable_categories: List[str]
) -> None:
    """
    Auto-Healing Catalog: Jika tenant baru onboarding dan belum memiliki produk siap jual
    (misalnya data warisan lama yang hanya menginput bahan baku mentah/alat kerja internal),
    secara cerdas menginisialisasi katalog produk jadi sesuai bidang usaha tenant
    menggunakan katalog domain heuristik terpusat (DRY, SAK EMKM).
    """
    base_check_stmt = select(Product).where(
        Product.tenant_id == tenant_id,
        ~func.lower(Product.category).in_(non_saleable_categories)
    )
    check_res = await db.execute(base_check_stmt)
    if check_res.scalars().first():
        return

    all_stmt = select(Product).where(Product.tenant_id == tenant_id)
    all_res = await db.execute(all_stmt)
    all_existing = all_res.scalars().all()
    if not all_existing:
        return

    names_lower = " ".join(p.name.lower() for p in all_existing)
    heuristic = get_startup_heuristic_recommendation(names_lower)
    finished_templates = heuristic.get("finished_products", [])

    if finished_templates:
        for fp in finished_templates:
            new_prod = Product(
                id=f"prod-{uuid.uuid4().hex[:12]}",
                tenant_id=tenant_id,
                name=fp["name"],
                sku=f"SKU-{uuid.uuid4().hex[:6].upper()}",
                category=fp.get("category", "Lauk Olahan"),
                price=float(fp.get("selling_price", 0.0)),
                cogs=float(fp.get("cogs", 0.0)),
                stock=int(fp.get("stock", 10)),
                unit=fp.get("unit", "Pack")
            )
            db.add(new_prod)
        await db.commit()


async def _process_and_deduct_cart_items(
    db: AsyncSession,
    tenant_id: str,
    items: List[CartItemPayload]
) -> Tuple[List[ReceiptItemSchema], float, float, float, int]:
    """
    Server-side verification & pemotongan stok fisik di tabel 'products':
    1. Mengambil produk asli dari PostgreSQL (mencegah manipulasi harga/diskon dari client).
    2. Memverifikasi ketersediaan stok fisik di database.
    3. Mengurangi stok produk di DB secara atomik.
    4. Menghitung subtotal, diskon, akumulasi HPP/COGS, dan jumlah unit belanja.
    """
    req_prod_ids = [item.product_id for item in items]
    stmt_prods = select(Product).where(
        Product.tenant_id == tenant_id,
        Product.id.in_(req_prod_ids)
    )
    res_prods = await db.execute(stmt_prods)
    db_products = {p.id: p for p in res_prods.scalars().all()}

    receipt_items: List[ReceiptItemSchema] = []
    subtotal = 0.0
    total_discount = 0.0
    total_cogs = 0.0
    total_items_count = 0

    for item in items:
        db_prod = db_products.get(item.product_id)
        if not db_prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produk '{item.product_name}' (ID: {item.product_id}) tidak ditemukan dalam katalog unit usaha Anda."
            )

        if db_prod.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stok untuk '{db_prod.name}' tidak mencukupi (Tersisa: {db_prod.stock}, diminta: {item.quantity})."
            )

        db_prod.stock -= item.quantity
        unit_price = float(db_prod.price)
        unit_cogs = float(db_prod.cogs or 0.0)

        line_raw = item.quantity * unit_price
        disc_amount = line_raw * (item.discount_percent / 100.0)
        line_net = line_raw - disc_amount

        subtotal += line_raw
        total_discount += disc_amount
        total_cogs += (item.quantity * unit_cogs)
        total_items_count += item.quantity

        receipt_items.append(
            ReceiptItemSchema(
                product_name=db_prod.name,
                sku=db_prod.sku,
                quantity=item.quantity,
                unit_price=unit_price,
                discount_amount=disc_amount,
                subtotal=line_net
            )
        )

    return receipt_items, subtotal, total_discount, total_cogs, total_items_count


def _validate_checkout_payment(
    payment_method: str,
    grand_total: float,
    cash_tendered: Optional[float]
) -> Tuple[float, float]:
    """Validasi pembayaran tunai / non-tunai dan menghitung uang kembalian."""
    if payment_method.upper() == "CASH":
        tendered = cash_tendered or 0.0
        if tendered < grand_total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Uang tunai diserahkan (Rp {tendered:,.0f}) kurang dari total belanja (Rp {grand_total:,.0f})."
            )
        return tendered, tendered - grand_total
    else:
        return grand_total, 0.0


async def _record_pos_sale(
    db: AsyncSession,
    tenant_id: str,
    current_user: UserCredential,
    payload: POSCheckoutPayload,
    receipt_no: str,
    entry_number: str,
    subtotal: float,
    total_discount: float,
    grand_total: float,
    tax_pp55_estimated: float,
    cash_tendered: float,
    change_amount: float,
    receipt_items: List[ReceiptItemSchema]
) -> str:
    """
    Auto-posting jurnal pembukuan SAK EMKM dan menyimpan arsip struk POS ke PostgreSQL.
    Mengembalikan audit_merkle_hash.
    """
    target_cash_code = COA_CASH_ON_HAND if payload.payment_method.upper() == "CASH" else COA_BANK_GIRO_QRIS

    journal_entry = await AccountingService.post_double_entry(
        db=db,
        tenant_id=tenant_id,
        description=f"Transaksi Kasir POS {receipt_no} - {payload.customer_name} ({payload.payment_method.upper()})",
        debit_account_code=target_cash_code,
        credit_account_code=COA_SALES_REVENUE,
        amount=grand_total,
        memo_debit=f"Penerimaan {payload.payment_method.upper()} Kasir Struk {receipt_no}",
        memo_credit=f"Pendapatan Kasir Toko Struk {receipt_no}",
        entry_number_prefix="JV-POS",
        custom_entry_number=entry_number,
        update_account_balances=True
    )
    merkle_hash = journal_entry.audit_merkle_hash

    receipt_record = POSReceiptRecord(
        id=f"rcpt-{uuid.uuid4().hex[:12]}",
        tenant_id=tenant_id,
        receipt_number=receipt_no,
        journal_entry_number=entry_number,
        cashier_name=current_user.full_name,
        customer_name=payload.customer_name or "Pelanggan Umum",
        customer_phone=payload.customer_phone,
        subtotal=subtotal,
        total_discount=total_discount,
        tax_pp55_estimated=tax_pp55_estimated,
        grand_total=grand_total,
        payment_method=payload.payment_method.upper(),
        cash_tendered=cash_tendered,
        change_amount=change_amount,
        audit_merkle_hash=merkle_hash,
        items_json=json.dumps([item.model_dump() for item in receipt_items])
    )
    db.add(receipt_record)
    await db.commit()

    return merkle_hash


async def _replace_recipe_and_compute_cogs(
    db: AsyncSession,
    tenant_id: str,
    product: Product,
    payload: SaveRecipePayload
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Menghapus resep lama, menyimpan bahan BOM baru, dan menghitung HPP riil baru.
    Mengembalikan tuple (new_cogs, materials_for_ai).
    """
    del_stmt = select(ProductRecipeItem).where(
        ProductRecipeItem.product_id == product.id,
        ProductRecipeItem.tenant_id == tenant_id
    )
    del_res = await db.execute(del_stmt)
    for old_item in del_res.scalars().all():
        await db.delete(old_item)
    await db.flush()

    materials_for_ai = []
    raw_material_cost = 0.0
    for item in payload.items:
        new_item = ProductRecipeItem(
            id=f"rec-{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            product_id=product.id,
            material_id=item.material_id,
            material_name=item.material_name.strip(),
            quantity_required=item.quantity_required,
            unit=item.unit.strip(),
            cost_per_unit=item.cost_per_unit,
            notes=item.notes
        )
        db.add(new_item)
        subtotal = float(item.quantity_required) * float(item.cost_per_unit)
        raw_material_cost += subtotal
        materials_for_ai.append({
            "material_name": item.material_name.strip(),
            "quantity_required": float(item.quantity_required),
            "unit": item.unit.strip(),
            "cost_per_unit": float(item.cost_per_unit)
        })

    wastage_pct = float(payload.wastage_percent or 0.0)
    overhead_u = float(payload.overhead_cost_per_unit or 0.0)
    wastage_multiplier = 1.0 / (1.0 - (wastage_pct / 100.0)) if wastage_pct < 99 else 1.0
    adjusted_material_cost = raw_material_cost * wastage_multiplier
    new_cogs = round(adjusted_material_cost + overhead_u, 2)

    product.cogs = new_cogs
    product.overhead_cost_per_unit = overhead_u
    product.wastage_percent = wastage_pct

    await db.commit()
    await db.refresh(product)
    return new_cogs, materials_for_ai


def _extract_materials_for_pricing(
    product: Product,
    recipe_items: List[ProductRecipeItem]
) -> List[Dict[str, Any]]:
    """
    Ekstrak daftar bahan untuk kalkulasi AI pricing engine.
    Jika belum ada BOM terperinci, gunakan cogs produk saat ini sebagai 1 komponen dasar.
    """
    if recipe_items:
        return [
            {
                "material_name": item.material_name,
                "quantity_required": float(item.quantity_required),
                "unit": item.unit,
                "cost_per_unit": float(item.cost_per_unit)
            }
            for item in recipe_items
        ]
    return [
        {
            "material_name": "Biaya Modal Produk / Pembelian Dasar",
            "quantity_required": 1.0,
            "unit": product.unit or "Pcs",
            "cost_per_unit": float(product.cogs or 0.0)
        }
    ]


# --- Endpoints ---

@router.get(
    "/products",
    response_model=List[POSProductSchema],
    summary="Katalog Produk Kasir POS (Query Langsung dari Database PostgreSQL)"
)
async def list_pos_products(
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter berdasarkan kategori produk"),
    search: Optional[str] = Query(None, description="Pencarian nama produk atau SKU")
):
    """
    Mengambil katalog produk siap jual untuk kasir LANGSUNG DARI TABEL 'products' PostgreSQL.
    Menerapkan isolasi multi-tenant ketat: kasir hanya dapat melihat produk milik tenant bisnisnya.
    PRINSIP BISNIS & SAK EMKM: Bahan baku mentah internal, alat kerja, kemasan, dan tabung gas operasional
    TIDAK BOLEH tampil di rak kasir POS untuk dijual ke konsumen akhir.
    """
    await _ensure_saleable_pos_catalog(db, current_user.tenant_id, NON_SALEABLE_CATEGORIES)

    stmt = select(Product).where(
        Product.tenant_id == current_user.tenant_id,
        ~func.lower(Product.category).in_(NON_SALEABLE_CATEGORIES)
    )

    if isinstance(category, str) and category.strip().lower() != "semua":
        stmt = stmt.where(func.lower(Product.category) == category.strip().lower())

    if isinstance(search, str) and search.strip():
        s = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(func.lower(Product.name).like(s), func.lower(Product.sku).like(s))
        )

    stmt = stmt.order_by(Product.name)
    result = await db.execute(stmt)
    products = result.scalars().all()

    return [
        POSProductSchema(
            id=p.id,
            name=p.name,
            sku=p.sku,
            category=p.category,
            price=float(p.price),
            cogs=float(p.cogs or 0.0),
            stock=p.stock,
            unit=p.unit,
            image_url=p.image_url
        )
        for p in products
    ]


@router.post(
    "/products",
    response_model=POSProductSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Tambah Produk Baru ke Katalog Tenant POS (Multi-Tenant Row-Level Security)"
)
async def create_pos_product(
    payload: CreatePOSProductPayload,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Menambahkan produk baru ke katalog POS secara khusus untuk tenant saat ini.
    Menghasilkan SKU otomatis jika tidak disediakan, dan mengaitkan tenant_id secara aman.
    """
    gen_sku = payload.sku.strip() if payload.sku and payload.sku.strip() else f"{payload.category[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    product_id = f"prd-{current_user.tenant_id}-{uuid.uuid4().hex[:8]}"

    cleaned_img: Optional[str] = payload.image_url.strip() if payload.image_url and payload.image_url.strip() else None

    new_product = Product(
        id=product_id,
        tenant_id=current_user.tenant_id,
        name=payload.name.strip(),
        sku=gen_sku,
        category=payload.category.strip(),
        price=payload.price,
        cogs=payload.cogs,
        stock=payload.stock,
        unit=payload.unit.strip(),
        image_url=cleaned_img
    )

    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)

    return POSProductSchema(
        id=new_product.id,
        name=new_product.name,
        sku=new_product.sku,
        category=new_product.category,
        price=float(new_product.price),
        cogs=float(new_product.cogs or 0.0),
        stock=new_product.stock,
        unit=new_product.unit,
        image_url=new_product.image_url
    )


@router.put(
    "/products/{product_id}",
    response_model=POSProductSchema,
    summary="Perbarui Data / Stok Produk Tenant POS (Mencegah BOLA/IDOR)"
)
async def update_pos_product(
    product_id: str,
    payload: UpdatePOSProductPayload,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Memperbarui harga, stok, nama, atau kategori produk.
    Memverifikasi kepemilikan tenant_id untuk mencegah eksploitasi Broken Object Level Authorization.
    """
    stmt = select(Product).where(
        Product.id == product_id,
        Product.tenant_id == current_user.tenant_id
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produk tidak ditemukan atau bukan milik unit usaha Anda."
        )

    if payload.name is not None:
        product.name = payload.name.strip()
    if payload.sku is not None:
        product.sku = payload.sku.strip()
    if payload.category is not None:
        product.category = payload.category.strip()
    if payload.price is not None:
        product.price = payload.price
    if payload.cogs is not None:
        product.cogs = payload.cogs
    if payload.stock is not None:
        product.stock = payload.stock
    if payload.unit is not None:
        product.unit = payload.unit.strip()
    if payload.image_url is not None:
        cleaned_url: Optional[str] = payload.image_url.strip() if payload.image_url and payload.image_url.strip() else None
        product.image_url = cleaned_url

    await db.commit()
    await db.refresh(product)

    return POSProductSchema(
        id=product.id,
        name=product.name,
        sku=product.sku,
        category=product.category,
        price=float(product.price),
        cogs=float(product.cogs or 0.0),
        stock=product.stock,
        unit=product.unit,
        image_url=product.image_url
    )


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_200_OK,
    summary="Hapus Produk dari Katalog Tenant POS"
)
async def delete_pos_product(
    product_id: str,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghapus produk dari database fisik PostgreSQL dengan proteksi isolasi tenant.
    """
    stmt = select(Product).where(
        Product.id == product_id,
        Product.tenant_id == current_user.tenant_id
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produk tidak ditemukan atau bukan milik unit usaha Anda."
        )

    await db.delete(product)
    await db.commit()

    return {
        "success": True,
        "message": f"Produk '{product.name}' berhasil dihapus dari katalog.",
        "deleted_product_id": product_id
    }


@router.post(
    "/checkout",
    response_model=POSReceiptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Eksekusi Transaksi Kasir POS (Atomic ACID: Update Stok + Auto-Posting Jurnal SAK EMKM)"
)
async def checkout_pos(
    payload: POSCheckoutPayload,
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Memproses transaksi penjualan langsung di kasir dengan integrasi 100% database:
    1. Mengambil data produk ASLI dari tabel 'products' PostgreSQL untuk verifikasi harga & stok (Server-Side Anti-Tampering).
    2. Mengurangi stok fisik produk di tabel 'products' secara atomik.
    3. Menghitung subtotal, diskon, dan estimasi pajak PPh Final PP 55/2022 (0.5%).
    4. Auto-posting jurnal pembukuan berpasangan ke tabel 'journal_entries' & 'journal_lines':
       * Debet: Akun 1101 (Kas Kasir) atau Akun 1102 (Bank QRIS)
       * Kredit: Akun 4101 (Pendapatan Penjualan)
    5. Menyimpan arsip struk ke tabel fisik 'pos_receipts' lengkap dengan SHA-256 Merkle Hash.
    """
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Keranjang kasir tidak boleh kosong."
        )

    # 1. Server-Side Verification & Pemotongan Stok Atomik
    receipt_items, subtotal, total_discount, total_cogs, total_items_count = await _process_and_deduct_cart_items(
        db=db,
        tenant_id=current_user.tenant_id,
        items=payload.items
    )

    grand_total = max(0.0, subtotal - total_discount)
    tax_pp55_estimated = round(grand_total * PP55_FINAL_TAX_RATE, 2)

    # 2. Validasi Pembayaran & Kembalian
    cash_tendered, change_amount = _validate_checkout_payment(
        payment_method=payload.payment_method,
        grand_total=grand_total,
        cash_tendered=payload.cash_tendered
    )

    # 3. Penyiapan Nomor Unik Struk & Jurnal
    now = datetime.now(timezone.utc)
    timestamp_compact = now.strftime("%Y%m%d%H%M%S")
    rand_suffix = uuid.uuid4().hex[:4].upper()
    receipt_no = f"POS-{now.strftime('%Y%m%d')}-{rand_suffix}"
    entry_number = f"JV-POS-{timestamp_compact}-{rand_suffix}"

    # 4. Delegasikan Auto-Posting Jurnal SAK EMKM dan Penyimpanan Struk
    merkle_hash = await _record_pos_sale(
        db=db,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
        payload=payload,
        receipt_no=receipt_no,
        entry_number=entry_number,
        subtotal=subtotal,
        total_discount=total_discount,
        grand_total=grand_total,
        tax_pp55_estimated=tax_pp55_estimated,
        cash_tendered=cash_tendered,
        change_amount=change_amount,
        receipt_items=receipt_items
    )

    # URL simulasi QRIS SNAP jika metode pembayaran QRIS
    qr_snap_url = None
    if payload.payment_method.upper() == "QRIS":
        qr_snap_url = f"https://api.midtrans.com/v2/qris/simulate?order_id={receipt_no}&amount={int(grand_total)}"

    return POSReceiptResponse(
        success=True,
        receipt_number=receipt_no,
        journal_entry_number=entry_number,
        transaction_date=now.strftime("%d-%m-%Y %H:%M:%S WIB"),
        tenant_id=current_user.tenant_id,
        tenant_name=current_user.tenant.name if current_user.tenant else "FINA Enterprise UMKM",
        cashier_name=current_user.full_name,
        customer_name=payload.customer_name or "Pelanggan Umum",
        customer_phone=payload.customer_phone,
        items=receipt_items,
        total_items_count=total_items_count,
        subtotal=subtotal,
        total_discount=total_discount,
        tax_pp55_estimated=tax_pp55_estimated,
        grand_total=grand_total,
        payment_method=payload.payment_method.upper(),
        cash_tendered=cash_tendered,
        change_amount=change_amount,
        audit_merkle_hash=merkle_hash,
        qr_snap_url=qr_snap_url
    )


@router.get("/receipts", response_model=List[POSReceiptResponse], summary="Ambil riwayat struk transaksi POS fisik tenant")
async def get_pos_receipts(
    limit: int = Query(default=30, ge=1, le=100),
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(POSReceiptRecord)
        .where(POSReceiptRecord.tenant_id == current_user.tenant_id)
        .order_by(POSReceiptRecord.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    results: List[POSReceiptResponse] = []
    for r in records:
        try:
            items_raw = json.loads(r.items_json) if r.items_json else []
            items = [ReceiptItemSchema(**item) for item in items_raw]
        except Exception:
            items = []

        results.append(
            POSReceiptResponse(
                success=True,
                receipt_number=r.receipt_number,
                journal_entry_number=r.journal_entry_number,
                transaction_date=r.created_at.strftime("%d-%m-%Y %H:%M:%S WIB") if r.created_at else "",
                tenant_id=r.tenant_id,
                tenant_name=current_user.tenant.name if current_user.tenant else "FINA Enterprise UMKM",
                cashier_name=r.cashier_name,
                customer_name=r.customer_name,
                customer_phone=r.customer_phone,
                items=items,
                total_items_count=sum(i.quantity for i in items),
                subtotal=float(r.subtotal),
                total_discount=float(r.total_discount),
                tax_pp55_estimated=float(r.tax_pp55_estimated),
                grand_total=float(r.grand_total),
                payment_method=r.payment_method,
                cash_tendered=float(r.cash_tendered),
                change_amount=float(r.change_amount),
                audit_merkle_hash=r.audit_merkle_hash,
                qr_snap_url=None
            )
        )
    return results


# =============================================================================
# FITUR: DYNAMIC PRICING, BILL OF MATERIALS (BOM), RESTOCK & BATCH PRODUCTION
# Anti-Margin Leakage: Menjamin UMKM Tidak Rugi di Sepanjang Siklus Bisnis
# =============================================================================


@router.get("/products/{product_id}/recipe", summary="Ambil data resep/BOM (komposisi bahan baku) produk")
async def get_product_recipe(
    product_id: str,
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil data komposisi bahan baku (Bill of Materials) untuk produk tertentu
    beserta biaya modal bahan baku per unit terkini.
    """
    prod_stmt = select(Product).where(
        Product.id == product_id,
        Product.tenant_id == current_user.tenant_id
    )
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produk dengan ID '{product_id}' tidak ditemukan."
        )

    stmt = select(ProductRecipeItem).where(
        ProductRecipeItem.product_id == product_id,
        ProductRecipeItem.tenant_id == current_user.tenant_id
    ).order_by(ProductRecipeItem.created_at.asc())
    res = await db.execute(stmt)
    recipe_items = res.scalars().all()

    items_data = []
    total_material_cost = 0.0
    for item in recipe_items:
        subtotal = float(item.quantity_required) * float(item.cost_per_unit)
        total_material_cost += subtotal
        items_data.append({
            "id": item.id,
            "material_id": item.material_id,
            "material_name": item.material_name,
            "quantity_required": float(item.quantity_required),
            "unit": item.unit,
            "cost_per_unit": float(item.cost_per_unit),
            "subtotal_cost": round(subtotal, 2),
            "notes": item.notes
        })

    return {
        "product_id": product.id,
        "product_name": product.name,
        "current_selling_price": float(product.price),
        "current_cogs": float(product.cogs),
        "overhead_cost_per_unit": float(product.overhead_cost_per_unit or 0.0),
        "wastage_percent": float(product.wastage_percent or 0.0),
        "total_material_cost": round(total_material_cost, 2),
        "items": items_data
    }


@router.post("/products/{product_id}/recipe", summary="Simpan / perbarui resep BOM & hitung ulang HPP otomatis")
async def save_product_recipe(
    product_id: str,
    payload: SaveRecipePayload,
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Menyimpan atau memperbarui resep bahan baku (BOM) untuk suatu produk.
    Sistem otomatis:
    1. Menyimpan rincian bahan dan takaran per pcs
    2. Menghitung HPP riil baru (Direct Materials + Wastage + Overhead)
    3. Memperbarui kolom cogs pada tabel products
    4. Menjalankan AI Pricing Engine untuk memberikan rekomendasi harga anti-rugi
    """
    prod_stmt = select(Product).where(
        Product.id == product_id,
        Product.tenant_id == current_user.tenant_id
    )
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produk dengan ID '{product_id}' tidak ditemukan."
        )

    # 1. Hapus resep lama, simpan bahan baru & hitung HPP riil baru
    new_cogs, materials_for_ai = await _replace_recipe_and_compute_cogs(
        db, current_user.tenant_id, product, payload
    )

    # 2. Hitung Rekomendasi Harga AI Anti-Rugi
    ai_pricing = ai_service.calculate_dynamic_pricing_recommendation(
        materials=materials_for_ai,
        current_selling_price=float(product.price),
        overhead_cost_per_unit=float(product.overhead_cost_per_unit or 0.0),
        wastage_percent=float(product.wastage_percent or 0.0),
        category=product.category,
        product_name=product.name,
        target_margin_percent=float(payload.target_margin_percent or 35.0)
    )

    return {
        "success": True,
        "message": f"Resep produk '{product.name}' berhasil disimpan. HPP riil baru: Rp {new_cogs:,.0f}/pcs",
        "product_id": product.id,
        "new_cogs": new_cogs,
        "ai_pricing_analysis": ai_pricing
    }


@router.get("/products/{product_id}/pricing-analysis", summary="Analisis HPP & Rekomendasi Harga AI Anti-Rugi")
async def get_pricing_analysis(
    product_id: str,
    target_margin: float = Query(default=35.0, ge=10.0, le=80.0, description="Target margin keuntungan kotor (%)"),
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Evaluasi mendalam HPP dan relevansi harga jual produk saat ini.
    Mendeteksi apakah harga saat ini rugi, margin tipis, atau sehat.
    """
    prod_stmt = select(Product).where(
        Product.id == product_id,
        Product.tenant_id == current_user.tenant_id
    )
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produk dengan ID '{product_id}' tidak ditemukan."
        )

    # Ambil bahan resep jika ada, atau fallback ke modal dasar
    stmt = select(ProductRecipeItem).where(
        ProductRecipeItem.product_id == product_id,
        ProductRecipeItem.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    recipe_items = res.scalars().all()
    materials_for_ai = _extract_materials_for_pricing(product, recipe_items)

    analysis = ai_service.calculate_dynamic_pricing_recommendation(
        materials=materials_for_ai,
        current_selling_price=float(product.price),
        overhead_cost_per_unit=float(product.overhead_cost_per_unit or 0.0),
        wastage_percent=float(product.wastage_percent or 0.0),
        category=product.category,
        product_name=product.name,
        target_margin_percent=target_margin
    )
    analysis["product_id"] = product.id
    analysis["sku"] = product.sku
    analysis["stock"] = product.stock
    analysis["unit"] = product.unit

    return analysis


@router.put("/products/{product_id}/apply-recommended-price", summary="Terapkan harga rekomendasi AI ke katalog POS")
async def apply_recommended_price(
    product_id: str,
    payload: ApplyPricePayload,
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    1-Klik untuk mengadopsi harga jual rekomendasi AI langsung ke katalog POS kasir.
    Menjamin kasir langsung menjual dengan harga yang terbukti tidak rugi.
    """
    stmt = select(Product).where(
        Product.id == product_id,
        Product.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produk dengan ID '{product_id}' tidak ditemukan."
        )

    old_price = float(product.price)
    product.price = round(payload.new_price, 2)
    await db.commit()
    await db.refresh(product)

    return {
        "success": True,
        "message": f"Harga produk '{product.name}' berhasil diperbarui dari Rp {old_price:,.0f} menjadi Rp {product.price:,.0f}",
        "product_id": product.id,
        "old_price": old_price,
        "new_price": float(product.price)
    }


@router.post("/inventory/restock", summary="Restock bahan baku/produk (Recycle Stock) dengan Moving Weighted Average Cost")
async def restock_inventory(
    payload: RestockInventoryPayload,
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Siklus Restock (Recycle Stock) Bahan Baku / Barang Dagangan.
    Delegasi ke InventoryService sesuai Hexagonal Architecture.
    """
    return await inventory_service.restock_inventory_and_evaluate_bom(
        db=db,
        tenant_id=current_user.tenant_id,
        payload=payload
    )


@router.post("/production/batch", summary="Catat produksi batch produk (Konversi Bahan Baku -> Produk Jadi)")
async def record_production_batch(
    payload: ProductionBatchPayload,
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Siklus Batch Produksi UMKM:
    Delegasi ke InventoryService sesuai Hexagonal Architecture.
    """
    try:
        return await inventory_service.execute_production_batch(
            db=db,
            tenant_id=current_user.tenant_id,
            payload=payload
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/pricing/margin-leakage-alerts", summary="Pindai seluruh katalog untuk mendeteksi produk yang berpotensi rugi")
async def scan_margin_leakage_alerts(
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Pindai otomatis seluruh katalog produk untuk mendeteksi 'Margin Leakage'.
    Delegasi ke InventoryService sesuai Hexagonal Architecture.
    """
    return await inventory_service.scan_margin_leakage(
        db=db,
        tenant_id=current_user.tenant_id,
        tax_rate=PP55_FINAL_TAX_RATE
    )



