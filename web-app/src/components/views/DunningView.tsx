import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCheck, 
  Smartphone, 
  Phone,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import type { ARDunningInvoice } from '../../types';
import { sampleInvoices } from '../../data/mockData';

interface DunningViewProps {
  isPiiMasked?: boolean;
}

export const DunningView: React.FC<DunningViewProps> = ({ isPiiMasked = false }) => {
  const [invoices, setInvoices] = useState<ARDunningInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<ARDunningInvoice | null>(null);
  const [selectedTone, setSelectedTone] = useState<'FRIENDLY' | 'REMINDER' | 'FORMAL_URGENT'>('REMINDER');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
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
            suggestedTone: inv.suggested_tone as ARDunningInvoice['suggestedTone'],
            snapQrisUrl: inv.snap_qris_url,
          }));
          setInvoices(mapped);
          setSelectedInvoice(mapped[0]);
        } else {
          setInvoices(sampleInvoices);
          setSelectedInvoice(sampleInvoices[0]);
        }
      } catch {
        setInvoices(sampleInvoices);
        setSelectedInvoice(sampleInvoices[0]);
      }
      setIsLoading(false);
    };
    fetchInvoices();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const maskCustomer = (name: string) => {
    if (!isPiiMasked) return name;
    return `[TERLINDUNGI UU PDP] - ${name.substring(0, 4)}***`;
  };

  const maskPhone = (phone: string) => {
    if (!isPiiMasked) return phone;
    return phone.substring(0, 6) + '****' + phone.substring(phone.length - 2);
  };

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

  const handleSendWhatsApp = () => {
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
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

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr', gap: '20px' }}>
        {/* Invoices Aging Table */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
            Daftar Piutang Jatuh Tempo (Accounts Receivable)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Invoice & Pelanggan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Nominal Piutang</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Keterlambatan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Rekomendasi Nada</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
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
                        background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{maskCustomer(inv.customerName)}</div>
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {inv.invoiceNumber} • {maskPhone(inv.customerPhone)}
                        </div>
                      </td>
                      <td className="mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--emerald-400)' }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {inv.daysOverdue > 15 ? (
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

          {/* Tone Selector */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Pilih Nada Komunikasi Penagihan:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn btn-sm ${selectedTone === 'FRIENDLY' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedTone('FRIENDLY')}
              >
                Sopan & Bersahabat (H-0)
              </button>
              <button 
                className={`btn btn-sm ${selectedTone === 'REMINDER' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedTone('REMINDER')}
              >
                Pengingat Tegur Sapa (H+7)
              </button>
              <button 
                className={`btn btn-sm ${selectedTone === 'FORMAL_URGENT' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setSelectedTone('FORMAL_URGENT')}
              >
                Formal Tegas (H+20)
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Preview & Outbound Dispatcher */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="var(--emerald-400)" />
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                Preview Pesan WhatsApp Bisnis
              </h3>
            </div>
            <span className="badge badge-emerald">
              Meta Cloud Verified
            </span>
          </div>

          {/* Simulated WhatsApp Phone Mockup */}
          <div style={{
            background: 'rgba(11, 20, 26, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* WhatsApp Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--emerald-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700 }}>
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
                <span>11:20</span>
                <CheckCheck size={14} color="#53bdeb" />
              </div>
            </div>

            {/* Send Trigger */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target: {selectedInvoice ? maskPhone(selectedInvoice.customerPhone) : '-'}
              </span>
              <button 
                className="btn btn-primary"
                onClick={handleSendWhatsApp}
                disabled={isSent || !selectedInvoice}
              >
                <Send size={15} />
                <span>{isSent ? 'Pesan Terkirim ke WhatsApp!' : 'Kirim Pesan WhatsApp Otomatis'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
