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
    ProductionBatchRecord
)
from app.domain.services.ai_service import ai_service
from app.schemas.pos import (
    RestockInventoryPayload,
    ProductionBatchPayload
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

        await db.commit()

        return {
            "success": True,
            "message": f"Restock bahan '{material.name}' berhasil. Moving Average Cost baru: Rp {new_weighted_cogs:,.2f}/{material.unit}",
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
                mat_prod.stock = max(0, round(float(mat_prod.stock) - required_qty))

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
        product.stock = product.stock + qty_produced

        # Hitung HPP riil batch
        wastage_pct = float(product.wastage_percent or 0.0)
        multiplier = 1.0 / (1.0 - (wastage_pct / 100.0)) if wastage_pct < 99 else 1.0
        adjusted_material_cost = (total_batch_material_cost / qty_produced) * multiplier
        overhead_per_unit = (overhead_batch / qty_produced) + float(product.overhead_cost_per_unit or 0.0)
        unit_cost_hpp = round(adjusted_material_cost + overhead_per_unit, 2)

        product.cogs = unit_cost_hpp

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
        batch_num = f"BATCH-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
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


# Singleton instance
inventory_service = InventoryService()
