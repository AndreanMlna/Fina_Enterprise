import React from 'react';
import { CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { InventoryItemPayload } from '../../services/types';
import { formatCurrency } from '../../utils';

interface SetupWizardStep4ConfirmProps {
  openingPayables: number;
  setOpeningPayables: React.Dispatch<React.SetStateAction<number>>;
  cashOnHand: number;
  bankBalance: number;
  inventoryItems: InventoryItemPayload[];
  totalInventory: number;
  totalFixedAssets: number;
  totalAssets: number;
  ownerEquity: number;
  totalLiabilities: number;
  isNeracaBalanced: boolean;
}

export const SetupWizardStep4Confirm: React.FC<SetupWizardStep4ConfirmProps> = ({
  openingPayables,
  setOpeningPayables,
  cashOnHand,
  bankBalance,
  inventoryItems,
  totalInventory,
  totalFixedAssets,
  totalAssets,
  ownerEquity,
  totalLiabilities,
  isNeracaBalanced
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Utang Awal (Opsional) */}
      <div className="homies-card-inner" style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <CreditCard size={15} color="#F87171" />
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>
            Utang Awal (Opsional)
          </span>
        </div>
        <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 8px 0' }}>
          Tagihan ke supplier atau pihak lain yang belum lunas sebelum hari ini.
        </p>
        <div style={{ position: 'relative', maxWidth: '320px' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#F87171',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>Rp</span>
          <input
            type="number"
            min={0}
            value={openingPayables || ''}
            onChange={(e) => setOpeningPayables(Math.max(0, Number(e.target.value)))}
            placeholder="0"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px 8px 38px',
              color: '#FFFFFF',
              fontSize: '0.90rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Neraca Saldo Preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        {/* Kolom ASET */}
        <div className="homies-card-inner" style={{ padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--mint-neon)', marginBottom: '10px' }}>
            ASET (HARTA)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.80rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Kas Tunai</span>
              <span className="mono">{formatCurrency(cashOnHand)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Saldo Bank & E-Wallet</span>
              <span className="mono">{formatCurrency(bankBalance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Persediaan ({inventoryItems.filter(i => i.name).length} barang)</span>
              <span className="mono">{formatCurrency(totalInventory)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Aset & Peralatan</span>
              <span className="mono">{formatCurrency(totalFixedAssets)}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              padding: '10px 12px',
              background: 'rgba(0, 223, 143, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(0, 223, 143, 0.2)',
              fontWeight: 700
            }}>
              <span style={{ color: '#FFFFFF' }}>TOTAL ASET</span>
              <span className="mono" style={{ fontSize: '0.96rem', color: 'var(--mint-neon)' }}>
                {formatCurrency(totalAssets)}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom PASIVA */}
        <div className="homies-card-inner" style={{ padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', marginBottom: '10px' }}>
            KEWAJIBAN & MODAL
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.80rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Utang Awal</span>
              <span className="mono" style={{ color: openingPayables > 0 ? '#F87171' : '#cbd5e1' }}>
                {formatCurrency(openingPayables)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Modal Awal Pemilik</span>
              <span className="mono" style={{ color: ownerEquity > 0 ? 'var(--mint-neon)' : '#F87171', fontWeight: 600 }}>
                {formatCurrency(ownerEquity)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              padding: '10px 12px',
              background: 'rgba(56, 189, 248, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontWeight: 700
            }}>
              <span style={{ color: '#FFFFFF' }}>TOTAL PASIVA</span>
              <span className="mono" style={{ fontSize: '0.96rem', color: '#38BDF8' }}>
                {formatCurrency(totalLiabilities + ownerEquity)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Seimbang */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '8px',
        background: isNeracaBalanced ? 'rgba(0, 223, 143, 0.08)' : 'rgba(239, 68, 68, 0.08)',
        border: `1px solid ${isNeracaBalanced ? 'rgba(0, 223, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
      }}>
        {isNeracaBalanced ? (
          <CheckCircle2 size={16} color="var(--mint-neon)" />
        ) : (
          <AlertTriangle size={16} color="#F87171" />
        )}
        <span style={{ fontSize: '0.78rem', color: isNeracaBalanced ? 'var(--mint-neon)' : '#F87171', fontWeight: 600 }}>
          {isNeracaBalanced 
            ? 'Neraca seimbang: Total Aset sama dengan Total Kewajiban dan Modal.'
            : 'Total aset masih Rp 0 atau modal bernilai negatif.'}
        </span>
      </div>
    </div>
  );
};
