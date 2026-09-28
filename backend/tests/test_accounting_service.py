"""
Unit Test Suite: Accounting Domain Service
- Format dan keunikan nomor voucher jurnal
- Integritas deterministik SHA-256 Merkle Hash
- Konsistensi Bagan Akun Standar SAK EMKM
"""

import unittest
from app.domain.services.accounting_service import (
    AccountingService,
    COA_CASH_ON_HAND,
    COA_BANK_GIRO_QRIS,
    COA_ACCOUNTS_RECEIVABLE,
    COA_INVENTORY_RAW,
    COA_SALES_REVENUE,
    COA_COGS,
    COA_OPERATING_EXPENSE
)

class TestAccountingService(unittest.TestCase):
    def test_generate_entry_number_format(self):
        num1 = AccountingService.generate_entry_number("JV-POS")
        num2 = AccountingService.generate_entry_number("JV-POS")
        self.assertTrue(num1.startswith("JV-POS-"))
        self.assertTrue(num2.startswith("JV-POS-"))
        self.assertNotEqual(num1, num2)

    def test_merkle_hash_deterministic(self):
        payload = "JV-001:tenant-1:1101:4101:500000.00:2026-09-24T10:00:00Z"
        hash1 = AccountingService.calculate_merkle_hash(payload)
        hash2 = AccountingService.calculate_merkle_hash(payload)
        self.assertTrue(hash1.startswith("sha256:"))
        self.assertEqual(hash1, hash2)
        self.assertEqual(len(hash1), 7 + 64)  # "sha256:" + 64 hex chars

    def test_coa_constants_validity(self):
        self.assertEqual(COA_CASH_ON_HAND, "1101")
        self.assertEqual(COA_BANK_GIRO_QRIS, "1102")
        self.assertEqual(COA_ACCOUNTS_RECEIVABLE, "1103")
        self.assertEqual(COA_INVENTORY_RAW, "1104")
        self.assertEqual(COA_SALES_REVENUE, "4101")
        self.assertEqual(COA_COGS, "5101")
        self.assertEqual(COA_OPERATING_EXPENSE, "6103")

if __name__ == "__main__":
    unittest.main()
