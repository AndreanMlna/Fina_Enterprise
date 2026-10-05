import React from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils';

interface SetupStep2FooterSummaryProps {
  onAddItem: () => void;
  financialStats: {
    totalCost: number;
    materialRevenue: number;
    materialGrossProfit: number;
    materialMargin: number;
  };
}

export const SetupStep2FooterSummary: React.FC<SetupStep2FooterSummaryProps> = ({
  onAddItem,
  financialStats
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <button
        type="button"
        onClick={onAddItem}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 12px',
          background: 'rgba(0, 223, 143, 0.08)',
          border: '1px dashed rgba(0, 223, 143, 0.35)',
          borderRadius: '6px',
          color: 'var(--mint-neon)',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <Plus size={14} /> Tambah Item Manual
      </button>

      {financialStats.totalCost > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            fontSize: '0.78rem',
            color: '#94a3b8'
          }}
        >
          <div>
            Total Belanja: <strong className="mono" style={{ color: '#FFFFFF', marginLeft: '4px' }}>{formatCurrency(financialStats.totalCost)}</strong>
          </div>

          {financialStats.materialRevenue > 0 && (
            <>
              <div style={{ color: '#64748b' }}>•</div>
              <div>
                Potensi Omzet: <strong className="mono" style={{ color: '#38BDF8', marginLeft: '4px' }}>{formatCurrency(financialStats.materialRevenue)}</strong>
              </div>
              <div style={{ color: '#64748b' }}>•</div>
              <div>
                Proyeksi Laba Bahan: <strong className="mono" style={{ color: 'var(--mint-neon)', marginLeft: '4px' }}>+{formatCurrency(financialStats.materialGrossProfit)} ({financialStats.materialMargin}%)</strong>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
