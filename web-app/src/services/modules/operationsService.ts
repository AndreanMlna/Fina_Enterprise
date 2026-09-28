import { httpClient } from '../httpClient';
import type { 
  InvoiceItem, 
  DialectItem, 
  SupportTicketPayload, 
  SupportTicketItem 
} from '../types';
import type { 
  CommodityPriceBenchmark, 
  NationalBenchmarkItem, 
  CreateSupplierQuotePayload, 
  CreateInvoicePayload, 
  PayInvoiceResponse, 
  LoanEvaluationRecord, 
  CreateLoanEvaluationPayload, 
  ReceiptForensicsRecordItem, 
  AnalyzeReceiptPayload, 
  ParseAndPostDialectPayload 
} from '../../types';

export class OperationsService {
  // --- B2B Price Intelligence ---
  async getCommodityBenchmarks(): Promise<CommodityPriceBenchmark[]> {
    return httpClient.get<CommodityPriceBenchmark[]>('/api/v1/benchmarks/commodities', []);
  }

  async getNationalBenchmarks(): Promise<NationalBenchmarkItem[]> {
    return httpClient.get<NationalBenchmarkItem[]>('/api/v1/benchmarks/national', []);
  }

  async createSupplierQuote(payload: CreateSupplierQuotePayload): Promise<{ success: boolean; message: string }> {
    return httpClient.post<{ success: boolean; message: string }>('/api/v1/benchmarks/quotes', payload);
  }

  async deleteSupplierQuote(id: string): Promise<boolean> {
    return httpClient.delete<boolean>(`/api/v1/benchmarks/quotes/${id}`);
  }

  // --- AR Invoices & WhatsApp Dunning ---
  async getInvoices(): Promise<InvoiceItem[]> {
    return httpClient.get<InvoiceItem[]>('/api/v1/invoices', []);
  }

  async createInvoice(payload: CreateInvoicePayload): Promise<InvoiceItem> {
    return httpClient.post<InvoiceItem>('/api/v1/invoices', payload);
  }

  async payInvoice(invoiceId: string, paymentMethod: string = 'CASH'): Promise<PayInvoiceResponse> {
    return httpClient.patch<PayInvoiceResponse>(`/api/v1/invoices/${invoiceId}/pay`, { payment_method: paymentMethod });
  }

  async sendDunningReminder(invoiceId: string, tone?: string, customMessage?: string): Promise<{ success: boolean; message: string }> {
    return httpClient.post<{ success: boolean; message: string }>(`/api/v1/invoices/${invoiceId}/dunning-reminder`, {
      tone,
      custom_message: customMessage
    });
  }

  // --- Anti-Predatory Loan Deobfuscator ---
  async getLoanEvaluations(): Promise<LoanEvaluationRecord[]> {
    return httpClient.get<LoanEvaluationRecord[]>('/api/v1/loans/evaluations', []);
  }

  async saveLoanEvaluation(payload: CreateLoanEvaluationPayload): Promise<LoanEvaluationRecord> {
    return httpClient.post<LoanEvaluationRecord>('/api/v1/loans/evaluations', payload);
  }

  async deleteLoanEvaluation(id: string): Promise<boolean> {
    return httpClient.delete<boolean>(`/api/v1/loans/evaluations/${id}`);
  }

  // --- Receipt Forensics Studio ---
  async getForensicRecords(limit: number = 30): Promise<ReceiptForensicsRecordItem[]> {
    return httpClient.get<ReceiptForensicsRecordItem[]>(`/api/v1/forensics/records?limit=${limit}`, []);
  }

  async analyzeForensicReceipt(payload: AnalyzeReceiptPayload): Promise<ReceiptForensicsRecordItem> {
    return httpClient.post<ReceiptForensicsRecordItem>('/api/v1/forensics/analyze', payload);
  }

  async postForensicToLedger(recordId: string): Promise<{ success: boolean; message: string; journal_entry_number: string }> {
    return httpClient.post<{ success: boolean; message: string; journal_entry_number: string }>(`/api/v1/forensics/${recordId}/post-to-ledger`);
  }

  // --- Voice Dialect Console ---
  async getDialects(dialect?: string): Promise<DialectItem[]> {
    const query = dialect ? `?dialect=${encodeURIComponent(dialect)}` : '';
    return httpClient.get<DialectItem[]>(`/api/v1/dialects${query}`, []);
  }

  async postDialectJournal(payload: ParseAndPostDialectPayload): Promise<{ 
    success: boolean; 
    message: string; 
    journal_entry_number: string; 
    audit_merkle_hash: string 
  }> {
    return httpClient.post<{ 
      success: boolean; 
      message: string; 
      journal_entry_number: string; 
      audit_merkle_hash: string 
    }>('/api/v1/dialects/parse-and-post', payload);
  }

  // --- Customer Support Desk ---
  async submitTicket(payload: SupportTicketPayload): Promise<SupportTicketItem> {
    try {
      return await httpClient.post<SupportTicketItem>('/api/v1/support/tickets', payload);
    } catch {
      // Graceful fallback ticket jika backend sedang offline
      return {
        id: `TCK-LOCAL-${Date.now().toString().slice(-4)}`,
        tenant_id: payload.tenant_id,
        title: payload.title,
        category: payload.category,
        description: payload.description,
        priority: payload.priority,
        status: 'OPEN',
        created_at: new Date().toISOString(),
      };
    }
  }

  async getTickets(tenantId?: string): Promise<SupportTicketItem[]> {
    const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : '';
    return httpClient.get<SupportTicketItem[]>(`/api/v1/support/tickets${query}`, []);
  }

  async updateTicketStatus(ticketId: string, status: string, agentName?: string): Promise<boolean> {
    try {
      await httpClient.patch(`/api/v1/support/tickets/${ticketId}/status`, { status, assigned_to: agentName });
      return true;
    } catch {
      return false;
    }
  }
}

export const operationsService = new OperationsService();
