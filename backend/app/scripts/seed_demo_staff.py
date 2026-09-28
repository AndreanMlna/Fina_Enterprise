import sys
import os
sys.path.insert(0, os.path.abspath("d:/ATURSENDIRI/Agentic_AI/backend"))

import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, or_, func
from app.infrastructure.database import AsyncSessionLocal
from app.domain.models import UserCredential, Tenant
from app.core.security import hash_pin

async def seed_demo_staff():
    async with AsyncSessionLocal() as session:
        # Cari tenant aktif PT Abadi Nan Jaya
        tenant = await session.get(Tenant, "t-9cda0c7d")
        if not tenant:
            # Fallback ke tenant pertama yang ada
            tenant = (await session.execute(select(Tenant))).scalars().first()
            if not tenant:
                print("Error: Tidak ada tenant ditemukan di database.")
                return

        print(f"Target Tenant: {tenant.name} (ID: {tenant.id})")

        staff_data = [
            {
                "phone_number": "0812-1111-2222",
                "clean_phone": "081211112222",
                "full_name": "Siti Aminah (Kasir Toko)",
                "role": "CASHIER",
                "pin": "123456"
            },
            {
                "phone_number": "0812-3333-4444",
                "clean_phone": "081233334444",
                "full_name": "Rian Pratama (Manajer Operasional)",
                "role": "MANAGER",
                "pin": "123456"
            }
        ]

        for s in staff_data:
            clean_db_phone = func.replace(func.replace(func.replace(UserCredential.phone_number, "-", ""), " ", ""), "+62", "0")
            existing = await session.scalar(
                select(UserCredential).where(
                    or_(
                        UserCredential.phone_number == s["phone_number"],
                        UserCredential.phone_number == s["clean_phone"],
                        clean_db_phone == s["clean_phone"]
                    )
                )
            )
            if existing:
                print(f"[EXISTS] User {s['phone_number']} ({existing.full_name}) sudah ada dengan role {existing.role}.")
                # Pastikan role dan tenant_id sesuai
                existing.role = s["role"]
                existing.tenant_id = tenant.id
                existing.is_active = True
                existing.pin_hash = hash_pin(s["pin"])
                print(f" -> Diperbarui: role={existing.role}, tenant={existing.tenant_id}")
            else:
                user_id = f"usr-{s['role'].lower()[:3]}-{tenant.id[-4:]}"
                new_u = UserCredential(
                    id=user_id,
                    tenant_id=tenant.id,
                    phone_number=s["phone_number"],
                    pin_hash=hash_pin(s["pin"]),
                    role=s["role"],
                    full_name=s["full_name"],
                    is_active=True,
                    failed_attempts=0,
                    created_at=datetime.now(timezone.utc)
                )
                session.add(new_u)
                print(f"[CREATED] Akun {s['role']} berhasil dibuat: {s['phone_number']} (PIN: {s['pin']})")

        await session.commit()
        print("Seeding demo staff selesai.")

if __name__ == "__main__":
    asyncio.run(seed_demo_staff())
