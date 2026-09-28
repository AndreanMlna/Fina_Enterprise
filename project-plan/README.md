# FINA-ENTERPRISE: Blueprint Induk & Panduan Rencana Proyek (Project Plan)

> **Repositori Resmi Desain Arsitektur & Panduan Eksekusi Rekayasa Perangkat Lunak**  
> Standar Keilmuan: **Staff / Principal Software Engineer & Computer Scientist (M.Sc. in Computer Science)**  
> Kepatuhan: **IAI SAK EMKM, UU No. 27/2022 (PDP), PP No. 55/2022, ISO 27001, OWASP Top 10**

---

## 1. Peta Dokumen Rencana Proyek (Master Blueprints)

Folder `project-plan/` memuat arsitektur komprehensif FINA-ENTERPRISE yang terbagi dalam **10 Volume Blueprint Master (Bab 1 s.d. Bab 50)** serta panduan teknis operasional terkini:

| Dokumen | Judul & Ruang Lingkup | Hubungan dengan Modul Aktif |
| :--- | :--- | :--- |
| 📄 [**PANDUAN_ARSITEKTUR_DAN_ALUR_SISTEM.md**](file:///d:/ATURSENDIRI/Agentic_AI/project-plan/PANDUAN_ARSITEKTUR_DAN_ALUR_SISTEM.md) | **Dokumen Panduan Operasional & Alur Kerja Terbaru**: Kelola modal, analisis HPP/COGS per pcs produk, laba bersih/kotor, dan pemisahan hak akses Kasir vs Manager (RBAC). | **Blueprint Panduan Utama** yang menjadi acuan implementasi harian. |
| 📘 **Vol 01 (Bab 1–5)** | Analisis Strategis & Benchmark Global (Penyedia FinTech Global: Toast, Square, Ramp, Stripe). | Landasan komparasi fitur kasir POS dan benchmarking harga bahan baku. |
| 📘 **Vol 02 (Bab 6–10)** | Kepatuhan Hukum: UU PDP No. 27/2022, UU ITE, dan Standar Akuntansi IAI SAK EMKM. | Mesin *Zero-Knowledge PII Masking Engine* dan validasi jurnal berpasangan. |
| 📘 **Vol 03 (Bab 11–15)** | Standar Keamanan Siber, Tata Kelola Multi-Agent, Zero-Trust, & RBAC Policy. | Penegakan *Segregation of Duties (SoD)* antara Kasir Toko dan Manager/Owner. |
| 📘 **Vol 04 (Bab 16–20)** | Orkestrasi FinOrchestrator & Spesifikasi Kontrak Alat (*Tools Protocol*). | Agentic AI orkestrasi: Unit Economics Agent, Pricing Optimizer, Accounting Agent. |
| 📘 **Vol 05 (Bab 21–25)** | Resiliensi Agen Finansial & Fitur Vision-Ledger OCR Nota. | Ekstraksi otomatis struk belanja bahan baku modal dari pasar grosir. |
| 📘 **Vol 06 (Bab 26–30)** | Fitur B2B Supplier Intelligence, Anti-Predatory Loan & Margin Diagnostics. | Komparasi harga bahan baku pasar grosir dan proteksi bunga fintech ilegal. |
| 📘 **Vol 07 (Bab 31–35)** | Fitur Treasury, Multi-Dialek Lokal (Whisper STT), dan Database Relasional ACID. | PostgreSQL 16 ACID, schema isolation multi-tenant, dan leksikon bahasa daerah. |
| 📘 **Vol 08 (Bab 36–40)** | Vektor Basis Data (pgvector / HNSW Cosine Similarity), Streaming Event, & Klien Web. | RAG retrieval konteks keuangan dan telemetri transaksi asinkron. |
| 📘 **Vol 09 (Bab 41–45)** | API Gateway, Pipeline CI/CD, Automated Quality Gates, & Testing Framework. | Fastify/FastAPI async contracts, strict typing TypeScript, dan build verification. |
| 📘 **Vol 10 (Bab 46–50)** | Terraform IaC, Disaster Recovery Plan (DRP), Google SRE, & Observabilitas Day-2. | OpenTelemetry latency tracking, SLA 99.9% uptime, dan circuit breakers. |

---

## 2. Keselarasan Alur Kerja Nyata (The Real-World Operational Workflow)

Untuk memastikan sistem tidak menjadi "aplikasi coba-coba/MVP", setiap interaksi di lapangan mengikuti rantai nilai tertutup (*Closed-Loop Value Chain*):

```
                                [ RANTAI OPERASIONAL FINA-ENTERPRISE ]

   [ 1. MODAL & BELANJA ]               [ 2. PRICING & POS ]                 [ 3. EXECUTIVE P&L ]
   Input Uang Modal & Prive             Produk Aktif Terbit ke Kasir         Laba Kotor (Omzet - HPP)
   Foto / Catat Belanja Bahan           Pelayanan Cepat Kasir POS            Laba Bersih (-OPEX -Pajak)
            │                                    │                                    │
            ▼                                    ▼                                    ▼
   ┌──────────────────┐                 ┌──────────────────┐                 ┌──────────────────┐
   │ AI Unit Costing  │────────────────►│ Terminal Kasir   │────────────────►│ SAK EMKM Ledger  │
   │ HPP/pcs Terkunci │                 │ Zero-Fraud (RBAC)│                 │ Pajak PP 55 Auto │
   └──────────────────┘                 └──────────────────┘                 └──────────────────┘
```

1. **Owner/Manager Memegang Kendali Finansial Penuh**:
   - Mengetahui dengan pasti berapa modal belanja yang dikeluarkan.
   - Memastikan harga jual per unit memiliki margin sehat (> 35% - 50%) sebelum produk mulai dijual.
   - Mengetahui berapa porsi minimal yang wajib laku per hari (*Break-Even Point*).

2. **Kasir Terisolasi Khusus Melayani Transaksi (Zero-Distraction)**:
   - Kasir tidak dapat melihat atau mengubah modal belanja, HPP, atau laba bersih toko.
   - Kasir fokus mencatat pesanan, menerima uang tunai / QRIS dinamis, dan mencetak struk termal 80mm.
   - Setiap struk yang keluar otomatis memotong stok fisik dan mengirimkan data omzet ke buku besar.

3. **Autonomous Intelligence Memantau 24/7**:
   - Jika harga bahan baku di pasar grosir melonjak, agen otonom memberikan peringatan proaktif (*Margin Leakage Alert*).
   - Jika ada tagihan piutang pelanggan warung yang menunggak, modul AR Dunning mengingatkan via WhatsApp secara sopan.
   - Jika arus kas menipis, simulasi Monte Carlo 10.000 iterasi memberikan proyeksi berapa hari sisa daya tahan kas (*Liquidity Runway Days*).

---

## 3. Checklist Kepatuhan Rekayasa (Engineering Checklist)

Sebelum meluncurkan fitur baru, setiap pengembang wajib memverifikasi:
- [x] **Zero-Hardcoding**: Tidak ada angka statis, nominal kas dummy, atau tanggal grafis yang di-hardcode. Seluruh data berasal dari PostgreSQL 16.
- [x] **Strict RBAC Enforcement**: Role `CASHIER` tidak boleh dapat mengakses rute `/api/v1/ledger`, `/api/v1/kpi`, atau modul manajerial.
- [x] **Double-Entry Equilibrium**: Setiap mutasi kas kasir atau belanja bahan baku wajib menyeimbangkan $\sum \text{Debet} \equiv \sum \text{Kredit}$.
- [x] **UU PDP Compliance**: Sensor data pribadi (PII Masking) aktif untuk nomor WhatsApp, NIK, dan nama pelanggan pada tampilan publik.
- [x] **Zero UI Slop**: Larangan penggunaan `window.confirm()` atau `alert()` bawaan browser; wajib menggunakan modal konfirmasi enterprise (`ConfirmDialog`) berstandar WCAG 2.2 AA.
