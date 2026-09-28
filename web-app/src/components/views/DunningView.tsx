import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCheck, 
  Phone,
  ShieldCheck,
  Loader2,
  PlusCircle,
  CreditCard,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import type { ARDunningInvoice, CreateInvoicePayload } from '../../types';
import { formatCurrency, maskPhone, maskCustomerName } from '../../utils';

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
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_phone: '',
    amount: '',
    due_date: getDefaultDueDate(),
    suggested_tone: 'FRIENDLY' as const
  });

  // State Pelunasan Invoice
  const [isPaying, setIsPaying] = useState(false);
  const [settlementSuccess, setSettlementSuccess] = useState<string | null>(null);

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
  const maskPhoneNumber = (phone: string) => maskPhone(phone, isPiiMasked);

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
        due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
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
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
              Daftar Piutang Jatuh Tempo (Accounts Receivable)
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Total: {invoices.length} Invoice di PostgreSQL
            </span>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--emerald-400)' }} />
              <span>Memuat data invoice piutang dari PostgreSQL...</span>
            </div>
          ) : errorMessage ? (
            <div style={{ textAlign: 'center', padding: '24px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <p style={{ color: 'var(--rose-400)', fontSize: '0.85rem' }}>{errorMessage}</p>
              <button className="btn btn-sm btn-primary" onClick={fetchInvoices}>Muat Ulang</button>
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={40} style={{ opacity: 0.4, margin: '0 auto 8px auto', display: 'block', color: 'var(--emerald-400)' }} />
              <p style={{ fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>Tidak Ada Piutang Tertunggak</p>
              <p style={{ fontSize: '0.8rem', margin: '0 0 12px 0' }}>Semua tagihan pelanggan berada dalam status lunas atau belum ada invoice diterbitkan.</p>
              <button className="btn btn-sm btn-outline" onClick={() => setIsCreateModalOpen(true)}>
                + Buat Invoice Piutang Pertama
              </button>
            </div>
          ) : (
            <div className="table-scroll-container" style={{ maxHeight: 'calc(100vh - 310px)', minHeight: '420px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead className="sticky-table-header">
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Invoice & Pelanggan</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Nominal</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Rekomendasi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const isSelected = selectedInvoice?.id === inv.id;
                    const isPaid = inv.status === 'PAID';
                    return (
                      <tr 
                        key={inv.id}
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setSelectedTone(inv.suggestedTone);
                        }}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                          opacity: isPaid ? 0.65 : 1
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff', textDecoration: isPaid ? 'line-through' : 'none' }}>
                            {maskCustomer(inv.customerName)}
                          </div>
                          <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {inv.invoiceNumber} • {maskPhoneNumber(inv.customerPhone)}
                          </div>
                        </td>
                        <td className="mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: isPaid ? 'var(--text-muted)' : 'var(--emerald-400)' }}>
                          {formatCurrency(inv.amount)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {isPaid ? (
                            <span className="badge badge-emerald">LUNAS</span>
                          ) : inv.daysOverdue > 15 ? (
                            <span className="badge badge-rose">+{inv.daysOverdue} Hari Lewat</span>
                          ) : inv.daysOverdue > 0 ? (
                            <span className="badge badge-amber">+{inv.daysOverdue} Hari Lewat</span>
                          ) : (
                            <span className="badge badge-emerald">Jatuh Tempo Normal</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span className="badge badge-indigo">
                            {inv.suggestedTone}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* WhatsApp Dunning Preview & Settle Action */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px', alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
              Simulator Pesan Tagihan WhatsApp
            </h3>

            {/* Tombol Pelunasan Cepat jika belum lunas */}
            {selectedInvoice && selectedInvoice.status !== 'PAID' && (
              <button 
                className="btn btn-sm btn-outline"
                onClick={handlePayInvoice}
                disabled={isPaying}
                title="Tandai invoice lunas dan bukukan otomatis ke SAK EMKM"
                style={{ borderColor: 'var(--emerald-500)', color: 'var(--emerald-400)' }}
              >
                <CreditCard size={13} />
                <span>{isPaying ? 'Memproses...' : 'Tandai Lunas SAK EMKM'}</span>
              </button>
            )}
          </div>

          {/* Tone Selector */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['FRIENDLY', 'REMINDER', 'FORMAL_URGENT'] as const).map((tone) => (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone)}
                className={`btn btn-sm ${selectedTone === tone ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.72rem', padding: '6px 4px' }}
              >
                {tone === 'FRIENDLY' ? 'Santun (H-3)' : tone === 'REMINDER' ? 'Mengingatkan' : 'Somasi Formal'}
              </button>
            ))}
          </div>

          {/* WhatsApp Interface Mockup */}
          <div style={{
            background: '#0b141a',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            {/* Top Bar WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.82rem' }}>
                WA
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                  {selectedInvoice ? maskCustomer(selectedInvoice.customerName) : 'Tidak ada invoice terpilih'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--emerald-400)' }}>
                  Online • WhatsApp Business Official
                </div>
              </div>
              <Phone size={16} color="var(--text-muted)" />
            </div>

            {/* Chat Bubble */}
            <div style={{
              background: '#005c4b',
              color: '#e9edef',
              padding: '12px 14px',
              borderRadius: '8px 8px 0px 8px',
              maxWidth: '92%',
              alignSelf: 'flex-end',
              margin: '16px 0',
              fontSize: '0.82rem',
              lineHeight: 1.45,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              {getDunningMessage() || 'Pilih invoice di tabel sebelah kiri untuk mempratinjau draft penagihan otomatis.'}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>
                <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                <CheckCheck size={14} color="#53bdeb" />
              </div>
            </div>

            {sendSuccessMsg && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '4px',
                fontSize: '0.74rem',
                color: 'var(--emerald-400)',
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                ✓ {sendSuccessMsg}
              </div>
            )}

            {/* Send Trigger */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target: {selectedInvoice ? maskPhoneNumber(selectedInvoice.customerPhone) : '-'}
              </span>
              <button 
                className="btn btn-primary"
                onClick={handleSendWhatsApp}
                disabled={isSending || !selectedInvoice || selectedInvoice.status === 'PAID'}
              >
                <Send size={15} />
                <span>{isSending ? 'Mengirim...' : selectedInvoice?.status === 'PAID' ? 'Tagihan Telah Lunas' : 'Kirim Pesan WhatsApp Otomatis'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Terbitkan Invoice Baru */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={18} color="var(--emerald-400)" />
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Terbitkan Invoice Baru</h3>
              </div>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Nama Pelanggan / Entitas Mitra *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: PT Katering Mandiri Sejahtera"
                  value={invoiceForm.customer_name}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-medium)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Nomor WhatsApp Pelanggan *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: 081298765432"
                  value={invoiceForm.customer_phone}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-medium)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Nominal Piutang (Rp) *
                  </label>
                  <input 
                    type="number"
                    required
                    min="1000"
                    placeholder="Contoh: 3500000"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-medium)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Tanggal Jatuh Tempo *
                  </label>
                  <input 
                    type="date"
                    required
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-medium)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmittingInvoice}
                >
                  {isSubmittingInvoice ? 'Menerbitkan...' : 'Terbitkan Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
