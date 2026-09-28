/**
 * FINA-ENTERPRISE API Data Contracts & Types
 * 
 * Sesuai standar SAK EMKM Ikatan Akuntan Indonesia & UU No. 27/2022 (UU PDP).
 */

export interface BackendHealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  service: string;
  version: string;
  database: string;
  compliance: {
    double_entry_sak_emkm: string;
    uu_pdp_pii_masking: string;
  };
  latencyMs: number;
}

export interface SystemStatusResponse {
  engine: string;
  orm: string;
  migrations: string;
  driver: string;
  vector_indexing: string;
  security: string;
  compliance?: {
    sak_emkm_status?: string;
    uu_pdp_masking?: string;
  };
}

export interface SupportTicketPayload {
  tenant_id: string;
  title: string;
  category: 'REKONSILIASI' | 'PAJAK_PP55' | 'DUNNING_WHATSAPP' | 'DIALEK_AI' | 'KONEKSI_BANK' | 'LAINNYA';
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reporter_name?: string;
  reporter_phone?: string;
}

export interface SupportTicketItem {
  id: string;
  tenant_id: string;
  title: string;
  category: string;
  description: string;
  priority: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  assigned_to?: string;
  reporter_name?: string;
  reporter_phone?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    phone_number: string;
    full_name: string;
    role: string;
    tenant_id: string;
    is_active: boolean;
    last_login_at?: string;
  };
  tenant: {
    id: string;
    name: string;
    branch_code: string;
    active_license: string;
    address?: string;
    npwp?: string;
  };
}

export interface RegisterPayload {
  full_name: string;
  business_name: string;
  phone_number: string;
  business_category: string;
  address: string;
  pin: string;
}

export interface LedgerEntryLine {
  id: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface LedgerEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  status: string;
  audit_merkle_hash: string;
  lines: LedgerEntryLine[];
}

export interface AccountItem {
  id: string;
  code: string;
  name: string;
  category: string;
  normal_balance: string;
  balance: number;
}

export interface FinancialLineItem {
  name: string;
  amount: number;
}

export interface SAKEMKMReportResponse {
  period: string;
  total_assets: number;
  total_liabilities_and_equity: number;
  current_assets: FinancialLineItem[];
  non_current_assets: FinancialLineItem[];
  liabilities: FinancialLineItem[];
  equity: FinancialLineItem[];
  revenue: number;
  cogs: number;
  gross_profit: number;
  operational_expenses: FinancialLineItem[];
  net_income_before_tax: number;
  is_balanced: boolean;
  audit_merkle_hash: string;
}

export interface KPIDashboardResponse {
  liquid_cash: number;
  safety_buffer: number;
  cash_runway_days: number;
  financial_health_index: number;
  margin_leakage_monthly: number;
  active_accounts_receivable: number;
  estimated_tax_pp55: number;
}

export interface InvoiceItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  status: string;
  suggested_tone: string;
  snap_qris_url: string;
}

export interface DialectItem {
  id: string;
  dialect: string;
  raw_term: string;
  canonical_term: string;
  target_coa_code: string;
  action_type: string;
  sample_sentence?: string;
}
