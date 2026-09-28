"""
Unit Test Suite: AI Dynamic Pricing & Bill of Materials (BOM) Recommendation Engine
Anti-Margin Leakage: Verifikasi Perhitungan HPP, Titik Impas (BEP), dan Batas Aman Laba
Standar: SAK EMKM, PPh Final PP 55/2022 (0.5%), Moving Weighted Average Cost
"""

import unittest
from app.domain.services.ai_service import ai_service


class TestDynamicPricingEngine(unittest.TestCase):
    def setUp(self):
        # Contoh Resep: 1 Porsi Kopi Susu Aren
        self.sample_materials = [
            {"material_name": "Biji Kopi Arabika", "quantity_required": 0.02, "unit": "Kg", "cost_per_unit": 180000.0},  # Rp 3.600
            {"material_name": "Susu UHT Full Cream", "quantity_required": 0.15, "unit": "Liter", "cost_per_unit": 20000.0}, # Rp 3.000
            {"material_name": "Gula Aren Cair", "quantity_required": 0.03, "unit": "Liter", "cost_per_unit": 30000.0},     # Rp 900
            {"material_name": "Cup + Lid + Straw", "quantity_required": 1.0, "unit": "Pcs", "cost_per_unit": 1200.0}       # Rp 1.200
        ]
        # Total Direct Material = 3.600 + 3.000 + 900 + 1.200 = Rp 8.700

    def test_raw_material_cost_calculation(self):
        """Memastikan biaya bahan baku langsung dihitung secara presisi."""
        res = ai_service.calculate_dynamic_pricing_recommendation(
            materials=self.sample_materials,
            current_selling_price=18000.0,
            overhead_cost_per_unit=500.0,  # Listrik & Es batu
            wastage_percent=0.0,
            category="Minuman",
            product_name="Kopi Susu Aren"
        )
        self.assertEqual(res["raw_material_cost"], 8700.0)
        self.assertEqual(res["total_unit_cost_hpp"], 9200.0)  # 8.700 + 500

    def test_wastage_yield_loss_adjustment(self):
        """Memastikan faktor susut bahan (misal 5%) diperhitungkan menaikkan HPP riil."""
        res = ai_service.calculate_dynamic_pricing_recommendation(
            materials=self.sample_materials,
            current_selling_price=18000.0,
            overhead_cost_per_unit=0.0,
            wastage_percent=5.0,  # 5% susut bahan
            category="Minuman",
            product_name="Kopi Susu Aren"
        )
        # adjusted = 8.700 / 0.95 = 9.157,89
        self.assertAlmostEqual(res["raw_material_cost"], 8700.0, places=1)
        self.assertGreater(res["total_unit_cost_hpp"], 8700.0)
        self.assertAlmostEqual(res["total_unit_cost_hpp"], 9157.89, places=1)

    def test_pricing_tiers_and_anti_rugi_bep(self):
        """Memastikan tier harga BEP, Floor 20%, dan Optimal 35% menutup pajak PP55 (0.5%)."""
        res = ai_service.calculate_dynamic_pricing_recommendation(
            materials=self.sample_materials,
            current_selling_price=18000.0,
            overhead_cost_per_unit=500.0,  # HPP = 9.200
            wastage_percent=0.0,
            category="Minuman",
            product_name="Kopi Susu Aren",
            target_margin_percent=35.0
        )
        tiers = res["pricing_tiers"]
        # BEP = 9.200 / (1 - 0.005) = 9.246 -> rounded Rp 9.500
        self.assertEqual(tiers["bep_break_even"]["price"], 9500.0)
        # Floor (Margin 20%) = 9.200 / (1 - 0.20 - 0.005) = 9.200 / 0.795 = 11.572 -> rounded Rp 12.000
        self.assertEqual(tiers["safe_floor_minimum"]["price"], 12000.0)
        # Optimal (Margin 35%) = 9.200 / (1 - 0.35 - 0.005) = 9.200 / 0.645 = 14.263 -> rounded Rp 14.500
        self.assertEqual(tiers["optimal_recommended"]["price"], 14500.0)

    def test_critical_loss_detection(self):
        """Memastikan jika produk dijual di bawah BEP, sistem mendeteksi CRITICAL_LOSS."""
        res = ai_service.calculate_dynamic_pricing_recommendation(
            materials=self.sample_materials,
            current_selling_price=8000.0,  # Dijual 8.000 padahal HPP 9.200!
            overhead_cost_per_unit=500.0,
            wastage_percent=0.0,
            category="Minuman",
            product_name="Kopi Susu Aren"
        )
        self.assertTrue(res["is_at_loss"])
        self.assertEqual(res["margin_status"], "CRITICAL_LOSS")
        self.assertIn("PERINGATAN KRITIS", res["ai_insights"]["ai_executive_summary"])

    def test_margin_leakage_detection(self):
        """Memastikan jika produk dijual di bawah margin aman 20%, status MARGIN_LEAKAGE."""
        res = ai_service.calculate_dynamic_pricing_recommendation(
            materials=self.sample_materials,
            current_selling_price=10500.0,  # Di atas BEP 9.500 tapi di bawah Floor 12.000
            overhead_cost_per_unit=500.0,
            wastage_percent=0.0,
            category="Minuman",
            product_name="Kopi Susu Aren"
        )
        self.assertTrue(res["is_at_loss"])
        self.assertEqual(res["margin_status"], "MARGIN_LEAKAGE")
        self.assertIn("MARGIN BOCOR", res["ai_insights"]["ai_executive_summary"])

    def test_healthy_margin_detection(self):
        """Memastikan jika produk dijual dengan margin di atas 20%, status HEALTHY."""
        res = ai_service.calculate_dynamic_pricing_recommendation(
            materials=self.sample_materials,
            current_selling_price=20000.0,  # Margin = (20.000 - 9.200) / 20.000 = 54%
            overhead_cost_per_unit=500.0,
            wastage_percent=0.0,
            category="Minuman",
            product_name="Kopi Susu Aren"
        )
        self.assertFalse(res["is_at_loss"])
        self.assertEqual(res["margin_status"], "HEALTHY")
        self.assertAlmostEqual(res["current_margin_percent"], 54.0, places=1)


if __name__ == "__main__":
    unittest.main()
