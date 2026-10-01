import React from 'react';
import { Coins, Receipt, TrendingUp, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils';

export interface LedgerStatsData {
  revenue: number;
  expense: number;
  netProfit: number;
  pendingInvoices: number;
  pendingCount: number;
  badgeRev: string;
  badgeExp: string;
  badgeNet: string;
  isCurrent: boolean;
}

interface LedgerStatsRowProps {
  computedStats: LedgerStatsData;
  selectedMonth: string;
  selectedYear: string;
}

export const LedgerStatsRow: React.FC<LedgerStatsRowProps> = ({
  computedStats,
  selectedMonth,
  selectedYear
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px'
    }}>
      {/* Stat 1: Total Revenue */}
      <div className="homies-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(0, 223, 143, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mint-neon)',
            flexShrink: 0
          }}>
            <Coins size={20} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {formatCurrency(computedStats.revenue)}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
              Total Revenue {selectedMonth !== 'ALL' ? `(${selectedMonth}/${selectedYear})` : `(${selectedYear})`}
            </div>
            <div className={computedStats.isCurrent ? "homies-badge-up" : "homies-badge-down"} style={{ marginTop: '6px' }}>
              {computedStats.badgeRev}
            </div>
          </div>
        </div>
      </div>

      {/* Stat 2: Monthly Expenses */}
      <div className="homies-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F87171',
            flexShrink: 0
          }}>
            <Receipt size={20} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {formatCurrency(computedStats.expense)}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
              {selectedMonth !== 'ALL' ? 'Period Expenses' : 'Monthly Expenses'}
            </div>
            <div className="homies-badge-down" style={{ marginTop: '6px' }}>
              {computedStats.badgeExp}
            </div>
          </div>
        </div>
      </div>

      {/* Stat 3: Net Profit */}
      <div className="homies-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(0, 223, 143, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mint-neon)',
            flexShrink: 0
          }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {formatCurrency(computedStats.netProfit)}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
              Net Profit
            </div>
            <div className="homies-badge-up" style={{ marginTop: '6px' }}>
              {computedStats.badgeNet}
            </div>
          </div>
        </div>
      </div>

      {/* Stat 4: Pending Invoices */}
      <div className="homies-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FBBF24',
            flexShrink: 0
          }}>
            <FileText size={20} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {formatCurrency(computedStats.pendingInvoices)}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
              Pending Invoices
            </div>
            <div style={{ fontSize: '0.70rem', color: '#FBBF24', marginTop: '6px', fontWeight: 600 }}>
              {computedStats.pendingCount} Faktur Menunggu Pembayaran
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
