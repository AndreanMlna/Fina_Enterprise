import React, { useState, useEffect } from 'react';
import { 
  CheckCheck, 
  ShieldCheck, 
  Loader2, 
  PlusCircle
} from 'lucide-react';
import { api } from '../../services/api';
import type { ARDunningInvoice, CreateInvoicePayload, VerifyTransferProofResponse } from '../../types';
import { formatCurrency, maskCustomerName } from '../../utils';
import { 
  DunningInvoicesTable, 
  DunningWhatsAppPreview, 
  DunningCreateInvoiceModal, 
  DunningVerifyTransferModal,
  type NewInvoiceFormData 
} from '../dunning';

const getDefaultDueDate = (): string => {
  return new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
};

interface DunningViewProps {
  isPiiMasked?: boolean;
}

export const DunningView: React.FC<DunningViewProps> = ({ isPiiMasked = false }) => {
  const [invoices, setInvoices] = useState<ARDunningInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<ARDunningInvoice | null>(null);
  const [selectedTone, setSelectedTone] = useState<'FRIENDLY' | 'REMINDER' | 'FORMAL_URGENT'>('REMINDER');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Buat Invoice Baru
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<NewInvoiceFormData>({
    customer_name: '',
    customer_phone: '',
    amount: '',
    due_date: getDefaultDueDate(),
    suggested_tone: 'FRIENDLY'
  });

  // State Pelunasan Invoice
  const [isPaying, setIsPaying] = useState(false);
  const [settlementSuccess, setSettlementSuccess] = useState<string | null>(null);

  // State Verifikasi Bukti Transfer m-Banking AI (Opsi 3)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyTargetInvoice, setVerifyTargetInvoice] = useState<ARDunningInvoice | null>(null);
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isVerifyingProof, setIsVerifyingProof] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerifyTransferProofResponse | null>(null);

  const handleOpenVerifyModal = (inv: ARDunningInvoice) => {
    setVerifyTargetInvoice(inv);
    setSelectedProofFile(null);
    setProofPreviewUrl(null);
    setVerificationResult(null);
    setIsVerifyModalOpen(true);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedProofFile(file);
      setProofPreviewUrl(URL.createObjectURL(file));
      setVerificationResult(null);
    }
  };

  const handleExecuteProofVerification = async () => {
    const target = verifyTargetInvoice || selectedInvoice;
    if (!target) {
      alert('Pilih invoice yang akan diverifikasi.');
      return;
    }
    if (!selectedProofFile) {
      alert('Unggah file screenshot bukti transfer m-Banking terlebih dahulu.');
      return;
    }

    setIsVerifyingProof(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyTransferProof(target.id, selectedProofFile);
      setVerificationResult(res);
      if (res.is_authentic && res.success) {
        setSettlementSuccess(`✓ ${res.message} [Voucher: ${res.journal_entry_number}]`);
        setTimeout(() => setSettlementSuccess(null), 8000);
        await fetchInvoices();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memverifikasi bukti transfer.');
    } finally {
      setIsVerifyingProof(false);
    }
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getInvoices();
      if (data && data.length > 0) {
        const mapped: ARDunningInvoice[] = data.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          customerName: inv.customer_name,
          customerPhone: inv.customer_phone,
          amount: inv.amount,
          dueDate: inv.due_date,
          daysOverdue: inv.days_overdue,
          status: inv.status as ARDunningInvoice['status'],
          suggestedTone: (inv.suggested_tone as ARDunningInvoice['suggestedTone']) || 'REMINDER',
          snapQrisUrl: inv.snap_qris_url,
        }));
        setInvoices(mapped);
        setSelectedInvoice(prev => prev ? (mapped.find(m => m.id === prev.id) || mapped[0]) : mapped[0]);
        if (mapped[0]?.suggestedTone) {
          setSelectedTone(mapped[0].suggestedTone);
        }
      } else {
        setInvoices([]);
        setSelectedInvoice(null);
      }
    } catch (err: any) {
      console.error("[DunningView] Gagal mengambil invoice piutang:", err);
      setErrorMessage(err?.response?.data?.detail || err?.message || "Gagal memuat invoice dari server.");
      setInvoices([]);
      setSelectedInvoice(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const maskCustomer = (name: string) => maskCustomerName(name, isPiiMasked);

  const getDunningMessage = () => {
    if (!selectedInvoice) return '';
    const customer = maskCustomer(selectedInvoice.customerName);
    if (selectedTone === 'FRIENDLY') {
      return `Halo Bapak/Ibu dari ${customer}, semoga usahanya senantiasa lancar berkah. Kami ingin menginformasikan tagihan katering ${selectedInvoice.invoiceNumber} sebesar ${formatCurrency(selectedInvoice.amount)} akan jatuh tempo pada ${selectedInvoice.dueDate}. Pembayaran dapat dilakukan dengan mudah via QRIS SNAP instan berikut: ${selectedInvoice.snapQrisUrl}. Terima kasih banyak atas kepercayaannya 🙏`;
    }
    if (selectedTone === 'REMINDER') {
      return `Selamat siang Bapak/Ibu pengelola ${customer}. Mengingatkan kembali bahwa invoice nomor ${selectedInvoice.invoiceNumber} sebesar ${formatCurrency(selectedInvoice.amount)} telah melewati batas jatuh tempo (${selectedInvoice.daysOverdue} hari). Mohon kesediaannya untuk melakukan penyelesaian transaksi melalui tautan QRIS SNAP resmi kami: ${selectedInvoice.snapQrisUrl}. Terima kasih atas kerja samanya.`;
    }
    return `PEMBERITAHUAN FORMAL KEUANGAN (Pasal 1238 KUHPerdata): Kepada Yth. Pimpinan ${customer}. Berdasarkan catatan buku besar kami, tagihan ${selectedInvoice.invoiceNumber} senilai ${formatCurrency(selectedInvoice.amount)} telah tertunggak selama ${selectedInvoice.daysOverdue} hari. Mohon konfirmasi jadwal pelunasan hari ini atau segera selesaikan via sistem pembayaran online resmi: ${selectedInvoice.snapQrisUrl}. Terima kasih atas perhatiannya.`;
  };

  const handleSendWhatsApp = async () => {
    if (!selectedInvoice) return;
    setIsSending(true);
    setSendSuccessMsg(null);
    try {
      const res = await api.sendDunningReminder(selectedInvoice.id, selectedTone, getDunningMessage());
      setSendSuccessMsg(res.message);
      setTimeout(() => setSendSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan penagihan.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;
    const confirmPay = window.confirm(
      `Konfirmasi Pelunasan:\nTandai invoice ${selectedInvoice.invoiceNumber} (${maskCustomer(selectedInvoice.customerName)}) senilai ${formatCurrency(selectedInvoice.amount)} sebagai LUNAS?\n\nSistem akan otomatis membukukan jurnal berpasangan (Debet Kas 1101 == Kredit Piutang 1103) dengan SHA-256 Merkle Chaining di PostgreSQL.`
    );
    if (!confirmPay) return;

    setIsPaying(true);
    try {
      const res = await api.payInvoice(selectedInvoice.id, 'CASH');
      setSettlementSuccess(`Pelunasan berhasil dibukukan! Voucher: ${res.journal_entry_number}`);
      setTimeout(() => setSettlementSuccess(null), 5000);
      await fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pelunasan invoice.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(invoiceForm.amount.replace(/[^0-9]/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Masukkan nominal tagihan yang valid.');
      return;
    }
    if (!invoiceForm.customer_name.trim()) {
      alert('Masukkan nama pelanggan / mitra usaha.');
      return;
    }
    if (!invoiceForm.customer_phone.trim()) {
      alert('Masukkan nomor WhatsApp pelanggan.');
      return;
    }

    setIsSubmittingInvoice(true);
    try {
      const payload: CreateInvoicePayload = {
        customer_name: invoiceForm.customer_name.trim(),
        customer_phone: invoiceForm.customer_phone.trim(),
        amount: amountNum,
        due_date: invoiceForm.due_date,
        suggested_tone: invoiceForm.suggested_tone
      };
      await api.createInvoice(payload);
      setIsCreateModalOpen(false);
      setInvoiceForm({
        customer_name: '',
        customer_phone: '',
        amount: '',
        due_date: getDefaultDueDate(),
        suggested_tone: 'FRIENDLY'
      });
      await fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Gagal menerbitkan invoice baru.');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Autonomous AR Dunning & Collection Hub</h2>
            <span className="badge badge-emerald">WhatsApp Cloud API & SNAP QRIS</span>
            {isLoading && <Loader2 size={16} className="animate-spin" color="var(--emerald-400)" />}
            {isPiiMasked && (
              <span className="badge badge-amber">
                <ShieldCheck size={12} /> UU PDP Privacy Shield Active
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Otomatisasi penagihan piutang dagang tanpa canggung dengan nada bahasa adaptif (*adaptive conversational tone*) dan tautan pembayaran instan.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusCircle size={15} />
          <span>Terbitkan Invoice Baru</span>
        </button>
      </div>

      {/* Alert Banner Sukses Pelunasan */}
      {settlementSuccess && (
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
          <CheckCheck size={16} />
          <span>{settlementSuccess}</span>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr', gap: '20px' }}>
        {/* Invoices Aging Table */}
        <DunningInvoicesTable 
          invoices={invoices}
          selectedInvoice={selectedInvoice}
          onSelectInvoice={(inv) => {
            setSelectedInvoice(inv);
            setSelectedTone(inv.suggestedTone);
          }}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onRetry={fetchInvoices}
          onCreateInvoiceClick={() => setIsCreateModalOpen(true)}
          onOpenVerifyModal={handleOpenVerifyModal}
          isPiiMasked={isPiiMasked}
        />

        {/* WhatsApp Dunning Preview & Settle Action */}
        <DunningWhatsAppPreview 
          selectedInvoice={selectedInvoice}
          selectedTone={selectedTone}
          onSelectTone={setSelectedTone}
          dunningMessage={getDunningMessage()}
          isSending={isSending}
          sendSuccessMsg={sendSuccessMsg}
          onSendWhatsApp={handleSendWhatsApp}
          onOpenVerifyModal={handleOpenVerifyModal}
          onPayInvoice={handlePayInvoice}
          isPaying={isPaying}
          isPiiMasked={isPiiMasked}
        />
      </div>

      {/* Modal Terbitkan Invoice Baru */}
      <DunningCreateInvoiceModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        formData={invoiceForm}
        setFormData={setInvoiceForm}
        onSubmit={handleCreateInvoiceSubmit}
        isSubmitting={isSubmittingInvoice}
      />

      {/* Modal Verifikasi Bukti Transfer m-Banking Menggunakan AI Vision (Anti-Struk Palsu) */}
      <DunningVerifyTransferModal 
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        targetInvoice={verifyTargetInvoice}
        selectedProofFile={selectedProofFile}
        proofPreviewUrl={proofPreviewUrl}
        onProofFileChange={handleProofFileChange}
        onVerify={handleExecuteProofVerification}
        isVerifying={isVerifyingProof}
        verificationResult={verificationResult}
        isPiiMasked={isPiiMasked}
      />
    </div>
  );
};
