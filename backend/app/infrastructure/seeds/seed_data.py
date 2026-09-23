"""
FINA-ENTERPRISE Canonical Master Data Seeding Module
Location: app.infrastructure.seeds.seed_data
Architecture Standard: Clean Architecture (Hexagonal) - Infrastructure Layer (Single Source of Truth)

Modul kanonik tunggal untuk inisialisasi basis data PostgreSQL 16:
- Master Tenants & Multi-Tenant Isolation
- Kredensial Pengguna UMKM (PBKDF2-HMAC-SHA256)
- Chart of Accounts (COA) Standar IAI SAK EMKM (21 Akun)
- Jurnal Umum Berpasangan (Double-Entry: Debit == Credit, SHA-256 Merkle Chaining)
- Faktur Penagihan Piutang AR Dunning (SNAP QRIS Integrasi)
- Leksikon Dialek Daerah Nusantara (Jawa, Sunda, Madura, Pasar)
- Tiket Dukungan Pelanggan (CS Backoffice & HITL Review)
"""

import asyncio
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_pin
from app.domain.models import (
    Tenant,
    UserCredential,
    Account,
    AccountCategory,
    JournalEntry,
    JournalLine,
    DialectLexicon,
    Invoice,
    InvoiceStatus,
    DunningTone,
    SupportTicket as SupportTicketModel,
    TicketCategory,
    TicketPriority,
    TicketStatus,
)
from app.infrastructure.database import AsyncSessionLocal


