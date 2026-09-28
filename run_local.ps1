# ==============================================================================
# FINA-ENTERPRISE: One-Click Local Launcher
# Menjalankan Backend FastAPI (Port 8000) dan Frontend Vite React (Port 5173)
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  MENYIAPKAN DAN MENJALANKAN FINA-ENTERPRISE DI LOKAL" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan

$WorkspaceDir = "D:\ATURSENDIRI\Agentic_AI"

# 1. Cek Status PostgreSQL
Write-Host "[1/3] Memeriksa layanan basis data PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Write-Host "      Memulai layanan PostgreSQL..." -ForegroundColor Yellow
    Start-Service $pgService.Name
}
Write-Host "      PostgreSQL siap dan aktif." -ForegroundColor Green

# 2. Menjalankan Backend FastAPI (Port 8000) menggunakan uv run
Write-Host "[2/3] Menjalankan Server Backend FastAPI (Port 8000) via uv..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkspaceDir\backend'; uv run uvicorn main:app --reload --port 8000"

# 3. Menjalankan Frontend Vite React (Port 5173) di jendela terpisah
Write-Host "[3/3] Menjalankan Server Frontend Vite (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkspaceDir\web-app'; npm run dev"

# Tunggu 3 detik lalu buka browser secara otomatis
Start-Sleep -Seconds 3
Write-Host "`n[+] Seluruh server berhasil dijalankan!" -ForegroundColor Green
Write-Host "[+] Membuka browser ke http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "`nKredensial Login Tersedia:" -ForegroundColor White
Write-Host "  [Akun Pengguna Terdaftar]" -ForegroundColor Green
Write-Host "  - Nama Bisnis  : PT Abadi Nan Jaya (andrian maulana)" -ForegroundColor Gray
Write-Host "  - No. WhatsApp : 081249992243" -ForegroundColor Yellow
Write-Host "  - PIN Keamanan : 611059" -ForegroundColor Yellow
Write-Host "`n  [Akun Demo Seed]" -ForegroundColor Cyan
Write-Host "  - Nama Bisnis  : PT Berkah Pangan (Budi Santoso)" -ForegroundColor Gray
Write-Host "  - No. WhatsApp : 0812-3456-7890" -ForegroundColor Yellow
Write-Host "  - PIN Keamanan : 123456" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
