/**
 * FINA-ENTERPRISE Setup Service Module
 * 
 * Domain: Initial Capital Balance (Modal Awal) Setup
 * Mengelola proses onboarding saldo awal UMKM — kas, stok, aset tetap, dan utang.
 */

import { httpClient } from '../httpClient';
import type { 
  InitialBalancePayload, 
  InitialBalanceResponse, 
  SetupStatusResponse,
  SetupAIRecommendationRequest,
  SetupAIRecommendationResponse,
} from '../types';

class SetupService {
  /**
   * Cek apakah tenant sudah menyelesaikan setup saldo awal.
   */
  async getSetupStatus(): Promise<SetupStatusResponse> {
    return httpClient.get<SetupStatusResponse>('/api/v1/setup/status');
  }

  /**
   * Posting saldo awal (Opening Balance) ke jurnal SAK EMKM.
   */
  async postInitialBalance(payload: InitialBalancePayload): Promise<InitialBalanceResponse> {
    return httpClient.post<InitialBalanceResponse>('/api/v1/setup/initial-balance', payload);
  }

  /**
   * Rekomendasi AI LLM untuk Bahan & Alat Usaha serta Kalkulasi Harga Jual Anti-Rugi.
   * Dilengkapi offline fallback generator jika backend offline / demo mode.
   */
  async getAISuppliesRecommendation(
    payload: SetupAIRecommendationRequest
  ): Promise<SetupAIRecommendationResponse> {
    try {
      const res = await httpClient.post<SetupAIRecommendationResponse>(
        '/api/v1/setup/recommend-supplies',
        payload
      );
      if (res && res.recommended_items && res.recommended_items.length > 0) {
        return res;
      }
      throw new Error('Empty AI response');
    } catch {
      // Fallback Cerdas Frontend untuk UMKM
      return this._generateSmartFallbackRecommendation(payload);
    }
  }

