/**
 * FINA-ENTERPRISE: POSRecipeOverheadControl
 * Sub-komponen Kontrol Biaya Overhead, Susut Produksi, dan Live Estimasi HPP
 * Single Responsibility: Pengaturan parameter biaya pelengkap dan penyimpanan resep
 */

import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../../utils';

interface POSRecipeOverheadControlProps {
  overheadCost: number;
  setOverheadCost: (val: number) => void;
  wastagePercent: number;
  setWastagePercent: (val: number) => void;
  targetMargin: number;
  setTargetMargin: (val: number) => void;
  estimatedHpp: number;
  isSavingRecipe: boolean;
  onSaveRecipe: () => void;
}

export const POSRecipeOverheadControl: React.FC<POSRecipeOverheadControlProps> = ({
  overheadCost,
  setOverheadCost,
  wastagePercent,
  setWastagePercent,
  targetMargin,
  setTargetMargin,
  estimatedHpp,
  isSavingRecipe,
  onSaveRecipe
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 3 Input Cards: Overhead, Susut, Margin */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {/* Overhead */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>
            Biaya Overhead / Pcs (Gas/Listrik/Tenaga)
          </span>
          <div style={{ position: 'relative', marginTop: '6px' }}>
            <span style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>Rp</span>
            <input
              type="number"
              min="0"
              value={overheadCost || ''}
              onChange={(e) => setOverheadCost(parseFloat(e.target.value) || 0)}
              placeholder="0"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 10px 6px 34px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Susut / Waste */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>
            Toleransi Susut Bahan / Wastage (%)
          </span>
          <div style={{ position: 'relative', marginTop: '6px' }}>
            <input
              type="number"
              min="0"
              max="90"
              value={wastagePercent || ''}
              onChange={(e) => setWastagePercent(Math.min(90, Math.max(0, parseFloat(e.target.value) || 0)))}
              placeholder="0"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 28px 6px 10px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none'
              }}
            />
            <span style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>%</span>
          </div>
        </div>

        {/* Target Margin Sasaran */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>
            Target Margin Laba Bersih (%)
          </span>
          <div style={{ position: 'relative', marginTop: '6px' }}>
            <input
              type="number"
              min="5"
              max="90"
              value={targetMargin || ''}
              onChange={(e) => setTargetMargin(Math.min(90, Math.max(5, parseFloat(e.target.value) || 35)))}
              placeholder="35"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 28px 6px 10px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none'
              }}
            />
            <span style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>%</span>
          </div>
        </div>
      </div>

      {/* Live Cost Summary Bar & Action */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'linear-gradient(90deg, rgba(0, 223, 143, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid rgba(0, 223, 143, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>Estimasi HPP Riil per Pcs: </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--mint-neon)', marginLeft: '6px' }}>
            {formatCurrency(estimatedHpp)}
          </span>
        </div>

        <button
          type="button"
          onClick={onSaveRecipe}
          disabled={isSavingRecipe}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            background: 'var(--mint-neon)',
            color: '#0B1118',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: isSavingRecipe ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0, 223, 143, 0.25)'
          }}
        >
          {isSavingRecipe ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          <span>Simpan & Analisis Harga AI</span>
        </button>
      </div>
    </div>
  );
};
