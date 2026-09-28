"""
Unit Test Suite: Real AI & Agentic AI Service (FINA-ENTERPRISE)
Menguji 7 fitur AI cerdas:
1. Voice Dialek Daerah (NLP & Speech Entity Extraction)
2. Forensik Nota & Computer Vision ELA (Piksel ELA Matrix + Vision OCR)
3. AR Dunning WhatsApp Agent (Generative WhatsApp Copywriting)
4. AI Support Desk Cognitive Ticket Resolver
5. Anti-Predatory Loan Diagnostics (Fine-Print Contract Reasoning)
6. B2B Commodity Semantic Matching (Ramp-Style Benchmarking)
7. FinOrchestrator Autonomous Cognitive Cycle (Perceive -> Reason -> Act)
"""

import io
import unittest
from PIL import Image

from app.domain.services.ai_service import ai_service


class TestRealAIService(unittest.TestCase):

    def setUp(self):
        # Buat gambar dummy 100x100 untuk pengujian Computer Vision ELA
        img = Image.new("RGB", (100, 100), color=(255, 255, 255))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        self.sample_image_bytes = buf.getvalue()

    def test_feature_1_dialect_intent_parsing(self):
        """Fitur 1: Ekstraksi entitas dialek lokal ke entitas akuntansi SAK EMKM."""
        res_jawa = ai_service.parse_dialect_intent("Kulakan beras rojo lele limang kilo", dialect="JAWA")
        self.assertIn("action_type", res_jawa)
        self.assertIn("canonical_term", res_jawa)
        self.assertIn("target_coa_code", res_jawa)
        self.assertIn("confidence", res_jawa)
        self.assertGreaterEqual(res_jawa["confidence"], 0.5)

    def test_feature_2_forensics_ela_and_multimodal(self):
        """Fitur 2: Analisis Error Level Analysis (ELA) piksel nyata & integritas aritmatika."""
        # 1. Tes ELA matrix computation
        score, is_tampered, detail = ai_service.compute_ela_matrix(self.sample_image_bytes)
        self.assertIsInstance(score, int)
        self.assertIsInstance(is_tampered, bool)
        self.assertIsInstance(detail, str)

        # 2. Tes Multimodal receipt analysis dengan selisih aritmatika buatan
        items_tampered = [
            {"name": "Minyak Goreng", "qty": 1, "unitPrice": 18000, "subtotal": 18000},
            {"name": "Gula Pasir", "qty": 1, "unitPrice": 15000, "subtotal": 15000}
        ]
        # subtotal di nota 50.000 padahal total rincian 33.000 (inkonsistensi aritmatika)
        res_tampered = ai_service.analyze_receipt_multimodal(
            image_bytes=self.sample_image_bytes,
            subtotal=50000.0,
            grand_total=50000.0,
            items=items_tampered
        )
        self.assertTrue(res_tampered["is_tampered"])
        self.assertLessEqual(res_tampered["ela_score"], 50)
        self.assertIn("Inkonsistensi Aritmatika", res_tampered["details"])

    def test_feature_3_ar_dunning_whatsapp_agent(self):
        """Fitur 3: Penyusunan pesan penagihan piutang WhatsApp ramah & solutif."""
        msg = ai_service.generate_dunning_message(
            customer_name="Ibu Siti Rahma",
            invoice_number="INV-202609-001",
            amount=1500000.0,
            days_overdue=5,
            tone="FRIENDLY",
            snap_url="https://app.midtrans.com/snap/v2/vtweb/demo-qris-001"
        )
        self.assertIsInstance(msg, str)
        self.assertIn("Ibu Siti Rahma", msg)
        self.assertIn("INV-202609-001", msg)

    def test_feature_4_support_ticket_resolver(self):
        """Fitur 4: Diagnosa keluhan teknis tiket support kasir/keuangan."""
        conf, sol = ai_service.evaluate_support_ticket(
            subject="Printer Bluetooth tidak mau cetak struk",
            description="Lampu indikator menyala merah dan kertas tidak keluar saat transaksi POS diselesaikan.",
            category="HARDWARE_PRINTER"
        )
        self.assertIsInstance(conf, int)
        self.assertGreater(conf, 50)
        self.assertIsInstance(sol, str)
        self.assertTrue(len(sol) > 10)

    def test_feature_5_anti_predatory_loan_diagnostics(self):
        """Fitur 5: Analisa risiko pinjol predator berdasar aturan OJK."""
        diag = ai_service.evaluate_loan_threat(
            provider_name="Dana Cepat Kilat Online",
            requested_amount=10000000.0,
            effective_apr=185.0,
            admin_fee_percent=15.0,
            daily_rate=0.5,
            notes="Pinjaman modal kilat tanpa agunan"
        )
        self.assertIsInstance(diag, str)
        self.assertTrue("OJK" in diag or "APR" in diag or "Dana Cepat Kilat Online" in diag)

    def test_feature_6_b2b_commodity_semantic_matching(self):
        """Fitur 6: Pencocokan semantik istilah komoditas pasar ke acuan Bapanas."""
        sample_benchmarks = [
            {"id": "bm-1", "commodity_name": "Beras Premium", "market_median_price": 15500.0},
            {"id": "bm-2", "commodity_name": "Minyak Goreng Sawit", "market_median_price": 17800.0},
            {"id": "bm-3", "commodity_name": "Gula Pasir Kristal", "market_median_price": 17500.0}
        ]
        matched_id, conf = ai_service.match_commodity_semantic("Minyak curah kiloan", sample_benchmarks)
        self.assertIsNotNone(matched_id)
        self.assertGreaterEqual(conf, 0.5)

    def test_feature_7_finorchestrator_autonomous_cycle(self):
        """Fitur 7: Siklus kognitif FinOrchestrator (Perceive -> Reason -> Act)."""
        cycle = ai_service.evaluate_autonomous_orchestrator(
            liquid_cash=50000000.0,
            safety_buffer=15000000.0,
            runway_days=120,
            overdue_ar=8500000.0
        )
        self.assertIn("orchestrator_status", cycle)
        self.assertIn("recommended_actions", cycle)
        actions = cycle["recommended_actions"]
        action_names = [a["action"] for a in actions]
        # Kas likuid > safety buffer -> Sweeping
        self.assertIn("SWEEP_IDLE_CASH", action_names)
        # Piutang beredar > 0 -> Dunning
        self.assertIn("TRIGGER_AR_DUNNING", action_names)


if __name__ == "__main__":
    unittest.main()
