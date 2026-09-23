export type NavigationTab = 
  | 'cockpit'
  | 'ledger'
  | 'montecarlo'
  | 'loan_deobfuscator'
  | 'forensics'
  | 'b2b_benchmark'
  | 'ar_dunning'
  | 'voice_dialect';

export interface KPIStats {
  liquidCash: number;
  safetyBuffer: number;
  cashRunwayDays: number;
  financialHealthIndex: number; // 0 - 100 SAK EMKM
  marginLeakageMonthly: number;
  activeAccountsReceivable: number;
  estimatedTaxPP55: number;
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
  dialect: 'JAWA' | 'SUNDA' | 'INDONESIA_PASAR';
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

export type UserRole = 'OWNER' | 'ACCOUNTANT' | 'AUDITOR';

export interface Tenant {
  id: string;
  name: string;
  branchCode: string;
  npwp: string;
  address: string;
  activeLicense: string;
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


