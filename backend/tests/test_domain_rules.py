"""
Unit Test Suite: Domain Rules FINA-ENTERPRISE
- SAK EMKM Double-Entry Balancing & Merkle Hash
- Perpajakan UMKM PP No. 55 Tahun 2022 (PTKP Rp 500 Juta)
- Zero-Knowledge PII Masking Engine (UU No. 27/2022)
"""

from decimal import Decimal
import unittest
from app.domain.rules.sak_emkm_rules import SAKEMKMRules, SAKEMKMValidationError
from app.domain.rules.tax_pp55_rules import TaxPP55Rules
from app.domain.rules.pii_masking_rules import PIIMaskingRules

class TestDomainRules(unittest.TestCase):
    def test_sak_emkm_balanced_journal(self):
        lines = [
            {"debit": 2500000.00, "credit": 0.0},
            {"debit": 0.0, "credit": 2500000.00}
        ]
        debit, credit = SAKEMKMRules.validate_double_entry(lines)
        self.assertEqual(debit, Decimal("2500000.00"))
        self.assertEqual(credit, Decimal("2500000.00"))

    def test_sak_emkm_unbalanced_journal_raises_error(self):
        lines = [
            {"debit": 2500000.00, "credit": 0.0},
            {"debit": 0.0, "credit": 2400000.00}
        ]
        with self.assertRaises(SAKEMKMValidationError):
            SAKEMKMRules.validate_double_entry(lines)

    def test_merkle_chaining(self):
        h = SAKEMKMRules.calculate_merkle_hash("prev_genesis", "JRN-001", Decimal("2500000.00"))
        self.assertTrue(h.startswith("sha256:"))

    def test_tax_pp55_under_ptkp(self):
        # Omzet kumulatif masih di bawah 500 juta -> Bebas Pajak
        res = TaxPP55Rules.calculate_pp55_tax(Decimal("50000000"), Decimal("200000000"), is_corporate_entity=False)
        self.assertEqual(res["status"], "TAX_EXEMPT")
        self.assertEqual(res["tax_due"], 0.0)

    def test_tax_pp55_over_ptkp(self):
        # Omzet kumulatif surplus melewati 500 juta -> Pajak 0.5% atas surplus
        res = TaxPP55Rules.calculate_pp55_tax(Decimal("100000000"), Decimal("450000000"), is_corporate_entity=False)
        self.assertEqual(res["status"], "TAX_PAYABLE")
        # Total 550jt, surplus 50jt * 0.5% = 250.000
        self.assertEqual(res["tax_due"], 250000.0)

    def test_pii_masking_engine(self):
        self.assertEqual(PIIMaskingRules.mask_nik("3201123456780001"), "3201********0001")
        self.assertEqual(PIIMaskingRules.mask_phone("+6281234567890"), "+6281****890")
        self.assertEqual(PIIMaskingRules.mask_bank_account("1400019283741"), "****-****-3741")

if __name__ == "__main__":
    unittest.main()
