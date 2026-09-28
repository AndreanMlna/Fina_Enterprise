/**
 * FINA-ENTERPRISE Setup Service Module
 * 
 * Domain: Initial Capital Balance (Modal Awal) Setup
 * Mengelola proses onboarding saldo awal UMKM — kas, stok, aset tetap, dan utang.
 */

import { httpClient } from '../httpClient';
import type { InitialBalancePayload, InitialBalanceResponse, SetupStatusResponse } from '../types';

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
}

export const setupService = new SetupService();
