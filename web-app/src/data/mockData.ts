import type {
  KPIStats,
  DoubleEntryVoucher,
  ReceiptScan,
  CommodityPriceBenchmark,
  ARDunningInvoice,
  VoiceDialectSample,
  Tenant,
  AgentTraceEvent,
  SAKEMKMFinancialReport,
  SupportTicket
} from '../types';

export const initialKPI: KPIStats = {
  liquidCash: 48650000,
  safetyBuffer: 18500000,
  cashRunwayDays: 54,
  financialHealthIndex: 86, // SAK EMKM Standard
  marginLeakageMonthly: 1850000,
  activeAccountsReceivable: 14200000,
  estimatedTaxPP55: 235000
};

export const sampleVouchers: DoubleEntryVoucher[] = [
  {
    id: 'vch-001',
    voucherNumber: 'JV-2026-09-001',
    date: '2026-09-17 08:30',
    description: 'Penerimaan Penjualan Katering 120 Porsi via QRIS SNAP',
    debitAccount: '1102 - Kas Bank BCA (Lancar)',
    creditAccount: '4101 - Pendapatan Penjualan Katering',
    amount: 3600000,
    taxCategory: 'PP_55_BEBAS',
    integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    reconciled: true,
    source: 'BANK_MUTATION'
  },
  {
    id: 'vch-002',
    voucherNumber: 'JV-2026-09-002',
    date: '2026-09-16 16:15',
    description: 'Pembelian Bahan Baku Beras Ramos 5 Karung (Pasar Induk)',
    debitAccount: '1104 - Persediaan Bahan Baku',
    creditAccount: '1101 - Kas Tunai Kasir Warung',
    amount: 1650000,
    taxCategory: 'NON_TAX',
    integrityHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    reconciled: true,
    source: 'VISION_OCR'
  },
  {
    id: 'vch-003',
    voucherNumber: 'JV-2026-09-003',
    date: '2026-09-16 14:05',
    description: 'Pembayaran Parsial Piutang Warung Bu Siti via Transfer',
    debitAccount: '1102 - Kas Bank BCA (Lancar)',
    creditAccount: '1103 - Piutang Usaha Mitra',
    amount: 1200000,
    taxCategory: 'NON_TAX',
    integrityHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    reconciled: true,
    source: 'WHATSAPP_VOICE'
  },
  {
    id: 'vch-004',
    voucherNumber: 'JV-2026-09-004',
    date: '2026-09-15 11:20',
    description: 'Potongan MDR Biaya Admin QRIS Merchant (Leakage Terdeteksi)',
    debitAccount: '6104 - Beban Administrasi Transaksi Digital',
    creditAccount: '1102 - Kas Bank BCA (Lancar)',
    amount: 25200,
    taxCategory: 'NON_TAX',
    integrityHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    reconciled: true,
    source: 'BANK_MUTATION'
  },
  {
    id: 'vch-005',
    voucherNumber: 'JV-2026-09-005',
    date: '2026-09-15 09:00',
    description: 'Pembelian Telur Ayam 2 Peti (Voice Note Dialek Jawa)',
    debitAccount: '1104 - Persediaan Bahan Baku Telur',
    creditAccount: '1101 - Kas Tunai Kasir Warung',
    amount: 580000,
    taxCategory: 'NON_TAX',
    integrityHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    reconciled: true,
    source: 'WHATSAPP_VOICE'
  }
];

export const sampleReceipts: ReceiptScan[] = [
  {
    id: 'rcp-01',
    merchantName: 'Grosir Telur & Sembako Jaya Abadi',
    date: '2026-09-16',
    items: [
      { name: 'Telur Ayam Broiler (Peti)', qty: 2, unitPrice: 290000, subtotal: 580000 },
      { name: 'Minyak Goreng Sawit 2L', qty: 6, unitPrice: 34000, subtotal: 204000 },
      { name: 'Gula Pasir Kristal 50kg', qty: 1, unitPrice: 760000, subtotal: 760000 }
    ],
    subtotal: 1544000,
    tax: 0,
    total: 1544000,
    elaIntegrityScore: 98.6,
    isTampered: false,
    qrVerified: true,
    receiptType: 'GROSIR'
  },
  {
    id: 'rcp-02',
    merchantName: 'Nota Pembelian Daging Sapi Murni - Lapak 14',
    date: '2026-09-15',
    items: [
      { name: 'Daging Has Dalam 5kg', qty: 5, unitPrice: 140000, subtotal: 700000 },
      { name: 'Tulang Sumsum 2kg', qty: 2, unitPrice: 50000, subtotal: 100000 }
    ],
    subtotal: 800000,
    tax: 0,
    total: 1800000, // Sengaja dimanipulasi totalnya jadi 1.8jt padahal subtotal 800rb
    elaIntegrityScore: 42.1,
    isTampered: true,
    tamperingDetails: 'Anomali Kompresi Piksel pada Angka "1" di Total Pembayaran. ELA mendeteksi perbedaan noise frekuensi tinggi.',
    qrVerified: false,
    receiptType: 'NOTA_MANUAL'
  }
];

