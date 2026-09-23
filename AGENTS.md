# Project Rules & Engineering Guidelines: FINA-ENTERPRISE

> **Core Philosophy**:  
> Sistem ini dikembangkan dengan standar **Staff / Principal Software Engineer & Computer Scientist (M.Sc. in Computer Science)**. Setiap keputusan arsitektural, algoritma, skema basis data, dan implementasi kode wajib berakar pada **ilmu komputer yang valid, metodologi rekayasa perangkat lunak terbukti (*first principles of computer science*)**, praktik resmi **Google Engineering & SRE**, serta standar industri terbuka (IEEE, ACM, W3C, RFC, ISO 27001, OWASP, dan IAI SAK EMKM).

---

## 1. Automatic Skill Discovery & Application (Mandatory)

- **Proactive Contextual Checking**: Sebelum mengeksekusi setiap permintaan, rencana, atau penulisan kode, agen **WAJIB** secara proaktif memindai katalog skill yang tersedia (baik di `.agents/skills/` maupun skill global/plugins).
- **Zero-Trigger Requirement**: Pengguna **TIDAK HARUS** menyebutkan nama skill atau mengetik `/nama-skill`. Jika konteks percakapan, topik, bahasa pemrograman, atau domain masalah berhubungan dengan kompetensi suatu skill, agen **WAJIB** otomatis membaca berkas `SKILL.md` terkait (menggunakan tool `view_file`) dan mematuhi instruksi, runbook, serta standarnya.
- **Dukungan Khusus Workspace Skills**:
  - Pendelegasian pekerjaan ke Antigravity CLI (`agy`): Aktifkan alur kerja [agy-delegate](file:///.agents/skills/agy-delegate/SKILL.md).
  - Instalasi, konfigurasi, atau panduan resmi Antigravity CLI: Rujuk [antigravity-support](file:///.agents/skills/antigravity-support/SKILL.md).
  - Routing opini/saran ke CLI model AI lain (Claude, Codex, Cursor, Grok): Gunakan protokol [ask](file:///.agents/skills/ask/SKILL.md).

---

## 2. Standar Keilmuan Komputer & Referensi Valid (Computer Science Rigor)

1. **Justifikasi Algoritmik & Matematika Valid**:
   - Pemilihan struktur data, algoritma pengindeksan vektor (misal: *HNSW - Hierarchical Navigable Small World* dengan kompleksitas pencarian $\mathcal{O}(\log N)$), serta simulasi stokastik (Monte Carlo $10.000$ iterasi) harus berlandaskan bukti matematis dan sains data riil, bukan estimasi acak.
   - Integritas buku besar wajib mematuhi teorema **ACID** (*Atomicity, Consistency, Isolation, Durability*) dengan tingkat isolasi transaksi yang ketat (*Serializable / Repeatable Read*) dan verifikasi kriptografis tak terputus (*SHA-256 Merkle Hash Chaining*).

2. **Penerapan Google Engineering & Industry Best Practices**:
   - **Google Style Guides & Clean Architecture**: Menegakkan separasi dependensi (*Hexagonal Architecture / Ports and Adapters*). Layer HTTP/Transport, Domain Services, dan Data Access tidak boleh tercampur.
   - **Google SRE (Site Reliability Engineering)**: Merancang sistem dengan toleransi kegagalan (*fault tolerance*), *circuit breakers*, *graceful degradation*, dan pemantauan telemetri terdistribusi (OpenTelemetry & metrik latensi P95/P99).
   - **Zero-Trust Security & OWASP Standards**: Penerapan prinsip hak akses terkecil (*Least Privilege*), sanitasi input tanpa kompromi (mencegah XSS, SQLi, IDOR, BOLA), dan enkripsi *at-rest* maupun *in-transit* (AES-256-GCM, TLS 1.3).

3. **Kepatuhan Hukum & Regulasi Formal**:
   - **UU No. 27/2022 (Perlindungan Data Pribadi / PDP)**: Menerapkan *Zero-Knowledge PII Masking Engine* pada seluruh data sensitif (NIK, nomor rekening, kontak pribadi) sebelum menyentuh model inferensi atau penyimpanan vektor.
   - **SAK EMKM (Ikatan Akuntan Indonesia)**: Setiap jurnal pembukuan wajib mematuhi aturan berpasangan (*Double-Entry Balancing*): $\sum \text{Debet} \equiv \sum \text{Kredit}$.

---

## 3. Standar Kualitas, Verifikasi Faktual & Anti-Halusinasi

- **Verifikasi Faktual Empiris**:
  - Agen **DILARANG BERSPEKULASI ATAU BERHALUSINASI**. Selalu verifikasi status sistem, kode sumber, dependensi, versi pustaka, dan konfigurasi secara langsung melalui tool inspeksi sebelum mengambil kesimpulan.
  - Setiap integrasi eksternal wajib merujuk pada dokumentasi resmi terbaru (seperti `gemini-api-docs`, Meta Cloud API, atau RFC terkait).
- **Analisis Trade-Off Objektif**:
  - Setiap usulan arsitektur harus menyajikan evaluasi *trade-off* yang objektif (misal: komparasi latensi vs throughput, konsumsi memori vs akurasi, atau kompleksitas operasional).

---

## 4. Standar Komunikasi & Pelaporan Profesional

- **Bahasa & Artikulasi**: Gunakan bahasa Indonesia yang baku, profesional, runtut, dan terstruktur secara logis (*deductive reasoning*). Penjelasan teknis harus berbobot namun tetap mudah dipahami oleh eksekutif maupun tim pengembang.
- **Visualisasi & Pembuktian**: Gunakan diagram alur (*Mermaid diagrams*), tabel perbandingan, atau pembuktian matematis untuk memperjelas konsep arsitektur yang kompleks.
- **Preservasi Kode & Artefak**: Jangan mengubah, merusak, atau menghapus kode dan komentar yang sudah ada tanpa alasan teknis yang tervalidasi dan disetujui pengguna.
