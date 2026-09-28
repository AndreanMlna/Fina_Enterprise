/**
 * FINA-ENTERPRISE - Data Architecture Reference & Fallback Stubs
 * 
 * Standar Arsitektur: Google Engineering & SRE / Zero-Hardcoding Policy
 * Filosofi: Single Source of Truth (SSOT)
 * 
 * CATATAN ARSITEKTURAL:
 * Seluruh data operasional, buku besar (Double-Entry Ledger SAK EMKM),
 * katalog produk tenant POS, transaksi kasir, analisis komparasi harga pasar,
 * leksikon dialek regional, dan piutang dunning KINI DIKELOLA 100% SECARA
 * DINAMIS DAN REAKTIF MELALUI POSTGRESQL ACID & REST API BACKEND FASTAPI.
 * 
 * Berkas ini dipreservasi secara terisolasi murni sebagai kontrak fallback
 * pengujian unit (unit testing stub) jika jaringan terputus atau mode sandbox.
 */

import type { KPIStats, DoubleEntryVoucher, Tenant } from '../types';

/** Fallback KPI untuk isolasi unit test */
export const defaultTestKPI: KPIStats = {
  liquidCash: 48650000,
  safetyBuffer: 18500000,
  cashRunwayDays: 54,
  financialHealthIndex: 86,
  marginLeakageMonthly: 1850000,
  activeAccountsReceivable: 14200000,
  estimatedTaxPP55: 235000
};

/** Fallback Tenant untuk isolasi unit test */
export const defaultTestTenant: Tenant = {
  id: 'tenant-test-01',
  name: 'Katering Berkah Jaya Test',
  branchCode: 'KBJ-HQ',
  npwp: '01.234.567.8-901.000',
  address: 'Jl. Malioboro No. 45, Yogyakarta',
  activeLicense: 'ENTERPRISE_AI_PERPETUAL'
};

/** Fallback Single Voucher untuk testing verifikasi Merkle Chaining */
export const testVoucherSample: DoubleEntryVoucher = {
  id: 'vch-test-001',
  voucherNumber: 'JV-TEST-001',
  date: new Date().toISOString(),
  description: 'Pengujian Integritas Merkle Tree Double Entry SAK EMKM',
  debitAccount: '1102 - Kas Bank BCA (Lancar)',
  creditAccount: '4101 - Pendapatan Penjualan Katering',
  amount: 1000000,
  taxCategory: 'PP_55_BEBAS',
  integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  reconciled: true,
  source: 'MANUAL'
};
