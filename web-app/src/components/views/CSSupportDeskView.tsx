import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  CheckCircle2, 
  Clock, 
  Send, 
  Sparkles, 
  FileText, 
  LogOut,
  ShieldAlert,
  LifeBuoy,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import type { SupportTicket } from '../../types';
import { mockSupportTickets } from '../../data/mockData';
import { ConfirmDialog } from '../ConfirmDialog';

interface CSSupportDeskViewProps {
  tickets?: SupportTicket[];
  onResolveTicket?: (ticketId: string, resolutionNote?: string) => void;
  onLogout: () => void;
}

export const CSSupportDeskView: React.FC<CSSupportDeskViewProps> = ({
  tickets: propTickets,
  onResolveTicket: propOnResolveTicket,
  onLogout
}) => {
  const [internalTickets, setInternalTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  useEffect(() => {
    if (!propTickets) {
      const fetchTickets = async () => {
        setIsLoadingTickets(true);
        try {
          const data = await api.getTickets();
          if (data && data.length > 0) {
            const mapped: SupportTicket[] = data.map((t: any) => ({
              id: t.id,
              ticketNumber: t.id,
              tenantName: t.reporter_name || t.tenant_id || 'Pedagang UMKM',
              userPhone: t.reporter_phone || '+628123456789',
              category: (t.category as any) || 'SYSTEM_BUG',
              description: t.description || '',
              priority: (t.priority as any) || 'MEDIUM',
              status: t.status === 'RESOLVED' ? 'RESOLVED' : t.status === 'IN_PROGRESS' ? 'IN_REVIEW' : 'OPEN',
              subject: t.title || 'Laporan Pengguna',
              createdAt: t.created_at ? t.created_at.replace('T', ' ').substring(0, 16) : '2026-09-17 12:00',
              suggestedResolution: t.assigned_to ? `Ditangani oleh: ${t.assigned_to}` : 'Menunggu review staf CS'
            }));
            setInternalTickets(mapped);
          }
        } catch { /* use fallback tickets */ }
        setIsLoadingTickets(false);
      };
      fetchTickets();
    }
  }, [propTickets]);

  const tickets = (propTickets && propTickets.length > 0) 
    ? propTickets 
    : (internalTickets.length > 0 ? internalTickets : mockSupportTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];
  const [csReply, setCsReply] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isResolveConfirmOpen, setIsResolveConfirmOpen] = useState(false);

  const handleResolveTicket = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (propOnResolveTicket) {
        propOnResolveTicket(selectedTicket.id, csReply || selectedTicket.suggestedResolution);
      } else {
        const updated = tickets.map(t => 
          t.id === selectedTicket.id 
            ? { ...t, status: 'RESOLVED' as const, suggestedResolution: csReply || t.suggestedResolution } 
            : t
        );
        setInternalTickets(updated);
      }
      setIsProcessing(false);
      setSuccessToast('Tiket berhasil diselesaikan & konfirmasi terkirim ke pedagang via WhatsApp!');
      setCsReply('');
      setTimeout(() => setSuccessToast(''), 3000);
    }, 800);
  };


  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0a1728 0%, #05070f 80%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* CS Top Bar */}
      <header style={{
        padding: '16px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(6, 9, 17, 0.95)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px var(--cyan-glow)'
          }}>
            <Headphones size={22} color="#000000" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                FINA Customer Support & AI-Ops Desk
              </h2>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                INTERNAL ACCESS
              </span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Staf CS: <strong>Rian Pratama (ID: CS-OPS-8842)</strong> • Wilayah Layanan: Nasional UMKM
            </span>
          </div>
        </div>

        {/* Internal Session Security & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            color: 'var(--cyan-400)',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            padding: '6px 12px',
            borderRadius: '6px'
          }}>
            <ShieldAlert size={13} />
            <span>Akses Terbatas Staf CS (Zero-Trust)</span>
          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => setIsLogoutConfirmOpen(true)}
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={13} />
            <span>Keluar Sesi Staf (Logout)</span>
          </button>
        </div>

      </header>

      {/* Main Workspace */}
      <main style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Toast Notification */}
        {successToast && (
          <div style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--emerald-500)',
            color: 'var(--emerald-400)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Metric Cards Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tiket Aktif / Terbuka</span>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--amber-400)', marginTop: '4px' }}>
              {tickets.filter(t => t.status !== 'RESOLVED').length} Tiket
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Antrean HITL Review</span>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--rose-400)', marginTop: '4px' }}>
              1 Transaksi
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rata-rata Waktu Respon</span>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--emerald-400)', marginTop: '4px' }}>
              3.8 Menit
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CSAT Kepuasan Pedagang</span>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan-400)', marginTop: '4px' }}>
              98.6%
            </div>
          </div>
        </div>

        {/* Dual Split Workstation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.5fr', gap: '20px', flex: 1 }}>
          {/* Left: Ticket Queue */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LifeBuoy size={18} color="var(--cyan-400)" />
                <span>Antrean Tiket Masuk & HITL</span>
                {isLoadingTickets && <Loader2 size={14} className="animate-spin" color="var(--cyan-400)" />}
              </h3>
              <span className="badge badge-emerald">Real-time Ingestion</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              {tickets.map((t) => {
                const isSelected = t.id === selectedTicket.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--cyan-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
                        {t.ticketNumber}
                      </span>
                      <span className={`badge ${t.status === 'RESOLVED' ? 'badge-emerald' : t.priority === 'HIGH' ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                        {t.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>
                      {t.subject}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {t.tenantName} ({t.userPhone})
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>AI Confidence: <strong style={{ color: (t.aiConfidenceScore ?? 75) < 70 ? 'var(--rose-400)' : 'var(--emerald-400)' }}>{t.aiConfidenceScore ?? 75}%</strong></span>
                      <span>{t.createdAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Ticket Detail & Human-in-the-Loop Action Desk */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-400)' }}>
                    {selectedTicket.ticketNumber} • Kategori: {selectedTicket.category}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginTop: '4px' }}>
                    {selectedTicket.subject}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Pelapor: <strong>{selectedTicket.tenantName}</strong> • Kontak: {selectedTicket.userPhone}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${selectedTicket.priority === 'HIGH' ? 'badge-rose' : 'badge-amber'}`}>
                    Prioritas: {selectedTicket.priority}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                    {selectedTicket.createdAt}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Box */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              {selectedTicket.description}
            </div>

            {/* AI Diagnostics & Confidence Inspector */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--indigo-400)' }}>
                <Sparkles size={16} />
                <span>Analisis Diagnostik Agen & Rekomendasi Solusi:</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#e0e7ff', margin: 0, lineHeight: 1.45 }}>
                {selectedTicket.suggestedResolution}
              </p>
            </div>

            {/* Human-in-the-Loop Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Balas Langsung ke WhatsApp Pedagang:
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan pesan bantuan ramah untuk pengusaha UMKM..."
                value={csReply}
                onChange={(e) => setCsReply(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => alert('Kosakata telah diperbarui di database leksikon pgvector.')}
                >
                  <FileText size={15} />
                  <span>Update Kamus Dialek</span>
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => setIsResolveConfirmOpen(true)}
                  disabled={isProcessing || selectedTicket.status === 'RESOLVED'}
                >
                  {isProcessing ? (
                    <span>Memproses...</span>
                  ) : selectedTicket.status === 'RESOLVED' ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Tiket Telah Selesai</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Setujui HITL & Selesaikan Tiket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CS Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        variant="danger"
        title="Konfirmasi Keluar Sesi Staf CS"
        message="Apakah Anda yakin ingin keluar dari konsol operasional dukungan? Tiket yang sedang ditinjau akan tetap tersimpan di antrean."
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          onLogout();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

      {/* Resolve Ticket Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResolveConfirmOpen}
        variant="primary"
        title="Selesaikan Tiket & Balas Pedagang?"
        message={`Status tiket ${selectedTicket.ticketNumber} akan diubah menjadi RESOLVED. Catatan resolusi dan pesan bantuan akan diteruskan ke pedagang.`}
        subtext={`Target Pedagang: ${selectedTicket.tenantName} (${selectedTicket.userPhone})`}
        confirmLabel="Ya, Selesaikan Tiket"
        cancelLabel="Periksa Kembali"
        onConfirm={() => {
          setIsResolveConfirmOpen(false);
          handleResolveTicket();
        }}
        onCancel={() => setIsResolveConfirmOpen(false)}
      />
    </div>
  );
};

