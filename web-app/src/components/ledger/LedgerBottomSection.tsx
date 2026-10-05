import React from 'react';
import type { DoubleEntryVoucher } from '../../types';
import { formatCurrency } from '../../utils';

export interface TaxSummaryData {
  omzet: number;
  totalTax: number;
  paidTax: number;
  pendingTax: number;
  status: string;
}

export interface CostCompItem {
  dep: string;
  val: string;
  h: number;
}

interface LedgerBottomSectionProps {
  cashFlowYear: string;
  selectedYear: string;
  liveCash: number;
  dbGaji: number;
  dbCogs: number;
  dbSewa: number;
  dbPajakPP55: number;
  dbKemasan: number;
  dbTotalExpenses: number;
  vouchers: DoubleEntryVoucher[];
  onViewAllJournals: () => void;
  taxPeriod: string;
  onTaxPeriodChange: (period: string) => void;
  computedTaxSummary: TaxSummaryData;
  costCompPeriod: string;
  onCostCompPeriodChange: (period: string) => void;
  computedCostComp: CostCompItem[];
}

export const LedgerBottomSection: React.FC<LedgerBottomSectionProps> = ({
  cashFlowYear,
  selectedYear,
  liveCash,
  dbGaji,
  dbCogs,
  dbSewa,
  dbPajakPP55,
  dbKemasan,
  dbTotalExpenses,
  vouchers,
  onViewAllJournals,
  taxPeriod,
  onTaxPeriodChange,
  computedTaxSummary,
  costCompPeriod,
  onCostCompPeriodChange,
  computedCostComp
}) => {
  // Helper pencegah pembagian dengan nol (Anti-NaN% Guard)
  const calcExpensePct = (amount: number): { pct: string; track: number } => {
    if (selectedYear === '2025' || dbTotalExpenses <= 0 || amount <= 0) {
      return { pct: '0%', track: 0 };
    }
    const ratio = Math.round((amount / dbTotalExpenses) * 100);
    return { pct: `${ratio}%`, track: Math.min(ratio, 100) };
  };

  return (
    <>
      {/* Third Row: Payroll Spending, Budget Allocation, Recent Transactions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 4: Payroll Spending Bar Chart */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Alokasi Gaji & Upah</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {cashFlowYear === '2025'
                ? 'Tidak ada data 2025'
                : (dbGaji === 0
                    ? 'Rp 0 Jt/bln (Belum ada beban gaji)'
                    : `Rata-rata Rp ${(dbGaji / 8 / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt/bln`)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flex: 1, height: '130px', gap: '6px' }}>
            {[
              { m: 'Jan', h: 45 }, { m: 'Feb', h: 55 }, { m: 'Mar', h: 50 }, { m: 'Apr', h: 55 },
              { m: 'May', h: 60 }, { m: 'Jun', h: 65 }, { m: 'Jul', h: 60 }, { m: 'Aug', h: 70 },
              { m: 'Sep', h: 85 }, { m: 'Oct', h: 35 }, { m: 'Nov', h: 35 }, { m: 'Dec', h: 35 }
            ].map((col) => {
              const isCurrentMonth = col.m === 'Sep' && cashFlowYear === '2026';
              const isFutureMonth = ['Oct', 'Nov', 'Dec'].includes(col.m) && cashFlowYear === '2026';
              const heightVal = (cashFlowYear === '2025' || dbGaji === 0) ? 4 : col.h;
              return (
                <div key={col.m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{
                      width: '100%',
                      maxWidth: '18px',
                      height: `${Math.max(heightVal, 4)}%`,
                      background: dbGaji === 0
                        ? 'rgba(255, 255, 255, 0.08)'
                        : (isCurrentMonth ? 'var(--mint-neon)' : (isFutureMonth ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 223, 143, 0.6)')),
                      borderRadius: '4px 4px 0 0',
                      boxShadow: (isCurrentMonth && dbGaji > 0) ? '0 0 10px var(--mint-glow)' : 'none',
                      transition: 'height 0.3s ease'
                    }} />
                  </div>
                  <span style={{ 
                    fontSize: '0.62rem', 
                    color: (isCurrentMonth && dbGaji > 0) ? 'var(--mint-neon)' : '#64748B',
                    fontWeight: (isCurrentMonth && dbGaji > 0) ? 700 : 400,
                    marginTop: '8px'
                  }}>
                    {col.m}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 5: Budget Allocation */}
        <div className="homies-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Alokasi Anggaran Usaha</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--mint-neon)', fontWeight: 600 }}>Tahun {selectedYear}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              {
                title: 'HPP & Pasokan',
                amount: selectedYear === '2025' ? 'Rp 0' : formatCurrency(dbCogs),
                pct: calcExpensePct(dbCogs).pct,
                track: calcExpensePct(dbCogs).track
              },
              {
                title: 'Cadangan Kas',
                amount: selectedYear === '2025' ? 'Rp 0' : formatCurrency(liveCash),
                pct: selectedYear === '2025' ? '0%' : (liveCash > 0 ? (dbTotalExpenses > 0 ? `${Math.round((liveCash / (liveCash + dbTotalExpenses)) * 100)}%` : '100% Likuid') : '0%'),
                track: selectedYear === '2025' ? 0 : (liveCash > 0 ? (dbTotalExpenses > 0 ? Math.min(100, Math.round((liveCash / (liveCash + dbTotalExpenses)) * 100)) : 100) : 0)
              },
              {
                title: 'Gaji Karyawan',
                amount: selectedYear === '2025' ? 'Rp 0' : formatCurrency(dbGaji),
                pct: calcExpensePct(dbGaji).pct,
                track: calcExpensePct(dbGaji).track
              },
              {
                title: 'Sewa & Toko',
                amount: selectedYear === '2025' ? 'Rp 0' : formatCurrency(dbSewa),
                pct: calcExpensePct(dbSewa).pct,
                track: calcExpensePct(dbSewa).track
              },
              {
                title: 'Pajak PP 55',
                amount: selectedYear === '2025' ? 'Rp 0' : formatCurrency(dbPajakPP55),
                pct: selectedYear === '2025' ? '0%' : (dbPajakPP55 > 0 ? '0.5%' : '0%'),
                track: selectedYear === '2025' ? 0 : (dbPajakPP55 > 0 ? 5 : 0)
              },
              {
                title: 'Operasional',
                amount: selectedYear === '2025' ? 'Rp 0' : formatCurrency(dbKemasan),
                pct: calcExpensePct(dbKemasan).pct,
                track: calcExpensePct(dbKemasan).track
              }
            ].map((b) => (
              <div key={b.title}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>
                  <span>{b.title}</span>
                  <span>{b.pct}</span>
                </div>
                <div className="mono" style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                  {b.amount}
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', height: '4px', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${b.track}%`, height: '100%', background: 'var(--mint-neon)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Recent Transactions */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Transaksi & Jurnal Terkini</span>
            <span 
              onClick={onViewAllJournals}
              style={{ fontSize: '0.74rem', color: 'var(--mint-neon)', cursor: 'pointer', fontWeight: 600 }}
            >
              Lihat Semua ({vouchers.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vouchers.length > 0 ? (
              vouchers.slice(0, 5).map(v => {
                const descLower = v.description.toLowerCase();
                const isEquity = descLower.includes('saldo awal') || descLower.includes('modal') || v.creditAccount.includes('Modal') || v.creditAccount.includes('3101');
                const isExp = !isEquity && (v.creditAccount.includes('Kas') || descLower.includes('bayar') || descLower.includes('beli') || descLower.includes('beban'));
                
                let typeLabel = 'Income';
                let badgeBg = 'rgba(0, 223, 143, 0.1)';
                let badgeColor = 'var(--mint-neon)';
                let sign = '+';

                if (isEquity) {
                  typeLabel = 'Modal';
                  badgeBg = 'rgba(56, 189, 248, 0.1)';
                  badgeColor = '#38BDF8';
                  sign = '+';
                } else if (isExp) {
                  typeLabel = 'Expense';
                  badgeBg = 'rgba(248, 113, 113, 0.1)';
                  badgeColor = '#F87171';
                  sign = '-';
                }

                return {
                  id: v.id,
                  date: v.date ? new Date(v.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Hari ini',
                  desc: v.description,
                  type: typeLabel,
                  badgeBg,
                  badgeColor,
                  amount: `${sign}${formatCurrency(v.amount)}`,
                  status: v.reconciled ? 'Verified' : 'Pending'
                };
              }).map((trx, idx) => (
                <div key={trx.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: idx < 4 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                  fontSize: '0.75rem'
                }}>
                  <span style={{ color: '#64748B', width: '55px', fontSize: '0.70rem' }}>{trx.date}</span>
                  <span style={{ color: '#FFFFFF', flex: 1, padding: '0 8px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={trx.desc}>{trx.desc}</span>
                  <span style={{
                    color: trx.badgeColor,
                    fontSize: '0.70rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: trx.badgeBg,
                    marginRight: '8px'
                  }}>
                    {trx.type}
                  </span>
                  <span className="mono" style={{ color: '#FFFFFF', fontWeight: 600, width: '100px', textAlign: 'right' }}>
                    {trx.amount}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748B', fontSize: '0.82rem' }}>
                Belum ada transaksi atau jurnal yang tercatat.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Tax Summary + Department Spending Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 7: Tax Summary */}
        <div className="homies-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Ringkasan Pajak UMKM (PP 55)</span>
            <select 
              className="homies-select"
              value={taxPeriod}
              onChange={(e) => onTaxPeriodChange(e.target.value)}
            >
              <option value="2026" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Tahun 2026</option>
              <option value="THIS_MONTH" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Bulan Ini</option>
              <option value="LAST_MONTH" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Bulan Lalu</option>
              <option value="2025" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Tahun 2025</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Total Kewajiban Pajak PP 55 (0,5%)</span>
              <span className="mono" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.90rem' }}>{formatCurrency(computedTaxSummary.totalTax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Pajak Disetor (e-Billing DJP)</span>
              <span className="mono" style={{ color: 'var(--mint-neon)', fontWeight: 700, fontSize: '0.90rem' }}>{formatCurrency(computedTaxSummary.paidTax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Sisa Estimasi Pajak Terutang</span>
              <span className="mono" style={{ color: '#FBBF24', fontWeight: 700, fontSize: '0.90rem' }}>{formatCurrency(computedTaxSummary.pendingTax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Status & Tarif Efektif SAK EMKM</span>
              <span className="mono" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.90rem' }}>0.5% ({computedTaxSummary.status})</span>
            </div>
          </div>
        </div>

        {/* Card 8: Department Spending Comparison Bar Chart */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Perbandingan Komposisi Biaya</span>
            <select 
              className="homies-select"
              value={costCompPeriod}
              onChange={(e) => onCostCompPeriodChange(e.target.value)}
            >
              <option value="2026" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Tahun 2026</option>
              <option value="THIS_MONTH" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Bulan Ini</option>
              <option value="LAST_MONTH" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Bulan Lalu</option>
              <option value="2025" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Tahun 2025</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flex: 1, height: '140px', gap: '12px' }}>
            {computedCostComp.map((c) => (
              <div key={c.dep} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' }}>
                <span className="mono" style={{ fontSize: '0.64rem', color: '#94a3b8', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                  {c.val}
                </span>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '28px',
                    height: `${c.h}%`,
                    background: 'var(--mint-neon)',
                    borderRadius: '6px 6px 0 0',
                    boxShadow: '0 0 10px var(--mint-glow)',
                    transition: 'height 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '0.62rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '48px', marginTop: '6px' }}>
                  {c.dep}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
