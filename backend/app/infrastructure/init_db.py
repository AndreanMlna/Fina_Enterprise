import asyncio
import os
import subprocess
import sys
import asyncpg
from app.core.config import settings
from app.infrastructure.database import AsyncSessionLocal, engine
from app.infrastructure.seeds.seed_data import seed_database

async def verify_and_create_database():
    print(f"[*] Menghubungkan ke PostgreSQL di {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}...")
    try:
        # Hubungi maintenance database 'postgres' terlebih dahulu
        conn = await asyncpg.connect(
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            database="postgres"
        )
    except asyncpg.InvalidPasswordError:
        print("[!] ERROR OTENTIKASI: Kata sandi PostgreSQL salah.")
        print("    -> Silakan buka berkas 'backend/.env' dan perbarui baris 'POSTGRES_PASSWORD=...'.")
        return False
    except Exception as e:
        print(f"[!] Gagal terhubung ke server PostgreSQL: {e}")
        return False

    try:
        # Cek apakah basis data target sudah ada
        db_exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            settings.POSTGRES_DB
        )
        if not db_exists:
            print(f"[*] Membuat basis data '{settings.POSTGRES_DB}'...")
            await conn.execute(f'CREATE DATABASE "{settings.POSTGRES_DB}"')
            print(f"[+] Basis data '{settings.POSTGRES_DB}' berhasil dibuat!")
        else:
            print(f"[+] Basis data '{settings.POSTGRES_DB}' sudah tersedia.")
    finally:
        await conn.close()

    return True


def apply_migrations():
    print("[*] Menjalankan evolusi skema tabel (Alembic Migrations)...")
    try:
        # Jalankan Alembic via subproses terisolasi agar event loop bersih
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("[+] Seluruh tabel dan skema berhasil dimigrasi ke versi terbaru (HEAD).")
            if result.stdout.strip():
                print(result.stdout.strip())
            return True
        else:
            print(f"[!] Gagal menjalankan migrasi Alembic:\n{result.stderr}")
            return False
    except Exception as e:
        print(f"[!] Kesalahan saat memanggil Alembic: {e}")
        return False


async def apply_seeds():
    print("[*] Melakukan seeding data master awal (SAK EMKM, Multi-Tenant, Invoices)...")
    try:
        async with AsyncSessionLocal() as session:
            await seed_database(session)
            await session.commit()
        print("[+] Data master berhasil diinisialisasi.")
        return True
    except Exception as e:
        print(f"[!] Kesalahan saat seeding data: {e}")
        return False


async def async_flow_phase1():
    return await verify_and_create_database()


async def async_flow_phase2():
    seeded = await apply_seeds()
    await engine.dispose()
    return seeded


def main():
    print("================================================================")
    print("  FINA-ENTERPRISE: PostgreSQL Database Initializer")
    print(f"  Target: {settings.POSTGRES_DB} | User: {settings.POSTGRES_USER}")
    print("================================================================")

    created = asyncio.run(async_flow_phase1())
    if not created:
        print("\n[!] Inisialisasi dibatalkan karena koneksi belum valid.")
        return

    migrated = apply_migrations()
    if not migrated:
        print("\n[!] Migrasi skema gagal.")
        return

    seeded = asyncio.run(async_flow_phase2())
    if not seeded:
        print("\n[!] Seeding data gagal.")
        return

    print("\n[V] DATABASE FINA-ENTERPRISE SIAP DIGUNAKAN SECARA PENUH!")


if __name__ == "__main__":
    main()
