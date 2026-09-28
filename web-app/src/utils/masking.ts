/**
 * FINA-ENTERPRISE PII Masking Utilities
 * Sesuai UU No. 27/2022 (Pelindungan Data Pribadi / PDP)
 */

/**
 * Mask nomor telepon seluler/WhatsApp
 * Contoh: "081234567890" -> "0812-****-7890"
 */
export const maskPhone = (phone: string, isMasked: boolean = true): string => {
  if (!isMasked || !phone) return phone || '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return '****';
  return `${clean.slice(0, 4)}-****-${clean.slice(-4)}`;
};

/**
 * Mask nama pelanggan atau entitas perseorangan
 * Contoh: "Budi Santoso" -> "[TERLINDUNGI UU PDP] - Budi***"
 */
export const maskCustomerName = (name: string, isMasked: boolean = true): string => {
  if (!isMasked || !name) return name || '';
  const prefix = name.length > 4 ? name.substring(0, 4) : name;
  return `[TERLINDUNGI UU PDP] - ${prefix}***`;
};

/**
 * Mask teks sensitif dalam deskripsi mutasi buku besar
 */
export const maskFinancialText = (text: string, isMasked: boolean = true): string => {
  if (!isMasked || !text) return text || '';
  return text.replace(/(QRIS SNAP|BCA|Mandiri|BRI|BNI|Kelurahan|Warung)/gi, '[REDACTED]');
};
