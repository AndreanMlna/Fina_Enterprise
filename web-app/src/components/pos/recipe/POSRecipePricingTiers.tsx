import React from 'react';
import type { DynamicPricingAnalysis } from '../../../services/types';
import { formatCurrency } from '../../../utils';

interface POSRecipePricingTiersProps {
  analysis: DynamicPricingAnalysis;
  isApplyingPrice: boolean;
  onApplyPrice: (price: number) => void;
}

export const POSRecipePricingTiers: React.FC<POSRecipePricingTiersProps> = ({
  analysis,
  isApplyingPrice,
  onApplyPrice
}) => {
  return (
    <>
      {/* Status Hero Card */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: analysis.is_at_loss
            ? analysis.margin_status === 'CRITICAL_LOSS'
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(245, 158, 11, 0.15)'
            : 'rgba(16, 185, 129, 0.12)',
          border: `1px solid ${
            analysis.is_at_loss
              ? analysis.margin_status === 'CRITICAL_LOSS'
                ? 'rgba(239, 68, 68, 0.5)'
                : 'rgba(245, 158, 11, 0.5)'
              : 'rgba(16, 185, 129, 0.4)'
          }`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '20px',
                background: analysis.is_at_loss ? '#EF4444' : '#10B981',
                color: '#FFFFFF'
              }}
            >
              {analysis.margin_label}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
              Margin Saat Ini: <strong>{analysis.current_margin_percent}%</strong>
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#F1F5F9', fontWeight: 500 }}>
            {analysis.ai_insights.ai_executive_summary}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>HPP Riil Terkini</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
            {formatCurrency(analysis.total_unit_cost_hpp)}
          </span>
        </div>
      </div>

      {/* 4 Pricing Tiers */}
      <div>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#F8FAFC', fontWeight: 600 }}>
          Pilihan Skenario Harga Jual AI (Anti-Rugi)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {/* Tier 1: BEP */}
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Titik Impas (BEP)</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#E2E8F0', marginTop: '4px' }}>
                {formatCurrency(analysis.pricing_tiers.bep_break_even.price)}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                Margin 0% (HPP + Pajak)
              </span>
            </div>
          </div>

          {/* Tier 2: Safe Floor 20% */}
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: '#FBBF24', fontWeight: 600 }}>Batas Bawah Aman</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FDE68A', marginTop: '4px' }}>
                {formatCurrency(analysis.pricing_tiers.safe_floor_minimum.price)}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#F59E0B', display: 'block', marginTop: '2px' }}>
                Margin Minimal 20%
              </span>
            </div>
            <button
              type="button"
              onClick={() => onApplyPrice(analysis.pricing_tiers.safe_floor_minimum.price)}
              disabled={isApplyingPrice}
              style={{
                marginTop: '8px',
                padding: '4px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#FDE68A',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Pilih Harga
            </button>
          </div>

          {/* Tier 3: Optimal Recommended (Highlight) */}
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 223, 143, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
              border: '1.5px solid var(--mint-neon)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 0 15px rgba(0, 223, 143, 0.15)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--mint-neon)', fontWeight: 700 }}>REKOMENDASI AI</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
                {formatCurrency(analysis.pricing_tiers.optimal_recommended.price)}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#86EFAC', display: 'block', marginTop: '2px' }}>
                Margin Sehat {analysis.pricing_tiers.optimal_recommended.margin_percent}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => onApplyPrice(analysis.pricing_tiers.optimal_recommended.price)}
              disabled={isApplyingPrice}
              style={{
                marginTop: '8px',
                padding: '6px',
                borderRadius: '6px',
                background: 'var(--mint-neon)',
                color: '#0B1118',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✨ Terapkan ke POS
            </button>
          </div>

          {/* Tier 4: Premium */}
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: '#C084FC', fontWeight: 600 }}>Ritel Premium</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#E9D5FF', marginTop: '4px' }}>
                {formatCurrency(analysis.pricing_tiers.premium_retail.price)}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#A855F7', display: 'block', marginTop: '2px' }}>
                Margin 55%
              </span>
            </div>
            <button
              type="button"
              onClick={() => onApplyPrice(analysis.pricing_tiers.premium_retail.price)}
              disabled={isApplyingPrice}
              style={{
                marginTop: '8px',
                padding: '4px',
                borderRadius: '6px',
                background: 'rgba(168, 85, 247, 0.2)',
                color: '#E9D5FF',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Pilih Harga
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
