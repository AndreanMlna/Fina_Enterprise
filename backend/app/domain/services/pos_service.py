"""
FINA-ENTERPRISE POS (Point of Sale) Domain Service
Menangani seluruh operasi domain, pemotongan stok fisik, verifikasi anti-tampering,
pembukuan transaksi kasir berpasangan SAK EMKM, serta kalkulasi BOM resep produk.

Standar:
- Hexagonal Architecture: Domain Service Layer (Pure Business Logic)
- ACID Transaction & Double-Entry Balancing (SAK EMKM)
- Anti-Tampering & SHA-256 Merkle Chaining
- PP 55/2022 PPh Final 0.5%
"""

from typing import List, Optional, Tuple, Dict, Any, Sequence
import uuid
import json

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.domain.models import (
    Product,
    POSReceiptRecord,
    ProductRecipeItem,
    UserCredential
)
from app.domain.services.accounting_service import (
    AccountingService,
    COA_CASH_ON_HAND,
    COA_BANK_GIRO_QRIS,
    COA_SALES_REVENUE
)
from app.domain.services.startup_heuristics import get_startup_heuristic_recommendation
from app.schemas.pos import (
    CartItemPayload,
    ReceiptItemSchema,
    POSCheckoutPayload,
    SaveRecipePayload
)


# --- Domain & Regulatory Constants ---
PP55_FINAL_TAX_RATE: float = 0.005  # PPh Final PP 55/2022 (0.5% Omzet Bruto)
NON_SALEABLE_CATEGORIES: List[str] = [
    "alat kerja", "kemasan", "operasional", "peralatan & mesin", "peralatan", "aset", "equipment", "bahan baku"
]
NON_SALEABLE_KEYWORD_PATTERNS: List[str] = [
    "bahan baku",
    "raw material",
    "kemasan",
    "packaging",
    "bumbu",
    "bahan pembantu",
    "bahan segar",
    "perishable",
    "alat kerja",
    "peralatan",
    "equipment",
    "operasional",
    "aset",
    "material"
]


class POSService:
    """Domain Service untuk operasional Point of Sale & Kasir Toko UMKM."""

    @classmethod
    def get_saleable_filter(cls, model_attr=Product.category):
        """Menghasilkan ekspresi SQL filter untuk mengecualikan SEMUA jenis bahan mentah, kemasan, dan alat kerja."""
        from sqlalchemy import and_, func
        return and_(*[~func.lower(model_attr).like(f"%{p}%") for p in NON_SALEABLE_KEYWORD_PATTERNS])

    @classmethod
    def get_materials_filter(cls, model_attr=Product.category):
        """Menghasilkan ekspresi SQL filter untuk mengambil HANYA bahan baku, kemasan, bumbu, dan alat kerja."""
        from sqlalchemy import or_, func
        return or_(*[func.lower(model_attr).like(f"%{p}%") for p in NON_SALEABLE_KEYWORD_PATTERNS])

    @classmethod
    async def ensure_saleable_pos_catalog(
        cls,
        db: AsyncSession,
        tenant_id: str,
        non_saleable_categories: Sequence[str] = NON_SALEABLE_CATEGORIES
    ) -> None:
        """
        Auto-Healing Catalog: Jika tenant baru onboarding dan belum memiliki produk siap jual
        (misalnya data warisan lama yang hanya menginput bahan baku mentah/alat kerja internal),
        secara cerdas menginisialisasi katalog produk jadi sesuai bidang usaha tenant.
        CATATAN SAK EMKM: Stok awal produk jadi WAJIB bernilai 0. Stok hanya akan bertambah
        setelah pengguna mengeksekusi 'Tahap 2: Produksi Batch' dari bahan baku yang sudah dibeli di Tahap 1.
        """
        base_check_stmt = select(Product).where(
            Product.tenant_id == tenant_id,
            cls.get_saleable_filter(Product.category)
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
                    stock=0,  # SAK EMKM: 0 unit sebelum diproduksi dari bahan baku
                    unit=fp.get("unit", "Porsi")
                )
                db.add(new_prod)
            await db.commit()

    @staticmethod
    async def process_and_deduct_cart_items(
        db: AsyncSession,
        tenant_id: str,
        items: Sequence[CartItemPayload]
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

    @staticmethod
    def validate_checkout_payment(
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
        return grand_total, 0.0

    @staticmethod
    async def record_pos_sale(
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
        receipt_items: Sequence[ReceiptItemSchema]
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

    @staticmethod
    async def replace_recipe_and_compute_cogs(
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

        materials_for_ai: List[Dict[str, Any]] = []
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

    @staticmethod
    def extract_materials_for_pricing(
        product: Product,
        recipe_items: Sequence[ProductRecipeItem]
    ) -> List[Dict[str, Any]]:
        """
        Ekstrak daftar bahan untuk kalkulasi AI pricing engine.
        Jika belum ada BOM terperinci, gunakan cogs produk saat ini sebagai 1 komponen dasar.
        Parameter `recipe_items` menerima Sequence[ProductRecipeItem] agar kompatibel sempurna
        dengan hasil query SQLAlchemy `.scalars().all()`.
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


# Singleton instance
pos_service = POSService()
