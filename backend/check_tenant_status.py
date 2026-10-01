"""
FINA-ENTERPRISE Database Verification Utility: Tenant Operational Status
Memeriksa status konfigurasi saldo awal dan riwayat jurnal transaksi tenant di PostgreSQL.
"""

import asyncio
from typing import Optional
from sqlalchemy import select
from app.infrastructure.database import AsyncSessionLocal
from app.domain.models import Tenant, JournalEntry


async def main() -> None:
    async with AsyncSessionLocal() as session:
        # Periksa tenant aktif PT Abadi Nan Jaya
        tenant: Optional[Tenant] = await session.get(Tenant, "t-9cda0c7d")
        if tenant is not None:
            print(f"Tenant: {tenant.id} | {tenant.name} | is_setup_complete: {tenant.is_setup_complete}")
        else:
            print("Tenant 't-9cda0c7d' tidak ditemukan di database.")
            return

        # Periksa entri jurnal yang telah dibukukan
        entries_res = await session.execute(
            select(JournalEntry).where(JournalEntry.tenant_id == tenant.id).order_by(JournalEntry.entry_date)
        )
        entries = entries_res.scalars().all()
        print(f"Total Jurnal Tercatat: {len(entries)}")
        for e in entries[:5]:
            print(f"  {e.entry_number} | {e.entry_date} | {e.description}")


if __name__ == "__main__":
    asyncio.run(main())
