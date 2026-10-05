/**
 * FINA-ENTERPRISE: Step 2 — Bahan & Alat Usaha yang Dibutuhkan
 * 
 * Konsep:
 * Bukan sekadar persediaan barang yang sudah ada, melainkan belanja modal awal
 * (bahan-bahan & alat kerja yang dibutuhkan / akan dibeli).
 * 
 * Dilengkapi:
 * 1. AI LLM Recommender Assistant (Google Gemini LLM):
 *    Pengguna dapat bertanya/menyuruh AI menyusun kebutuhan belanja sesuai jenis UMKM dan modal.
 * 2. Kalkulator Harga Jual Anti-Rugi (Break-Even & Safety Margin Calculator):
 *    Menghitung harga jual dinamis, peringatan visual jika rugi/tekor, dan preset margin aman.
 * 3. Alokasi Modal Kas Real-Time:
 *    Simulasi dinamis duit kas modal awal berkurang saat belanja bahan/alat dimasukkan.
 * 
 * Standar: Clean Architecture, SAK EMKM, Dark Glassmorphism Neon Emerald.
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Plus, 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Coins,
  Calculator,
  RefreshCw,
  Wrench,
  PackageCheck
} from 'lucide-react';
import type { InventoryItemPayload, SetupAIRecommendationResponse } from '../../services/types';
import { setupService } from '../../services/modules/setupService';
import { formatCurrency } from '../../utils';

interface SetupWizardStep2InventoryProps {
  inventoryItems: InventoryItemPayload[];
  updateInventoryItem: (index: number, field: keyof InventoryItemPayload, val: any) => void;
  removeInventoryItem: (index: number) => void;
  addInventoryItem: () => void;
  addPresetInventory: (type: 'warung' | 'retail') => void;
  totalInventory: number;
  availableCash?: number;
  deductFromCash?: boolean;
  setDeductFromCash?: (val: boolean) => void;
  onApplyAISupplies?: (items: InventoryItemPayload[]) => void;
}

export const SetupWizardStep2Inventory: React.FC<SetupWizardStep2InventoryProps> = ({
  inventoryItems,
  updateInventoryItem,
  removeInventoryItem,
  addInventoryItem,
  addPresetInventory,
  totalInventory,
  availableCash = 0,
  deductFromCash = true,
  setDeductFromCash,
  onApplyAISupplies,
}) => {
  // State Asisten AI LLM
  const [aiPrompt, setAiPrompt] = useState('');
  const [targetMargin, setTargetMargin] = useState<number>(40);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<SetupAIRecommendationResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Template prompt rekomendasi cepat
  const QUICK_PROMPTS = [
    { label: '☕ Kopi & Minuman Kekinian', prompt: 'Kedai kopi susu kekinian dan minuman teh dingin take-away' },
    { label: '🍜 Warmindo & Kuliner', prompt: 'Warung warmindo indomie, telur, kornet, es teh dan kopi' },
    { label: '🍗 Ayam Geprek / Fried Chicken', prompt: 'Usaha ayam geprek sambal bawang dan nasi uduk' },
    { label: '🧺 Laundry Kiloan', prompt: 'Usaha jasa laundry kiloan dan setrika uap rumahan' },
    { label: '🛒 Toko Sembako & Ritel', prompt: 'Toko kelontong sembako kebutuhan harian warga' },
  ];

  // Request AI LLM Recommendation
  const handleAskAI = async (queryText?: string) => {
    const textToQuery = queryText || aiPrompt;
    if (!textToQuery.trim()) {
      setAiError('Silakan ketik jenis usaha atau klik salah satu pilihan cepat di atas.');
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
      setAiError(err.message || 'Gagal memuat rekomendasi AI. Coba kembali dalam beberapa saat.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Terapkan rekomendasi AI ke tabel
  const applyAIRecommendation = (replaceExisting: boolean) => {
    if (!aiResult || !aiResult.recommended_items) return;

    const mappedItems: InventoryItemPayload[] = aiResult.recommended_items.map(item => ({
      name: item.name,
      category: item.category || (item.is_equipment ? 'Peralatan & Mesin' : 'Bahan Baku'),
      quantity: item.quantity || 1,
      unit: item.unit || 'Pcs',
      unit_cost: item.unit_cost || 0,
      selling_price: item.selling_price || 0,
    }));

    if (onApplyAISupplies) {
      if (replaceExisting) {
        onApplyAISupplies(mappedItems);
      } else {
        onApplyAISupplies([...inventoryItems, ...mappedItems]);
      }
    } else {
      // Fallback update item per baris jika callback belum disambung
      mappedItems.forEach(() => {
        addInventoryItem();
      });
    }
  };

  // Helper kalkulasi margin anti-rugi per item
  const calculateMargin = (cost: number, price: number, category: string) => {
    const isEquipment = category.toLowerCase().includes('peralatan') || category.toLowerCase().includes('mesin');
    if (isEquipment && price === 0) {
      return { status: 'equipment', label: 'Alat Kerja Usaha', percent: 0, profit: 0, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
    }
    if (cost <= 0) {
      return { status: 'neutral', label: 'Belum Ada Biaya', percent: 0, profit: 0, color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.05)' };
    }
    if (price <= 0) {
      return { status: 'unset', label: 'Harga Jual Belum Diisi', percent: 0, profit: 0, color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)' };
    }

    const profit = price - cost;
    const marginPct = Math.round((profit / price) * 100);

    if (profit < 0) {
      return { 
        status: 'loss', 
        label: `🚨 RUGI! Minus ${formatCurrency(Math.abs(profit))}`, 
        percent: marginPct, 
        profit, 
        color: '#F87171', 
        bg: 'rgba(239, 68, 68, 0.18)' 
      };
    }
    if (marginPct < 20) {
      return { 
        status: 'tight', 
        label: `⚠️ Margin Tipis (+${marginPct}%)`, 
        percent: marginPct, 
        profit, 
        color: '#FBBF24', 
        bg: 'rgba(251, 191, 36, 0.15)' 
      };
    }
    if (marginPct < 50) {
      return { 
        status: 'safe', 
        label: `✅ Margin Sehat (+${marginPct}%)`, 
        percent: marginPct, 
        profit, 
        color: 'var(--mint-neon)', 
        bg: 'rgba(0, 223, 143, 0.12)' 
      };
    }
    return { 
      status: 'high', 
      label: `🚀 Margin Tinggi (+${marginPct}%)`, 
      percent: marginPct, 
      profit, 
      color: '#38BDF8', 
      bg: 'rgba(56, 189, 248, 0.15)' 
    };
  };

  // Terapkan margin persentase otomatis untuk semua bahan yang belum ada harga jual
  const applyAutoMarginGlobal = (marginPct: number) => {
    inventoryItems.forEach((item, idx) => {
      const isEquipment = item.category.toLowerCase().includes('peralatan') || item.category.toLowerCase().includes('mesin');
      if (!isEquipment && item.unit_cost > 0) {
        // Formula Anti-Rugi: Harga Jual = Modal / (1 - Margin/100), bulatkan ke ratusan terdekat
        const calculatedPrice = Math.ceil((item.unit_cost / (1 - marginPct / 100)) / 500) * 500;
        updateInventoryItem(idx, 'selling_price', calculatedPrice);
      }
    });
  };

  // Ringkasan Alokasi Modal Kas
  const remainingCash = availableCash - (deductFromCash ? totalInventory : 0);
  const isOverBudget = deductFromCash && totalInventory > availableCash && availableCash > 0;

  // Hitung potensi omzet jika seluruh bahan baku terjual
  const totalPotentialRevenue = inventoryItems.reduce((acc, it) => {
    const isEquipment = it.category.toLowerCase().includes('peralatan') || it.category.toLowerCase().includes('mesin');
    if (!isEquipment && it.selling_price > 0) {
      return acc + (it.quantity * it.selling_price);
    }
    return acc;
  }, 0);

  const potentialGrossProfit = totalPotentialRevenue > totalInventory ? totalPotentialRevenue - totalInventory : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* 1. REAL-TIME CASH ALLOCATION BANNER */}
      {availableCash > 0 && (
        <div style={{
          background: isOverBudget 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(0, 223, 143, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          border: isOverBudget ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 223, 143, 0.25)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isOverBudget ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 223, 143, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isOverBudget ? '#F87171' : 'var(--mint-neon)'
              }}>
                <Coins size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>
                  Alokasi Modal Kas Awal Usaha (Double-Entry SAK EMKM)
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Uang modal kas awal akan berkurang saat Anda membeli bahan & alat usaha ini.
                </div>
              </div>
            </div>

            {/* Metric Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Kas Modal Awal:</div>
                <div className="mono" style={{ fontSize: '0.90rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {formatCurrency(availableCash)}
                </div>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>-</div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Rencana Belanja:</div>
                <div className="mono" style={{ fontSize: '0.90rem', fontWeight: 700, color: isOverBudget ? '#F87171' : '#38BDF8' }}>
                  {formatCurrency(totalInventory)}
                </div>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>=</div>
              <div>
                <div style={{ fontSize: '0.68rem', color: isOverBudget ? '#F87171' : '#94a3b8' }}>
                  {isOverBudget ? 'Defisit Modal Kas:' : 'Sisa Uang Kas di Tangan:'}
                </div>
                <div className="mono" style={{ 
                  fontSize: '0.92rem', 
                  fontWeight: 700, 
                  color: isOverBudget ? '#F87171' : 'var(--mint-neon)' 
                }}>
                  {formatCurrency(Math.abs(remainingCash))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Toggle: Potong langsung dari kas modal */}
          {setDeductFromCash && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.75rem',
              color: '#cbd5e1'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={deductFromCash}
                  onChange={(e) => setDeductFromCash(e.target.checked)}
                  style={{ accentColor: 'var(--mint-neon)', width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <span>
                  <strong>Potong langsung dari Saldo Kas & Bank</strong> (Barang dibeli menggunakan uang modal awal di Step 1)
                </span>
              </label>

              {isOverBudget && (
                <span style={{ color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <AlertCircle size={13} /> Belanja melebihi uang kas tersedia!
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. AI LLM RECOMMENDER ASSISTANT PANEL */}
      <div style={{
        background: 'radial-gradient(ellipse at top left, rgba(0, 223, 143, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
        border: '1px solid rgba(0, 223, 143, 0.25)',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header AI */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 223, 143, 0.3) 0%, rgba(56, 189, 248, 0.3) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mint-neon)'
            }}>
              <Bot size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.90rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Asisten AI Rekomendasi Belanja & Pricing Anti-Rugi
                <span style={{ 
                  fontSize: '0.65rem', 
                  padding: '2px 7px', 
                  borderRadius: '12px', 
                  background: 'rgba(0, 223, 143, 0.15)', 
                  color: 'var(--mint-neon)',
                  fontWeight: 600
                }}>
                  Gemini LLM
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Tanya atau perintahkan AI untuk mengisi barang, bahan baku, dan alat yang dibutuhkan untuk usaha Anda.
              </div>
            </div>
          </div>

          {/* Quick Target Margin Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
            <span>Target Margin:</span>
            {[30, 40, 50].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTargetMargin(m)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: targetMargin === m ? 'rgba(0, 223, 143, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: targetMargin === m ? '1px solid var(--mint-neon)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: targetMargin === m ? 'var(--mint-neon)' : '#cbd5e1',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                +{m}%
              </button>
            ))}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setAiPrompt(qp.prompt);
                handleAskAI(qp.prompt);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--mint-neon)';
                e.currentTarget.style.background = 'rgba(0, 223, 143, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Text Prompt + Tombol Tanya */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Contoh: Saya mau buka warmindo modal 4 juta, apa saja bahan & alat yang wajib dibeli?"
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
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '9px 14px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
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
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00DF8F 0%, #009961 100%)',
              border: 'none',
              color: '#0D1512',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: isAiLoading ? 'not-allowed' : 'pointer',
              opacity: isAiLoading ? 0.7 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {isAiLoading ? (
              <>
                <RefreshCw size={14} className="homies-spin" /> Menganalisis...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Tanya AI LLM
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={14} /> {aiError}
          </div>
        )}

        {/* AI Result Card */}
        {aiResult && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(0, 223, 143, 0.35)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--mint-neon)',
                  letterSpacing: '0.05em'
                }}>
                  Hasil Rekomendasi: {aiResult.business_type}
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {aiResult.advice}
                </p>
              </div>

              {/* Action Buttons: Terapkan */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => applyAIRecommendation(true)}
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
                  <PackageCheck size={14} /> ✨ Terapkan ke Tabel ({aiResult.recommended_items.length} Item)
                </button>
                <button
                  type="button"
                  onClick={() => applyAIRecommendation(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} /> Tambahkan ke Daftar
                </button>
              </div>
            </div>

            {/* AI Summary Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Estimasi Belanja:</div>
                <div className="mono" style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--mint-neon)' }}>
                  {formatCurrency(aiResult.total_estimated_budget)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Potensi Omzet:</div>
                <div className="mono" style={{ fontSize: '0.80rem', fontWeight: 700, color: '#38BDF8' }}>
                  {formatCurrency(aiResult.total_potential_revenue)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Potensi Laba Kotor:</div>
                <div className="mono" style={{ fontSize: '0.80rem', fontWeight: 700, color: '#FBBF24' }}>
                  +{formatCurrency(aiResult.estimated_gross_profit)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Rata-rata Margin:</div>
                <div className="mono" style={{ fontSize: '0.80rem', fontWeight: 700, color: '#A78BFA' }}>
                  +{aiResult.average_margin_percent}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. QUICK ANTI-RUGI PRICING ACTIONS BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px 14px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calculator size={15} color="var(--mint-neon)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
            Kalkulator Margin Anti-Rugi Global:
          </span>
          <span style={{ fontSize: '0.70rem', color: '#64748b' }}>
            (Hitung otomatis harga jual semua bahan baku di atas modal)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => addPresetInventory('warung')}
            className="homies-pill-btn"
            style={{ fontSize: '0.70rem', padding: '4px 9px' }}
          >
            <Sparkles size={11} color="var(--mint-neon)" /> + Preset F&B
          </button>
          <button
            type="button"
            onClick={() => addPresetInventory('retail')}
            className="homies-pill-btn"
            style={{ fontSize: '0.70rem', padding: '4px 9px' }}
          >
            <Sparkles size={11} color="#38BDF8" /> + Preset Retail
          </button>
          <button
            type="button"
            onClick={() => applyAutoMarginGlobal(30)}
            className="homies-pill-btn"
            style={{ fontSize: '0.70rem', padding: '4px 9px' }}
            title="Terapkan harga jual +30% dari harga beli"
          >
            +30% Standar
          </button>
          <button
            type="button"
            onClick={() => applyAutoMarginGlobal(40)}
            className="homies-pill-btn"
            style={{ fontSize: '0.70rem', padding: '4px 9px' }}
            title="Terapkan harga jual +40% dari harga beli"
          >
            +40% Warung & F&B
          </button>
          <button
            type="button"
            onClick={() => applyAutoMarginGlobal(50)}
            className="homies-pill-btn"
            style={{ fontSize: '0.70rem', padding: '4px 9px' }}
            title="Terapkan harga jual +50% dari harga beli"
          >
            +50% Margin Aman
          </button>
          <button
            type="button"
            onClick={() => applyAutoMarginGlobal(70)}
            className="homies-pill-btn"
            style={{ fontSize: '0.70rem', padding: '4px 9px' }}
            title="Terapkan harga jual +70% untuk minuman & snack"
          >
            +70% Minuman
          </button>
        </div>
      </div>

      {/* 4. TABEL DAFTAR BAHAN & ALAT USAHA DENGAN KALKULATOR ANTI-RUGI */}
      <div style={{
        overflowX: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              fontSize: '0.72rem',
              color: '#94a3b8'
            }}>
              <th style={{ padding: '10px 12px' }}>Nama Bahan / Alat</th>
              <th style={{ padding: '10px 12px', width: '140px' }}>Kategori</th>
              <th style={{ padding: '10px 12px', width: '70px' }}>Qty</th>
              <th style={{ padding: '10px 12px', width: '80px' }}>Satuan</th>
              <th style={{ padding: '10px 12px', width: '120px' }}>Harga Beli (Modal)</th>
              <th style={{ padding: '10px 12px', width: '130px' }}>Harga Jual Anti-Rugi</th>
              <th style={{ padding: '10px 12px', width: '160px' }}>Margin & Status</th>
              <th style={{ padding: '10px 12px', width: '120px', textAlign: 'right' }}>Total Modal</th>
              <th style={{ padding: '10px 12px', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Belum ada bahan atau alat usaha yang ditambahkan
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    Gunakan Asisten AI di atas, klik contoh template, atau tambah item manual di bawah.
                  </div>
                </td>
              </tr>
            ) : (
              inventoryItems.map((item, idx) => {
                const marginData = calculateMargin(item.unit_cost, item.selling_price, item.category);
                const isEquipment = item.category.toLowerCase().includes('peralatan') || item.category.toLowerCase().includes('mesin');

                return (
                  <tr key={idx} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {/* Nama */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        placeholder="Nama bahan / alat yang dibutuhkan..."
                        value={item.name}
                        onChange={(e) => updateInventoryItem(idx, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Kategori */}
                    <td style={{ padding: '8px 12px' }}>
                      <select
                        value={item.category}
                        onChange={(e) => updateInventoryItem(idx, 'category', e.target.value)}
                        className="homies-select"
                        style={{ width: '100%', padding: '6px 8px' }}
                      >
                        {['Bahan Baku', 'Peralatan & Mesin', 'Kemasan & Wadah', 'Perlengkapan Usaha', 'Sembako', 'Minuman', 'Makanan', 'Umum'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>

                    {/* Qty */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity || ''}
                        onChange={(e) => updateInventoryItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 6px',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Satuan */}
                    <td style={{ padding: '8px 12px' }}>
                      <select
                        value={item.unit}
                        onChange={(e) => updateInventoryItem(idx, 'unit', e.target.value)}
                        className="homies-select"
                        style={{ width: '100%', padding: '6px 6px' }}
                      >
                        {['Pcs', 'Kg', 'Liter', 'Dus', 'Pack', 'Box', 'Unit', 'Set', 'Porsi', 'Karung', 'Lusin'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>

                    {/* Harga Beli (Modal) */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={item.unit_cost || ''}
                        onChange={(e) => updateInventoryItem(idx, 'unit_cost', Math.max(0, Number(e.target.value)))}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Harga Jual (Anti-Rugi) */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        min={0}
                        placeholder={isEquipment ? '0 (Alat)' : '0'}
                        value={item.selling_price || ''}
                        onChange={(e) => updateInventoryItem(idx, 'selling_price', Math.max(0, Number(e.target.value)))}
                        style={{
                          width: '100%',
                          background: marginData.status === 'loss' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: marginData.status === 'loss' ? '1px solid #F87171' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: marginData.status === 'loss' ? '#F87171' : '#FFFFFF',
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Margin & Status Anti-Rugi Badge */}
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: marginData.bg,
                        color: marginData.color,
                        fontSize: '0.70rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap'
                      }}>
                        {marginData.status === 'equipment' && <Wrench size={11} />}
                        {marginData.status === 'loss' && <AlertTriangle size={11} />}
                        {marginData.status === 'tight' && <AlertCircle size={11} />}
                        {marginData.status === 'safe' && <CheckCircle2 size={11} />}
                        {marginData.status === 'high' && <TrendingUp size={11} />}
                        {marginData.label}
                      </div>
                    </td>

                    {/* Subtotal Modal */}
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
                        {formatCurrency((item.quantity || 0) * (item.unit_cost || 0))}
                      </span>
                    </td>

                    {/* Hapus */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeInventoryItem(idx)}
                        className="homies-icon-btn"
                        style={{ color: '#F87171', width: '26px', height: '26px' }}
                        title="Hapus item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. ACTION & SUMMARY FOOTER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '6px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={addInventoryItem}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(0, 223, 143, 0.08)',
              border: '1px dashed rgba(0, 223, 143, 0.35)',
              borderRadius: '8px',
              color: 'var(--mint-neon)',
              fontSize: '0.80rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={15} /> Tambah Item Manual
          </button>
        </div>

        {/* Ringkasan Finansial Anti-Rugi */}
        {totalInventory > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            fontSize: '0.80rem',
            color: '#cbd5e1'
          }}>
            <div>
              Total Belanja Modal: <strong className="mono" style={{ color: 'var(--mint-neon)', marginLeft: '4px' }}>{formatCurrency(totalInventory)}</strong>
            </div>

            {totalPotentialRevenue > 0 && (
              <>
                <div style={{ color: '#64748b' }}>|</div>
                <div>
                  Potensi Omzet: <strong className="mono" style={{ color: '#38BDF8', marginLeft: '4px' }}>{formatCurrency(totalPotentialRevenue)}</strong>
                </div>
                <div>
                  Potensi Laba Kotor: <strong className="mono" style={{ color: '#FBBF24', marginLeft: '4px' }}>+{formatCurrency(potentialGrossProfit)}</strong>
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