def make_hash(data: str) -> str:
    """Menghasilkan hash kriptografis SHA-256 untuk audit Merkle Tree."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


# --- 1. Master Tenants (Cold-Start Master Data) ---
MASTER_TENANTS = [
    {
        "id": "t-001",
        "name": "PT Berkah Pangan Mandiri",
        "branch_code": "JKT-BARAT-01",
        "npwp": "01.234.567.8-012.000",
        "address": "Kawasan Kuliner Daan Mogot KM 11, Jakarta Barat",
        "active_license": "ENTERPRISE_LIFETIME",
    },
    {
        "id": "t-002",
        "name": "CV Berkah Distribusi Nusantara",
        "branch_code": "SBY-RUNGKUT-02",
        "npwp": "02.345.678.9-023.000",
        "address": "Kompleks Industri Rungkut Blok B-4, Surabaya",
        "active_license": "ENTERPRISE_ANNUAL",
    },
    {
        "id": "t-003",
        "name": "Toko Berkah Kelontong Mandiri",
        "branch_code": "BDG-CIBADAK-03",
        "npwp": "03.456.789.0-034.000",
        "address": "Jl. Cibadak No. 88, Kota Bandung",
        "active_license": "UMKM_GROWTH",
    },
]


async def seed_master_tenants(session: AsyncSession):
    """Menanamkan entitas master tenant awal jika belum ada."""
    existing_tenants = (await session.execute(select(Tenant))).scalars().all()
    existing_ids = {t.id for t in existing_tenants}

    inserted = 0
    for t_data in MASTER_TENANTS:
        if t_data["id"] not in existing_ids:
            session.add(Tenant(**t_data))
            inserted += 1

    if inserted > 0:
        await session.flush()
        print(f"[SEED] ✅ {inserted} master tenant awal berhasil ditanamkan.")
    else:
        print("[SEED] Master tenant awal sudah ada, skip.")


# --- 2. Master User Credentials ---
DEFAULT_USERS = [
    {
        "id": "usr-001",
        "tenant_id": "t-001",
        "phone_number": "0812-3456-7890",
        "role": "OWNER",
        "full_name": "Budi Santoso (Owner PT Berkah Pangan)",
        "is_active": True,
    },
    {
        "id": "usr-002",
        "tenant_id": "t-002",
        "phone_number": "0819-8765-4321",
        "role": "OWNER",
        "full_name": "Hendra Wijaya (Owner CV Berkah Distribusi)",
        "is_active": True,
    },
    {
        "id": "usr-003",
        "tenant_id": "t-003",
        "phone_number": "0857-1234-5678",
        "role": "OWNER",
        "full_name": "Siti Rahmawati (Owner Toko Berkah Kelontong)",
        "is_active": True,
    },
]


async def seed_user_credentials(session: AsyncSession):
    """Menanamkan kredensial akun pengguna bawaan dengan hash PBKDF2-HMAC-SHA256."""
    existing_users = (await session.execute(select(UserCredential))).scalars().all()
    existing_phones = {u.phone_number for u in existing_users}

    hashed_pin = hash_pin("123456")
    inserted = 0
    for u_data in DEFAULT_USERS:
        if u_data["phone_number"] not in existing_phones:
            session.add(UserCredential(
                id=u_data["id"],
                tenant_id=u_data["tenant_id"],
                phone_number=u_data["phone_number"],
                pin_hash=hashed_pin,
                role=u_data["role"],
                full_name=u_data["full_name"],
                is_active=u_data["is_active"],
            ))
            inserted += 1

    if inserted > 0:
        await session.flush()
        print(f"[SEED] ✅ {inserted} kredensial pengguna UMKM berhasil ditanamkan.")
    else:
        print("[SEED] Kredensial pengguna bawaan sudah lengkap, skip.")


# --- 3. Chart of Accounts (COA) Standar SAK EMKM (21 Akun) ---
COA_ENTRIES = [
    # Aset Lancar
    ("acct-1101", "1101", "Kas dan Setara Kas di Bank", "ASSET", "DEBIT"),
    ("acct-1102", "1102", "Kas Kecil Kasir Warung", "ASSET", "DEBIT"),
    ("acct-1103", "1103", "Piutang Usaha Pelanggan", "ASSET", "DEBIT"),
    ("acct-1104", "1104", "Persediaan Bahan Baku & Komoditas", "ASSET", "DEBIT"),
    # Aset Tetap
    ("acct-1201", "1201", "Peralatan Masak & Pendingin Industri", "ASSET", "DEBIT"),
    ("acct-1202", "1202", "Akumulasi Penyusutan Peralatan", "ASSET", "CREDIT"),
    ("acct-1203", "1203", "Kendaraan Operasional", "ASSET", "DEBIT"),
    ("acct-1204", "1204", "Akumulasi Penyusutan Kendaraan", "ASSET", "CREDIT"),
    # Kewajiban
    ("acct-2101", "2101", "Utang Usaha Pemasok Bahan Baku", "LIABILITY", "CREDIT"),
    ("acct-2102", "2102", "Beban Gaji Karyawan Akrual", "LIABILITY", "CREDIT"),
    ("acct-2103", "2103", "Utang Pajak PPh Final PP 55/2022", "LIABILITY", "CREDIT"),
    # Ekuitas
    ("acct-3101", "3101", "Modal Pemilik Awal", "EQUITY", "CREDIT"),
    ("acct-3102", "3102", "Saldo Laba Ditahan", "EQUITY", "CREDIT"),
    # Pendapatan
    ("acct-4101", "4101", "Pendapatan Penjualan Katering", "REVENUE", "CREDIT"),
    ("acct-4102", "4102", "Pendapatan Jasa Lainnya", "REVENUE", "CREDIT"),
    # Beban
    ("acct-5101", "5101", "Harga Pokok Penjualan (HPP)", "EXPENSE", "DEBIT"),
    ("acct-6101", "6101", "Beban Gaji & Upah", "EXPENSE", "DEBIT"),
    ("acct-6102", "6102", "Beban Listrik, Gas LPG & Air", "EXPENSE", "DEBIT"),
    ("acct-6103", "6103", "Beban Sewa & Operasional", "EXPENSE", "DEBIT"),
    ("acct-6104", "6104", "Beban Administrasi Transaksi Digital", "EXPENSE", "DEBIT"),
    ("acct-6105", "6105", "Beban Penyusutan Aset Tetap", "EXPENSE", "DEBIT"),
]


async def seed_coa(session: AsyncSession):
    """Menanamkan Chart of Accounts SAK EMKM kanonik lengkap."""
    result = await session.execute(select(Account))
    existing_by_code = {a.code: a for a in result.scalars().all()}

    inserted = 0
    for acct_id, code, name, category, normal_balance in COA_ENTRIES:
        if code not in existing_by_code:
            session.add(Account(
                id=acct_id,
                code=code,
                name=name,
                category=AccountCategory(category),
                normal_balance=normal_balance,
                balance=0.0
            ))
            inserted += 1

    if inserted > 0:
        await session.flush()
        print(f"[SEED] ✅ {inserted} akun COA SAK EMKM baru berhasil ditanamkan.")
    else:
        print("[SEED] COA sudah lengkap, skip.")


# --- 4. Journal Entries & Balanced Lines (Double-Entry SAK EMKM) ---
async def seed_journal_entries(session: AsyncSession, tenant_id: str):
    """Menanamkan siklus jurnal akuntansi lengkap untuk tenant spesifik."""
    existing = await session.scalar(
        select(JournalEntry).where(JournalEntry.tenant_id == tenant_id).limit(1)
    )
    if existing:
        print(f"[SEED] Journal entries untuk tenant {tenant_id} sudah ada, skip.")
        return

    # Pemetaan dinamis kode akun -> id akun di database
    res = await session.execute(select(Account))
    code_to_acct = {a.code: a.id for a in res.scalars().all()}

    entries_data: List[Dict[str, Any]] = [
        {
            "entry_number": "JV-2026-09-001",
            "entry_date": "2026-09-17",
            "description": "Penerimaan Penjualan Katering 120 Porsi via QRIS SNAP",
            "lines": [
                {"account_code": "1101", "debit": 3600000, "credit": 0, "memo": "Kas masuk via QRIS BCA"},
                {"account_code": "4101", "debit": 0, "credit": 3600000, "memo": "Pendapatan penjualan katering"},
            ]
        },
        {
            "entry_number": "JV-2026-09-002",
            "entry_date": "2026-09-16",
            "description": "Pembelian Bahan Baku Beras Ramos 5 Karung (Pasar Induk)",
            "lines": [
                {"account_code": "1104", "debit": 1650000, "credit": 0, "memo": "Persediaan beras ramos"},
                {"account_code": "1102", "debit": 0, "credit": 1650000, "memo": "Kas keluar dari laci kasir"},
            ]
        },
        {
            "entry_number": "JV-2026-09-003",
            "entry_date": "2026-09-16",
            "description": "Pembayaran Parsial Piutang Warung Bu Siti via Transfer",
            "lines": [
                {"account_code": "1101", "debit": 1200000, "credit": 0, "memo": "Kas masuk pembayaran piutang"},
                {"account_code": "1103", "debit": 0, "credit": 1200000, "memo": "Piutang berkurang"},
            ]
        },
        {
            "entry_number": "JV-2026-09-004",
            "entry_date": "2026-09-15",
            "description": "Potongan MDR Biaya Admin QRIS Merchant (Leakage Terdeteksi)",
            "lines": [
                {"account_code": "6104", "debit": 25200, "credit": 0, "memo": "Beban administrasi QRIS"},
                {"account_code": "1101", "debit": 0, "credit": 25200, "memo": "Kas dipotong otomatis"},
            ]
        },
        {
            "entry_number": "JV-2026-09-005",
            "entry_date": "2026-09-15",
            "description": "Pembelian Telur Ayam 2 Peti (Voice Note Dialek Jawa)",
            "lines": [
                {"account_code": "1104", "debit": 580000, "credit": 0, "memo": "Persediaan telur ayam"},
                {"account_code": "1102", "debit": 0, "credit": 580000, "memo": "Kas keluar dari laci kasir"},
            ]
        },
        # Opening balance entries (Saldo Awal per 1 Januari 2026)
        {
            "entry_number": "JV-2026-01-OB-001",
            "entry_date": "2026-01-01",
            "description": "Saldo Awal Kas Bank BCA per 1 Januari 2026",
            "lines": [
                {"account_code": "1101", "debit": 43875200, "credit": 0, "memo": "Saldo awal kas bank"},
                {"account_code": "3101", "debit": 0, "credit": 43875200, "memo": "Modal pemilik awal"},
            ]
        },
        {
            "entry_number": "JV-2026-01-OB-002",
            "entry_date": "2026-01-01",
            "description": "Saldo Awal Kas Kecil & Piutang per 1 Januari 2026",
            "lines": [
                {"account_code": "1102", "debit": 5730000, "credit": 0, "memo": "Saldo awal kas kecil"},
                {"account_code": "1103", "debit": 15400000, "credit": 0, "memo": "Saldo awal piutang"},
                {"account_code": "1104", "debit": 22800000, "credit": 0, "memo": "Saldo awal persediaan"},
                {"account_code": "3101", "debit": 0, "credit": 31115000, "memo": "Modal pemilik awal (lanjutan)"},
                {"account_code": "3102", "debit": 0, "credit": 12815000, "memo": "Saldo laba ditahan awal"},
            ]
        },
        {
            "entry_number": "JV-2026-01-OB-003",
            "entry_date": "2026-01-01",
            "description": "Saldo Awal Aset Tetap per 1 Januari 2026",
            "lines": [
                {"account_code": "1201", "debit": 35000000, "credit": 0, "memo": "Peralatan masak industri"},
                {"account_code": "1202", "debit": 0, "credit": 8500000, "memo": "Akumulasi penyusutan peralatan"},
                {"account_code": "1203", "debit": 18000000, "credit": 0, "memo": "Kendaraan operasional"},
                {"account_code": "1204", "debit": 0, "credit": 4200000, "memo": "Akumulasi penyusutan kendaraan"},
                {"account_code": "2101", "debit": 0, "credit": 16500000, "memo": "Utang usaha pemasok"},
                {"account_code": "2102", "debit": 0, "credit": 7200000, "memo": "Beban gaji akrual"},
                {"account_code": "2103", "debit": 0, "credit": 235000, "memo": "Utang pajak PP 55"},
                {"account_code": "3101", "debit": 0, "credit": 16365000, "memo": "Modal pemilik (selisih)"},
            ]
        },
        # Pendapatan Kumulatif Tahun Berjalan
        {
            "entry_number": "JV-2026-REVENUE-SUM",
            "entry_date": "2026-09-01",
            "description": "Ringkasan Pendapatan Kumulatif Jan-Agt 2026",
            "lines": [
                {"account_code": "1101", "debit": 180900000, "credit": 0, "memo": "Kas masuk kumulatif"},
                {"account_code": "4101", "debit": 0, "credit": 180900000, "memo": "Pendapatan penjualan kumulatif"},
            ]
        },
        # Beban Operasional Kumulatif Tahun Berjalan
        {
            "entry_number": "JV-2026-EXPENSE-SUM",
            "entry_date": "2026-09-01",
            "description": "Ringkasan Beban Operasional Kumulatif Jan-Agt 2026",
            "lines": [
                {"account_code": "5101", "debit": 112000000, "credit": 0, "memo": "HPP kumulatif"},
                {"account_code": "6101", "debit": 36000000, "credit": 0, "memo": "Gaji karyawan kumulatif"},
                {"account_code": "6102", "debit": 12500000, "credit": 0, "memo": "Listrik, gas, air kumulatif"},
                {"account_code": "6103", "debit": 9800000, "credit": 0, "memo": "Sewa & operasional kumulatif"},
                {"account_code": "6105", "debit": 2200000, "credit": 0, "memo": "Penyusutan aset tetap kumulatif"},
                {"account_code": "1101", "debit": 0, "credit": 172500000, "memo": "Kas keluar kumulatif"},
            ]
        },
    ]

    clean_tenant_suffix = tenant_id.replace("tenant-", "").replace("t-", "").upper()
    for entry_data in entries_data:
        ent_num = entry_data["entry_number"]
        existing_entry = await session.scalar(
            select(JournalEntry).where(JournalEntry.entry_number == ent_num).limit(1)
        )
        if existing_entry:
            ent_num = f"{ent_num}-{clean_tenant_suffix}"

        entry = JournalEntry(
            id=f"je-{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            entry_number=ent_num,
            entry_date=entry_data["entry_date"],
            description=entry_data["description"],
            status="POSTED",
            audit_merkle_hash=make_hash(f"{ent_num}:{tenant_id}:{entry_data['entry_date']}"),
        )
        session.add(entry)
        await session.flush()

        for line_data in entry_data["lines"]:
            code = str(line_data["account_code"])
            resolved_acct_id = code_to_acct.get(code) or f"acct-{code}"

            line = JournalLine(
                id=f"jl-{uuid.uuid4().hex[:8]}",
                entry_id=entry.id,
                account_id=resolved_acct_id,
                debit=float(line_data.get("debit", 0)),
                credit=float(line_data.get("credit", 0)),
                memo=line_data.get("memo")
            )
            session.add(line)

    await session.flush()
    print(f"[SEED] ✅ {len(entries_data)} jurnal dengan lines berhasil ditanamkan untuk tenant {tenant_id}.")


# --- 5. Invoices (AR Dunning SNAP QRIS) ---
async def seed_invoices(session: AsyncSession, tenant_id: str):
    """Menanamkan faktur piutang untuk tenant spesifik."""
    existing = await session.scalar(
        select(Invoice).where(Invoice.tenant_id == tenant_id).limit(1)
    )
    if existing:
        print(f"[SEED] Invoices untuk tenant {tenant_id} sudah ada, skip.")
        return

    invoices_data = [
        {
            "invoice_number": "INV-2026-089",
            "customer_name": "Kantin Karyawan PT Megah Sentosa",
            "customer_phone": "+6281298765432",
            "amount": 4750000,
            "due_date": "2026-09-10",
            "days_overdue": 7,
            "status": InvoiceStatus.OVERDUE_15,
            "suggested_tone": DunningTone.REMINDER,
            "snap_qris_url": "https://qris.fina.enterprise/pay/auto"
        },
        {
            "invoice_number": "INV-2026-074",
            "customer_name": "Warung Makan Barokah Pak Slamet",
            "customer_phone": "+6285712345678",
            "amount": 2300000,
            "due_date": "2026-08-25",
            "days_overdue": 23,
            "status": InvoiceStatus.OVERDUE_30,
            "suggested_tone": DunningTone.FORMAL_URGENT,
            "snap_qris_url": "https://qris.fina.enterprise/pay/auto"
        },
        {
            "invoice_number": "INV-2026-095",
            "customer_name": "Toko Oleh-Oleh Sari Rasa",
            "customer_phone": "+6287890123456",
            "amount": 1850000,
            "due_date": "2026-09-20",
            "days_overdue": 0,
            "status": InvoiceStatus.CURRENT,
            "suggested_tone": DunningTone.FRIENDLY,
            "snap_qris_url": "https://qris.fina.enterprise/pay/auto"
        },
    ]

    clean_tenant_suffix = tenant_id.replace("tenant-", "").replace("t-", "").upper()
    for inv_data in invoices_data:
        inv_num = inv_data["invoice_number"]
        existing_inv = await session.scalar(
            select(Invoice).where(Invoice.invoice_number == inv_num).limit(1)
        )
        if existing_inv:
            inv_num = f"{inv_num}-{clean_tenant_suffix}"

        session.add(Invoice(
            id=f"inv-{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            invoice_number=inv_num,
            customer_name=inv_data["customer_name"],
            customer_phone=inv_data["customer_phone"],
            amount=inv_data["amount"],
            due_date=inv_data["due_date"],
            days_overdue=inv_data["days_overdue"],
            status=inv_data["status"],
            suggested_tone=inv_data["suggested_tone"],
            snap_qris_url=inv_data["snap_qris_url"],
        ))
    await session.flush()
    print(f"[SEED] ✅ {len(invoices_data)} invoice piutang berhasil ditanamkan untuk tenant {tenant_id}.")


# --- 6. Dialect Lexicons (Kamus Dialek Lokal Nusantara) ---
async def seed_dialect_lexicons(session: AsyncSession):
    """Menanamkan leksikon dialek bahasa daerah (shared global)."""
    existing = await session.scalar(select(DialectLexicon).limit(1))
    if existing:
        print("[SEED] Dialect lexicons sudah ada, skip.")
        return

    lexicons = [
        ("dlx-01", "JAWA", "brambang abang", "Bawang Merah", "1104", "BELI",
         "Kula wau enjing tumbas brambang abang telung kilo regane seket ewu"),
        ("dlx-02", "JAWA", "endog", "Telur Ayam", "1104", "BELI",
         "Tumbas endog pitung kilo rego enem puluh ewu"),
        ("dlx-03", "JAWA", "lombok rawit", "Cabai Rawit", "1104", "BELI",
         "Lombok rawit sekilo telung puluh ewu bayar kontan"),
        ("dlx-04", "SUNDA", "endog hayam", "Telur Ayam", "1104", "BELI",
         "Punten teh abdi nembe meser endog hayam dua kilo lima puluh rebu"),
        ("dlx-05", "SUNDA", "meser", "Membeli (Action)", "1104", "BELI",
         "Abdi meser beas sapuluh kilo"),
        ("dlx-06", "INDONESIA_PASAR", "tumpeng mini", "Tumpeng Mini (Produk Katering)", "4101", "JUAL",
         "Udah diantar katering tumpeng mini tiga puluh box buat kantor kelurahan"),
        ("dlx-07", "MADURA", "jhuko'", "Ikan Tongkol", "1104", "BELI",
         "Melle jhuko' tongkol lema polo ebu"),
        ("dlx-08", "INDONESIA_PASAR", "bayar tempo", "Piutang Usaha", "1103", "JUAL",
         "Dibayar tempo minggu depan total sembilan ratus ribu"),
    ]

    for dlx_id, dialect, raw, canonical, coa, action, sample in lexicons:
        session.add(DialectLexicon(
            id=dlx_id,
            dialect=dialect,
            raw_term=raw,
            canonical_term=canonical,
            target_coa_code=coa,
            action_type=action,
            sample_sentence=sample,
        ))
    await session.flush()
    print(f"[SEED] ✅ {len(lexicons)} leksikon dialek berhasil ditanamkan.")


# --- 7. Support Tickets (CS Backoffice & HITL Queue) ---
async def seed_support_tickets(session: AsyncSession):
    """Menanamkan tiket kendala awal untuk simulasi CS Desk."""
    existing = await session.scalar(select(SupportTicketModel).limit(1))
    if existing:
        print("[SEED] Support tickets sudah ada, skip.")
        return

    tickets = [
        SupportTicketModel(
            id="tkt-001",
            ticket_number="TCK-2026-0891",
            tenant_id="t-001",
            user_phone="+6281234567890",
            category=TicketCategory.RECEIPT_OCR_FAILED,
            priority=TicketPriority.HIGH,
            status=TicketStatus.OPEN,
            subject="Struk Belanja Pasar Basah Buram & Tertumpuk Minyak",
            description="Pedagang mengunggah foto struk belanja ayam & bumbu basah nominal Rp 450.000, namun agen ELA menghasilkan tingkat keyakinan 54% karena tulisan tinta pudar.",
            ai_confidence_score=54,
            suggested_resolution="Verifikasi nominal total manual Rp 450.000 ke akun 1104 vs 1101."
        ),
        SupportTicketModel(
            id="tkt-002",
            ticket_number="TCK-2026-0892",
            tenant_id="t-002",
            user_phone="+6281987654321",
            category=TicketCategory.VOICE_DIALECT_AMBIGUOUS,
            priority=TicketPriority.MEDIUM,
            status=TicketStatus.IN_REVIEW,
            subject="Kosakata Dialek Madura Campuran Belum Terdaftar di COA",
            description="Pesan suara menyebutkan transaksi 'Melle jhuko tongkol lema polo ebu'. Kata jhuko terdeteksi sebagai ikan tongkol, perlu validasi akun COA.",
            ai_confidence_score=68,
            suggested_resolution="Tambahkan pemetaan leksikon jhuko -> Ikan Tongkol ke kamus pgvector."
        ),
    ]
    session.add_all(tickets)
    await session.flush()
    print(f"[SEED] ✅ {len(tickets)} support ticket contoh berhasil ditanamkan.")


# --- Orchestrator: Comprehensive Database Seeding ---
async def seed_database(session: AsyncSession):
    """
    Fungsi orkestrasi kanonik tunggal.
    Dipanggil oleh `init_db.py` dan runner CLI `seed_data.py`.
    """
    # 1. Pastikan master tenants terdaftar
    await seed_master_tenants(session)

    # 2. Pastikan kredensial user bawaan terdaftar
    await seed_user_credentials(session)

    # 3. Pastikan COA 21 akun SAK EMKM terdaftar
    await seed_coa(session)

    # 4. Pastikan Dialek Lexicons terdaftar
    await seed_dialect_lexicons(session)

    # 5. Pastikan Support Tickets awal terdaftar
    await seed_support_tickets(session)

    # 6. Cari SEMUA tenant yang ada di database (termasuk tenant baru hasil registrasi)
    result = await session.execute(select(Tenant))
    tenants = result.scalars().all()

    print(f"[SEED] Memeriksa data transaksi untuk {len(tenants)} tenant terdaftar...")
    for tenant in tenants:
        await seed_journal_entries(session, tenant.id)
        await seed_invoices(session, tenant.id)

    await session.commit()
    print("[SEED] ✅ Seluruh data master & operasional berhasil diselaraskan ke database!")


async def main():
    """Entry point eksekusi asinkron."""
    print("=" * 60)
    print("  FINA-ENTERPRISE Canonical Seeding Engine")
    print("  Source: app.infrastructure.seeds.seed_data")
    print("  Database: PostgreSQL 16 + pgvector")
    print("=" * 60)
    async with AsyncSessionLocal() as session:
        await seed_database(session)
    print("=" * 60)
    print("  ✅ SEED SELESAI — 100% Data Kanonik Berhasil Ditransaksikan!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
