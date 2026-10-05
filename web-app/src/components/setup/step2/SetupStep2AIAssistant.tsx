import React, { useState, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  Plus
} from 'lucide-react';
import type { InventoryItemPayload, SetupAIRecommendationResponse } from '../../../services/types';
import { setupService } from '../../../services/modules/setupService';
import { formatCurrency } from '../../../utils';

interface SetupStep2AIAssistantProps {
  availableCash: number;
  targetMargin: number;
  setTargetMargin: (val: number) => void;
  onApplyRecommendation: (items: InventoryItemPayload[], replaceExisting: boolean) => void;
}

export const SetupStep2AIAssistant: React.FC<SetupStep2AIAssistantProps> = ({
  availableCash,
  targetMargin,
  setTargetMargin,
  onApplyRecommendation
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<SetupAIRecommendationResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const QUICK_PROMPTS = [
    { label: '☕ Kopi & Minuman', prompt: 'Kedai kopi susu kekinian dan teh dingin' },
    { label: '🍜 Warmindo', prompt: 'Warung warmindo mie instan, telur, dan minuman' },
    { label: '🍗 Ayam Geprek', prompt: 'Usaha ayam geprek sambal dan nasi uduk' },
    { label: '🧺 Laundry', prompt: 'Usaha laundry kiloan dan setrika uap' },
    { label: '🛒 Toko Sembako', prompt: 'Toko sembako kebutuhan harian warga' },
  ];

  const handleAskAI = async (queryText?: string) => {
    const textToQuery = queryText || aiPrompt;
    if (!textToQuery.trim()) {
      setAiError('Ketik jenis usaha atau klik salah satu pilihan cepat di atas.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await setupService.getAISuppliesRecommendation({
        query: textToQuery,
        budget_estimate: availableCash > 0 ? availableCash : undefined,
        target_margin: targetMargin,
      });

      setAiResult(res);
    } catch (err: any) {
      setAiError(err.message || 'Gagal memuat rekomendasi. Silakan coba kembali.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApply = (replaceExisting: boolean) => {
    if (!aiResult || !aiResult.recommended_items) return;

    const mappedItems: InventoryItemPayload[] = aiResult.recommended_items.map(item => ({
      name: item.name,
      category: item.category || (item.is_equipment ? 'Peralatan & Mesin' : 'Bahan Baku'),
      quantity: item.quantity || 1,
      unit: item.unit || 'Pcs',
      unit_cost: item.unit_cost || item.estimated_unit_cost || 0,
      selling_price: item.selling_price || item.recommended_selling_price || 0,
    }));

    onApplyRecommendation(mappedItems, replaceExisting);
  };

  const cleanSummary = useMemo(() => {
    if (!aiResult) return '';
    let text = aiResult.business_summary || aiResult.business_type || '';
    text = text.replace(/^hasil rekomendasi:\s*/i, '');
    return text;
  }, [aiResult]);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Header Bar AI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bot size={15} color="var(--mint-neon)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
            AI Generator Kebutuhan Usaha
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
          <span>Target Margin:</span>
          {[30, 40, 50].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTargetMargin(m)}
              style={{
                padding: '2px 7px',
                borderRadius: '4px',
                background: targetMargin === m ? 'rgba(0, 223, 143, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: targetMargin === m ? '1px solid var(--mint-neon)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: targetMargin === m ? 'var(--mint-neon)' : '#94a3b8',
                fontSize: '0.70rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              +{m}%
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Tulis jenis usaha... (contoh: 'Kedai Kopi Susu', 'Ayam Geprek', 'Laundry')"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAskAI();
            }
          }}
          style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#FFFFFF',
            fontSize: '0.80rem',
            outline: 'none'
          }}
        />
        <button
          type="button"
          onClick={() => handleAskAI()}
          disabled={isAiLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00DF8F 0%, #009961 100%)',
            border: 'none',
            color: '#0D1512',
            fontWeight: 700,
            fontSize: '0.80rem',
            cursor: isAiLoading ? 'not-allowed' : 'pointer',
            opacity: isAiLoading ? 0.7 : 1,
            whiteSpace: 'nowrap'
          }}
        >
          {isAiLoading ? (
            <>
              <RefreshCw size={13} className="homies-spin" /> Proses...
            </>
          ) : (
            <>
              <Sparkles size={13} /> Buat Daftar
            </>
          )}
        </button>
      </div>

      {/* Quick Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setAiPrompt(qp.prompt);
              handleAskAI(qp.prompt);
            }}
            className="homies-pill-btn"
            style={{ fontSize: '0.70rem', padding: '3px 8px' }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {aiError && (
        <div style={{ fontSize: '0.74rem', color: '#F87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <AlertCircle size={13} /> {aiError}
        </div>
      )}

      {/* AI Result Card */}
      {aiResult && (
        <div
          style={{
            background: 'rgba(0, 223, 143, 0.03)',
            border: '1px solid rgba(0, 223, 143, 0.2)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF' }}>
                {cleanSummary || 'Rekomendasi Kebutuhan Usaha'}
              </div>
              {aiResult.advice && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
                  {aiResult.advice}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => handleApply(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'var(--mint-neon)',
                  color: '#0D1512',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <PackageCheck size={13} /> Terapkan ({aiResult.recommended_items.length} Item)
              </button>
              <button
                type="button"
                onClick={() => handleApply(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Tambah
              </button>
            </div>
          </div>

          {/* AI Summary Breakdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              fontSize: '0.72rem',
              color: '#94a3b8',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div>
              Taksiran Modal: <strong className="mono" style={{ color: 'var(--mint-neon)' }}>{formatCurrency(aiResult.total_estimated_budget)}</strong>
            </div>
            <div style={{ color: '#64748b' }}>•</div>
            <div>
              Potensi Omzet: <strong className="mono" style={{ color: '#38BDF8' }}>{formatCurrency(aiResult.total_potential_revenue)}</strong>
            </div>
            <div style={{ color: '#64748b' }}>•</div>
            <div>
              Margin Sasaran: <strong className="mono" style={{ color: '#A78BFA' }}>+{aiResult.average_margin_percent}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