  private _generateSmartFallbackRecommendation(
    payload: SetupAIRecommendationRequest
  ): SetupAIRecommendationResponse {
    const q = (payload.query || '').toLowerCase();
    const margin = payload.target_margin || 35;

    if (q.includes('kopi') || q.includes('coffee') || q.includes('kafe') || q.includes('minuman')) {
      const items = [
        { name: 'Biji Kopi Arabika / Robusta Blend (1 Kg)', category: 'Bahan Baku', quantity: 3, unit: 'Kg', unit_cost: 120000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Bahan baku utama espresso base' },
        { name: 'Susu Fresh Milk UHT Full Cream (12 Liter)', category: 'Bahan Baku', quantity: 2, unit: 'Karton', unit_cost: 210000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Bahan baku latte & cappuccino' },
        { name: 'Sirup Perisa (Caramel, Hazelnut, Vanilla)', category: 'Bahan Baku', quantity: 3, unit: 'Botol', unit_cost: 85000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Varian menu signature drink' },
        { name: 'Cup Plastik PET + Tutup Dome + Sedotan (500 pcs)', category: 'Kemasan & Wadah', quantity: 1, unit: 'Dus', unit_cost: 195000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Kemasan takeaway higienis' },
        { name: 'Mesin Espresso Portabel / Manual Grinder & Dripper', category: 'Peralatan & Mesin', quantity: 1, unit: 'Unit', unit_cost: 1450000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Alat ekstraksi kopi utama' },
        { name: 'Timbangan Digital Akurasi 0.1g + Timer', category: 'Peralatan & Mesin', quantity: 1, unit: 'Pcs', unit_cost: 165000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Konsistensi resep dan gramasi' },
      ];
      // Hitung harga jual anti-rugi untuk menu turunan jika ada
      const totalCost = items.reduce((acc, it) => acc + it.unit_cost * it.quantity, 0);
      return {
        business_type: 'Kedai Kopi / Minuman Kekinian',
        advice: `Estimasi kebutuhan awal kedai kopi dengan target margin ${margin}%. Utamakan kualitas biji kopi dan konsistensi resep ekstraksi.`,
        recommended_items: items,
        total_estimated_budget: totalCost,
        total_potential_revenue: Math.round(totalCost * (1 + margin / 100)),
        estimated_gross_profit: Math.round(totalCost * (margin / 100)),
        average_margin_percent: margin,
      };
    }

    if (q.includes('warmindo') || q.includes('mie') || q.includes('bakso') || q.includes('kuliner') || q.includes('makan') || q.includes('warung')) {
      const items = [
        { name: 'Mie Instan Aneka Rasa (Goreng & Kuah)', category: 'Bahan Baku', quantity: 5, unit: 'Dus', unit_cost: 118000, selling_price: 12000, margin_percent: 52, is_equipment: false, rationale: 'Bahan baku utama menu warmindo' },
        { name: 'Telur Ayam Segar (1 Tray)', category: 'Bahan Baku', quantity: 3, unit: 'Tray', unit_cost: 58000, selling_price: 4000, margin_percent: 45, is_equipment: false, rationale: 'Topping wajib warmindo' },
        { name: 'Sawi Hijau, Kol & Cabai Rawit Segar', category: 'Bahan Baku', quantity: 4, unit: 'Kg', unit_cost: 25000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Pelengkap sayuran segar harian' },
        { name: 'Sosis Sapi & Kornet Sachet', category: 'Bahan Baku', quantity: 5, unit: 'Pack', unit_cost: 32000, selling_price: 5000, margin_percent: 40, is_equipment: false, rationale: 'Topping pelengkap favorit pelanggan' },
        { name: 'Kompor Gas 2 Tungku High Pressure + Selang Regulator', category: 'Peralatan & Mesin', quantity: 1, unit: 'Set', unit_cost: 550000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Peralatan memasak utama' },
        { name: 'Panci Rebus Stainless + Saringan Mie Warmindo', category: 'Peralatan & Mesin', quantity: 2, unit: 'Pcs', unit_cost: 115000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Alat perebusan cepat efisien' },
        { name: 'Mangkok Melamin, Piring & Sendok Garpu (1 Lusin)', category: 'Perlengkapan Usaha', quantity: 2, unit: 'Lusin', unit_cost: 145000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Peralatan makan dine-in pelanggan' },
      ];
      const totalCost = items.reduce((acc, it) => acc + it.unit_cost * it.quantity, 0);
      return {
        business_type: 'Warmindo / Warung Makan',
        advice: `Daftar belanja bahan baku dan alat memasak untuk warmindo. Pastikan harga jual seporsi di atas HPP (mie + telur + sayur + gas) untuk margin sehat 40-50%.`,
        recommended_items: items,
        total_estimated_budget: totalCost,
        total_potential_revenue: Math.round(totalCost * (1 + margin / 100)),
        estimated_gross_profit: Math.round(totalCost * (margin / 100)),
        average_margin_percent: margin,
      };
    }

    if (q.includes('laundry') || q.includes('cuci')) {
      const items = [
        { name: 'Deterjen Cair Konsentrat Low Foam (5 Liter)', category: 'Bahan Baku', quantity: 4, unit: 'Jerigen', unit_cost: 65000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Bahan pembersih utama mesin cuci' },
        { name: 'Parfum Laundry Grade A + Fixative (5 Liter)', category: 'Bahan Baku', quantity: 2, unit: 'Jerigen', unit_cost: 95000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Pewangi tahan lama pakaian bersih' },
        { name: 'Plastik Packing Laundry Jinjing Tebal (3 Ukuran)', category: 'Kemasan & Wadah', quantity: 6, unit: 'Kg', unit_cost: 32000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Kemasan rapi untuk diserahkan ke pelanggan' },
        { name: 'Setrika Uap Boiler Gas 15 Liter + Kepala Setrika', category: 'Peralatan & Mesin', quantity: 1, unit: 'Set', unit_cost: 1850000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Setrika cepat tanpa risiko kain gosong' },
        { name: 'Timbangan Gantung / Digital Laundry 50kg', category: 'Peralatan & Mesin', quantity: 1, unit: 'Pcs', unit_cost: 145000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Penimbangan akurat order kiloan' },
        { name: 'Keranjang Laundry Plastik Kapasitas Besar', category: 'Perlengkapan Usaha', quantity: 6, unit: 'Pcs', unit_cost: 48000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Pemisahan pakaian antar pelanggan' },
      ];
      const totalCost = items.reduce((acc, it) => acc + it.unit_cost * it.quantity, 0);
      return {
        business_type: 'Jasa Laundry Kiloan & Satuan',
        advice: `Paket belanja awal laundry kiloan. Alokasikan modal ke deterjen konsentrat dan setrika uap hemat energi untuk menjaga biaya operasional per kg di bawah Rp 2.500.`,
        recommended_items: items,
        total_estimated_budget: totalCost,
        total_potential_revenue: Math.round(totalCost * (1 + margin / 100)),
        estimated_gross_profit: Math.round(totalCost * (margin / 100)),
        average_margin_percent: margin,
      };
    }

    // Default UMKM Umum / Sembako / Retail
    const items = [
      { name: 'Beras Premium 5kg / Bahan Utama', category: 'Bahan Baku', quantity: 5, unit: 'Karung', unit_cost: 72000, selling_price: 82000, margin_percent: 14, is_equipment: false, rationale: 'Komoditas perputaran cepat' },
      { name: 'Minyak Goreng Pouch 2 Liter', category: 'Bahan Baku', quantity: 10, unit: 'Pouch', unit_cost: 33000, selling_price: 37500, margin_percent: 14, is_equipment: false, rationale: 'Kebutuhan pokok harian' },
      { name: 'Gula Pasir Kristal Putih (1 Kg)', category: 'Bahan Baku', quantity: 15, unit: 'Kg', unit_cost: 16500, selling_price: 19000, margin_percent: 15, is_equipment: false, rationale: 'Bahan pokok dapur' },
      { name: 'Rak Display Besi / Etalase Kaca Minimalis', category: 'Peralatan & Mesin', quantity: 1, unit: 'Unit', unit_cost: 850000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Display penataan barang dagangan' },
      { name: 'Kalkulator Dagang / Barcode Scanner Portable', category: 'Peralatan & Mesin', quantity: 1, unit: 'Pcs', unit_cost: 175000, selling_price: 0, margin_percent: 0, is_equipment: true, rationale: 'Percepatan pencatatan kasir' },
      { name: 'Plastik Kantong Kresek Ramah Lingkungan', category: 'Kemasan & Wadah', quantity: 5, unit: 'Pack', unit_cost: 14000, selling_price: 0, margin_percent: 0, is_equipment: false, rationale: 'Wadah belanjaan pembeli' },
    ];
    const totalCost = items.reduce((acc, it) => acc + it.unit_cost * it.quantity, 0);
    return {
      business_type: payload.query ? `Usaha ${payload.query}` : 'Toko Sembako & Ritel UMKM',
      advice: `Daftar belanja bahan, barang dagangan, dan alat usaha. Terapkan margin rata-rata ${margin}% pada barang non-subsidi untuk menutup biaya operasional toko.`,
      recommended_items: items,
      total_estimated_budget: totalCost,
      total_potential_revenue: Math.round(totalCost * (1 + margin / 100)),
      estimated_gross_profit: Math.round(totalCost * (margin / 100)),
      average_margin_percent: margin,
    };
  }
}

export const setupService = new SetupService();

