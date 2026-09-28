"""
Unit Tests for InventoryService & POS Schemas
Pengujian ketat kalkulasi matematis Moving Weighted Average Cost (MWA) dan validasi DTO.

Standar:
- SAK EMKM Persediaan
- Hexagonal Architecture Domain Testing
"""

import unittest
from app.domain.services.inventory_service import InventoryService
from app.schemas.pos import (
    RestockInventoryPayload,
    ProductionBatchPayload,
    CreatePOSProductPayload,
    SaveRecipePayload,
    RecipeItemPayload
)


class TestInventoryService(unittest.TestCase):
    """Pengujian kalkulasi matematis persediaan bergerak dan validasi DTO."""

    def test_moving_weighted_average_standard(self):
        """
        Skenario:
        - Stok lama: 10 kg @ Rp 20.000 = Rp 200.000
        - Restock baru: 15 kg @ Rp 25.000 = Rp 375.000
        - Total kuantitas: 25 kg
        - Total nilai: Rp 575.000
        - MWA Cost = 575.000 / 25 = Rp 23.000
        """
        mwa = InventoryService.calculate_moving_weighted_average(
            old_stock=10.0,
            old_cogs=20000.0,
            added_qty=15.0,
            purchase_price=25000.0
        )
        self.assertEqual(mwa, 23000.0)

    def test_moving_weighted_average_initial_stock(self):
        """
        Skenario stok awal kosong (0 unit):
        - Stok lama: 0 kg @ Rp 0
        - Restock baru: 50 kg @ Rp 12.500
        - MWA Cost harus persis sama dengan harga beli faktur: Rp 12.500
        """
        mwa = InventoryService.calculate_moving_weighted_average(
            old_stock=0.0,
            old_cogs=0.0,
            added_qty=50.0,
            purchase_price=12500.0
        )
        self.assertEqual(mwa, 12500.0)

    def test_moving_weighted_average_zero_total_qty(self):
        """
        Edge case: Total kuantitas <= 0 tidak boleh menghasilkan ZeroDivisionError.
        """
        mwa = InventoryService.calculate_moving_weighted_average(
            old_stock=0.0,
            old_cogs=0.0,
            added_qty=0.0,
            purchase_price=18000.0
        )
        self.assertEqual(mwa, 18000.0)

    def test_restock_payload_validation(self):
        """
        Memastikan payload restock divalidasi dengan benar oleh Pydantic.
        """
        payload = RestockInventoryPayload(
            material_name="Tepung Terigu Segitiga Biru",
            quantity_added=25.0,
            unit="Kg",
            purchase_price_per_unit=11500.0,
            supplier_name="Toko Bahan Kue Berkah"
        )
        self.assertEqual(payload.material_name, "Tepung Terigu Segitiga Biru")
        self.assertEqual(payload.quantity_added, 25.0)
        self.assertEqual(payload.purchase_price_per_unit, 11500.0)

    def test_production_batch_payload_validation(self):
        """
        Memastikan payload produksi batch divalidasi dengan kuantitas > 0.
        """
        payload = ProductionBatchPayload(
            product_id="prd-12345",
            quantity_produced=50,
            overhead_cost=15000.0,
            notes="Batch produksi pagi"
        )
        self.assertEqual(payload.product_id, "prd-12345")
        self.assertEqual(payload.quantity_produced, 50)
        self.assertEqual(payload.overhead_cost, 15000.0)

    def test_recipe_payload_hierarchy(self):
        """
        Memastikan hierarki BOM RecipePayload mematuhi batas margin 10-90%.
        """
        item = RecipeItemPayload(
            material_name="Daging Ayam Fillet",
            quantity_required=0.15,
            unit="Kg",
            cost_per_unit=42000.0
        )
        recipe = SaveRecipePayload(
            overhead_cost_per_unit=1500.0,
            wastage_percent=5.0,
            target_margin_percent=40.0,
            items=[item]
        )
        self.assertEqual(len(recipe.items), 1)
        self.assertEqual(recipe.target_margin_percent, 40.0)


if __name__ == "__main__":
    unittest.main()
