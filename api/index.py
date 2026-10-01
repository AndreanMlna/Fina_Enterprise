import os
import sys

# Tambahkan path backend ke sys.path agar seluruh modul app.* dan main.py dapat diimpor oleh runtime Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Impor instance FastAPI ASGI app dari backend/main.py
from main import app

# Vercel Serverless Function runtime otomatis mendeteksi objek 'app'
