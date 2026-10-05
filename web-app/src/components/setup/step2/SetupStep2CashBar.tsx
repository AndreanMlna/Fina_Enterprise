import React from 'react';
import { Coins } from 'lucide-react';
import { formatCurrency } from '../../../utils';

interface SetupStep2CashBarProps {
  availableCash: number;
  totalInventory: number;
  remainingCash: number;
  isOverBudget: boolean;
  deductFromCash?: boolean;
  setDeductFromCash?: (val: boolean) => void;
}

export const SetupStep2CashBar: React.FC<SetupStep2CashBarProps> = ({
  availableCash,
  totalInventory,
  remainingCash,
  isOverBudget,
  deductFromCash = true,
  setDeductFromCash
}) => {
  if (availableCash <= 0) return null;

  return (
    <div
      style={{
        background: isOverBudget ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 223, 143, 0.04)',
        border: isOverBudget ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(0, 223, 143, 0.15)',
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      {/* Sisi Kiri: Switch Alokasi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: isOverBudget ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 223, 143, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isOverBudget ? '#F87171' : 'var(--mint-neon)'
          }}
        >
          <Coins size={15} />
        </div>

        {setDeductFromCash ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={deductFromCash}
              onChange={(e) => setDeductFromCash(e.target.checked)}
              style={{ accentColor: 'var(--mint-neon)', width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
              Potong dari Kas Modal Awal
            </span>
          </label>
        ) : (
          <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
            Alokasi Kas Modal
          </span>
        )}
      </div>

      {/* Sisi Kanan: Metrics Ringkas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem' }}>
        <div style={{ color: '#94a3b8' }}>
          Modal: <strong className="mono" style={{ color: '#FFFFFF' }}>{formatCurrency(availableCash)}</strong>
        </div>
        <div style={{ color: '#64748b' }}>•</div>
        <div style={{ color: '#94a3b8' }}>
          Belanja: <strong className="mono" style={{ color: isOverBudget ? '#F87171' : '#38BDF8' }}>{formatCurrency(totalInventory)}</strong>
        </div>
        <div style={{ color: '#64748b' }}>•</div>
        <div style={{ color: '#94a3b8' }}>
          Sisa Kas: <strong className="mono" style={{ color: isOverBudget ? '#F87171' : 'var(--mint-neon)' }}>{formatCurrency(Math.max(0, remainingCash))}</strong>
        </div>
      </div>
    </div>
  );
};
