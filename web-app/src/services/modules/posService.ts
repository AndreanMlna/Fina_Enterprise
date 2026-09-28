import { httpClient } from '../httpClient';
import type { 
  POSProduct, 
  CreatePOSProductPayload, 
  UpdatePOSProductPayload, 
  POSCheckoutPayload, 
  POSReceipt 
} from '../../types';

export class POSService {
  /**
   * Mengambil katalog produk kasir POS
   */
  async getPOSProducts(category?: string, search?: string): Promise<POSProduct[]> {
    const params = new URLSearchParams();
    if (category && category !== 'Semua') params.append('category', category);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return httpClient.get<POSProduct[]>(`/api/v1/pos/products${query}`, []);
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
}

export const posService = new POSService();
