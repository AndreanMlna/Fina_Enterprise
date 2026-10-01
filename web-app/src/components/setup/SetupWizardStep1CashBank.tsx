import React from 'react';
import { Wallet, Building2 } from 'lucide-react';

interface SetupWizardStep1CashBankProps {
  cashOnHand: number;
  setCashOnHand: React.Dispatch<React.SetStateAction<number>>;
  bankBalance: number;
  setBankBalance: React.Dispatch<React.SetStateAction<number>>;
}

export const SetupWizardStep1CashBank: React.FC<SetupWizardStep1CashBankProps> = ({
  cashOnHand,
  setCashOnHand,
  bankBalance,
  setBankBalance
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px'
    }}>
      {/* Kas Tunai */}
      <div className="homies-card-inner" style={{ padding: '18px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Wallet size={16} color="var(--mint-neon)" />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>Kas Tunai</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Uang fisik di kasir / toko</div>
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: '12px' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--mint-neon)',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>Rp</span>
          <input
            type="number"
            min={0}
            value={cashOnHand || ''}
            onChange={(e) => setCashOnHand(Math.max(0, Number(e.target.value)))}
            placeholder="0"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '10px 14px 10px 38px',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
          {[1000000, 2500000, 5000000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setCashOnHand(prev => prev + amt)}
              className="homies-pill-btn"
              style={{ fontSize: '0.70rem', padding: '3px 8px' }}
            >
              +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
            </button>
          ))}
          {cashOnHand > 0 && (
            <button
              type="button"
              onClick={() => setCashOnHand(0)}
              className="homies-pill-btn"
              style={{ fontSize: '0.70rem', padding: '3px 8px', color: '#F87171' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Saldo Bank */}
      <div className="homies-card-inner" style={{ padding: '18px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Building2 size={16} color="#38BDF8" />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>Rekening Bank & E-Wallet</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Saldo rekening usaha (BCA, Mandiri, dll)</div>
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: '12px' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#38BDF8',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>Rp</span>
          <input
            type="number"
            min={0}
            value={bankBalance || ''}
            onChange={(e) => setBankBalance(Math.max(0, Number(e.target.value)))}
            placeholder="0"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '10px 14px 10px 38px',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
          {[5000000, 10000000, 25000000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setBankBalance(prev => prev + amt)}
              className="homies-pill-btn"
              style={{ fontSize: '0.70rem', padding: '3px 8px' }}
            >
              +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
            </button>
          ))}
          {bankBalance > 0 && (
            <button
              type="button"
              onClick={() => setBankBalance(0)}
              className="homies-pill-btn"
              style={{ fontSize: '0.70rem', padding: '3px 8px', color: '#F87171' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