export const sampleCommodities: CommodityPriceBenchmark[] = [
  {
    commodity: 'Telur Ayam Ras',
    userPurchasePrice: 31500,
    marketMedianPrice: 27800,
    unit: 'Kg',
    discrepancyPercent: 13.3,
    supplierName: 'Agen Telur Surya',
    isOverpriced: true,
    potentialMonthlySavings: 740000
  },
  {
    commodity: 'Minyak Goreng Curah Bersertifikat',
    userPurchasePrice: 16800,
    marketMedianPrice: 15500,
    unit: 'Liter',
    discrepancyPercent: 8.4,
    supplierName: 'Distributor Minyak Berkah',
    isOverpriced: true,
    potentialMonthlySavings: 390000
  },
  {
    commodity: 'Beras Ramos Super (50kg)',
    userPurchasePrice: 690000,
    marketMedianPrice: 695000,
    unit: 'Karung 50kg',
    discrepancyPercent: -0.7,
    supplierName: 'UD Padi Makmur',
    isOverpriced: false,
    potentialMonthlySavings: 0
  },
  {
    commodity: 'Tepung Terigu Segitiga Cakra',
    userPurchasePrice: 12400,
    marketMedianPrice: 11900,
    unit: 'Kg',
    discrepancyPercent: 4.2,
    supplierName: 'Toko Sumber Terigu',
    isOverpriced: false,
    potentialMonthlySavings: 150000
  }
];

export const sampleInvoices: ARDunningInvoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-089',
    customerName: 'Kantin Karyawan PT Megah Sentosa',
    customerPhone: '+6281298765432',
    amount: 4750000,
    dueDate: '2026-09-10',
    daysOverdue: 7,
    status: 'OVERDUE_15',
    suggestedTone: 'REMINDER',
    snapQrisUrl: 'https://qris.fina.enterprise/pay/inv-101'
  },
  {
    id: 'inv-102',
    invoiceNumber: 'INV-2026-074',
    customerName: 'Warung Makan Barokah Pak Slamet',
    customerPhone: '+6285712345678',
    amount: 2300000,
    dueDate: '2026-08-25',
    daysOverdue: 23,
    status: 'OVERDUE_30',
    suggestedTone: 'FORMAL_URGENT',
    snapQrisUrl: 'https://qris.fina.enterprise/pay/inv-102'
  },
  {
    id: 'inv-103',
    invoiceNumber: 'INV-2026-095',
    customerName: 'Toko Oleh-Oleh Sari Rasa',
    customerPhone: '+6287890123456',
    amount: 1850000,
    dueDate: '2026-09-20',
    daysOverdue: 0,
    status: 'CURRENT',
    suggestedTone: 'FRIENDLY',
    snapQrisUrl: 'https://qris.fina.enterprise/pay/inv-103'
  }
];

export const sampleVoiceDialects: VoiceDialectSample[] = [
  {
    id: 'aud-jawa-01',
    dialect: 'JAWA',
    audioTitle: 'Rekaman Suara Belanja Pasar (Jawa Halus/Ngoko)',
    rawSpeechText: 'Kula wau enjing tumbas brambang abang telung kilo regane seket ewu, terus lombok rawit sekilo telung puluh ewu, bayar kontan.',
    detectedEntities: {
      action: 'BELI',
      item: 'Bawang Merah 3kg & Cabai Rawit 1kg',
      quantity: '3kg + 1kg',
      amount: 80000
    },
    journalPreview: {
      debit: '1104 - Persediaan Bahan Bumbu Dapur',
      credit: '1101 - Kas Tunai Kasir Warung',
      amount: 80000
    }
  },
  {
    id: 'aud-sunda-01',
    dialect: 'SUNDA',
    audioTitle: 'Rekaman Suara Warung Katering (Sunda)',
    rawSpeechText: 'Punten teh, abdi nembe meser endog hayam dua kilo lima puluh rebu, artosna nyandak tina laci kasir.',
    detectedEntities: {
      action: 'BELI',
      item: 'Telur Ayam 2 Kg',
      quantity: '2 kg',
      amount: 50000
    },
    journalPreview: {
      debit: '1104 - Persediaan Telur Ayam',
      credit: '1101 - Kas Tunai Kasir Warung',
      amount: 50000
    }
  },
  {
    id: 'aud-indo-01',
    dialect: 'INDONESIA_PASAR',
    audioTitle: 'Rekaman Suara Pengantaran Pesanan (Indo Pasar)',
    rawSpeechText: 'Udah diantar katering tumpeng mini tiga puluh box buat kantor kelurahan, total sembilan ratus ribu dibayar tempo minggu depan.',
    detectedEntities: {
      action: 'JUAL',
      item: 'Tumpeng Mini 30 Box',
      quantity: '30 box',
      amount: 900000
    },
    journalPreview: {
      debit: '1103 - Piutang Usaha Pemesanan Kelurahan',
      credit: '4101 - Pendapatan Penjualan Katering',
      amount: 900000
    }
  }
];

