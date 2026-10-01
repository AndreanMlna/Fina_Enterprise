# 📁 Kerangka Struktur Folder Proyek GoodevaDesk

Dokumen ini memetakan seluruh arsitektur dan kerangka struktur folder untuk modul **Backend (NestJS 10)** dan **Frontend (React 19 + Vite)** pada proyek **GoodevaDesk**.  
Struktur ini mengadopsi standar **Clean Architecture**, **Single Responsibility Principle (SRP)**, **Strict Multi-Tenancy Isolation**, dan **Google SRE Resiliency**.

---

## 🏛️ 1. Ikhtisar Arsitektur & Pemisahan Tanggung Jawab (Separation of Concerns)

```text
                                +-------------------------------------------+
                                |         FRONTEND (React 19 + Vite)        |
                                |  - UI Components & Subcomponents (SRP)    |
                                |  - API Layer (REST, SSE Token Stream)     |
                                |  - Client-side Telemetry & Local Fallback |
                                +---------------------+---------------------+
                                                      |
                                                      | HTTPS / REST / SSE
                                                      v
                                +-------------------------------------------+
                                |          BACKEND (NestJS 10 Core)         |
                                |  - Auth & Strict Multi-Tenant Guard       |
                                |  - Controllers (Transport Layer)          |
                                |  - Domain Services (Business Logic)       |
                                |  - Dual-Tier Caching (Redis + pgvector)   |
                                |  - Data Access Layer (Prisma ORM)         |
                                +-------------------------------------------+
```

---

## ⚙️ 2. Struktur Folder Backend (`backend/`)

Backend dibangun menggunakan **NestJS 10**, **TypeScript**, **Prisma ORM**, dan **PostgreSQL 16 (dengan ekstensi pgvector)**.

