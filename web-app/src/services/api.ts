/**
 * FINA-ENTERPRISE Unified API Client Facade
 * 
 * Mengadopsi standar Google Engineering & Clean Architecture:
 * - Hexagonal Architecture / Port & Adapter
 * - Modular Domain Services (Auth, Ledger, POS, Operations)
 * - Centralized Robust HttpClient
 * - 100% Backward Compatibility untuk Semua Komponen & Views
 */

import { httpClient } from './httpClient';
import { authService } from './modules/authService';
import { ledgerService } from './modules/ledgerService';
import { posService } from './modules/posService';
import { operationsService } from './modules/operationsService';
import { setupService } from './modules/setupService';

// Re-export all type contracts for consumers
export * from './types';

/**
 * Unified ApiService Facade
 * Menyatukan seluruh domain layanan API menjadi antarmuka tunggal yang konsisten.
 */
class ApiService {
  // --- Token & Sesi Autentikasi ---
  getAuthToken() {
    return httpClient.getAuthToken();
  }

  setAuthToken(token: string) {
    httpClient.setAuthToken(token);
  }

  clearAuthToken() {
    httpClient.clearAuthToken();
  }

  // --- Domain: Autentikasi & Telemetri ---
  login = authService.login.bind(authService);
  register = authService.register.bind(authService);
  getMe = authService.getMe.bind(authService);
  checkHealth = authService.checkHealth.bind(authService);
  getSystemStatus = authService.getSystemStatus.bind(authService);
  getStaffList = authService.getStaffList.bind(authService);
  createStaff = authService.createStaff.bind(authService);
  updateStaffStatus = authService.updateStaffStatus.bind(authService);
  deleteStaff = authService.deleteStaff.bind(authService);

  // --- Domain: Akuntansi & Buku Besar SAK EMKM ---
  getLedgerEntries = ledgerService.getLedgerEntries.bind(ledgerService);
  getAccounts = ledgerService.getAccounts.bind(ledgerService);
  getSAKEMKMReport = ledgerService.getSAKEMKMReport.bind(ledgerService);
  getKPIDashboard = ledgerService.getKPIDashboard.bind(ledgerService);
  getRunwayBaseline = ledgerService.getRunwayBaseline.bind(ledgerService);

  // --- Domain: Kasir Point of Sale (POS) & Pricing Intelligence ---
  getPOSProducts = posService.getPOSProducts.bind(posService);
  createPOSProduct = posService.createPOSProduct.bind(posService);
  updatePOSProduct = posService.updatePOSProduct.bind(posService);
  deletePOSProduct = posService.deletePOSProduct.bind(posService);
  checkoutPOS = posService.checkoutPOS.bind(posService);
  getPOSReceipts = posService.getPOSReceipts.bind(posService);
  getProductRecipe = posService.getProductRecipe.bind(posService);
  saveProductRecipe = posService.saveProductRecipe.bind(posService);
  getPricingAnalysis = posService.getPricingAnalysis.bind(posService);
  applyRecommendedPrice = posService.applyRecommendedPrice.bind(posService);
  restockInventory = posService.restockInventory.bind(posService);
  recordProductionBatch = posService.recordProductionBatch.bind(posService);
  getMarginLeakageAlerts = posService.getMarginLeakageAlerts.bind(posService);
  getInventoryMaterials = posService.getInventoryMaterials.bind(posService);
  getInventorySummary = posService.getInventorySummary.bind(posService);
  getStockMovements = posService.getStockMovements.bind(posService);
  adjustStock = posService.adjustStock.bind(posService);

  // --- Domain: Intelijen Harga B2B & Komoditas ---
  getCommodityBenchmarks = operationsService.getCommodityBenchmarks.bind(operationsService);
  getNationalBenchmarks = operationsService.getNationalBenchmarks.bind(operationsService);
  createSupplierQuote = operationsService.createSupplierQuote.bind(operationsService);
  deleteSupplierQuote = operationsService.deleteSupplierQuote.bind(operationsService);

  // --- Domain: Penagihan Piutang (AR Dunning) ---
  getInvoices = operationsService.getInvoices.bind(operationsService);
  createInvoice = operationsService.createInvoice.bind(operationsService);
  payInvoice = operationsService.payInvoice.bind(operationsService);
  verifyTransferProof = operationsService.verifyTransferProof.bind(operationsService);
  sendDunningReminder = operationsService.sendDunningReminder.bind(operationsService);

  // --- Domain: Anti-Predatory Loan Deobfuscator ---
  getLoanEvaluations = operationsService.getLoanEvaluations.bind(operationsService);
  saveLoanEvaluation = operationsService.saveLoanEvaluation.bind(operationsService);
  deleteLoanEvaluation = operationsService.deleteLoanEvaluation.bind(operationsService);

  // --- Domain: Forensik Dokumen & Nota (ELA) ---
  getForensicRecords = operationsService.getForensicRecords.bind(operationsService);
  analyzeForensicReceipt = operationsService.analyzeForensicReceipt.bind(operationsService);
  postForensicToLedger = operationsService.postForensicToLedger.bind(operationsService);

  // --- Domain: Konsol Dialek Suara Daerah ---
  getDialects = operationsService.getDialects.bind(operationsService);
  postDialectJournal = operationsService.postDialectJournal.bind(operationsService);

  // --- Domain: Customer Support & Tiket ---
  submitTicket = operationsService.submitTicket.bind(operationsService);
  getTickets = operationsService.getTickets.bind(operationsService);
  updateTicketStatus = operationsService.updateTicketStatus.bind(operationsService);

  // --- Domain: Setup Saldo Awal (Modal Awal) ---
  getSetupStatus = setupService.getSetupStatus.bind(setupService);
  postInitialBalance = setupService.postInitialBalance.bind(setupService);
  getAISuppliesRecommendation = setupService.getAISuppliesRecommendation.bind(setupService);
}

export const api = new ApiService();
