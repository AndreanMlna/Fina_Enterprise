"""
FINA-ENTERPRISE Inventory & Production Domain Service
Modul domain untuk manajemen persediaan barang, kalkulasi Moving Weighted Average Cost,
evaluasi resep Bill of Materials (BOM), eksekusi batch produksi, dan pemindaian margin leakage.

Standar:
- Hexagonal Architecture / Domain Service
- ACID Transactional Consistency
- SAK EMKM & PP 55/2022
"""

from typing import List, Dict, Any, Optional, Set
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.domain.models import (
    Product,
    ProductRecipeItem,
    ProductionBatchRecord,
    StockMovementRecord
)
from app.domain.services.ai_service import ai_service
from app.domain.services.accounting_service import (
    AccountingService,
    COA_CASH_ON_HAND,
    COA_BANK_GIRO_QRIS,
    COA_INVENTORY_RAW,
    COA_FIXED_EQUIPMENT,
    COA_COGS,
)
from app.schemas.pos import (
    RestockInventoryPayload,
    ProductionBatchPayload,
    StockAdjustmentPayload
)


class InventoryService:
    """
    Domain service yang menangani seluruh kalkulasi matematis dan integritas siklus persediaan:
    1. Moving Weighted Average (MWA) Costing
    2. BOM Cascade Recalculation pada saat Restock (Recycle Stock)
    3. Konversi Bahan Baku ke Produk Jadi (Production Batch Execution)
    4. Deteksi Kebocoran Margin (Margin Leakage Scanner)
    """

    @staticmethod
    def calculate_moving_weighted_average(
        old_stock: float,
        old_cogs: float,
        added_qty: float,
        purchase_price: float
    ) -> float:
        """
        Menghitung Biaya Rata-Rata Tertimbang Bergerak (Moving Weighted Average Cost)
        sesuai kaidah akuntansi persediaan SAK EMKM:
        
            C_new = (S_old * C_old + Q_added * P_purchase) / (S_old + Q_added)
        """
        total_qty = old_stock + added_qty
        if total_qty <= 0:
            return round(purchase_price, 2)
        
        weighted_cost = ((old_stock * old_cogs) + (added_qty * purchase_price)) / total_qty
        return round(weighted_cost, 2)

    @classmethod
    async def record_stock_movement(
        cls,
        db: AsyncSession,
        tenant_id: str,
        product_id: str,
        product_name: str,
        movement_type: str,
        quantity_delta: float,
        unit: str,
        cost_per_unit: float,
        total_cost: float,
        stock_before: float,
        stock_after: float,
        reference_number: str,
        notes: Optional[str] = None
    ) -> StockMovementRecord:
        """
        Merekam mutasi fisik barang ke buku besar pergerakan stok (Stock Movement Ledger).
        Kepatuhan audit SAK EMKM dan inventarisasi berkala.
        """
        mov = StockMovementRecord(
            id=f"mov-{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            product_id=product_id,
            product_name=product_name,
            movement_type=movement_type,
            quantity_delta=quantity_delta,
            unit=unit or "Pcs",
            cost_per_unit=round(cost_per_unit, 2),
            total_cost=round(total_cost, 2),
            stock_before=round(stock_before, 4),
            stock_after=round(stock_after, 4),
            reference_number=reference_number,
            notes=notes,
            created_at=datetime.now(timezone.utc)
        )
        db.add(mov)
        return mov

    @classmethod
    async def restock_inventory_and_evaluate_bom(
        cls,
        db: AsyncSession,
        tenant_id: str,
        payload: RestockInventoryPayload
    ) -> Dict[str, Any]:
        """
        Mengeksekusi siklus restock (recycle stock) bahan baku:
        - Memperbarui stok dan MWA cost bahan baku
        - Melakukan cascade update pada seluruh resep produk jadi yang menggunakan bahan ini
        - Menghitung ulang HPP produk jadi dan memberikan peringatan jika margin tergerus
        """
        # 1. Cari produk bahan baku berdasarkan product_id atau nama
        material: Optional[Product] = None
        if payload.product_id:
            stmt = select(Product).where(
                Product.id == payload.product_id,
                Product.tenant_id == tenant_id
            )
            res = await db.execute(stmt)
            material = res.scalar_one_or_none()

        if not material:
            stmt = select(Product).where(
                func.lower(Product.name) == func.lower(payload.material_name.strip()),
                Product.tenant_id == tenant_id
            )
            res = await db.execute(stmt)
            material = res.scalar_one_or_none()

        old_stock = float(material.stock) if material else 0.0
        old_cogs = float(material.cogs) if material else float(payload.purchase_price_per_unit)
        added_qty = float(payload.quantity_added)
        purchase_price = float(payload.purchase_price_per_unit)

        # 2. Hitung Moving Weighted Average Cost
        new_weighted_cogs = cls.calculate_moving_weighted_average(
            old_stock=old_stock,
            old_cogs=old_cogs,
            added_qty=added_qty,
            purchase_price=purchase_price
        )
        total_qty = old_stock + added_qty

        if material:
            material.stock = round(total_qty)
            material.cogs = new_weighted_cogs
        else:
            # Buat item bahan baku baru jika belum pernah terdaftar
            material = Product(
                id=f"prod-mat-{uuid.uuid4().hex[:12]}",
                tenant_id=tenant_id,
                name=payload.material_name.strip(),
                sku=f"MAT-{uuid.uuid4().hex[:6].upper()}",
                category=payload.category.strip() or "Bahan Baku",
                price=round(new_weighted_cogs * 1.3, 2),  # Default markup 30% jika dijual langsung
                cogs=new_weighted_cogs,
                stock=round(total_qty),
                unit=payload.unit.strip() or "Kg"
            )
            db.add(material)

        await db.flush()

        # 3. Deteksi produk jadi yang resepnya menggunakan bahan ini (BOM Cascade Recalculation)
        recipe_stmt = select(ProductRecipeItem).where(
            or_(
                ProductRecipeItem.material_id == material.id,
                func.lower(ProductRecipeItem.material_name) == func.lower(material.name)
            ),
            ProductRecipeItem.tenant_id == tenant_id
        )
        recipe_res = await db.execute(recipe_stmt)
        matching_recipe_items = recipe_res.scalars().all()

        affected_products_summary = []
        parent_product_ids: Set[str] = set()

        for r_item in matching_recipe_items:
            r_item.cost_per_unit = new_weighted_cogs
            r_item.material_id = material.id
            parent_product_ids.add(r_item.product_id)

        await db.flush()

        # 4. Hitung ulang HPP dan evaluasi harga anti-rugi untuk setiap produk jadi terkait
        for parent_id in parent_product_ids:
            parent_stmt = select(Product).where(Product.id == parent_id)
            parent_res = await db.execute(parent_stmt)
            parent_prod = parent_res.scalar_one_or_none()
            if not parent_prod:
                continue

            # Ambil semua bahan resep produk ini
            p_recipes_stmt = select(ProductRecipeItem).where(ProductRecipeItem.product_id == parent_id)
            p_recipes_res = await db.execute(p_recipes_stmt)
            all_materials = p_recipes_res.scalars().all()

            p_materials_list = []
            new_parent_material_cost = 0.0
            for m in all_materials:
                subtotal = float(m.quantity_required) * float(m.cost_per_unit)
                new_parent_material_cost += subtotal
                p_materials_list.append({
                    "material_name": m.material_name,
                    "quantity_required": float(m.quantity_required),
                    "unit": m.unit,
                    "cost_per_unit": float(m.cost_per_unit)
                })

            wastage_p = float(parent_prod.wastage_percent or 0.0)
            overhead_p = float(parent_prod.overhead_cost_per_unit or 0.0)
            multiplier = 1.0 / (1.0 - (wastage_p / 100.0)) if wastage_p < 99 else 1.0
            updated_parent_cogs = round((new_parent_material_cost * multiplier) + overhead_p, 2)
            old_parent_cogs = float(parent_prod.cogs)
            parent_prod.cogs = updated_parent_cogs

            # Evaluasi AI Pricing untuk produk jadi ini
            pricing_eval = ai_service.calculate_dynamic_pricing_recommendation(
                materials=p_materials_list,
                current_selling_price=float(parent_prod.price),
                overhead_cost_per_unit=overhead_p,
                wastage_percent=wastage_p,
                category=parent_prod.category,
                product_name=parent_prod.name
            )

            affected_products_summary.append({
                "product_id": parent_prod.id,
                "product_name": parent_prod.name,
                "current_price": float(parent_prod.price),
                "old_cogs": old_parent_cogs,
                "new_cogs": updated_parent_cogs,
                "cogs_increased": updated_parent_cogs > old_parent_cogs,
                "margin_status": pricing_eval["margin_status"],
                "margin_label": pricing_eval["margin_label"],
                "is_at_loss": pricing_eval["is_at_loss"],
                "recommended_price": pricing_eval["pricing_tiers"]["optimal_recommended"]["price"],
                "safe_floor_price": pricing_eval["pricing_tiers"]["safe_floor_minimum"]["price"],
                "ai_warning": pricing_eval["ai_insights"]["ai_executive_summary"]
            })

        # 4. Auto-posting Jurnal SAK EMKM: Pembelian Bahan Baku/Alat Tunai/Bank (Mengurangi Kas/Bank & Menambah Persediaan)
        total_purchase_amount = round(added_qty * purchase_price, 2)
        journal_entry_num = None
        if total_purchase_amount > 0:
            pay_method = (getattr(payload, "payment_method", "CASH") or "CASH").upper()
            target_cash_code = COA_BANK_GIRO_QRIS if pay_method == "BANK" else COA_CASH_ON_HAND

            # Tentukan akun debit: peralatan (1201) vs persediaan bahan baku (1104)
            is_equipment = any(k in material.category.lower() for k in ["alat", "peralatan", "mesin", "aset", "equipment"])
            debit_code = COA_FIXED_EQUIPMENT if is_equipment else COA_INVENTORY_RAW

            try:
                journal_entry = await AccountingService.post_double_entry(
                    db=db,
                    tenant_id=tenant_id,
                    description=f"Pembelian/Restock {material.name} ({added_qty} {material.unit})",
                    debit_account_code=debit_code,
                    credit_account_code=target_cash_code,
                    amount=total_purchase_amount,
                    memo_debit=f"Penambahan stok {material.name} {added_qty} {material.unit}",
                    memo_credit=f"Pembayaran {pay_method} restock ke {payload.supplier_name or 'Pemasok'}",
                    entry_number_prefix="JV-BUY",
                    update_account_balances=True
                )
                journal_entry_num = journal_entry.entry_number
            except Exception as e:
                print(f"[InventoryService] Warning posting jurnal restock: {e}")

        # Catat mutasi fisik barang ke buku besar mutasi (RESTOCK_IN)
        ref_buy = journal_entry_num or f"RESTOCK-{uuid.uuid4().hex[:6].upper()}"
        await cls.record_stock_movement(
            db=db,
            tenant_id=tenant_id,
            product_id=material.id,
            product_name=material.name,
            movement_type="RESTOCK_IN",
            quantity_delta=added_qty,
            unit=material.unit or "Kg",
            cost_per_unit=purchase_price,
            total_cost=total_purchase_amount,
            stock_before=old_stock,
            stock_after=total_qty,
            reference_number=ref_buy,
            notes=payload.notes or f"Restock dari {payload.supplier_name or 'Pemasok'}"
        )

        await db.commit()

        return {
            "success": True,
            "message": f"Restock bahan '{material.name}' berhasil. Kas/Bank berkurang Rp {total_purchase_amount:,.0f}. Moving Average Cost baru: Rp {new_weighted_cogs:,.2f}/{material.unit}",
            "cash_deducted": total_purchase_amount,
            "journal_entry_number": journal_entry_num,
            "material": {
                "id": material.id,
                "name": material.name,
                "old_stock": old_stock,
                "added_quantity": added_qty,
                "new_total_stock": float(material.stock),
                "old_cogs": old_cogs,
                "purchase_price": purchase_price,
                "new_weighted_cogs": new_weighted_cogs,
                "unit": material.unit
            },
            "affected_products_count": len(affected_products_summary),
            "affected_finished_products": affected_products_summary
        }

    @classmethod
    async def execute_production_batch(
        cls,
        db: AsyncSession,
        tenant_id: str,
        payload: ProductionBatchPayload
    ) -> Dict[str, Any]:
        """
        Mengeksekusi proses batch produksi:
        - Mengurangi stok bahan baku sesuai formula BOM
        - Menambah stok produk jadi yang dihasilkan
        - Menghitung HPP riil batch produksi dan status kelayakan harga AI
        - Merekam log transaksi ke ProductionBatchRecord
        """
        prod_stmt = select(Product).where(
            Product.id == payload.product_id,
            Product.tenant_id == tenant_id
        )
        prod_res = await db.execute(prod_stmt)
        product = prod_res.scalar_one_or_none()
        if not product:
            raise ValueError(f"Produk jadi dengan ID '{payload.product_id}' tidak ditemukan.")

        recipe_stmt = select(ProductRecipeItem).where(
            ProductRecipeItem.product_id == product.id,
            ProductRecipeItem.tenant_id == tenant_id
        )
        recipe_res = await db.execute(recipe_stmt)
        recipe_items = recipe_res.scalars().all()

        qty_produced = payload.quantity_produced
        overhead_batch = float(payload.overhead_cost or 0.0)
        batch_num = f"BATCH-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        total_batch_material_cost = 0.0
        materials_consumed = []
        materials_for_ai = []

        for r_item in recipe_items:
            required_qty = float(r_item.quantity_required) * qty_produced
            unit_cost = float(r_item.cost_per_unit)
            line_cost = required_qty * unit_cost
            total_batch_material_cost += line_cost

            # Kurangi stok bahan baku jika terhubung ke Product
            mat_prod = None
            if r_item.material_id:
                m_res = await db.execute(select(Product).where(Product.id == r_item.material_id))
                mat_prod = m_res.scalar_one_or_none()
            elif r_item.material_name:
                m_res = await db.execute(select(Product).where(
                    func.lower(Product.name) == func.lower(r_item.material_name),
                    Product.tenant_id == tenant_id
                ))
                mat_prod = m_res.scalar_one_or_none()

            if mat_prod:
                stock_prev = float(mat_prod.stock)
                stock_now = max(0, round(stock_prev - required_qty))
                mat_prod.stock = stock_now
                # Catat mutasi bahan baku keluar untuk produksi
                await cls.record_stock_movement(
                    db=db,
                    tenant_id=tenant_id,
                    product_id=mat_prod.id,
                    product_name=mat_prod.name,
                    movement_type="PRODUCTION_OUT",
                    quantity_delta=-required_qty,
                    unit=r_item.unit or mat_prod.unit or "Pcs",
                    cost_per_unit=unit_cost,
                    total_cost=line_cost,
                    stock_before=stock_prev,
                    stock_after=stock_now,
                    reference_number=batch_num,
                    notes=f"Konsumsi bahan produksi batch {batch_num} ({qty_produced} {product.unit} {product.name})"
                )

            materials_consumed.append({
                "material_name": r_item.material_name,
                "quantity_consumed": required_qty,
                "unit": r_item.unit,
                "unit_cost": unit_cost,
                "total_cost": round(line_cost, 2)
            })

            materials_for_ai.append({
                "material_name": r_item.material_name,
                "quantity_required": float(r_item.quantity_required),
                "unit": r_item.unit,
                "cost_per_unit": unit_cost
            })

        # Tambah stok produk jadi
        stock_before_prod = float(product.stock)
        product.stock = product.stock + qty_produced

        # Hitung HPP riil batch
        if not recipe_items and float(product.cogs or 0.0) > 0:
            total_batch_material_cost = float(product.cogs) * qty_produced

        wastage_pct = float(product.wastage_percent or 0.0)
        multiplier = 1.0 / (1.0 - (wastage_pct / 100.0)) if wastage_pct < 99 else 1.0
        adjusted_material_cost = (total_batch_material_cost / qty_produced) * multiplier
        overhead_per_unit = (overhead_batch / qty_produced) + float(product.overhead_cost_per_unit or 0.0)
        unit_cost_hpp = round(adjusted_material_cost + overhead_per_unit, 2)

        product.cogs = unit_cost_hpp

        # Catat mutasi produk jadi masuk dari hasil produksi
        await cls.record_stock_movement(
            db=db,
            tenant_id=tenant_id,
            product_id=product.id,
            product_name=product.name,
            movement_type="PRODUCTION_IN",
            quantity_delta=float(qty_produced),
            unit=product.unit or "Pcs",
            cost_per_unit=unit_cost_hpp,
            total_cost=round(unit_cost_hpp * qty_produced, 2),
            stock_before=stock_before_prod,
            stock_after=float(product.stock),
            reference_number=batch_num,
            notes=f"Hasil produksi batch {batch_num} (+{qty_produced} {product.unit})"
        )

        # Evaluasi AI Pricing
        pricing_eval = ai_service.calculate_dynamic_pricing_recommendation(
            materials=materials_for_ai if materials_for_ai else [{
                "material_name": "Biaya Bahan Produksi",
                "quantity_required": 1.0,
                "unit": product.unit or "Pcs",
                "cost_per_unit": unit_cost_hpp
            }],
            current_selling_price=float(product.price),
            overhead_cost_per_unit=overhead_per_unit,
            wastage_percent=wastage_pct,
            category=product.category,
            product_name=product.name
        )

        recommended_price = pricing_eval["pricing_tiers"]["optimal_recommended"]["price"]
        margin_status = pricing_eval["margin_status"]

        # Simpan batch record
        batch_record = ProductionBatchRecord(
            id=f"batch-{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            product_id=product.id,
            batch_number=batch_num,
            quantity_produced=qty_produced,
            total_material_cost=round(total_batch_material_cost, 2),
            overhead_cost=overhead_batch,
            wastage_percent=wastage_pct,
            unit_cost_hpp=unit_cost_hpp,
            selling_price_at_production=float(product.price),
            recommended_price=recommended_price,
            margin_status=margin_status,
            notes=payload.notes
        )
        db.add(batch_record)

        # Auto-posting Jurnal SAK EMKM: Biaya Overhead Produksi Batch Tunai (Jika ada biaya langsung listrik/gas/kemasan)
        overhead_journal_num = None
        if overhead_batch > 0:
            pay_method = (getattr(payload, "payment_method", "CASH") or "CASH").upper()
            target_cash_code = COA_BANK_GIRO_QRIS if pay_method == "BANK" else COA_CASH_ON_HAND
            try:
                journal_entry = await AccountingService.post_double_entry(
                    db=db,
                    tenant_id=tenant_id,
                    description=f"Biaya Overhead Produksi Batch {qty_produced} {product.name}",
                    debit_account_code=COA_COGS,
                    credit_account_code=target_cash_code,
                    amount=overhead_batch,
                    memo_debit=f"Beban overhead langsung batch {batch_num}",
                    memo_credit=f"Pembayaran {pay_method} overhead batch {batch_num}",
                    entry_number_prefix="JV-OVD",
                    update_account_balances=True
                )
                overhead_journal_num = journal_entry.entry_number
            except Exception as e:
                print(f"[InventoryService] Warning posting jurnal overhead batch: {e}")

        await db.commit()
        await db.refresh(product)

        return {
            "success": True,
            "message": f"Produksi {qty_produced} {product.unit} '{product.name}' berhasil dicatat. HPP batch: Rp {unit_cost_hpp:,.0f}/pcs",
            "batch_number": batch_num,
            "quantity_produced": qty_produced,
            "new_finished_stock": product.stock,
            "unit_cost_hpp": unit_cost_hpp,
            "current_selling_price": float(product.price),
            "overhead_cost": overhead_batch,
            "overhead_journal_number": overhead_journal_num,
            "margin_status": margin_status,
            "margin_label": pricing_eval["margin_label"],
            "is_at_loss": pricing_eval["is_at_loss"],
            "recommended_price": recommended_price,
            "materials_consumed": materials_consumed,
            "ai_insights": pricing_eval["ai_insights"]
        }

    @classmethod
    async def scan_margin_leakage(
        cls,
        db: AsyncSession,
        tenant_id: str,
        tax_rate: float = 0.005
    ) -> Dict[str, Any]:
        """
        Pindai otomatis seluruh katalog produk untuk mendeteksi 'Margin Leakage':
        - Produk yang harga jualnya di bawah titik impas (BEP) -> CRITICAL_LOSS
        - Produk yang margin kotornya di bawah batas aman minimum (20%) -> MARGIN_LEAKAGE
        """
        stmt = select(Product).where(Product.tenant_id == tenant_id).order_by(Product.name.asc())
        res = await db.execute(stmt)
        products = res.scalars().all()

        alerts = []
        healthy_count = 0
        total_products = len(products)

        for p in products:
            cogs = float(p.cogs or 0.0)
            price = float(p.price or 0.0)

            if cogs <= 0 or price <= 0:
                continue

            bep = cogs / (1.0 - tax_rate)
            floor = cogs / (1.0 - 0.20 - tax_rate)
            rec = cogs / (1.0 - 0.35 - tax_rate)
            margin_pct = round(((price - cogs) / price) * 100, 1)

            if price < bep:
                alerts.append({
                    "product_id": p.id,
                    "product_name": p.name,
                    "category": p.category,
                    "current_price": price,
                    "cogs": cogs,
                    "current_margin_percent": margin_pct,
                    "severity": "CRITICAL",
                    "status": "CRITICAL_LOSS",
                    "label": "RUGI OPERASIONAL! Dijual di bawah titik impas",
                    "bep_price": float(int((bep + 499) // 500) * 500),
                    "recommended_price": float(int((rec + 499) // 500) * 500)
                })
            elif price < floor:
                alerts.append({
                    "product_id": p.id,
                    "product_name": p.name,
                    "category": p.category,
                    "current_price": price,
                    "cogs": cogs,
                    "current_margin_percent": margin_pct,
                    "severity": "WARNING",
                    "status": "MARGIN_LEAKAGE",
                    "label": "MARGIN BOCOR: Di bawah batas aman 20%",
                    "bep_price": float(int((bep + 499) // 500) * 500),
                    "recommended_price": float(int((rec + 499) // 500) * 500)
                })
            else:
                healthy_count += 1

        return {
            "total_products_scanned": total_products,
            "healthy_count": healthy_count,
            "leakage_count": len(alerts),
            "alerts": alerts
        }

    @classmethod
    async def get_stock_movements(
        cls,
        db: AsyncSession,
        tenant_id: str,
        product_id: Optional[str] = None,
        movement_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Mengambil riwayat mutasi keluar-masuk barang fisik (Stock Movement Ledger).
        """
        stmt = select(StockMovementRecord).where(
            StockMovementRecord.tenant_id == tenant_id
        )
        if product_id:
            stmt = stmt.where(StockMovementRecord.product_id == product_id)
        if movement_type:
            stmt = stmt.where(StockMovementRecord.movement_type == movement_type)

        stmt = stmt.order_by(StockMovementRecord.created_at.desc()).limit(limit)
        res = await db.execute(stmt)
        records = res.scalars().all()

        return [
            {
                "id": r.id,
                "tenant_id": r.tenant_id,
                "product_id": r.product_id,
                "product_name": r.product_name,
                "movement_type": r.movement_type,
                "quantity_delta": float(r.quantity_delta),
                "unit": r.unit,
                "cost_per_unit": float(r.cost_per_unit),
                "total_cost": float(r.total_cost),
                "stock_before": float(r.stock_before),
                "stock_after": float(r.stock_after),
                "reference_number": r.reference_number,
                "notes": r.notes,
                "created_at": r.created_at.strftime("%d-%m-%Y %H:%M:%S WIB") if r.created_at else ""
            }
            for r in records
        ]

    @classmethod
    async def adjust_stock(
        cls,
        db: AsyncSession,
        tenant_id: str,
        payload: StockAdjustmentPayload
    ) -> Dict[str, Any]:
        """
        Siklus Stock Opname / Penyesuaian Stok Fisik Riil:
        - Memperbarui stok fisik di katalog
        - Merekam kartu mutasi STOCK_OPNAME_ADJUSTMENT
        - Jika terjadi selisih minus (kehilangan/kerusakan/basi), otomatis posting jurnal rugi persediaan SAK EMKM
        """
        stmt = select(Product).where(
            Product.id == payload.product_id,
            Product.tenant_id == tenant_id
        )
        res = await db.execute(stmt)
        product = res.scalar_one_or_none()
        if not product:
            raise ValueError(f"Barang dengan ID '{payload.product_id}' tidak ditemukan.")

        stock_before = float(product.stock)
        stock_after = float(payload.actual_physical_stock)
        diff = stock_after - stock_before

        if diff == 0:
            return {
                "success": True,
                "message": f"Stok fisik {product.name} sudah sesuai catatan sistem ({stock_before} {product.unit}).",
                "product_id": product.id,
                "stock": product.stock,
                "difference": 0
            }

        product.stock = round(stock_after)
        cogs = float(product.cogs or 0.0)
        total_adjustment_value = round(abs(diff) * cogs, 2)
        ref_num = f"OPN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        # Catat mutasi stok
        await cls.record_stock_movement(
            db=db,
            tenant_id=tenant_id,
            product_id=product.id,
            product_name=product.name,
            movement_type="STOCK_OPNAME_ADJUSTMENT",
            quantity_delta=diff,
            unit=product.unit or "Pcs",
            cost_per_unit=cogs,
            total_cost=total_adjustment_value,
            stock_before=stock_before,
            stock_after=stock_after,
            reference_number=ref_num,
            notes=f"Stock Opname: {payload.reason}. {payload.notes or ''}"
        )

        # Jika ada selisih negatif (stok fisik hilang/rusak/basi), posting jurnal rugi persediaan SAK EMKM
        journal_entry_num = None
        if diff < 0 and total_adjustment_value > 0:
            is_equipment = any(k in product.category.lower() for k in ["alat", "peralatan", "mesin", "aset", "equipment"])
            inv_credit_code = COA_FIXED_EQUIPMENT if is_equipment else COA_INVENTORY_RAW
            try:
                journal = await AccountingService.post_double_entry(
                    db=db,
                    tenant_id=tenant_id,
                    description=f"Penyusutan/Kerugian Persediaan {product.name} (Opname)",
                    debit_account_code=COA_COGS,
                    credit_account_code=inv_credit_code,
                    amount=total_adjustment_value,
                    memo_debit=f"Selisih stok hilang/rusak {abs(diff)} {product.unit} (Opname)",
                    memo_credit=f"Penyesuaian kartu stok fisik {ref_num}",
                    entry_number_prefix="JV-OPN",
                    update_account_balances=True
                )
                journal_entry_num = journal.entry_number
            except Exception as e:
                print(f"[InventoryService] Warning posting jurnal opname: {e}")

        await db.commit()
        await db.refresh(product)

        return {
            "success": True,
            "message": f"Stok {product.name} berhasil disesuaikan dari {stock_before} menjadi {stock_after} {product.unit}.",
            "product_id": product.id,
            "product_name": product.name,
            "stock_before": stock_before,
            "stock_after": stock_after,
            "difference": diff,
            "reference_number": ref_num,
            "journal_entry_number": journal_entry_num
        }

    @classmethod
    async def get_inventory_summary(
        cls,
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Menghasilkan rekapitulasi menyeluruh stok persediaan:
        - Bahan Baku & Kemasan (1104)
        - Produk Jadi Siap Jual (1105)
        - Peralatan & Aset Toko (1201)
        - Peringatan stok menipis (Low Stock Alert)
        """
        stmt = select(Product).where(Product.tenant_id == tenant_id).order_by(Product.name.asc())
        res = await db.execute(stmt)
        all_products = res.scalars().all()

        raw_materials = []
        finished_goods = []
        equipment_assets = []

        total_raw_value = 0.0
        total_finished_value = 0.0
        total_equipment_value = 0.0
        low_stock_count = 0

        for p in all_products:
            cat = (p.category or "").lower()
            name = (p.name or "").lower()
            stock = float(p.stock or 0)
            cogs = float(p.cogs or 0)
            price = float(p.price or 0)
            item_value = stock * (cogs if cogs > 0 else price)

            is_eq = any(k in cat or k in name for k in ["alat", "peralatan", "mesin", "aset", "equipment", "blender", "timbangan", "grinder", "wajan", "kompor"])
            is_mat = any(k in cat or k in name for k in ["bahan", "raw", "material", "kemasan", "packaging", "biji", "bubuk", "tepung", "gula", "cup", "botol kosong"])

            is_low = stock <= 5 and not is_eq
            if is_low:
                low_stock_count += 1

            item_dict = {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "category": p.category,
                "stock": p.stock,
                "unit": p.unit or "Pcs",
                "cogs": cogs,
                "price": price,
                "total_inventory_value": round(item_value, 2),
                "is_low_stock": is_low
            }

            if is_eq:
                equipment_assets.append(item_dict)
                total_equipment_value += item_value
            elif is_mat:
                raw_materials.append(item_dict)
                total_raw_value += item_value
            else:
                finished_goods.append(item_dict)
                total_finished_value += item_value

        return {
            "summary": {
                "total_raw_material_value": round(total_raw_value, 2),
                "total_finished_goods_value": round(total_finished_value, 2),
                "total_equipment_value": round(total_equipment_value, 2),
                "total_warehouse_value": round(total_raw_value + total_finished_value + total_equipment_value, 2),
                "total_items_count": len(all_products),
                "raw_materials_count": len(raw_materials),
                "finished_goods_count": len(finished_goods),
                "equipment_assets_count": len(equipment_assets),
                "low_stock_alerts_count": low_stock_count
            },
            "raw_materials": raw_materials,
            "finished_goods": finished_goods,
            "equipment_assets": equipment_assets
        }


# Singleton instance
inventory_service = InventoryService()

