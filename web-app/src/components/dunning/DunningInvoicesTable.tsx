import React from 'react';
import { Loader2, ShieldCheck, Scan } from 'lucide-react';
import type { ARDunningInvoice } from '../../types';
import { formatCurrency, maskCustomerName, maskPhone } from '../../utils';

interface DunningInvoicesTableProps {
  invoices: ARDunningInvoice[];
  selectedInvoice: ARDunningInvoice | null;
  onSelectInvoice: (inv: ARDunningInvoice) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onCreateInvoiceClick: () => void;
  onOpenVerifyModal: (inv: ARDunningInvoice) => void;
  isPiiMasked: boolean;
}

export const DunningInvoicesTable: React.FC<DunningInvoicesTableProps> = ({
  invoices,
  selectedInvoice,
  onSelectInvoice,
  isLoading,
  errorMessage,
  onRetry,
  onCreateInvoiceClick,
  onOpenVerifyModal,
  isPiiMasked
}) => {
  const maskCustomer = (name: string) => maskCustomerName(name, isPiiMasked);
  const maskPhoneNumber = (phone: string) => maskPhone(phone, isPiiMasked);

  return (
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
          <button className="btn btn-sm btn-primary" onClick={onRetry}>Muat Ulang</button>
        </div>
      ) : invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          <ShieldCheck size={40} style={{ opacity: 0.4, margin: '0 auto 8px auto', display: 'block', color: 'var(--emerald-400)' }} />
          <p style={{ fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>Tidak Ada Piutang Tertunggak</p>
          <p style={{ fontSize: '0.8rem', margin: '0 0 12px 0' }}>Semua tagihan pelanggan berada dalam status lunas atau belum ada invoice diterbitkan.</p>
          <button className="btn btn-sm btn-outline" onClick={onCreateInvoiceClick}>
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
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
                const isPaid = inv.status === 'PAID';
                return (
                  <tr 
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
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
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenVerifyModal(inv);
                          }}
                          className="btn btn-sm btn-primary"
                          style={{
                            fontSize: '0.68rem',
                            padding: '4px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'linear-gradient(135deg, var(--mint-neon), var(--cyan-600))',
                            color: '#000000',
                            fontWeight: 700
                          }}
                          title="Unggah dan verifikasi bukti transfer m-Banking dengan AI Vision"
                        >
                          <Scan size={12} />
                          <span>Cek Bukti</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.70rem', color: 'var(--emerald-400)', fontWeight: 600 }}>
                          ✓ Selesai
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