```text
backend/
├── Dockerfile                      # Konfigurasi container Docker backend
├── nest-cli.json                   # Konfigurasi Nest CLI build & schematics
├── package.json                    # Dependensi Node.js & skrip kompilasi
├── tsconfig.json                   # Konfigurasi kompilasi TypeScript
├── vercel.json                     # Konfigurasi serverless deployment Vercel
├── prisma/                         # Lapisan Skema & Migrasi Basis Data
│   ├── schema.prisma               # Definisi skema model multi-tenant & pgvector
│   ├── seed.ts                     # Seeder data awal tenant (Acme Corp & TechFlow)
│   └── migrations/                 # Catatan histori migrasi SQL Prisma
└── src/                            # Kode Sumber Utama Backend
    ├── main.ts                     # Titik masuk aplikasi (Bootstrap, CORS, Pipes)
    ├── app.module.ts               # Root module yang mengorkestrasi seluruh modul
    │
    ├── analytics/                  # Modul Metrik & Analitik Eksekutif
    │   ├── analytics.constants.ts  # Konstanta target SLA, pembobotan, dan formula
    │   ├── analytics.controller.ts # Endpoint REST: /analytics/executive
    │   ├── analytics.module.ts     # Pendaftaran modul analitik
    │   ├── analytics.service.ts    # Agregasi kepatuhan SLA, tren, dan kategori
    │   └── bigquery-ml.service.ts  # Integrasi enterprise BigQuery ML forecasting
    │
    ├── auth/                       # Modul Keamanan & Isolasi Multi-Tenant
    │   ├── api-key.guard.ts        # Guard x-api-key & penegak konteks organization_id
    │   ├── api-key.guard.spec.ts   # Pengujian unit keamanan tenant & zero-IDOR
    │   ├── auth.module.ts          # Pendaftaran modul autentikasi
    │   └── current-org.decorator.ts# Custom decorator @CurrentOrg() untuk injeksi tenant
    │
    ├── cache/                      # Modul Caching Ganda (Dual-Tier Cache)
    │   ├── cache.module.ts         # Pendaftaran modul cache
    │   └── semantic-cache.service.ts # L1 SHA-256 Redis + L2 pgvector Cosine Cache
    │
    ├── common/                     # Utilitas Bersama Lintas Modul
    │   ├── filters/
    │   │   └── http-exception.filter.ts # Global Exception Filter untuk respons terstandar
    │   └── interceptors/
    │       └── logging.interceptor.ts   # Interceptor pencatat latensi & audit HTTP
    │
    ├── escalation/                 # Modul Kebijakan Eskalasi Tiket
    │   ├── escalation.controller.ts# Endpoint konfigurasi eskalasi
    │   ├── escalation.module.ts    # Pendaftaran modul eskalasi
    │   └── escalation.service.ts   # Logika pendeteksi breach SLA & eskalasi otomatis
    │
    ├── guardrails/                 # Modul Privasi & Kepatuhan Regulasi
    │   ├── guardrails.module.ts    # Pendaftaran modul guardrails
    │   └── pii-guard.service.ts    # Desanitasi PII (Masking CC, NIK, Email, No Telp)
    │
    ├── health/                     # Modul Pemantauan Kesehatan Sistem
    │   ├── health.controller.ts    # Endpoint REST: /health (DB, Redis, Uptime)
    │   └── health.module.ts        # Pendaftaran modul healthcheck
    │
    ├── knowledge-base/             # Modul SOP Enterprise & RAG Grounding
    │   ├── knowledge-base.controller.ts # Endpoint pengambilan dokumen SOP
    │   ├── knowledge-base.module.ts     # Pendaftaran modul knowledge base
    │   ├── knowledge-base.service.ts    # Ingestion & retrieval referensi SOP RAG
    │   └── documents/                   # Repositori Berkas Markdown SOP Resmi
    │       ├── billing_sop.md           # SOP-BIL-2026: Kebijakan refund & penagihan
    │       ├── general_sop.md           # SOP-GEN-2026: Kebijakan akun & operasional
    │       └── technical_sop.md         # SOP-ENG-2026: Penanganan insiden 500 & timeout
    │
    ├── llm/                        # Adaptive Multi-Provider LLM Engine
    │   ├── llm.constants.ts        # Definisi prompt sistem, model Gemini/OpenAI, mock
    │   ├── llm.module.ts           # Pendaftaran modul LLM
    │   ├── llm.service.ts          # Integrasi multi-model, circuit-breaker, streaming
    │   └── llm.service.spec.ts     # Pengujian timeout, fallback, dan isolasi kegagalan
    │
    ├── prisma/                     # Layanan Global Koneksi Basis Data
    │   ├── prisma.module.ts        # Module global PrismaClient
    │   └── prisma.service.ts       # Manajemen lifecycle koneksi Prisma ($connect/$disconnect)
    │
    ├── redis/                      # Modul Redis In-Memory Layer
    │   ├── redis.constants.ts      # Konstanta TTL dan koneksi Redis
    │   ├── redis.module.ts         # Pendaftaran modul Redis
    │   └── redis.service.ts        # Operasi caching L1 dan Agent Presence Heartbeat
    │
    ├── tickets/                    # Modul Domain Inti Tiket Layanan
    │   ├── tickets.constants.ts    # Status lifecycle, durasi SLA, default priority
    │   ├── tickets.controller.ts   # Endpoint CRUD tiket, pesan, whisper, & SSE stream
    │   ├── tickets.module.ts       # Orkestrator tiket, LLM, PII, Redis, dan NLP
    │   ├── tickets.service.ts      # Logika domain tiket dengan isolasi organization_id
    │   ├── tickets.utils.ts        # Fungsi murni (SLA calculation, Prisma where builder)
    │   ├── fase3-security.spec.ts  # Pengujian keamanan penetrasi & isolasi tenant
    │   ├── innovations.spec.ts     # Pengujian fitur inovasi (SSE, PII, Dual-Tier)
    │   ├── tickets.service.spec.ts # Pengujian unit siklus hidup tiket
    │   └── dto/                    # Data Transfer Objects (Validasi Masukan)
    │       ├── assign-ticket.dto.ts        # DTO penugasan tiket ke agen
    │       ├── create-message.dto.ts       # DTO pengiriman pesan pelanggan / whisper
    │       ├── create-ticket.dto.ts        # DTO pembuatan tiket baru
    │       ├── feedback.dto.ts             # DTO RLHF rating draf balasan AI
    │       ├── query-tickets.dto.ts        # DTO filter pencarian & paginasi tiket
    │       └── update-ticket-status.dto.ts # DTO transisi status tiket
    │
    ├── vector/                     # Modul Pencarian Vektor & pgvector
    │   ├── pgvector.spec.ts        # Pengujian query vektor & cosine similarity
    │   ├── vector.controller.ts    # Endpoint inspeksi embedding & pencarian semantik
    │   ├── vector.module.ts        # Pendaftaran modul vektor
    │   └── vector.service.ts       # Kueri k-NN Cosine Distance (<=>) & HNSW Index
    │
    └── webhooks/                   # Modul Integrasi Webhook Eksternal
        ├── webhooks.controller.ts  # Endpoint penerima event pihak ketiga
        ├── webhooks.module.ts      # Pendaftaran modul webhook
        └── webhooks.service.ts     # Validasi tanda tangan kriptografi & ingestion event
```

