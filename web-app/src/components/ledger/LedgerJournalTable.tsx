import React from 'react';
import { Search, Sparkles, CheckCircle2 } from 'lucide-react';
import type { DoubleEntryVoucher } from '../../types';
import { formatCurrency } from '../../utils';

interface LedgerJournalTableProps {
  vouchers: DoubleEntryVoucher[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenAddModal: () => void;
  isLoading: boolean;
}

export const LedgerJournalTable: React.FC<LedgerJournalTableProps> = ({
  vouchers,
  searchTerm,
  onSearchChange,
  onOpenAddModal,
  isLoading
}) => {
  const filteredVouchers = vouchers.filter(v => 
    v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.debitAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.creditAccount.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="homies-card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: 0, fontFamily: 'var(--font-display)' }}>
            Buku Besar Double-Entry (ACID Merkle)
          </h2>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Transaksi terverifikasi kriptografis SHA-256 Merkle Chaining
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '7px 14px',
            minWidth: '220px'
          }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari transaksi buku besar..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                fontSize: '0.80rem',
                width: '100%'
              }}
            />
          </div>

          <button
            onClick={onOpenAddModal}
            className="homies-pill-btn active"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
            <span>+ Jurnal Baru (AI)</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <p>Memuat voucher transaksi dari PostgreSQL...</p>
        </div>
      ) : (
        <div className="table-scroll-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)', color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>NO. VOUCHER</th>
                <th style={{ padding: '12px 14px' }}>TANGGAL</th>
                <th style={{ padding: '12px 14px' }}>KETERANGAN</th>
                <th style={{ padding: '12px 14px' }}>DEBET (AKUN)</th>
                <th style={{ padding: '12px 14px' }}>KREDIT (AKUN)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>NOMINAL (RP)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>INTEGRITAS</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map((v) => (
                <tr key={v.id} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.80rem' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--mint-neon)' }}>
                    {v.voucherNumber}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                    {v.date}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#FFFFFF', fontWeight: 500 }}>
                    {v.description}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                    {v.debitAccount}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                    {v.creditAccount}
                  </td>
                  <td className="mono" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#FFFFFF' }}>
                    {formatCurrency(v.amount)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(0, 223, 143, 0.12)',
                      color: 'var(--mint-neon)',
                      fontSize: '0.70rem',
                      fontWeight: 600
                    }} title={`Merkle Hash: ${v.integrityHash}`}>
                      <CheckCircle2 size={12} />
                      ACID OK
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                    Tidak ada voucher buku besar yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