export const mockTenants: Tenant[] = [
  {
    id: 'tenant-jkt-01',
    name: 'PT Berkah Pangan Mandiri (Kantor Pusat)',
    branchCode: 'JKT-HQ-01',
    npwp: '01.345.678.9-012.000',
    address: 'Jl. Daan Mogot No. 42, Jakarta Barat',
    activeLicense: 'ENTERPRISE_UNLIMITED_ACID'
  },
  {
    id: 'tenant-sby-02',
    name: 'CV Berkah Distribusi Nusantara (Gudang Cabang)',
    branchCode: 'SBY-HUB-02',
    npwp: '02.876.543.2-021.000',
    address: 'Kawasan Industri Rungkut Blok B-12, Surabaya',
    activeLicense: 'ENTERPRISE_NODE_CLUSTER'
  }
];

export const mockAgentTraces: AgentTraceEvent[] = [
  {
    id: 'trc-101',
    timestamp: '11:23:40.120',
    module: 'ORCHESTRATOR',
    action: 'INBOUND_WEBHOOK_INGESTION',
    status: 'SUCCESS',
    details: 'Menerima pesan audio WhatsApp dari nomor terdaftar (+6281234567890). Webhook merespons 200 OK dalam 120ms.',
    latencyMs: 120
  },
  {
    id: 'trc-102',
    timestamp: '11:23:40.245',
    module: 'PII_VAULT',
    action: 'ZERO_KNOWLEDGE_SANITIZATION',
    status: 'SUCCESS',
    details: 'UU PDP Rule: Mendeteksi NIK 16 digit dan nomor rekening vendor. Melakukan enkripsi AES-256-GCM & tokenisasi mask.',
    latencyMs: 35
  },
  {
    id: 'trc-103',
    timestamp: '11:23:40.410',
    module: 'PGVECTOR_RAG',
    action: 'HNSW_COSINE_SIMILARITY_SEARCH',
    status: 'SUCCESS',
    details: 'pgvector query: Mencocokkan teks dialek dengan katalog COA SAK EMKM. Top match: "1104 - Persediaan Bahan Dapur" (Score: 0.941).',
    latencyMs: 8
  },
  {
    id: 'trc-104',
    timestamp: '11:23:40.430',
    module: 'DOUBLE_ENTRY',
    action: 'DETERMINISTIC_MATH_VALIDATION',
    status: 'SUCCESS',
    details: 'Validasi kesetaraan: Total Debit (Rp 80.000) === Total Kredit (Rp 80.000). Selisih: Rp 0,00 (Pass).',
    latencyMs: 2
  },
  {
    id: 'trc-105',
    timestamp: '11:23:40.490',
    module: 'ORCHESTRATOR',
    action: 'CRYPTOGRAPHIC_MERKLE_COMMIT',
    status: 'SUCCESS',
    details: 'Komit transaksi ke PostgreSQL dengan SHA-256 Block: 9a8b7c6d5e4f... Rantai audit tidak terputus.',
    latencyMs: 58
  },
  {
    id: 'trc-106',
    timestamp: '11:23:41.100',
    module: 'ELA_FORENSICS',
    action: 'PIXEL_ERROR_LEVEL_INSPECTION',
    status: 'WARN',
    details: 'Pemeriksaan Struk Nota #NT-892: Gradient kompresi JPEG terindikasi konsisten, namun kontras font thermal pudar 18%. Rekomendasi: Verifikasi QR.',
    latencyMs: 210
  }
];