---

## 💻 3. Struktur Folder Frontend (`frontend/`)

Frontend dibangun menggunakan **React 19**, **TypeScript**, **Vite**, dan **Tailwind CSS**. Mengikuti prinsip dekomposisi **Single Responsibility Principle (SRP)**.

```text
frontend/
├── Dockerfile                      # Konfigurasi container Docker multi-stage Nginx
├── index.html                      # Entrypoint HTML aplikasi Vite
├── nginx.conf                      # Konfigurasi server Nginx produksi & proxy
├── package.json                    # Dependensi React 19, Lucide, Tailwind
├── postcss.config.js               # Konfigurasi PostCSS Tailwind
├── tailwind.config.js              # Token desain, palet warna kustom, animasi
├── tsconfig.json                   # Konfigurasi TypeScript frontend
├── vercel.json                     # Konfigurasi routing rewrite SPA di Vercel
├── vite.config.ts                  # Konfigurasi bundler Vite
├── public/                         # Aset Publik Statis
│   ├── og-image.jpg                # Pratinjau banner OpenGraph
│   ├── robots.txt                  # Kebijakan bot search engine
│   ├── sitemap.xml                 # Peta situs SEO
│   └── landing-pages/              # Halaman dokumentasi statis tambahan
└── src/                            # Kode Sumber Utama Frontend
    ├── main.tsx                    # Titik masuk React 19 (createRoot, StrictMode)
    ├── App.tsx                     # Shell aplikasi utama, state tabs, routing view
    ├── api.ts                      # Client HTTP terpusat, SSE stream reader, Presence
    ├── constants.ts                # Konstanta UI, enum status, durasi, fallback data
    ├── types.ts                    # Definisi antarmuka TypeScript (Ticket, Message, Org)
    ├── index.css                   # Styling global Tailwind, scrollbars, animasi
    │
    ├── lib/                        # Pustaka & Utilitas Pendukung
    │   ├── nlpFallback.ts          # Ekstraktor entitas berbasis Regex saat NLP offline
    │   ├── telemetry.ts            # Pencatat metrik Core Web Vitals & runtime errors
    │   └── utils.ts                # Utilitas penggabung class Tailwind (clsx & twMerge)
    │
    └── components/                 # Modul Komponen Antarmuka Pengguna
        ├── HeaderBar.tsx           # Bar atas: Pengganti tenant, quick search, status
        ├── Sidebar.tsx             # Navigasi samping: Inbox, My Tickets, SLA alerts, SOP
        ├── TicketDesk.tsx          # Tampilan meja tiket utama, sorting, tab filter
        ├── ExecutiveAnalytics.tsx  # Dashboard eksekutif: Gauges SLA, grafik otomasi AI
        ├── KnowledgeShelfView.tsx  # Pustaka browser SOP RAG interaktif & markdown
        ├── CommandPalette.tsx      # Modal pintasan cepat keyboard (Ctrl+K / Cmd+K)
        ├── CreateTicketModal.tsx   # Dialog pembuatan tiket baru dengan live AI preview
        ├── SettingsModal.tsx       # Konfigurasi preferensi tenant & pemilihan provider LLM
        ├── MobileBottomNav.tsx     # Bar navigasi bawah responsif untuk perangkat mobile
        ├── CompleteShelfLandingPage.tsx # Landing page visual dokumentasi shelf
        │
        ├── desk/                   # Subkomponen Khusus Meja Pengelolaan Tiket
        │   ├── KpiMetricsOverview.tsx     # Kartu metrik ringkasan atas (Total, Urgent, SLA)
        │   ├── OperationalGaugesSidebar.tsx# Gauge visual: Zona bahaya SLA & agen aktif
        │   └── TicketCardItem.tsx         # Kartu tiket individual responsif dengan chip SLA
        │
        └── ticket-modal/           # Dekomposisi SRP Detail Tiket (8 Subkomponen Terisolasi)
            ├── TicketModalHeader.tsx      # Metadata judul, ID, pemilih prioritas & assignee
            ├── TicketPresenceBanner.tsx   # Deteksi & peringatan tabrakan agen real-time
            ├── TicketLifecycleBar.tsx     # Transisi status satu klik (Open -> Closed)
            ├── TicketMessageTimeline.tsx  # Linimasa pesan pelanggan & staff internal whisper
            ├── TicketMessageComposer.tsx  # Area komposer pesan dengan toggle rahasia SOC-2
            ├── TicketCopilotStudio.tsx    # Studio AI: SSE token stream, RAG citation, RLHF
            ├── TicketNlpCard.tsx          # Panel visualisasi entitas hasil ekstraksi NLP
            ├── TicketAuditTrailTab.tsx    # Jejak audit abadi status & penugasan SOC-2
            └── TicketDetailModal.tsx      # Orkestrator modal utama (~450 baris bersih)
```

