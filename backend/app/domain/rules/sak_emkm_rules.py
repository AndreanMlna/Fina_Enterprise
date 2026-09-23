"""
FINA-ENTERPRISE: Aturan Domain Akuntansi SAK EMKM (Ikatan Akuntan Indonesia)

Prinsip First Principles of Accounting & Computer Science:
1. Double-Entry Invariant: Total Debit WAJIB presisi sama dengan Total Kredit (sum(Debit) == sum(Kredit)).
2. Klasifikasi Saldo Normal Akun:
   - ASSET: Debit
   - LIABILITY: Credit
   - EQUITY: Credit
   - REVENUE: Credit
   - EXPENSE: Debit
3. Immutable Merkle Chaining: Setiap perubahan jurnal menghasilkan hash SHA-256 yang merujuk pada hash transaksi sebelumnya.
"""

from decimal import Decimal
from typing import List, Dict, Any, Tuple
import hashlib
from datetime import datetime, timezone

class SAKEMKMValidationError(Exception):
    """Exception khusus jika transaksi melanggar aturan baku SAK EMKM."""
    pass

class SAKEMKMRules:
    NORMAL_BALANCES: Dict[str, str] = {
        "ASSET": "DEBIT",
        "EXPENSE": "DEBIT",
        "LIABILITY": "CREDIT",
        "EQUITY": "CREDIT",
        "REVENUE": "CREDIT"
    }

    @staticmethod
    def validate_double_entry(lines: List[Dict[str, Any]]) -> Tuple[Decimal, Decimal]:
        """
        Memvalidasi aturan mutlak SAK EMKM:
        sum(Debit) == sum(Kredit) dengan toleransi 0 (zero epsilon).
        """
        if not lines or len(lines) < 2:
            raise SAKEMKMValidationError("Jurnal SAK EMKM minimal harus memiliki 2 baris (1 Debit, 1 Kredit).")

        total_debit = Decimal("0.00")
        total_credit = Decimal("0.00")

        for idx, line in enumerate(lines, start=1):
            debit = Decimal(str(line.get("debit", 0.0)))
            credit = Decimal(str(line.get("credit", 0.0)))

            if debit < 0 or credit < 0:
                raise SAKEMKMValidationError(f"Baris ke-{idx}: Nilai nominal tidak boleh negatif.")

            if debit > 0 and credit > 0:
                raise SAKEMKMValidationError(f"Baris ke-{idx}: Baris tidak boleh memiliki debit dan kredit sekaligus.")

            total_debit += debit
            total_credit += credit

        if total_debit != total_credit:
            selisih = abs(total_debit - total_credit)
            raise SAKEMKMValidationError(
                f"Jurnal TIDAK BERIMBANG! Total Debit ({total_debit}) != Total Kredit ({total_credit}). "
                f"Selisih: Rp {selisih:,.2f}"
            )

        return total_debit, total_credit

    @staticmethod
    def calculate_merkle_hash(prev_hash: str, entry_number: str, amount: Decimal) -> str:
        """
        Menghasilkan hash kriptografis SHA-256 berantai untuk menjamin integritas jurnal anti-tampering.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        payload = f"{prev_hash}|{entry_number}|{amount:.2f}|{timestamp}"
        return f"sha256:{hashlib.sha256(payload.encode('utf-8')).hexdigest()}"
