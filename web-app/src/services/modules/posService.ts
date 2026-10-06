import { httpClient } from '../httpClient';
import type { 
  POSProduct, 
  CreatePOSProductPayload, 
  UpdatePOSProductPayload, 
  POSCheckoutPayload, 
  POSReceipt 
} from '../../types';
import type {
  ProductRecipeResponse,
  SaveRecipePayload,
  DynamicPricingAnalysis,
  RestockInventoryPayload,
  RestockInventoryResponse,
  ProductionBatchPayload,
  ProductionBatchResponse,
  MarginLeakageScanResponse
} from '../types';

export class POSService {
  /**
   * Mengambil katalog produk kasir POS
   */
  async getPOSProducts(category?: string, search?: string, itemType: 'saleable' | 'materials' | 'all' = 'saleable'): Promise<POSProduct[]> {
    const params = new URLSearchParams();
    if (category && category !== 'Semua') params.append('category', category);
    if (search) params.append('search', search);
    if (itemType) params.append('item_type', itemType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return httpClient.get<POSProduct[]>(`/api/v1/pos/products${query}`, []);
  }

  /**
   * Mengambil daftar bahan baku mentah & alat kerja untuk restock dan resep BOM
   */
  async getInventoryMaterials(): Promise<POSProduct[]> {
    return httpClient.get<POSProduct[]>('/api/v1/pos/inventory/materials', []);
  }

  /**
   * Menambah produk baru ke katalog POS tenant di basis data PostgreSQL
   */
  async createPOSProduct(payload: CreatePOSProductPayload): Promise<POSProduct> {
    return httpClient.post<POSProduct>('/api/v1/pos/products', payload);
  }

  /**
   * Memperbarui detail / stok produk POS tenant
   */
  async updatePOSProduct(productId: string, payload: UpdatePOSProductPayload): Promise<POSProduct> {
    return httpClient.put<POSProduct>(`/api/v1/pos/products/${productId}`, payload);
  }

  /**
   * Menghapus produk dari katalog POS tenant
   */
  async deletePOSProduct(productId: string): Promise<boolean> {
    return httpClient.delete<boolean>(`/api/v1/pos/products/${productId}`);
  }

  /**
   * Eksekusi transaksi checkout kasir POS dengan auto-posting double-entry SAK EMKM
   */
  async checkoutPOS(payload: POSCheckoutPayload): Promise<POSReceipt | null> {
    return httpClient.post<POSReceipt>('/api/v1/pos/checkout', payload);
  }

  /**
   * Mengambil riwayat struk transaksi POS fisik tenant dari PostgreSQL
   */
  async getPOSReceipts(limit: number = 30): Promise<POSReceipt[]> {
    return httpClient.get<POSReceipt[]>(`/api/v1/pos/receipts?limit=${limit}`, []);
  }

  /**
   * Mengambil komposisi bahan baku (BOM) resep produk.
   * Toleran terhadap HTTP 404 (produk belum memiliki resep terdaftar di database).
   */
  async getProductRecipe(productId: string): Promise<ProductRecipeResponse | null> {
    try {
      return await httpClient.get<ProductRecipeResponse>(`/api/v1/pos/products/${productId}/recipe`);
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Menyimpan formulasi resep BOM produk dan menghitung ulang HPP
   */
  async saveProductRecipe(productId: string, payload: SaveRecipePayload): Promise<any> {
    return httpClient.post<any>(`/api/v1/pos/products/${productId}/recipe`, payload);
  }

  /**
   * Mengambil analisis HPP & rekomendasi harga AI anti-rugi
   */
  async getPricingAnalysis(productId: string, targetMargin: number = 35): Promise<DynamicPricingAnalysis | null> {
    try {
      return await httpClient.get<DynamicPricingAnalysis>(`/api/v1/pos/products/${productId}/pricing-analysis?target_margin=${targetMargin}`);
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Menerapkan harga rekomendasi AI ke katalog produk POS
   */
  async applyRecommendedPrice(productId: string, newPrice: number): Promise<any> {
    return httpClient.put<any>(`/api/v1/pos/products/${productId}/apply-recommended-price`, { new_price: newPrice });
  }

  /**
   * Restock bahan baku (Recycle Stock) dengan Moving Weighted Average Cost
   */
  async restockInventory(payload: RestockInventoryPayload): Promise<RestockInventoryResponse> {
    return httpClient.post<RestockInventoryResponse>('/api/v1/pos/inventory/restock', payload);
  }

  /**
   * Catat batch produksi (Konversi Bahan Baku -> Produk Jadi)
   */
  async recordProductionBatch(payload: ProductionBatchPayload): Promise<ProductionBatchResponse> {
    return httpClient.post<ProductionBatchResponse>('/api/v1/pos/production/batch', payload);
  }

  /**
   * Pindai seluruh katalog produk untuk mendeteksi margin leakage
   */
  async getMarginLeakageAlerts(): Promise<MarginLeakageScanResponse> {
    return httpClient.get<MarginLeakageScanResponse>('/api/v1/pos/pricing/margin-leakage-alerts');
  }
}

export const posService = new POSService();

