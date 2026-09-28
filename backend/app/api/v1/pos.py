"""
FINA-ENTERPRISE POS (Point of Sale) API Router
Modul transaksi kasir cepat untuk toko fisik, gerai, dan operasional UMKM.

Standar: Hexagonal Architecture / Ports & Adapters
Security: JWT Bearer token, Tenant-scoped isolation (RBAC), Server-Side Price Verification
Compliance: SAK EMKM Double-Entry Balancing & UU PDP No. 27/2022
Database: PostgreSQL 16 + pgvector (Tabel fisik: 'products', 'pos_receipts', 'journal_entries', 'accounts')
"""

from typing import List, Optional
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
    POSReceiptRecord
)
from app.domain.services import (
    AccountingService,
    COA_CASH_ON_HAND,
    COA_BANK_GIRO_QRIS,
    COA_SALES_REVENUE
)
from app.infrastructure.database import get_db

router = APIRouter(prefix="/pos", tags=["Point of Sale (POS) & Kasir UMKM"])

# RBAC Guard: Dependency instance untuk endpoint manajerial POS
_require_manager = require_role(["OWNER", "MANAGER"])

# --- Domain & Regulatory Constants ---
PP55_FINAL_TAX_RATE: float = 0.005  # PPh Final PP 55/2022 (0.5% Omzet Bruto)


# --- Pydantic Data Contracts ---

class POSProductSchema(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    price: float
    cogs: float = Field(description="Harga Pokok Penjualan / Modal per unit")
    stock: int
    unit: str
    image_url: Optional[str] = None


class CreatePOSProductPayload(BaseModel):
    name: str = Field(min_length=2, max_length=255, description="Nama produk/menu")
    sku: Optional[str] = Field(default=None, max_length=64, description="Kode SKU atau barcode produk")
    category: str = Field(default="Makanan", max_length=64, description="Kategori produk (Makanan, Minuman, Camilan, Sembako, dll)")
    price: float = Field(ge=0, description="Harga jual produk")
    cogs: float = Field(default=0.0, ge=0, description="Harga Pokok Penjualan / Modal per unit")
    stock: int = Field(default=0, ge=0, description="Jumlah stok fisik awal")
    unit: str = Field(default="Porsi", max_length=32, description="Satuan unit (Porsi, Pcs, Botol, Kg, dll)")
    image_url: Optional[str] = Field(default=None, description="URL gambar produk")


class UpdatePOSProductPayload(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    sku: Optional[str] = Field(default=None, max_length=64)
    category: Optional[str] = Field(default=None, max_length=64)
    price: Optional[float] = Field(default=None, ge=0)
    cogs: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, max_length=32)
    image_url: Optional[str] = None


class CartItemPayload(BaseModel):
    product_id: str
    product_name: str
    sku: str
    quantity: int = Field(gt=0, description="Kuantitas harus lebih besar dari 0")
    unit_price: float = Field(ge=0, description="Harga satuan")
    cogs: float = Field(default=0.0, ge=0)
    discount_percent: float = Field(default=0.0, ge=0, le=100)


class POSCheckoutPayload(BaseModel):
    items: List[CartItemPayload] = Field(min_length=1, description="Minimal 1 item belanja")
    payment_method: str = Field(description="'CASH', 'QRIS', atau 'TRANSFER'")
    cash_tendered: Optional[float] = Field(default=0.0, description="Nominal uang tunai diserahkan pelanggan")
    customer_name: Optional[str] = Field(default="Pelanggan Umum", description="Nama pembeli")
    customer_phone: Optional[str] = Field(default=None, description="Nomor WhatsApp untuk nota digital")
    notes: Optional[str] = None


class ReceiptItemSchema(BaseModel):
    product_name: str
    sku: str
    quantity: int
    unit_price: float
    discount_amount: float
    subtotal: float


class POSReceiptResponse(BaseModel):
    success: bool
    receipt_number: str
    journal_entry_number: str
    transaction_date: str
    tenant_id: str
    tenant_name: str
    cashier_name: str
    customer_name: str
    customer_phone: Optional[str]
    items: List[ReceiptItemSchema]
    total_items_count: int
    subtotal: float
    total_discount: float
    tax_pp55_estimated: float
    grand_total: float
    payment_method: str
    cash_tendered: float
    change_amount: float
    audit_merkle_hash: str
    qr_snap_url: Optional[str] = None


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
    """
    stmt = select(Product).where(Product.tenant_id == current_user.tenant_id)

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

    # 1. Server-Side Verification: Ambil produk asli dari database untuk tenant ini
    req_prod_ids = [item.product_id for item in payload.items]
    stmt_prods = select(Product).where(
        Product.tenant_id == current_user.tenant_id,
        Product.id.in_(req_prod_ids)
    )
    res_prods = await db.execute(stmt_prods)
    db_products = {p.id: p for p in res_prods.scalars().all()}

    receipt_items: List[ReceiptItemSchema] = []
    subtotal = 0.0
    total_discount = 0.0
    total_cogs = 0.0
    total_items_count = 0

    for item in payload.items:
        db_prod = db_products.get(item.product_id)
        if not db_prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produk '{item.product_name}' (ID: {item.product_id}) tidak ditemukan dalam katalog unit usaha Anda."
            )

        # Validasi ketersediaan stok fisik di database
        if db_prod.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stok untuk '{db_prod.name}' tidak mencukupi (Tersisa: {db_prod.stock}, diminta: {item.quantity})."
            )

        # Potong stok produk di database secara atomik
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

    grand_total = max(0.0, subtotal - total_discount)

    # Estimasi PPh Final PP 55/2022 dari Omzet Bruto (Standar UMKM)
    tax_pp55_estimated = round(grand_total * PP55_FINAL_TAX_RATE, 2)

    # 2. Validasi Pembayaran
    cash_tendered = payload.cash_tendered or 0.0
    change_amount = 0.0

    if payload.payment_method.upper() == "CASH":
        if cash_tendered < grand_total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Uang tunai diserahkan (Rp {cash_tendered:,.0f}) kurang dari total belanja (Rp {grand_total:,.0f})."
            )
        change_amount = cash_tendered - grand_total
    else:
        # QRIS / TRANSFER: Nominal pas
        cash_tendered = grand_total
        change_amount = 0.0

    # 3. Penyiapan Nomor Unik Struk & Jurnal
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")
    timestamp_compact = now.strftime("%Y%m%d%H%M%S")
    rand_suffix = uuid.uuid4().hex[:4].upper()
    receipt_no = f"POS-{now.strftime('%Y%m%d')}-{rand_suffix}"
    entry_number = f"JV-POS-{timestamp_compact}-{rand_suffix}"

    target_cash_code = COA_CASH_ON_HAND if payload.payment_method.upper() == "CASH" else COA_BANK_GIRO_QRIS

    # 4. Delegasikan Auto-Posting Jurnal SAK EMKM ke Accounting Domain Service
    journal_entry = await AccountingService.post_double_entry(
        db=db,
        tenant_id=current_user.tenant_id,
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

    # 7. Simpan Arsip Riwayat Struk ke Tabel Fisik 'pos_receipts' di PostgreSQL
    receipt_record = POSReceiptRecord(
        id=f"rcpt-{uuid.uuid4().hex[:12]}",
        tenant_id=current_user.tenant_id,
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

    # Commit transaksi ACID utuh
    await db.commit()

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

