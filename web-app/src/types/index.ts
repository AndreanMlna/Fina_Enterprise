export type NavigationTab = 
  | 'cockpit'
  | 'pos'
  | 'inventory'
  | 'ledger'
  | 'montecarlo'
  | 'loan_deobfuscator'
  | 'forensics'
  | 'b2b_benchmark'
  | 'ar_dunning'
  | 'voice_dialect'
  | 'staff'
  | 'initial_setup';

export interface StaffMember {
  id: string;
  full_name: string;
  phone_number: string;
  role: UserRole;
  tenant_id: string;
  is_active: boolean;
  created_at?: string;
  last_login_at?: string;
}

export interface CreateStaffPayload {
  full_name: string;
  phone_number: string;
  role: 'CASHIER' | 'MANAGER' | 'AUDITOR';
  pin: string;
}

export interface KPIStats {
  liquidCash: number;
  safetyBuffer: number;
  cashRunwayDays: number;
  financialHealthIndex: number; // 0 - 100 SAK EMKM
  marginLeakageMonthly: number;
  activeAccountsReceivable: number;
  estimatedTaxPP55: number;
  totalRevenue?: number;
}

export interface DoubleEntryVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  taxCategory: 'PP_55_BEBAS' | 'PP_55_FINAL_05' | 'NON_TAX';
  integrityHash: string;
  reconciled: boolean;
  source: 'WHATSAPP_VOICE' | 'VISION_OCR' | 'BANK_MUTATION' | 'MANUAL';
}

export interface MonteCarloConfig {
  initialCash: number;
  dailyRevenueMean: number;
  revenueDropPercent: number;
  receivableDelayDays: number;
  costInflationPercent: number;
  fixedMonthlyCost: number;
}

export interface MonteCarloResult {
  medianRunwayDays: number;
  survivalProbability90Days: number;
  criticalDeficitDate: string;
  trajectoryP10: number[];
  trajectoryP50: number[];
  trajectoryP90: number[];
  recommendation: string;
}

export interface PredatoryLoanAnalysis {
  requestedAmount: number;
  adminFeePercent: number;
  upfrontDeduction: number;
  disbursedAmount: number;
  dailyInterestRate: number;
  tenorDays: number;
  totalRepayment: number;
  effectiveAnnualAPR: number;
  isLegalOJK: boolean;
  threatLevel: 'SAFE' | 'MODERATE' | 'PREDATORY_EXTREME';
  ojkStatusText: string;
  alternativeSuggestion: string;
}

export interface ReceiptForensicsItem {
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReceiptScan {
  id: string;
  merchantName: string;
  date: string;
  items: ReceiptForensicsItem[];
  subtotal: number;
  tax: number;
  total: number;
  elaIntegrityScore: number; // 0 - 100
  isTampered: boolean;
  tamperingDetails?: string;
  qrVerified: boolean;
  receiptType: 'GROSIR' | 'MINIMARKET' | 'NOTA_MANUAL';
}

export interface CommodityPriceBenchmark {
  commodity: string;
  userPurchasePrice: number;
  marketMedianPrice: number;
  unit: string;
  discrepancyPercent: number;
  supplierName: string;
  isOverpriced: boolean;
  potentialMonthlySavings: number;
}

export interface ARDunningInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  status: 'CURRENT' | 'OVERDUE_15' | 'OVERDUE_30' | 'PAID';
  suggestedTone: 'FRIENDLY' | 'REMINDER' | 'FORMAL_URGENT';
  snapQrisUrl: string;
}

export interface VoiceDialectSample {
  id: string;
  dialect: 'JAWA' | 'SUNDA' | 'MADURA' | 'INDONESIA_PASAR';
  audioTitle: string;
  rawSpeechText: string;
  detectedEntities: {
    action: 'BELI' | 'JUAL' | 'BAYAR';
    item: string;
    quantity: string;
    amount: number;
  };
  journalPreview: {
    debit: string;
    credit: string;
    amount: number;
  };
}

export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'AUDITOR' | 'STAFF_CS';

export interface Tenant {
  id: string;
  name: string;
  branchCode: string;
  npwp: string;
  address: string;
  activeLicense: string;
  isSetupComplete?: boolean;
}

export interface AgentTraceEvent {
  id: string;
  timestamp: string;
  module: 'ORCHESTRATOR' | 'PGVECTOR_RAG' | 'DOUBLE_ENTRY' | 'ELA_FORENSICS' | 'MONTE_CARLO' | 'PII_VAULT';
  action: string;
  status: 'SUCCESS' | 'WARN' | 'PROCESSING';
  details: string;
  latencyMs: number;
}

export interface SAKEMKMFinancialReport {
  period: string;
  assets: {
    currentAssets: { name: string; amount: number }[];
    nonCurrentAssets: { name: string; amount: number }[];
    totalAssets: number;
  };
  liabilitiesAndEquity: {
    liabilities: { name: string; amount: number }[];
    equity: { name: string; amount: number }[];
    totalLiabilitiesAndEquity: number;
  };
  incomeStatement: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operationalExpenses: { name: string; amount: number }[];
    netIncomeBeforeTax: number;
    pp55TaxEstimated: number;
    netIncomeAfterTax: number;
  };
  auditMerkleHash: string;
  signedBy: string;
}

export type AppPage = 'homepage' | 'login' | 'portal_umkm' | 'portal_cs' | 'cs_login';

export type AuthType = 'UMKM' | 'CS_STAFF';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  tenantName: string;
  userPhone: string;
  category: 'RECEIPT_OCR_FAILED' | 'VOICE_DIALECT_AMBIGUOUS' | 'WHATSAPP_DUNNING_ERROR' | 'TAX_PP55_INQUIRY' | 'SYSTEM_BUG';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  subject: string;
  description: string;
  aiConfidenceScore?: number;
  createdAt: string;
  suggestedResolution?: string;
  transactionRef?: string;
  csNotes?: string;
}

