import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import type { DynamicPricingAnalysis } from '../../../services/types';

interface POSRecipeAIInsightsProps {
  analysis: DynamicPricingAnalysis;
}

export const POSRecipeAIInsights: React.FC<POSRecipeAIInsightsProps> = ({ analysis }) => {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={16} color="#818CF8" />
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#C7D2FE' }}>
          Justifikasi Finansial & Solusi AI ({analysis.engine})
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '0.8rem', color: '#CBD5E1', lineHeight: '1.45' }}>
        {analysis.ai_insights.ai_financial_rationale}
      </p>

      <div
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px dashed rgba(99, 102, 241, 0.3)',
          fontSize: '0.78rem',
          color: '#E0E7FF'
        }}
      >
        <strong>Analisis Komponen Biaya Terbesar:</strong> {analysis.ai_insights.cost_driver_analysis}
      </div>

      {Array.isArray(analysis.ai_insights.strategic_actions) && (
        <div>
          <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Langkah Taktis Perlindungan Kas UMKM:
          </span>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.78rem', color: '#CBD5E1' }}>
            {analysis.ai_insights.strategic_actions.map((act, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>
                {act}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ fontSize: '0.74rem', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Info size={14} />
        <span>
          <strong>Mitigasi Inflasi Restock:</strong> {analysis.ai_insights.inflation_resilience_tip}
        </span>
      </div>
    </div>
  );
};
