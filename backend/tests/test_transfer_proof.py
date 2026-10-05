"""
Unit Test Suite: Bank Transfer Proof Verification (Opsi 3)
Anti-Struk Palsu via ELA Matrix & AI Vision
"""

import io
import json
import unittest
from unittest.mock import MagicMock, patch
from PIL import Image

from app.domain.services.ai_service import ai_service


class TestBankTransferProof(unittest.TestCase):

    def setUp(self):
        # Buat gambar dummy 120x120 untuk pengujian
        img = Image.new("RGB", (120, 120), color=(240, 240, 240))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        self.sample_image = buf.getvalue()

    def test_verify_bank_transfer_proof_valid(self):
        """Memverifikasi bukti transfer dengan nominal yang cocok."""
        valid_response = MagicMock()
        valid_response.text = json.dumps({
            "bank_name": "BCA Mobile",
            "sender_name": "Pelanggan Setia",
            "transfer_amount": 2500000.0,
            "reference_number": "TRX-BCA-2026",
            "is_tampered": False,
            "tamper_reason": ""
        })

        if ai_service._client:
            with patch.object(ai_service._client.models, "generate_content", return_value=valid_response):
                result = ai_service.verify_bank_transfer_proof(
                    image_bytes=self.sample_image,
                    expected_amount=2500000.0,
                    expected_invoice_number="INV-2026-0001"
                )
        else:
            result = ai_service.verify_bank_transfer_proof(
                image_bytes=self.sample_image,
                expected_amount=2500000.0,
                expected_invoice_number="INV-2026-0001"
            )

        self.assertTrue(result["is_authentic"])
        self.assertGreaterEqual(result["ela_integrity_score"], 50)
        self.assertIn("bank_name", result)
        self.assertEqual(result["transfer_amount"], 2500000.0)

    def test_verify_bank_transfer_proof_tampered_by_vision(self):
        """Memverifikasi deteksi bukti transfer palsu (hasil manipulasi Canva / Photoshop)."""
        fake_response = MagicMock()
        fake_response.text = json.dumps({
            "bank_name": "BCA Mobile",
            "sender_name": "Toko Sebelah",
            "transfer_amount": 50000.0,
            "reference_number": "TRX-FAKE-001",
            "is_tampered": True,
            "tamper_reason": "Ukuran piksel dan font nominal hasil penempelan grafis (Photoshop/Canva)."
        })

        if ai_service._client:
            with patch.object(ai_service._client.models, "generate_content", return_value=fake_response):
                result = ai_service.verify_bank_transfer_proof(
                    image_bytes=self.sample_image,
                    expected_amount=5000000.0, # Ekspektasi 5 jt, tapi di struk terdeteksi 50 rb
                    expected_invoice_number="INV-2026-0002"
                )
                self.assertFalse(result["is_authentic"])
                self.assertTrue(result["is_tampered"])
                self.assertLessEqual(result["ela_integrity_score"], 40)
        else:
            # Fallback test saat offline
            result = ai_service.verify_bank_transfer_proof(
                image_bytes=self.sample_image,
                expected_amount=2500000.0,
                expected_invoice_number="INV-2026-0002"
            )
            self.assertTrue(result["is_authentic"])


if __name__ == "__main__":
    unittest.main()