// --- POS (Point of Sale) Data Contracts ---

export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cogs: number;
  stock: number;
  unit: string;
  image_url?: string;
}

export interface CreatePOSProductPayload {
  name: string;
  sku?: string;
  category: string;
  price: number;
  cogs?: number;
  stock?: number;
  unit?: string;
  image_url?: string;
}

export interface UpdatePOSProductPayload {
  name?: string;
  sku?: string;
  category?: string;
  price?: number;
  cogs?: number;
  stock?: number;
  unit?: string;
  image_url?: string;
}

export interface POSCartItem {
  product: POSProduct;
  quantity: number;
  discountPercent: number;
  subtotal: number;
}

export interface POSCheckoutPayload {
  items: {
    product_id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    cogs: number;
    discount_percent: number;
  }[];
  payment_method: 'CASH' | 'STATIC_QRIS' | 'BANK_TRANSFER' | 'QRIS' | 'TRANSFER';
  cash_tendered?: number;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
}

export interface POSReceiptItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
}

export interface POSReceipt {
  success: boolean;
  receipt_number: string;
  journal_entry_number: string;
  transaction_date: string;
  tenant_id: string;
  tenant_name: string;
  cashier_name: string;
  customer_name: string;
  customer_phone?: string;
  items: POSReceiptItem[];
  total_items_count: number;
  subtotal: number;
  total_discount: number;
  tax_pp55_estimated: number;
  grand_total: number;
  payment_method: string;
  cash_tendered: number;
  change_amount: number;
  audit_merkle_hash: string;
  qr_snap_url?: string;
}

export interface CreateInvoicePayload {
  customer_name: string;
  customer_phone: string;
  amount: number;
  due_date: string;
  suggested_tone?: 'FRIENDLY' | 'REMINDER' | 'FORMAL_URGENT';
  snap_qris_url?: string;
}

export interface PayInvoiceResponse {
  success: boolean;
  message: string;
  invoice_id: string;
  journal_entry_number: string;
  audit_merkle_hash: string;
  amount_settled: number;
}

export interface VerifyTransferProofResponse {
  success: boolean;
  is_authentic: boolean;
  message: string;
  ela_integrity_score: number;
  bank_detected: string;
  sender_name: string;
  amount_verified: number;
  reference_number: string;
  invoice_id: string;
  invoice_number: string;
  invoice_status: string;
  journal_entry_number?: string;
  audit_merkle_hash?: string;
  tamper_details?: string;
}

export interface LoanEvaluationRecord {
  id: string;
  provider_name: string;
  requested_amount: number;
  admin_fee_percent: number;
  upfront_deduction: number;
  disbursed_amount: number;
  daily_interest_rate: number;
  tenor_days: number;
  total_repayment: number;
  effective_annual_apr: number;
  is_legal_ojk: boolean;
  threat_level: 'SAFE' | 'MODERATE' | 'PREDATORY_EXTREME';
  notes?: string;
  created_at: string;
}

export interface CreateLoanEvaluationPayload {
  provider_name: string;
  requested_amount: number;
  admin_fee_percent: number;
  daily_interest_rate: number;
  tenor_days: number;
  notes?: string;
}

export interface NationalBenchmarkItem {
  id: string;
  commodity_name: string;
  category: string;
  unit: string;
  market_median_price: number;
  source: string;
  updated_at: string;
}

export interface CreateSupplierQuotePayload {
  supplier_name: string;
  commodity_name: string;
  unit: string;
  purchase_price: number;
  notes?: string;
}

export interface ReceiptForensicsRecordItem {
  id: string;
  receipt_number: string;
  merchant_name: string;
  transaction_date: string;
  subtotal: number;
  tax_amount: number;
  grand_total: number;
  ela_integrity_score: number;
  is_tampered: boolean;
  tampering_details?: string;
  items: { name: string; qty: number; unitPrice: number; subtotal: number }[];
  audit_merkle_hash: string;
  status: string;
  journal_entry_id?: string;
  created_at: string;
}

export interface AnalyzeReceiptPayload {
  receipt_number: string;
  merchant_name: string;
  transaction_date?: string;
  items: { name: string; qty: number; unitPrice: number; subtotal: number }[];
  subtotal: number;
  tax_amount?: number;
  grand_total: number;
  simulate_tamper?: boolean;
}

export interface ParseAndPostDialectPayload {
  raw_speech_text: string;
  dialect?: string;
  action_type?: string;
  canonical_term?: string;
  target_coa_code?: string;
  amount: number;
}

export interface RunwayBaseline {
  initial_cash: number;
  daily_revenue_mean: number;
  fixed_monthly_cost: number;
  total_revenue: number;
  total_expenses: number;
  active_receivables: number;
  data_source: string;
  transaction_count: number;
}

export interface StockMovement {
  id: string;
  tenant_id: string;
  product_id: string;
  product_name: string;
  movement_type: string;
  quantity_delta: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  stock_before: number;
  stock_after: number;
  reference_number: string;
  notes?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  cogs: number;
  price: number;
  total_inventory_value: number;
  is_low_stock: boolean;
}

export interface InventorySummary {
  summary: {
    total_raw_material_value: number;
    total_finished_goods_value: number;
    total_equipment_value: number;
    total_warehouse_value: number;
    total_items_count: number;
    raw_materials_count: number;
    finished_goods_count: number;
    equipment_assets_count: number;
    low_stock_alerts_count: number;
  };
  raw_materials: InventoryItem[];
  finished_goods: InventoryItem[];
  equipment_assets: InventoryItem[];
}



