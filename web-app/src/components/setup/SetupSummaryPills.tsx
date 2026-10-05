import React from 'react';
import { Wallet, Package, Wrench, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils';

interface SetupSummaryPillsProps {
  cashOnHand: number;
  bankBalance: number;
  totalInventory: number;
  totalFixedAssets: number;
  ownerEquity: number;
}

export const SetupSummaryPills: React.FC<SetupSummaryPillsProps> = ({
  cashOnHand,
  bankBalance,
  totalInventory,
  totalFixedAssets,
  ownerEquity
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px'
    }}>
      {/* Kas & Bank */}
      <div className="homies-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(0, 223, 143, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mint-neon)',
          flexShrink: 0
        }}>
          <Wallet size={17} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
            {formatCurrency(cashOnHand + bankBalance)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            Kas & Bank
          </div>
        </div>
      </div>

      {/* Persediaan */}
      <div className="homies-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38BDF8',
          flexShrink: 0
        }}>
          <Package size={17} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
            {formatCurrency(totalInventory)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            Bahan & Alat Usaha
          </div>
        </div>
      </div>

      {/* Aset Tetap */}
      <div className="homies-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(251, 191, 36, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FBBF24',
          flexShrink: 0
        }}>
          <Wrench size={17} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
            {formatCurrency(totalFixedAssets)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            Aset & Peralatan
          </div>
        </div>
      </div>

      {/* Modal Awal */}
      <div className="homies-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: ownerEquity > 0 ? 'rgba(0, 223, 143, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: ownerEquity > 0 ? 'var(--mint-neon)' : '#F87171',
          flexShrink: 0
        }}>
          <CheckCircle2 size={17} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: ownerEquity > 0 ? 'var(--mint-neon)' : '#F87171', lineHeight: 1.1 }}>
            {formatCurrency(ownerEquity)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            Total Modal Awal
          </div>
        </div>
      </div>
    </div>
  );
};
