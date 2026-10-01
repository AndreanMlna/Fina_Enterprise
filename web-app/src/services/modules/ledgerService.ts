import { httpClient } from '../httpClient';
import type { 
  LedgerEntry, 
  AccountItem, 
  SAKEMKMReportResponse, 
  KPIDashboardResponse 
} from '../types';
import type { RunwayBaseline } from '../../types';

export class LedgerService {
  /**
   * Mengambil daftar jurnal pembukuan dari database (tenant-scoped via JWT)
   */
  async getLedgerEntries(): Promise<LedgerEntry[]> {
    return httpClient.get<LedgerEntry[]>('/api/v1/ledger/entries?limit=100', []);
  }

  /**
   * Mengambil Chart of Accounts (COA) dari database
   */
  async getAccounts(): Promise<AccountItem[]> {
    return httpClient.get<AccountItem[]>('/api/v1/ledger/accounts', []);
  }

  /**
   * Mengambil laporan SAK EMKM computed dari database riil
   */
  async getSAKEMKMReport(): Promise<SAKEMKMReportResponse | null> {
    return httpClient.get<SAKEMKMReportResponse | null>('/api/v1/ledger/sak-emkm-report', null);
  }

  /**
   * Mengambil KPI dashboard computed real-time dari database
   */
  async getKPIDashboard(): Promise<KPIDashboardResponse | null> {
    return httpClient.get<KPIDashboardResponse | null>('/api/v1/kpi/dashboard', null);
  }

  /**
   * Mengambil parameter dasar omzet dan biaya operasional riil dari buku besar
   */
  async getRunwayBaseline(): Promise<RunwayBaseline | null> {
    return httpClient.get<RunwayBaseline | null>('/api/v1/kpi/runway-baseline', null);
  }
}

export const ledgerService = new LedgerService();
