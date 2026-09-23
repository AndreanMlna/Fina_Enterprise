import React, { useState } from 'react';
import { 
  X, 
  Send, 
  LifeBuoy, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Smartphone, 
  Hash, 
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import type { SupportTicket, Tenant } from '../../types';

interface SupportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  tickets: SupportTicket[];
  onSubmitTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => void;
}

export const SupportReportModal: React.FC<SupportReportModalProps> = ({
  isOpen,
  onClose,
  tenant,
  tickets,
  onSubmitTicket
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Form State
  const [category, setCategory] = useState<SupportTicket['category']>('RECEIPT_OCR_FAILED');
  const [priority, setPriority] = useState<SupportTicket['priority']>('HIGH');
  const [subject, setSubject] = useState('');
  const [userPhone, setUserPhone] = useState('+6281234567890');
  const [transactionRef, setTransactionRef] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const generatedTicketNo = `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setTimeout(() => {
      onSubmitTicket({
        ticketNumber: generatedTicketNo,
        tenantName: tenant ? `${tenant.name} (${tenant.branchCode})` : 'Entitas Usaha',
        userPhone,
        category,
        priority,
        status: 'OPEN',
        subject,
        description: `${description}${transactionRef ? `\n[Referensi Transaksi: ${transactionRef}]` : ''}`,
        aiConfidenceScore: 75,
        suggestedResolution: 'Menunggu peninjauan & verifikasi oleh Tim CS internal.'
      });

      setIsSubmitting(false);
      setSubmittedTicketNumber(generatedTicketNo);
      // Reset form fields
      setSubject('');
      setDescription('');
      setTransactionRef('');
    }, 700);
  };

  const getCategoryLabel = (cat: SupportTicket['category']) => {
    switch (cat) {
      case 'RECEIPT_OCR_FAILED':
        return '📷 Struk / Nota Buram (OCR Gagal)';
      case 'VOICE_DIALECT_AMBIGUOUS':
        return '🎙️ Transkripsi Rekaman Suara / Dialek Salah';
      case 'WHATSAPP_DUNNING_ERROR':
        return '💬 Penagihan WhatsApp Piutang Gagal';
      case 'TAX_PP55_INQUIRY':
        return '📊 Rekonsiliasi Pajak PP 55 / SAK EMKM';
      case 'SYSTEM_BUG':
        return '⚙️ Kendala Sistem / Saldo Tidak Sinkron';
      default:
        return cat;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0b1528 0%, #060b17 100%)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--cyan-glow)'
            }}>
              <LifeBuoy size={22} color="#021a10" strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Pusat Bantuan & Lapor Kendala UMKM
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Laporkan masalah operasional Anda secara mendalam untuk ditindaklanjuti Staf Customer Support & AI-Ops
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '0 24px'
        }}>
          <button
            onClick={() => {
              setActiveTab('form');
              setSubmittedTicketNumber(null);
            }}
            style={{
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'form' ? '2px solid var(--cyan-400)' : '2px solid transparent',
              color: activeTab === 'form' ? 'var(--cyan-400)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={16} />
            <span>Formulir Lapor Kendala Baru</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid var(--cyan-400)' : '2px solid transparent',
              color: activeTab === 'history' ? 'var(--cyan-400)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Clock size={16} />
            <span>Riwayat Laporan Kendala Saya</span>
            <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
              {tickets.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Formulir Lapor Kendala */}
        {activeTab === 'form' && (
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {submittedTicketNumber ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid var(--emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={36} color="var(--emerald-400)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
                    Laporan Kendala Berhasil Dikirimkan!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
                    Laporan Anda telah terdaftar dengan nomor tiket resmi di bawah ini. Tim Customer Support & AI-Ops sedang meninjau rincian masalah Anda.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 24px',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nomor Tiket Antrean:</span>
                  <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan-400)', marginTop: '2px' }}>
                    {submittedTicketNumber}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab('history')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Lihat Status di Riwayat
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSubmittedTicketNumber(null)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Buat Laporan Lain
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  fontSize: '0.82rem',
                  color: 'var(--cyan-400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <HelpCircle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    Pedagang tidak perlu pusing mengenai istilah teknis. Jelaskan saja apa yang terjadi, dan tim CS akan memvalidasi data atau jurnal akuntansi Anda.
                  </span>
                </div>

                {/* Baris 1: Kategori & Tingkat Urgensi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Kategori Permasalahan <span style={{ color: 'var(--rose-400)' }}>*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ffffff',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="RECEIPT_OCR_FAILED" style={{ background: '#0f172a' }}>
                        📷 Struk Belanja / Nota Buram & Salah Baca Total
                      </option>
                      <option value="VOICE_DIALECT_AMBIGUOUS" style={{ background: '#0f172a' }}>
                        🎙️ Transkripsi Rekaman Suara / Dialek Daerah Salah
                      </option>
                      <option value="WHATSAPP_DUNNING_ERROR" style={{ background: '#0f172a' }}>
                        💬 Penagihan WhatsApp Piutang Gagal Terkirim
                      </option>
                      <option value="TAX_PP55_INQUIRY" style={{ background: '#0f172a' }}>
                        📊 Rekonsiliasi Perhitungan Pajak PP 55 / SAK EMKM
                      </option>
                      <option value="SYSTEM_BUG" style={{ background: '#0f172a' }}>
                        ⚙️ Gangguan Teknis / Inkonsistensi Saldo Buku Besar
                      </option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Tingkat Urgensi <span style={{ color: 'var(--rose-400)' }}>*</span>
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: priority === 'CRITICAL' ? 'var(--rose-400)' : priority === 'HIGH' ? 'var(--amber-400)' : '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    >
                      <option value="LOW" style={{ background: '#0f172a', color: '#e2e8f0' }}>🟢 Rendah (Pertanyaan Umum)</option>
                      <option value="MEDIUM" style={{ background: '#0f172a', color: '#e2e8f0' }}>🟡 Sedang (Ada Transaksi Perlu Dicek)</option>
                      <option value="HIGH" style={{ background: '#0f172a', color: '#f59e0b' }}>🟠 Tinggi (Operasional Hari Ini Terganggu)</option>
                      <option value="CRITICAL" style={{ background: '#0f172a', color: '#ef4444' }}>🔴 Kritis (Laporan Pajak / Kasir Terhenti)</option>
                    </select>
                  </div>
                </div>

                {/* Baris 2: Subjek Judul Masalah */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Judul / Subjek Kendala <span style={{ color: 'var(--rose-400)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Nota pembelian bahan baku Pasar Induk Rp 2.450.000 salah baca angka nol"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                {/* Baris 3: WhatsApp & Referensi Transaksi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Nomor WhatsApp untuk Konfirmasi Solusi <span style={{ color: 'var(--rose-400)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Smartphone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        required
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="0812-xxxx-xxxx"
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 36px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#ffffff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      ID Transaksi / Nomor Nota (Jika Ada)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Hash size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="Contoh: TRX-2026-0917-001 atau INV-102"
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 36px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#ffffff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Baris 4: Rincian Kronologi Masalah */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Rincian Kronologi & Penjelasan Masalah <span style={{ color: 'var(--rose-400)' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan apa yang terjadi secara lengkap. Contoh:&#10;Tadi pagi jam 08:30 saya scan nota pembelian telur dan minyak goreng senilai Rp 850.000. Tapi di jurnal terbaca Rp 85.000 karena struk terkena cipratan minyak. Mohon tim CS perbaiki nominalnya agar kas masuk dan persediaan sesuai..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      lineHeight: '1.5',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Submit Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                      fontSize: '0.85rem',
                      padding: '10px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSubmitting ? (
                      <span>Mengirim Laporan ke Antrean CS...</span>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Kirim Laporan Kendala</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Riwayat Laporan Kendala */}
        {activeTab === 'history' && (
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <HelpCircle size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p>Belum ada laporan kendala yang pernah diajukan.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tickets.map((t) => {
                  const isResolved = t.status === 'RESOLVED';
                  const isInReview = t.status === 'IN_REVIEW';

                  return (
                    <div 
                      key={t.id} 
                      className="glass-panel" 
                      style={{
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-md)',
                        border: isResolved 
                          ? '1px solid rgba(16, 185, 129, 0.3)' 
                          : isInReview 
                          ? '1px solid rgba(6, 182, 212, 0.3)' 
                          : '1px solid var(--border-subtle)',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
                              {t.ticketNumber}
                            </span>
                            <span className={`badge ${isResolved ? 'badge-emerald' : isInReview ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: '0.68rem' }}>
                              {isResolved ? 'SELESAI DITANGANI' : isInReview ? 'SEDANG DITINJAU CS' : 'MENUNGGU CS'}
                            </span>
                            <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                              {t.priority}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#ffffff', margin: '8px 0 4px 0' }}>
                            {t.subject}
                          </h4>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Kategori: <strong style={{ color: '#e2e8f0' }}>{getCategoryLabel(t.category)}</strong> • Waktu Lapor: {t.createdAt}
                          </span>
                        </div>
                      </div>

                      {/* Deskripsi Masalah */}
                      <p style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        margin: '10px 0',
                        lineHeight: '1.5',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--border-subtle)'
                      }}>
                        {t.description}
                      </p>

                      {/* Respon / Tanggapan CS */}
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: isResolved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(6, 182, 212, 0.08)',
                        border: isResolved ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(6, 182, 212, 0.2)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                      }}>
                        {isResolved ? (
                          <CheckCircle2 size={16} color="var(--emerald-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        ) : (
                          <MessageSquare size={16} color="var(--cyan-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        )}
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isResolved ? 'var(--emerald-400)' : 'var(--cyan-400)', textTransform: 'uppercase' }}>
                            {isResolved ? 'Solusi / Tindak Lanjut Tim CS:' : 'Status Peninjauan Staf CS:'}
                          </span>
                          <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: '2px 0 0 0', lineHeight: '1.4' }}>
                            {t.suggestedResolution || 'Laporan Anda sedang dalam antrean evaluasi teknis tim AI-Ops.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Info */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.74rem',
          color: 'var(--text-muted)'
        }}>
          <span>
            Penyedia Layanan: <strong>FINA Customer Support & AI-Ops Desk</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={13} color="var(--cyan-400)" />
            <span>SLA Penanganan Kendala Kritis: &lt; 15 Menit</span>
          </span>
        </div>
      </div>
    </div>
  );
};
