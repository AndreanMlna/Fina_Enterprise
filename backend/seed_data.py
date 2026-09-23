"""
FINA-ENTERPRISE Seeding CLI Runner
Architecture Standard: Clean Architecture (Hexagonal) - Thin CLI Entrypoint
Canonical Source of Truth: app.infrastructure.seeds.seed_data

Berkas ini bertindak sebagai runner ramping (Thin CLI Wrapper) yang mengeksekusi modul
kanonik database seeding pada lapisan infrastruktur sesuai prinsip Clean Code (DRY & SSOT).

Cara penggunaan:
    cd backend
    .venv\\Scripts\\python.exe seed_data.py
"""

import asyncio
import os
import sys

# Memastikan modul app dapat diimpor dengan andal di berbagai lingkungan runtime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.infrastructure.seeds.seed_data import main, seed_database

__all__ = ["main", "seed_database"]

if __name__ == "__main__":
    asyncio.run(main())
