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
  total_revenue?: number;
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

// --- Setup Saldo Awal (Initial Capital Balance) ---

export interface InventoryItemPayload {
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  selling_price: number;
  category: string;
}

export interface FixedAssetPayload {
  name: string;
  value: number;
  asset_type: 'equipment' | 'vehicle';
}

export interface InitialBalancePayload {
  effective_date: string;
  cash_on_hand: number;
  bank_balance: number;
  inventory_items: InventoryItemPayload[];
  fixed_assets: FixedAssetPayload[];
  opening_payables: number;
}

export interface InitialBalanceResponse {
  success: boolean;
  message: string;
  journal_entry_number: string;
  total_assets: number;
  total_liabilities: number;
  owner_equity: number;
  products_created: number;
  audit_merkle_hash: string;
}

export interface SetupStatusResponse {
  is_setup_complete: boolean;
  tenant_id: string;
  tenant_name: string;
  operating_status?: 'ONBOARDING' | 'OPERATIONAL';
  initial_equity?: number;
  initial_cash_bank?: number;
  initial_fixed_assets?: number;
  current_total_assets?: number;
  initial_date?: string;
  journal_entry_number?: string;
  audit_merkle_hash?: string;
  total_journals_count?: number;
}

// --- Dynamic Pricing, Bill of Materials (BOM) & Production ---

export interface RecipeItem {
  id?: string;
  material_id?: string;
  material_name: string;
  quantity_required: number;
  unit: string;
  cost_per_unit: number;
  subtotal_cost?: number;
  notes?: string;
}

export interface ProductRecipeResponse {
  product_id: string;
  product_name: string;
  current_selling_price: number;
  current_cogs: number;
  overhead_cost_per_unit: number;
  wastage_percent: number;
  total_material_cost: number;
  items: RecipeItem[];
}

export interface SaveRecipePayload {
  overhead_cost_per_unit?: number;
  wastage_percent?: number;
  target_margin_percent?: number;
  items: RecipeItem[];
}

export interface PricingTierDetail {
  price: number;
  margin_percent: number;
  description: string;
}

export interface DynamicPricingAnalysis {
  product_id: string;
  product_name: string;
  sku?: string;
  category: string;
  current_selling_price: number;
  raw_material_cost: number;
  wastage_percent: number;
  wastage_cost: number;
  overhead_cost_per_unit: number;
  total_unit_cost_hpp: number;
  pricing_tiers: {
    bep_break_even: PricingTierDetail;
    safe_floor_minimum: PricingTierDetail;
    optimal_recommended: PricingTierDetail;
    premium_retail: PricingTierDetail;
  };
  current_margin_percent: number;
  margin_status: 'HEALTHY' | 'MARGIN_LEAKAGE' | 'CRITICAL_LOSS' | 'UNPRICED';
  margin_label: string;
  is_at_loss: boolean;
  detailed_materials_breakdown: {
    material_name: string;
    quantity: number;
    unit: string;
    cost_per_unit: number;
    subtotal_cost: number;
    cost_share_percent: number;
  }[];
  ai_insights: {
    ai_executive_summary: string;
    ai_financial_rationale: string;
    cost_driver_analysis: string;
    strategic_actions: string[];
    inflation_resilience_tip: string;
  };
  engine: string;
}

export interface RestockInventoryPayload {
  product_id?: string;
  material_name: string;
  category?: string;
  quantity_added: number;
  unit: string;
  purchase_price_per_unit: number;
  supplier_name?: string;
  notes?: string;
}

export interface RestockInventoryResponse {
  success: boolean;
  message: string;
  material: {
    id: string;
    name: string;
    old_stock: number;
    added_quantity: number;
    new_total_stock: number;
    old_cogs: number;
    purchase_price: number;
    new_weighted_cogs: number;
    unit: string;
  };
  affected_products_count: number;
  affected_finished_products: {
    product_id: string;
    product_name: string;
    current_price: number;
    old_cogs: number;
    new_cogs: number;
    cogs_increased: boolean;
    margin_status: string;
    margin_label: string;
    is_at_loss: boolean;
    recommended_price: number;
    safe_floor_price: number;
    ai_warning: string;
  }[];
}

export interface ProductionBatchPayload {
  product_id: string;
  quantity_produced: number;
  overhead_cost?: number;
  notes?: string;
}

export interface ProductionBatchResponse {
  success: boolean;
  message: string;
  batch_number: string;
  quantity_produced: number;
  new_finished_stock: number;
  unit_cost_hpp: number;
  current_selling_price: number;
  margin_status: string;
  margin_label: string;
  is_at_loss: boolean;
  recommended_price: number;
  materials_consumed: {
    material_name: string;
    quantity_consumed: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
  }[];
  ai_insights: any;
}

export interface MarginLeakageAlert {
  product_id: string;
  product_name: string;
  category: string;
  current_price: number;
  cogs: number;
  current_margin_percent: number;
  severity: 'CRITICAL' | 'WARNING';
  status: 'CRITICAL_LOSS' | 'MARGIN_LEAKAGE';
  label: string;
  bep_price: number;
  recommended_price: number;
}

export interface MarginLeakageScanResponse {
  total_products_scanned: number;
  healthy_count: number;
  leakage_count: number;
  alerts: MarginLeakageAlert[];
}


