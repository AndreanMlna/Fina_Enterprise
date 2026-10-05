import React, { useState, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  Plus
} from 'lucide-react';
import type { InventoryItemPayload, SetupAIRecommendationResponse, FinishedProductPayload } from '../../../services/types';
import { setupService } from '../../../services/modules/setupService';
import { formatCurrency } from '../../../utils';

interface SetupStep2AIAssistantProps {
  availableCash: number;
  targetMargin: number;
  setTargetMargin: (val: number) => void;
  onApplyRecommendation: (
    items: InventoryItemPayload[],
    replaceExisting: boolean,
    finishedProducts?: FinishedProductPayload[]
  ) => void;
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
  const [activeTab, setActiveTab] = useState<'supplies' | 'pos_catalog'>('pos_catalog');

  const QUICK_PROMPTS = [
    { label: '🍗 Ayam & Lauk Marinasi', prompt: 'Usaha ayam marinasi, ikan marinasi serta aneka lauk marinasi siap masak' },
    { label: '☕ Kedai Kopi & Minuman', prompt: 'Kedai kopi susu kekinian dan teh dingin segar' },
    { label: '🧺 Jasa Laundry', prompt: 'Usaha jasa laundry kiloan dan setrika uap rapi' },
    { label: '🛒 Toko Sembako', prompt: 'Toko sembako dan kelontong kebutuhan harian warga' },
    { label: '🍜 Warmindo / Kuliner', prompt: 'Warung makan warmindo mie instan, telur, dan lauk santap' },
  ];

  const handleAskAI = async (queryText?: string) => {
    const textToQuery = queryText || aiPrompt;
    if (!textToQuery.trim()) {
      setAiError('Ketik jenis usaha atau klik salah satu rekomendasi cepat di atas.');
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
      // Default langsung sorot katalog produk jualan POS agar user langsung melihat menu jualan kasirnya
      setActiveTab('pos_catalog');
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

    onApplyRecommendation(mappedItems, replaceExisting, aiResult.finished_products || aiResult.saleable_products);
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
            border: '1px solid rgba(0, 223, 143, 0.25)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Header Ringkasan & Tombol Aksi */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {cleanSummary || 'Rekomendasi Usaha Terintegrasi'}
                </span>
                {aiResult.business_model && (
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}
                  >
                    {aiResult.business_model === 'PROCESSED_GOODS' ? 'PRODUK OLAHAN / KULINER' : aiResult.business_model === 'SERVICE' ? 'JASA LAYANAN' : 'DAGANG / RITEL'}
                  </span>
                )}
              </div>
              {aiResult.advice && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', lineHeight: 1.35 }}>
                  {aiResult.advice}
                </div>
              )}
            </div>

            {/* Tombol Terapkan */}
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
                <PackageCheck size={13} /> Terapkan ke Usaha & POS
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
                <Plus size={13} /> Gabung
              </button>
            </div>
          </div>

          {/* Tab Selector: Menu Siap Jual di POS vs Belanja Bahan/Alat */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('pos_catalog')}
              style={{
                background: activeTab === 'pos_catalog' ? 'rgba(0, 223, 143, 0.15)' : 'transparent',
                border: activeTab === 'pos_catalog' ? '1px solid var(--mint-neon)' : '1px solid transparent',
                color: activeTab === 'pos_catalog' ? 'var(--mint-neon)' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.73rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              🏷️ Menu Jual di Kasir POS ({(aiResult.finished_products || aiResult.saleable_products || []).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('supplies')}
              style={{
                background: activeTab === 'supplies' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: activeTab === 'supplies' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                color: activeTab === 'supplies' ? '#FFFFFF' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.73rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📦 Belanja Bahan & Alat Modal ({aiResult.recommended_items.length})
            </button>
          </div>

          {/* Konten Tab Aktif */}
          {activeTab === 'pos_catalog' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
                Item di bawah ini yang akan <strong>otomatis terdaftar di fitur POS Kasir</strong> siap dijual ke pelanggan:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                {(aiResult.finished_products || aiResult.saleable_products || []).map((fp, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>{fp.name}</span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '3px' }}>
                        {fp.category}
                      </span>
                    </div>
                    {fp.recipe_summary && (
                      <div style={{ fontSize: '0.67rem', color: '#64748b', fontStyle: 'italic' }}>
                        {fp.recipe_summary}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '0.70rem' }}>
                      <span style={{ color: '#94a3b8' }}>HPP: {formatCurrency(fp.cogs || 0)}</span>
                      <span style={{ color: 'var(--mint-neon)', fontWeight: 700 }}>
                        Jual: {formatCurrency(fp.selling_price)} / {fp.unit || 'Pack'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
                Daftar bahan baku, wadah kemasan, dan perlengkapan untuk <strong>mengurangi saldo modal kas awal</strong>:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px' }}>
                {aiResult.recommended_items.map((it, iIdx) => (
                  <div
                    key={iIdx}
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.72rem'
                    }}
                  >
                    <div>
                      <div style={{ color: '#FFFFFF', fontWeight: 500 }}>{it.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{it.category} • {it.quantity} {it.unit}</div>
                    </div>
                    <div style={{ color: '#FCD34D', fontWeight: 600 }}>
                      {formatCurrency((it.unit_cost || it.estimated_unit_cost || 0) * (it.quantity || 1))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary Breakdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              fontSize: '0.72rem',
              color: '#94a3b8',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div>
              Total Modal Belanja: <strong className="mono" style={{ color: '#FCD34D' }}>{formatCurrency(aiResult.total_estimated_budget)}</strong>
            </div>
            <div style={{ color: '#64748b' }}>•</div>
            <div>
              Potensi Omzet Menu Kasir: <strong className="mono" style={{ color: '#38BDF8' }}>{formatCurrency(aiResult.total_potential_revenue)}</strong>
            </div>
            <div style={{ color: '#64748b' }}>•</div>
            <div>
              Target Margin: <strong className="mono" style={{ color: 'var(--mint-neon)' }}>+{aiResult.average_margin_percent}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