export const mockSAKEMKMReport: SAKEMKMFinancialReport = {
  period: 'Periode Berjalan (1 Januari 2026 s.d. 17 September 2026)',
  assets: {
    currentAssets: [
      { name: '1101 - Kas dan Setara Kas di Bank', amount: 48650000 },
      { name: '1102 - Kas Kecil Kasir Warung', amount: 3500000 },
      { name: '1103 - Piutang Usaha Pelanggan (Netto)', amount: 14200000 },
      { name: '1104 - Persediaan Bahan Baku & Komoditas', amount: 22800000 }
    ],
    nonCurrentAssets: [
      { name: '1201 - Peralatan Masak & Pendingin Industri', amount: 35000000 },
      { name: '1202 - Akumulasi Penyusutan Peralatan', amount: -8500000 },
      { name: '1203 - Kendaraan Operasional Pengantar Katering', amount: 18000000 },
      { name: '1204 - Akumulasi Penyusutan Kendaraan', amount: -4200000 }
    ],
    totalAssets: 129450000
  },
  liabilitiesAndEquity: {
    liabilities: [
      { name: '2101 - Utang Usaha Pemasok Bahan Baku', amount: 16500000 },
      { name: '2102 - Beban Gaji Karyawan Akrual', amount: 7200000 },
      { name: '2103 - Utang Pajak PPh Final PP 55/2022', amount: 235000 }
    ],
    equity: [
      { name: '3101 - Modal Pemilik Awal', amount: 75000000 },
      { name: '3102 - Saldo Laba Ditahan', amount: 18515000 },
      { name: '3103 - Laba Bersih Tahun Berjalan', amount: 12000000 }
    ],
    totalLiabilitiesAndEquity: 129450000
  },
  incomeStatement: {
    revenue: 184500000,
    cogs: 112000000,
    grossProfit: 72500000,
    operationalExpenses: [
      { name: 'Beban Gaji & Upah Koki/Kasir', amount: 36000000 },
      { name: 'Beban Listrik, Gas LPG & Air Bersih', amount: 12500000 },
      { name: 'Beban Sewa Ruko & Operasional Kendaraan', amount: 9800000 },
      { name: 'Beban Penyusutan Aset Tetap', amount: 2200000 }
    ],
    netIncomeBeforeTax: 12000000,
    pp55TaxEstimated: 235000,
    netIncomeAfterTax: 11765000
  },
  auditMerkleHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  signedBy: 'KAP Drs. Hendrawan & Rekan (Register Akuntan Publik #AP-2026-889)'
};

export const mockSupportTickets: SupportTicket[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'TCK-2026-0891',
    tenantName: 'PT Berkah Pangan Mandiri (Warung Daan Mogot)',
    userPhone: '+6281234567890',
    category: 'RECEIPT_OCR_FAILED',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'Struk Thermal Pasar Basah Buram & Tertumpuk Minyak',
    description: 'Pedagang mengunggah foto struk belanja ayam & bumbu basah, namun agen ELA menghasilkan tingkat keyakinan 54% karena tulisan tinta pudar. Membutuhkan review manual manusia (HITL).',
    aiConfidenceScore: 54,
    createdAt: '2026-09-17 11:15',
    suggestedResolution: 'Verifikasi nominal total manual Rp 450.000 ke akun 1104 (Persediaan Bahan Baku) vs 1101 (Kas Tunai).'
  },
  {
    id: 'tkt-002',
    ticketNumber: 'TCK-2026-0892',
    tenantName: 'CV Berkah Distribusi Nusantara (Gudang Rungkut)',
    userPhone: '+6281987654321',
    category: 'VOICE_DIALECT_AMBIGUOUS',
    priority: 'MEDIUM',
    status: 'IN_REVIEW',
    subject: 'Kosakata Dialek Madura Campuran Belum Terdaftar di COA',
    description: 'Pesan suara WhatsApp menyebutkan transaksi "Melle jhuko\' tongkol lema polo ebu". Kata "jhuko\'" terdeteksi sebagai nama ikan tongkol, namun akun debit COA belum dipetakan secara otomatis.',
    aiConfidenceScore: 68,
    createdAt: '2026-09-17 10:40',
    suggestedResolution: 'Tambahkan pemetaan leksikon "jhuko\'" -> Ikan Tongkol (Bahan Baku Makanan) ke Qdrant/pgvector Dictionary.'
  },
  {
    id: 'tkt-003',
    ticketNumber: 'TCK-2026-0893',
    tenantName: 'Toko Berkah Kelontong Mandiri',
    userPhone: '+6285678901234',
    category: 'WHATSAPP_DUNNING_ERROR',
    priority: 'LOW',
    status: 'RESOLVED',
    subject: 'Nomor WhatsApp Pelanggan Centang Satu (Tidak Terkirim)',
    description: 'Dunning invoice INV-2026-088 tertahan karena nomor WhatsApp pembeli tidak aktif. CS telah memandu pembuatan link pembayaran SNAP QRIS langsung via SMS alternatif.',
    aiConfidenceScore: 92,
    createdAt: '2026-09-17 09:20',
    suggestedResolution: 'Tiket selesai. Link SNAP QRIS telah disalin dan dikirim via alternatif SMS/Email.'
  }
];


