import os
import sys

# Tambahkan direktori root backend ke sys.path agar seluruh modul 'app.*' dan 'main.py' dapat diimpor oleh runtime Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)

for path in [backend_dir, current_dir, "/var/task", os.path.join("/var/task", "backend")]:
    if os.path.exists(path) and path not in sys.path:
        sys.path.insert(0, path)

# Impor instance FastAPI ASGI app dari main.py
from main import app
