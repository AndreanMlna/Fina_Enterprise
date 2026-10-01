import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  RefreshCw, 
  FileCheck2, 
  Receipt,
  Scan,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';
import type { ReceiptScan, AnalyzeReceiptPayload, ARDunningInvoice, VerifyTransferProofResponse } from '../../types';
import { api } from '../../services/api';
import { 
  ForensicReceiptPreview, 
  ForensicAuditCard, 
  ForensicUploadReceiptModal, 
  ForensicTransferVerificationModal,
  type NewReceiptFormData 
} from '../forensics';

interface ExtendedReceiptScan extends ReceiptScan {
  dbRecordId?: string;
  status?: string;
}

export const ForensicsView: React.FC = () => {
  const [receipts, setReceipts] = useState<ExtendedReceiptScan[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ExtendedReceiptScan | null>(null);
  const [showElaHeatmap, setShowElaHeatmap] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [postSuccessMsg, setPostSuccessMsg] = useState<string | null>(null);

  // Modal Uji Nota Baru
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReceiptForm, setNewReceiptForm] = useState<NewReceiptFormData>(() => ({
    merchant_name: 'UD Sumber Makmur Pasar Induk',
    receipt_number: `NOTA-PSR-${Date.now().toString().slice(-4)}`,
    item_1_name: 'Beras IR 64 (25 Kg)',
    item_1_price: '337500',
    item_2_name: 'Minyakita Pouch 1L (5 Pcs)',
    item_2_price: '77500',
    simulate_tamper: false
  }));

  // Modal Verifikasi Bukti Transfer m-Banking AI (Opsi 3)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferInvoices, setTransferInvoices] = useState<ARDunningInvoice[]>([]);
  const [selectedTransferInvoiceId, setSelectedTransferInvoiceId] = useState<string>('');
  const [transferFile, setTransferFile] = useState<File | null>(null);
  const [transferPreviewUrl, setTransferPreviewUrl] = useState<string | null>(null);
  const [isVerifyingTransfer, setIsVerifyingTransfer] = useState(false);
  const [transferResult, setTransferResult] = useState<VerifyTransferProofResponse | null>(null);

  const handleOpenTransferModal = async () => {
    setIsTransferModalOpen(true);
    setTransferFile(null);
    setTransferPreviewUrl(null);
    setTransferResult(null);
    try {
      const invs = await api.getInvoices();
      if (invs && invs.length > 0) {
        const mapped: ARDunningInvoice[] = invs.map(i => ({
          id: i.id,
          invoiceNumber: i.invoice_number,
          customerName: i.customer_name,
          customerPhone: i.customer_phone,
          amount: i.amount,
          dueDate: i.due_date,
          daysOverdue: i.days_overdue,
          status: i.status as ARDunningInvoice['status'],
          suggestedTone: (i.suggested_tone as ARDunningInvoice['suggestedTone']) || 'REMINDER',
          snapQrisUrl: i.snap_qris_url
        }));
        setTransferInvoices(mapped);
        const unpaid = mapped.find(m => m.status !== 'PAID');
        if (unpaid) {
          setSelectedTransferInvoiceId(unpaid.id);
        } else if (mapped[0]) {
          setSelectedTransferInvoiceId(mapped[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load invoices for transfer verification:', e);
    }
  };

  const handleTransferFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setTransferFile(f);
      setTransferPreviewUrl(URL.createObjectURL(f));
      setTransferResult(null);
    }
  };

  const handleExecuteTransferVerification = async () => {
    if (!selectedTransferInvoiceId) {
      alert('Pilih invoice tagihan yang akan diverifikasi.');
      return;
    }
    if (!transferFile) {
      alert('Unggah file screenshot bukti transfer m-Banking terlebih dahulu.');
      return;
    }

    setIsVerifyingTransfer(true);
    setTransferResult(null);
    try {
      const res = await api.verifyTransferProof(selectedTransferInvoiceId, transferFile);
      setTransferResult(res);
      if (res.is_authentic && res.success) {
        setPostSuccessMsg(`✓ Bukti transfer tervalidasi asli! Invoice ${res.invoice_number} lunas. Voucher Jurnal: ${res.journal_entry_number}`);
        setTimeout(() => setPostSuccessMsg(null), 8000);
        await fetchReceipts();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memverifikasi bukti transfer.');
    } finally {
      setIsVerifyingTransfer(false);
    }
  };

  const fetchReceipts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [forensicRecs, posReceipts] = await Promise.all([
        api.getForensicRecords(30),
        api.getPOSReceipts(15)
      ]);

      const forensicMapped: ExtendedReceiptScan[] = forensicRecs.map((fr) => ({
        id: fr.receipt_number,
        dbRecordId: fr.id,
        merchantName: fr.merchant_name,
        date: fr.transaction_date,
        items: fr.items.map(it => ({
          name: it.name,
          qty: it.qty,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal
        })),
        subtotal: fr.subtotal,
        tax: fr.tax_amount,
        total: fr.grand_total,
        elaIntegrityScore: fr.ela_integrity_score,
        isTampered: fr.is_tampered,
        tamperingDetails: fr.tampering_details || undefined,
        qrVerified: !fr.is_tampered,
        receiptType: 'GROSIR',
        status: fr.status
      }));

      const posMapped: ExtendedReceiptScan[] = posReceipts.map((r) => ({
        id: r.receipt_number,
        merchantName: r.tenant_name || 'FINA Enterprise Kasir',
        date: r.transaction_date,
        items: (r.items || []).map((it) => ({
          name: it.product_name,
          qty: it.quantity,
          unitPrice: it.unit_price,
          subtotal: it.subtotal
        })),
        subtotal: r.subtotal,
        tax: r.tax_pp55_estimated,
        total: r.grand_total,
        elaIntegrityScore: 100,
        isTampered: false,
        tamperingDetails: undefined,
        qrVerified: true,
        receiptType: 'MINIMARKET',
        status: 'POSTED_TO_LEDGER'
      }));

      const combined = [...forensicMapped, ...posMapped];
      setReceipts(combined);
      if (combined.length > 0) {
        setSelectedReceipt(prev => prev ? (combined.find(c => c.id === prev.id) || combined[0]) : combined[0]);
      } else {
        setSelectedReceipt(null);
      }
    } catch (err: any) {
      console.error('[ForensicsView] Gagal mengambil riwayat struk:', err);
      setError('Gagal memuat arsip transaksi struk nota dari basis data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handlePostToLedger = async () => {
    if (!selectedReceipt) return;
    if (selectedReceipt.isTampered) {
      alert('Dokumen ini terdeteksi manipulasi/tampered! Sistem melarang pembukuan nota bermasalah ke SAK EMKM.');
      return;
    }
    if (selectedReceipt.status === 'POSTED_TO_LEDGER') {
      alert('Dokumen ini sudah pernah dibukukan ke buku besar.');
      return;
    }
    if (!selectedReceipt.dbRecordId) {
      alert('Transaksi kasir POS sudah otomatis dibukukan saat checkout.');
      return;
    }

    setIsPosting(true);
    setPostSuccessMsg(null);
    try {
      const res = await api.postForensicToLedger(selectedReceipt.dbRecordId);
      setPostSuccessMsg(res.message);
      setTimeout(() => setPostSuccessMsg(null), 5000);
      await fetchReceipts();
    } catch (err: any) {
      alert(err.message || 'Gagal membukukan nota ke buku besar.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateAndAnalyzeReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = parseFloat(newReceiptForm.item_1_price.replace(/[^0-9]/g, '')) || 0;
    const p2 = parseFloat(newReceiptForm.item_2_price.replace(/[^0-9]/g, '')) || 0;
    const subtotal = p1 + p2;
    if (subtotal <= 0) {
      alert('Masukkan harga barang yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AnalyzeReceiptPayload = {
        receipt_number: newReceiptForm.receipt_number.trim(),
        merchant_name: newReceiptForm.merchant_name.trim(),
        subtotal: subtotal,
        tax_amount: 0,
        grand_total: subtotal,
        simulate_tamper: newReceiptForm.simulate_tamper,
        items: [
          { name: newReceiptForm.item_1_name, qty: 1, unitPrice: p1, subtotal: p1 },
          { name: newReceiptForm.item_2_name, qty: 1, unitPrice: p2, subtotal: p2 }
        ]
      };
      await api.analyzeForensicReceipt(payload);
      setIsModalOpen(false);
      setNewReceiptForm({
        merchant_name: 'UD Sumber Makmur Pasar Induk',
        receipt_number: `NOTA-PSR-${Date.now().toString().slice(-4)}`,
        item_1_name: 'Beras IR 64 (25 Kg)',
        item_1_price: '337500',
        item_2_name: 'Minyakita Pouch 1L (5 Pcs)',
        item_2_price: '77500',
        simulate_tamper: false
      });
      await fetchReceipts();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses nota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveReceipt = selectedReceipt;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Studio Forensik */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Multimodal Receipt Forensics Studio</h2>
            <span className="badge badge-amber">Vision AI & Error Level Analysis (ELA)</span>
            <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FileCheck2 size={12} /> Audit Kriptografis PostgreSQL
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Mendeteksi keaslian nota kasir & nota belanjaan pasar, memeriksa anomali piksel kompresi (ELA), dan memverifikasi rantai hash kriptografis SHA-256 Merkle Chaining di basis data.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleOpenTransferModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(56, 189, 248, 0.4)', color: 'var(--cyan-400)' }}
          >
            <ShieldCheck size={14} />
            <span>Verifikasi Transfer m-Banking (AI Vision)</span>
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={14} />
            <span>Uji & Unggah Nota Baru</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchReceipts}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            <span>Sinkronkan Struk</span>
          </button>
        </div>
      </div>

      {/* Post to Ledger Success Banner */}
      {postSuccessMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--emerald-400)',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{postSuccessMsg}</span>
        </div>
      )}

      {/* 2. Error Alert Banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--rose-400)',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          <button className="btn btn-sm btn-outline" onClick={fetchReceipts}>Coba Lagi</button>
        </div>
      )}

      {/* 3. Selector Dokumen Struk & Kontrol Forensik */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Pilih Dokumen Struk / Nota:
          </span>
          {isLoading ? (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Memuat riwayat struk dari PostgreSQL...</span>
          ) : receipts.length === 0 ? (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Belum ada nota tersimpan.</span>
          ) : (
            receipts.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedReceipt(r);
                  setShowElaHeatmap(false);
                }}
                className={`btn btn-sm ${selectedReceipt?.id === r.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Scan size={13} />
                <span>{r.id} ({r.merchantName})</span>
                {r.isTampered && <span className="badge badge-rose" style={{ fontSize: '0.6rem', padding: '0 4px' }}>Tampered</span>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. Tampilan Kerja Forensik Ganda */}
      {effectiveReceipt ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '20px' }}>
          {/* Panel Kiri: Visual Dokumen Struk Termal & Heatmap ELA */}
          <ForensicReceiptPreview 
            receipt={effectiveReceipt}
            showElaHeatmap={showElaHeatmap}
            onToggleElaHeatmap={() => setShowElaHeatmap(!showElaHeatmap)}
          />

          {/* Panel Kanan: Diagnostik Integritas Forensik */}
          <ForensicAuditCard 
            receipt={effectiveReceipt}
            isPosting={isPosting}
            onPostToLedger={handlePostToLedger}
          />
        </div>
      ) : (
        /* Empty State */
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Receipt size={48} color="var(--text-muted)" />
          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', margin: 0 }}>Belum Ada Struk / Nota Tersimpan</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', lineHeight: 1.5, margin: 0 }}>
            Lakukan penjualan di kasir POS atau unggah nota belanjaan bahan baku pasar Anda. Sistem akan memverifikasi integritas dokumen melalui algoritma ELA dan mencatatnya ke PostgreSQL.
          </p>
          <button className="btn btn-sm btn-primary" onClick={() => setIsModalOpen(true)}>
            + Uji & Unggah Nota Pertama
          </button>
        </div>
      )}

      {/* Modal Uji Nota Baru */}
      <ForensicUploadReceiptModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={newReceiptForm}
        setFormData={setNewReceiptForm}
        onSubmit={handleCreateAndAnalyzeReceipt}
        isSubmitting={isSubmitting}
      />

      {/* Modal Verifikasi Bukti Transfer m-Banking AI (Opsi 3) */}
      <ForensicTransferVerificationModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        invoices={transferInvoices}
        selectedInvoiceId={selectedTransferInvoiceId}
        onSelectInvoiceId={setSelectedTransferInvoiceId}
        transferFile={transferFile}
        transferPreviewUrl={transferPreviewUrl}
        onFileChange={handleTransferFileChange}
        onVerify={handleExecuteTransferVerification}
        isVerifying={isVerifyingTransfer}
        transferResult={transferResult}
      />
    </div>
  );
};
