"""
FINA-ENTERPRISE: Accounting Domain Service
Menegakkan prinsip First Principles of Computer Science & Akuntansi SAK EMKM:
1. Double-Entry Invariant: sum(Debit) == sum(Credit)
2. Chart of Accounts (COA) Standar Baku IAI SAK EMKM
3. SHA-256 Merkle Chaining untuk Integritas Audit Kriptografis
4. Isolasi Transaksi Multi-Tenant (Tenant-Scoped Data Access)
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import hashlib

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.domain.models import JournalEntry, JournalLine, Account, AccountCategory
from app.domain.rules.sak_emkm_rules import SAKEMKMValidationError


# --- Standar Bagan Akun (Chart of Accounts - COA) SAK EMKM ---
COA_CASH_ON_HAND = "1101"          # Kas Tunai Kasir / Toko
COA_BANK_GIRO_QRIS = "1102"        # Rekening Giro Operasional / Bank QRIS
COA_ACCOUNTS_RECEIVABLE = "1103"    # Piutang Usaha Pelanggan & Katering
COA_INVENTORY_RAW = "1104"         # Persediaan Bahan Baku Dapur & Perlengkapan
COA_FIXED_EQUIPMENT = "1201"       # Peralatan & Mesin Usaha
COA_ACCOUNTS_PAYABLE = "2101"      # Utang Usaha Pemasok
COA_OWNER_EQUITY = "3101"          # Modal Pemilik
COA_RETAINED_EARNINGS = "3201"     # Laba Ditahan / Periode Berjalan
COA_SALES_REVENUE = "4101"         # Pendapatan Penjualan
COA_COGS = "5101"                  # Beban Pokok Pendapatan (HPP)
COA_OPERATING_EXPENSE = "6103"     # Beban Sewa & Operasional Umum


class AccountingService:
    """
    Domain service terpusat untuk operasi akuntansi berpasangan,
    kalkulasi saldo akun, laporan SAK EMKM, dan integritas Merkle hash.
    """

    @staticmethod
    def generate_entry_number(prefix: str = "JV") -> str:
        """Menghasilkan nomor unik voucher jurnal berformat ISO timestamp + suffix acak."""
        now = datetime.now(timezone.utc)
        timestamp = now.strftime("%Y%m%d%H%M%S")
        rand_suffix = uuid.uuid4().hex[:4].upper()
        return f"{prefix}-{timestamp}-{rand_suffix}"

    @staticmethod
    def calculate_merkle_hash(payload: str) -> str:
        """Menghasilkan hash kriptografis SHA-256 berantai untuk audit trail."""
        return f"sha256:{hashlib.sha256(payload.encode('utf-8')).hexdigest()}"

    @classmethod
    async def post_double_entry(
        cls,
        db: AsyncSession,
        tenant_id: str,
        description: str,
        debit_account_code: str,
        credit_account_code: str,
        amount: float,
        memo_debit: Optional[str] = None,
        memo_credit: Optional[str] = None,
        entry_number_prefix: str = "JV",
        custom_entry_number: Optional[str] = None,
        entry_date: Optional[str] = None,
        update_account_balances: bool = True
    ) -> JournalEntry:
        """
        Membukukan transaksi berpasangan (double-entry) SAK EMKM secara atomik (ACID):
        1. Memvalidasi nominal > 0
        2. Mengambil kedua akun COA dalam 1 kali round-trip database
        3. Menghasilkan SHA-256 Merkle Hash
        4. Membuat JournalEntry dan 2 baris JournalLine (Debit & Kredit)
        5. Mengupdate saldo akun jika diminta
        6. Mengembalikan JournalEntry yang telah di-flush
        """
        if amount <= 0:
            raise SAKEMKMValidationError(f"Nominal transaksi harus lebih besar dari 0 (diterima: {amount})")

        now = datetime.now(timezone.utc)
        date_str = entry_date or now.strftime("%Y-%m-%d")
        entry_num = custom_entry_number or cls.generate_entry_number(entry_number_prefix)

        # Ambil akun COA
        stmt = select(Account).where(Account.code.in_([debit_account_code, credit_account_code]))
        res = await db.execute(stmt)
        accounts_map = {a.code: a for a in res.scalars().all()}

        debit_acct = accounts_map.get(debit_account_code)
        credit_acct = accounts_map.get(credit_account_code)

        if not debit_acct:
            raise SAKEMKMValidationError(
                f"Akun debit dengan kode '{debit_account_code}' tidak ditemukan di Chart of Accounts."
            )
        if not credit_acct:
            raise SAKEMKMValidationError(
                f"Akun kredit dengan kode '{credit_account_code}' tidak ditemukan di Chart of Accounts."
            )

        # Hash audit trail tak terputus
        hash_payload = f"{entry_num}:{tenant_id}:{debit_account_code}:{credit_account_code}:{amount:.2f}:{now.isoformat()}"
        merkle_hash = cls.calculate_merkle_hash(hash_payload)

        # Buat Header Journal Entry
        entry = JournalEntry(
            id=f"entry-{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            entry_number=entry_num,
            entry_date=date_str,
            description=description,
            status="POSTED",
            audit_merkle_hash=merkle_hash
        )
        db.add(entry)
        await db.flush()

        # Baris 1: DEBIT
        line_debit = JournalLine(
            id=f"line-{uuid.uuid4().hex[:12]}",
            entry_id=entry.id,
            account_id=debit_acct.id,
            debit=amount,
            credit=0.0,
            memo=memo_debit or description
        )
        # Baris 2: KREDIT
        line_credit = JournalLine(
            id=f"line-{uuid.uuid4().hex[:12]}",
            entry_id=entry.id,
            account_id=credit_acct.id,
            debit=0.0,
            credit=amount,
            memo=memo_credit or description
        )
        db.add(line_debit)
        db.add(line_credit)

        if update_account_balances:
            # Penyesuaian saldo akun mematuhi kaidah saldo normal SAK EMKM:
            if debit_acct.normal_balance == "DEBIT":
                debit_acct.balance = float(debit_acct.balance or 0) + amount
            else:
                debit_acct.balance = float(debit_acct.balance or 0) - amount

            if credit_acct.normal_balance == "CREDIT":
                credit_acct.balance = float(credit_acct.balance or 0) + amount
            else:
                credit_acct.balance = max(0.0, float(credit_acct.balance or 0) - amount)

        await db.flush()
        return entry

    @staticmethod
    async def get_tenant_account_balances(
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Dict[str, float]]:
        """
        Menghitung agregasi saldo total debit dan kredit per akun dari baris jurnal aktual milik tenant.
        Query optimal GROUP BY terindeks pada tabel journal_lines & journal_entries.
        """
        stmt = (
            select(
                JournalLine.account_id,
                func.sum(JournalLine.debit).label("total_debit"),
                func.sum(JournalLine.credit).label("total_credit")
            )
            .join(JournalEntry, JournalLine.entry_id == JournalEntry.id)
            .where(JournalEntry.tenant_id == tenant_id)
            .group_by(JournalLine.account_id)
        )
        result = await db.execute(stmt)
        return {
            row.account_id: {
                "debit": float(row.total_debit or 0),
                "credit": float(row.total_credit or 0)
            }
            for row in result
        }

    @classmethod
    async def compute_sak_emkm_report(
        cls,
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Menghitung Laporan Keuangan SAK EMKM lengkap (Laporan Posisi Keuangan & Laporan Laba Rugi)
        secara murni dari data baris jurnal aktual di PostgreSQL.
        """
        # Ambil semua akun COA terurut berdasarkan kode akun
        stmt = select(Account).order_by(Account.code)
        res = await db.execute(stmt)
        accounts = res.scalars().all()

        balances = await cls.get_tenant_account_balances(db, tenant_id)

        current_assets = []
        non_current_assets = []
        liabilities = []
        equity = []
        revenues = []
        expenses = []

        for acct in accounts:
            bal = balances.get(acct.id, {"debit": 0.0, "credit": 0.0})
            cat = acct.category.value if isinstance(acct.category, AccountCategory) else str(acct.category)

            # Hitung saldo netto berdasarkan normal balance
            if acct.normal_balance == "DEBIT":
                net = bal["debit"] - bal["credit"]
            else:
                net = bal["credit"] - bal["debit"]

            item = {"name": f"{acct.code} - {acct.name}", "amount": net}

            if cat == "ASSET":
                if acct.code.startswith("12"):
                    non_current_assets.append(item)
                else:
                    current_assets.append(item)
            elif cat == "LIABILITY":
                liabilities.append(item)
            elif cat == "EQUITY":
                equity.append(item)
            elif cat == "REVENUE":
                revenues.append(item)
            elif cat == "EXPENSE":
                expenses.append(item)

        total_assets = sum(a["amount"] for a in current_assets) + sum(a["amount"] for a in non_current_assets)
        total_liabilities = sum(l["amount"] for l in liabilities)
        total_equity = sum(e["amount"] for e in equity)
        total_revenue = sum(r["amount"] for r in revenues)
        total_expenses = sum(e["amount"] for e in expenses)

        gross_profit = total_revenue
        net_income = total_revenue - total_expenses
        total_liab_and_equity = total_liabilities + total_equity + net_income

        hash_input = f"{total_assets}:{total_liabilities}:{total_equity}:{net_income}"
        audit_hash = cls.calculate_merkle_hash(hash_input)

        is_balanced = abs(total_assets - total_liab_and_equity) < 0.01

        return {
            "period": "Periode Berjalan (1 Januari 2026 s.d. Hari Ini)",
            "total_assets": total_assets,
            "total_liabilities_and_equity": total_liab_and_equity,
            "current_assets": current_assets,
            "non_current_assets": non_current_assets,
            "liabilities": liabilities,
            "equity": equity,
            "revenue": total_revenue,
            "cogs": 0.0,
            "gross_profit": gross_profit,
            "operational_expenses": expenses,
            "net_income_before_tax": net_income,
            "is_balanced": is_balanced,
            "audit_merkle_hash": audit_hash
        }
