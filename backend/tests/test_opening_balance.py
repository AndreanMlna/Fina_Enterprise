"""
Unit Test Suite: Initial Balance (Modal Awal) & Opening Balance Posting
Kepatuhan SAK EMKM: Double-Entry Balancing & Deterministic SHA-256 Merkle Chaining
"""

import unittest
from unittest.mock import AsyncMock, MagicMock
from app.domain.services.accounting_service import AccountingService
from app.domain.rules.sak_emkm_rules import SAKEMKMValidationError


class TestOpeningBalance(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tenant_id = "test-tenant-umkm-001"
        self.effective_date = "2026-09-28"

    async def test_unbalanced_opening_balance_raises_error(self):
        """Memastikan jika debit != kredit, SAKEMKMValidationError dilempar."""
        mock_db = AsyncMock()
        lines = [
            {"account_code": "1101", "debit": 10000000.0, "credit": 0.0, "memo": "Kas Tunai"},
            {"account_code": "3101", "debit": 0.0, "credit": 8000000.0, "memo": "Modal Pemilik"}  # Selisih 2jt
        ]
        with self.assertRaises(SAKEMKMValidationError) as ctx:
            await AccountingService.post_opening_balance(
                db=mock_db,
                tenant_id=self.tenant_id,
                lines=lines,
                effective_date=self.effective_date
            )
        self.assertIn("TIDAK BERIMBANG", str(ctx.exception))

    async def test_negative_amount_raises_error(self):
        """Memastikan nominal negatif ditolak."""
        mock_db = AsyncMock()
        lines = [
            {"account_code": "1101", "debit": -500000.0, "credit": 0.0},
            {"account_code": "3101", "debit": 0.0, "credit": -500000.0}
        ]
        with self.assertRaises(SAKEMKMValidationError) as ctx:
            await AccountingService.post_opening_balance(
                db=mock_db,
                tenant_id=self.tenant_id,
                lines=lines,
                effective_date=self.effective_date
            )
        self.assertIn("tidak boleh negatif", str(ctx.exception))

    async def test_single_line_both_debit_credit_raises_error(self):
        """Memastikan satu baris tidak boleh memiliki debit dan kredit sekaligus."""
        mock_db = AsyncMock()
        lines = [
            {"account_code": "1101", "debit": 500000.0, "credit": 500000.0},
            {"account_code": "3101", "debit": 0.0, "credit": 500000.0}
        ]
        with self.assertRaises(SAKEMKMValidationError) as ctx:
            await AccountingService.post_opening_balance(
                db=mock_db,
                tenant_id=self.tenant_id,
                lines=lines,
                effective_date=self.effective_date
            )
        self.assertIn("tidak boleh memiliki debit dan kredit sekaligus", str(ctx.exception))

    async def test_missing_coa_account_raises_error(self):
        """Memastikan kode akun yang tidak terdaftar di COA ditolak."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []  # COA kosong
        mock_db.execute.return_value = mock_result

        lines = [
            {"account_code": "9999", "debit": 1000000.0, "credit": 0.0},
            {"account_code": "3101", "debit": 0.0, "credit": 1000000.0}
        ]
        with self.assertRaises(SAKEMKMValidationError) as ctx:
            await AccountingService.post_opening_balance(
                db=mock_db,
                tenant_id=self.tenant_id,
                lines=lines,
                effective_date=self.effective_date
            )
        self.assertIn("tidak ditemukan di Chart of Accounts", str(ctx.exception))

    async def test_balanced_opening_balance_success(self):
        """Memastikan posting saldo awal yang berimbang berhasil dan menghasilkan entri valid."""
        class MockAccount:
            def __init__(self, code, name, category, normal_balance="DEBIT", balance=0.0):
                self.id = f"acct-{code}"
                self.code = code
                self.name = name
                self.category = category
                self.normal_balance = normal_balance
                self.balance = balance

        mock_cash = MockAccount("1101", "Kas Tunai", "ASSET", "DEBIT", 0.0)
        mock_inv = MockAccount("1104", "Persediaan", "ASSET", "DEBIT", 0.0)
        mock_equity = MockAccount("3101", "Modal Pemilik", "EQUITY", "CREDIT", 0.0)

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_cash, mock_inv, mock_equity]
        mock_db.execute.return_value = mock_result

        lines = [
            {"account_code": "1101", "debit": 5000000.0, "credit": 0.0, "memo": "Kas Toko"},
            {"account_code": "1104", "debit": 3000000.0, "credit": 0.0, "memo": "Bahan Baku"},
            {"account_code": "3101", "debit": 0.0, "credit": 8000000.0, "memo": "Modal Sendiri"}
        ]

        entry = await AccountingService.post_opening_balance(
            db=mock_db,
            tenant_id=self.tenant_id,
            lines=lines,
            effective_date=self.effective_date,
            description="Setup Saldo Awal UMKM"
        )

        self.assertIsNotNone(entry)
        self.assertTrue(entry.entry_number.startswith("OB-"))
        self.assertEqual(mock_db.add.call_count, 4)  # 1 entry + 3 lines
        self.assertTrue(entry.audit_merkle_hash.startswith("sha256:"))
        # Cek update saldo
        self.assertEqual(mock_cash.balance, 5000000.0)
        self.assertEqual(mock_inv.balance, 3000000.0)
        self.assertEqual(mock_equity.balance, 8000000.0)


if __name__ == "__main__":
    unittest.main()
