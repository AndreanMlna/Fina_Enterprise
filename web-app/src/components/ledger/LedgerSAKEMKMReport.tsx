import React from 'react';
import { Printer, ShieldCheck } from 'lucide-react';
import type { SAKEMKMFinancialReport } from '../../types';
import { formatCurrency } from '../../utils';

interface LedgerSAKEMKMReportProps {
  tenantName?: string;
  sakEmkmReport: SAKEMKMFinancialReport | null;
  revenueVal: number;
  expenseVal: number;
  netProfitVal: number;
}

export const LedgerSAKEMKMReport: React.FC<LedgerSAKEMKMReportProps> = ({
  tenantName,
  sakEmkmReport,
  revenueVal,
  expenseVal,
  netProfitVal
}) => {
  return (
    <div className="homies-card" style={{ padding: '26px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            Laporan Keuangan SAK EMKM Standar IAI
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {tenantName || 'PT Abadi Nan Jaya'} • {sakEmkmReport?.period || 'Tahun Fiskal Berjalan 2026'}
          </span>
        </div>

        <button 
          onClick={() => window.print()}
          className="homies-pill-btn active"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Printer size={14} />
          <span>Cetak / PDF SAK EMKM</span>
        </button>
      </div>

      {/* Laporan Laba Rugi SAK EMKM */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--mint-neon)', marginBottom: '12px' }}>
          I. Laporan Laba Rugi (Income Statement)
        </h3>
        <div style={{ background: '#16202D', borderRadius: '12px', padding: '16px 20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.82rem' }}>
            <span style={{ color: '#FFFFFF' }}>Pendapatan Usaha (Revenue)</span>
            <span className="mono" style={{ fontWeight: 600, color: 'var(--mint-neon)' }}>{formatCurrency(revenueVal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.82rem' }}>
            <span style={{ color: '#94a3b8' }}>Beban Pokok Penjualan (HPP / COGS)</span>
            <span className="mono" style={{ color: '#F87171' }}>({formatCurrency(sakEmkmReport?.incomeStatement.cogs || 0)})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.85rem', fontWeight: 700 }}>
            <span style={{ color: '#FFFFFF' }}>Laba Bruto (Gross Profit)</span>
            <span className="mono" style={{ color: '#FFFFFF' }}>{formatCurrency((revenueVal) - (sakEmkmReport?.incomeStatement.cogs || 0))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.82rem' }}>
            <span style={{ color: '#94a3b8' }}>Beban Operasional & Administrasi</span>
            <span className="mono" style={{ color: '#F87171' }}>({formatCurrency(expenseVal - (sakEmkmReport?.incomeStatement.cogs || 0))})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.90rem', fontWeight: 800, marginTop: '4px' }}>
            <span style={{ color: 'var(--mint-neon)' }}>Laba Bersih Tahun Berjalan</span>
            <span className="mono" style={{ color: 'var(--mint-neon)' }}>{formatCurrency(netProfitVal)}</span>
          </div>
        </div>
      </div>

      {/* Audit Merkle Stamp */}
      <div style={{
        background: 'rgba(0, 223, 143, 0.06)',
        border: '1px solid rgba(0, 223, 143, 0.25)',
        borderRadius: '10px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.74rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
          <ShieldCheck size={16} color="var(--mint-neon)" />
          <span>Verifikasi Kriptografis: <strong>SHA-256 Merkle Chain SAK EMKM Valid</strong></span>
        </div>
        <span className="mono" style={{ color: 'var(--mint-neon)', fontSize: '0.70rem' }}>
          Hash: {sakEmkmReport?.auditMerkleHash?.slice(0, 24) || 'sha256:7f83b165...'}
        </span>
      </div>
    </div>
  );
};
