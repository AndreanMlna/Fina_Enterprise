/**
 * FINA-ENTERPRISE Shared Formatting Utilities
 * Standardized across all views, POS, and financial statements (SAK EMKM)
 */

/**
 * Format angka ke format mata uang Rupiah Indonesia (IDR)
 * Contoh: 1500000 -> "Rp 1.500.000"
 */
export const formatCurrency = (val: number): string => {
  if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

/**
 * Format angka desimal atau integer dengan pemisah ribuan lokal
 * Contoh: 15000 -> "15.000"
 */
export const formatNumber = (val: number, maxDecimals: number = 0): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: maxDecimals
  }).format(val);
};

/**
 * Format persentase
 * Contoh: 8.5 -> "+8.5%" atau "-3.2%"
 */
export const formatPercentage = (val: number, withSign: boolean = true): string => {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  const prefix = withSign && val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(1)}%`;
};

/**
 * Format tanggal ISO ke format standar Indonesia
 * Contoh: "2026-09-24T10:00:00Z" -> "24 Sep 2026"
 */
export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
};