---

## ⚡ 4. Alur Interaksi Data (End-to-End Pipeline)

1. **Inbound Request**: Permintaan dari klien frontend menyertakan header `x-api-key`.
2. **Auth & Multi-Tenancy Guard**: `api-key.guard.ts` memverifikasi kunci, menemukan organisasi, dan menempelkan `organization_id` pada konteks kueri.
3. **Dual-Tier Cache Check**:
   - **L1**: `redis.service.ts` memeriksa hash SHA-256 dari `lowercase(trim(subject + message))`.
   - **L2**: Jika L1 miss, `vector.service.ts` mengecek kemiripan semantik via ekstensi `pgvector`.
4. **PII Masking**: `pii-guard.service.ts` menyamarkan data sensitif pengguna (NIK, CC, Email).
5. **RAG Grounding**: Dokumen SOP dari `knowledge-base/documents/` diinjeksikan ke dalam konteks prompt.
6. **Adaptive LLM Inference**: `llm.service.ts` memanggil Gemini / OpenAI / Mock dengan batas waktu non-blocking 7 detik.
7. **Streaming Response**: Hasil draf disiarkan ke antarmuka klien menggunakan *Server-Sent Events* (SSE) secara *real-time*.
8. **Prisma Persistence & Audit Log**: Tiket disimpan di PostgreSQL 16 dengan isolasi baris absolut dan jejak audit SOC-2 tak terhapuskan.

---

## 🛡️ 5. Perintah Verifikasi & Validasi Mutu

| Komponen | Perintah Pengujian | Tujuan |
|---|---|---|
| **Backend Unit Tests** | `cd backend && npm test` | Memverifikasi seluruh 38 pengujian unit NestJS |
| **Backend Typecheck** | `cd backend && npx tsc --noEmit` | Memastikan validitas tipe data TypeScript backend |
| **Frontend Typecheck** | `cd frontend && npx tsc --noEmit` | Memastikan validitas tipe data TypeScript frontend |
| **Frontend Build** | `cd frontend && npm run build` | Memverifikasi kompilasi bundel produksi Vite |
| **Python NLP Tests** | `cd python-nlp && pytest test_nlp.py` | Menguji akurasi ekstraksi entitas regex & model NLP |
