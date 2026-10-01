import React from 'react';
import { formatCurrency } from '../../utils';

export interface ExpenseBreakdownItem {
  name: string;
  amount: string;
  pct: string;
  width: number;
}

export interface CategoryDonutData {
  slices: Array<{ stroke: string; dasharray: string; offset: string }>;
  legends: Array<{ label: string; pct: string; color: string }>;
}

export interface CashFlowData {
  balance: number;
  balanceLabel: string;
  pathD: string;
  status: string;
}

interface LedgerBreakdownGridProps {
  expensePeriod: 'CURRENT_MONTH' | 'LAST_MONTH' | 'YTD';
  onExpensePeriodChange: (period: 'CURRENT_MONTH' | 'LAST_MONTH' | 'YTD') => void;
  computedExpenseBreakdown: ExpenseBreakdownItem[];
  categoryPeriod: 'YTD' | 'CURRENT_MONTH' | 'LAST_MONTH';
  onCategoryPeriodChange: (period: 'YTD' | 'CURRENT_MONTH' | 'LAST_MONTH') => void;
  computedCategoryDonut: CategoryDonutData;
  cashFlowYear: string;
  onCashFlowYearChange: (year: string) => void;
  computedCashFlow: CashFlowData;
}

export const LedgerBreakdownGrid: React.FC<LedgerBreakdownGridProps> = ({
  expensePeriod,
  onExpensePeriodChange,
  computedExpenseBreakdown,
  categoryPeriod,
  onCategoryPeriodChange,
  computedCategoryDonut,
  cashFlowYear,
  onCashFlowYearChange,
  computedCashFlow
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '20px'
    }}>
      {/* Card 1: Salary Expense Breakdown */}
      <div className="homies-card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Beban Operasional & HPP</span>
          <select 
            className="homies-select"
            value={expensePeriod}
            onChange={(e) => onExpensePeriodChange(e.target.value as any)}
          >
            <option value="CURRENT_MONTH" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Bulan Ini</option>
            <option value="LAST_MONTH" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Bulan Lalu</option>
            <option value="YTD" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Tahun Berjalan</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {computedExpenseBreakdown.map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '90px', fontSize: '0.74rem', color: '#94a3b8' }}>
                {item.name}
              </span>
              <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${item.width}%`,
                  height: '100%',
                  background: 'var(--mint-neon)',
                  borderRadius: '9999px',
                  boxShadow: '0 0 8px var(--mint-glow)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span className="mono" style={{ fontSize: '0.74rem', color: '#FFFFFF', width: '75px', textAlign: 'right' }}>
                {item.amount}
              </span>
              <span style={{ fontSize: '0.70rem', color: '#64748B', width: '38px', textAlign: 'right' }}>
                {item.pct}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Expense Categories Donut */}
      <div className="homies-card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Kategori Pengeluaran</span>
          <select 
            className="homies-select"
            value={categoryPeriod}
            onChange={(e) => onCategoryPeriodChange(e.target.value as any)}
          >
            <option value="YTD" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Tahun Berjalan</option>
            <option value="CURRENT_MONTH" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Bulan Ini</option>
            <option value="LAST_MONTH" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Bulan Lalu</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* SVG Donut Ring */}
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              {computedCategoryDonut.slices.map((sl, sIdx) => (
                <circle
                  key={sIdx}
                  cx="65"
                  cy="65"
                  r="48"
                  fill="none"
                  stroke={sl.stroke}
                  strokeWidth="18"
                  strokeDasharray={sl.dasharray}
                  strokeDashoffset={sl.offset}
                  style={{ transition: 'all 0.3s ease' }}
                />
              ))}
            </svg>
          </div>

          {/* Legend Slices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem' }}>
            {computedCategoryDonut.legends.map((leg) => (
              <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: leg.color }} />
                <span style={{ color: '#94a3b8', width: '85px' }}>{leg.label}</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{leg.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: Cash Flow Overview Area Line Curve */}
      <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Cash Flow Overview</span>
          <select 
            className="homies-select"
            value={cashFlowYear}
            onChange={(e) => onCashFlowYearChange(e.target.value)}
          >
            <option value="2026" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Tahun 2026</option>
            <option value="2025" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>Tahun 2025</option>
          </select>
        </div>

        {/* Data Callout Tooltip */}
        <div style={{ alignSelf: 'flex-end', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.68rem', marginBottom: '4px' }}>
          <span style={{ color: '#94a3b8' }}>{computedCashFlow.balanceLabel}</span>
          <strong style={{ color: 'var(--mint-neon)' }}>{formatCurrency(computedCashFlow.balance)}</strong>
        </div>

        {/* Glowing SVG Area Curve */}
        <div style={{ flex: 1, minHeight: '120px', display: 'flex', alignItems: 'flex-end' }}>
          <svg width="100%" height="100" viewBox="0 0 300 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cashflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--mint-neon)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--mint-neon)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={`${computedCashFlow.pathD} L 300 100 L 0 100 Z`}
              fill="url(#cashflowGrad)"
            />
            <path
              d={computedCashFlow.pathD}
              fill="none"
              stroke="var(--mint-neon)"
              strokeWidth="2.5"
              style={{ filter: 'drop-shadow(0 0 6px var(--mint-glow))', transition: 'd 0.3s ease' }}
            />
          </svg>
        </div>

        {/* Month labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.68rem', marginTop: '6px' }}>
          <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
        </div>
      </div>
    </div>
  );
};
