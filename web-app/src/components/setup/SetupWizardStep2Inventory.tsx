/**
 * FINA-ENTERPRISE: Step 2 — Bahan & Alat Usaha
 * 
 * Desain: Clean Dark Glassmorphism, Neon Emerald, Anti-UI-Slop.
 * Fitur:
 * 1. AI Generator Kebutuhan Usaha (Google Gemini LLM) - Ringkas, zero-fluff.
 * 2. Kalkulator Margin Anti-Rugi Dinamis (Memisahkan Bahan Baku vs Alat Kerja).
 * 3. Alokasi Kas Modal Real-Time dengan Toggle Switch Modern.
 */

import React, { useState, useMemo } from 'react';
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

  // Quick Chips Template (Pendek & Informatif)
  const QUICK_PROMPTS = [
    { label: '☕ Kopi & Minuman', prompt: 'Kedai kopi susu kekinian dan teh dingin' },
    { label: '🍜 Warmindo', prompt: 'Warung warmindo mie instan, telur, dan minuman' },
    { label: '🍗 Ayam Geprek', prompt: 'Usaha ayam geprek sambal dan nasi uduk' },
    { label: '🧺 Laundry', prompt: 'Usaha laundry kiloan dan setrika uap' },
    { label: '🛒 Toko Sembako', prompt: 'Toko sembako kebutuhan harian warga' },
  ];

  // Request AI LLM
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

  // Terapkan ke tabel
  const applyAIRecommendation = (replaceExisting: boolean) => {
    if (!aiResult || !aiResult.recommended_items) return;

    const mappedItems: InventoryItemPayload[] = aiResult.recommended_items.map(item => ({
      name: item.name,
      category: item.category || (item.is_equipment ? 'Peralatan & Mesin' : 'Bahan Baku'),
      quantity: item.quantity || 1,
      unit: item.unit || 'Pcs',
      unit_cost: item.unit_cost || item.estimated_unit_cost || 0,
      selling_price: item.selling_price || item.recommended_selling_price || 0,
    }));

    if (onApplyAISupplies) {
      if (replaceExisting) {
        onApplyAISupplies(mappedItems);
      } else {
        onApplyAISupplies([...inventoryItems, ...mappedItems]);
      }
    }
  };

  // Helper kalkulasi margin anti-rugi per item
  const calculateMargin = (cost: number, price: number, category: string) => {
    const isEquipment = category.toLowerCase().includes('peralatan') || category.toLowerCase().includes('mesin') || category.toLowerCase().includes('alat');
    if (isEquipment && price === 0) {
      return { status: 'equipment', label: 'Alat Kerja', percent: 0, profit: 0, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.10)' };
    }
    if (cost <= 0) {
      return { status: 'neutral', label: 'Rp 0', percent: 0, profit: 0, color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.04)' };
    }
    if (price <= 0) {
      return { status: 'unset', label: 'Belum Dijual', percent: 0, profit: 0, color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.10)' };
    }

    const profit = price - cost;
    const marginPct = Math.round((profit / price) * 100);

    if (profit < 0) {
      return { 
        status: 'loss', 
        label: `🚨 Rugi ${formatCurrency(Math.abs(profit))}`, 
        percent: marginPct, 
        profit, 
        color: '#F87171', 
        bg: 'rgba(239, 68, 68, 0.15)' 
      };
    }
    if (marginPct < 20) {
      return { 
        status: 'tight', 
        label: `⚠️ Tipis (+${marginPct}%)`, 
        percent: marginPct, 
        profit, 
        color: '#FBBF24', 
        bg: 'rgba(251, 191, 36, 0.12)' 
      };
    }
    if (marginPct < 50) {
      return { 
        status: 'safe', 
        label: `✅ Aman (+${marginPct}%)`, 
        percent: marginPct, 
        profit, 
        color: 'var(--mint-neon)', 
        bg: 'rgba(0, 223, 143, 0.12)' 
      };
    }
    return { 
      status: 'high', 
      label: `🚀 Untung (+${marginPct}%)`, 
      percent: marginPct, 
      profit, 
      color: '#38BDF8', 
      bg: 'rgba(56, 189, 248, 0.12)' 
    };
  };

  // Terapkan margin persentase otomatis
  const applyAutoMarginGlobal = (marginPct: number) => {
    inventoryItems.forEach((item, idx) => {
      const isEquipment = item.category.toLowerCase().includes('peralatan') || item.category.toLowerCase().includes('mesin') || item.category.toLowerCase().includes('alat');
      if (!isEquipment && item.unit_cost > 0) {
        const calculatedPrice = Math.ceil((item.unit_cost / (1 - marginPct / 100)) / 500) * 500;
        updateInventoryItem(idx, 'selling_price', calculatedPrice);
      }
    });
  };

  // Kalkulasi Finansial yang Masuk Akal (Memisahkan Bahan Baku vs Alat Kerja)
  const financialStats = useMemo(() => {
    let materialCost = 0;
    let equipmentCost = 0;
    let materialRevenue = 0;

    inventoryItems.forEach(item => {
      const isEquipment = item.category.toLowerCase().includes('peralatan') || item.category.toLowerCase().includes('mesin') || item.category.toLowerCase().includes('alat');
      const itemCost = (item.quantity || 0) * (item.unit_cost || 0);
      
      if (isEquipment) {
        equipmentCost += itemCost;
      } else {
        materialCost += itemCost;
        if (item.selling_price > 0) {
          materialRevenue += (item.quantity || 0) * item.selling_price;
        }
      }
    });

    const materialGrossProfit = Math.max(0, materialRevenue - materialCost);
    const materialMargin = materialRevenue > 0 ? Math.round((materialGrossProfit / materialRevenue) * 100) : 0;

    return {
      materialCost,
      equipmentCost,
      totalCost: materialCost + equipmentCost,
      materialRevenue,
      materialGrossProfit,
      materialMargin,
    };
  }, [inventoryItems]);

  const remainingCash = availableCash - (deductFromCash ? totalInventory : 0);
  const isOverBudget = deductFromCash && totalInventory > availableCash && availableCash > 0;

  // Pembersihan teks AI (Hapus teks berteriak & format rapi)
  const cleanSummary = useMemo(() => {
    if (!aiResult) return '';
    let text = aiResult.business_summary || aiResult.business_type || '';
    text = text.replace(/^hasil rekomendasi:\s*/i, '');
    return text;
  }, [aiResult]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. BAR ALOKASI KAS MODAL (SLEEK & COMPACT) */}
      {availableCash > 0 && (
        <div style={{
          background: isOverBudget 
            ? 'rgba(239, 68, 68, 0.08)'
            : 'rgba(0, 223, 143, 0.04)',
          border: isOverBudget ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(0, 223, 143, 0.15)',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Sisi Kiri: Switch Alokasi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: isOverBudget ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 223, 143, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOverBudget ? '#F87171' : 'var(--mint-neon)'
            }}>
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
      )}

      {/* 2. ASISTEN AI KEBUTUHAN USAHA (KOMPAK & HIGH-SIGNAL) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
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

        {/* AI Result Card (Ringkas, Rapi & Tidak Slop) */}
        {aiResult && (
          <div style={{
            background: 'rgba(0, 223, 143, 0.03)',
            border: '1px solid rgba(0, 223, 143, 0.2)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
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
                  <PackageCheck size={13} /> Terapkan ({aiResult.recommended_items.length} Item)
                </button>
                <button
                  type="button"
                  onClick={() => applyAIRecommendation(false)}
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              fontSize: '0.72rem',
              color: '#94a3b8',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
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

      {/* 3. TOOLBAR TABEL & QUICK MARGIN ACTIONS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '6px 2px'
      }}>
        <div style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
          Daftar Bahan & Alat ({inventoryItems.length} item)
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Set Margin:</span>
          {[30, 40, 50, 70].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => applyAutoMarginGlobal(m)}
              className="homies-pill-btn"
              style={{ fontSize: '0.68rem', padding: '3px 7px' }}
              title={`Terapkan harga jual +${m}% dari modal bahan`}
            >
              +{m}%
            </button>
          ))}
          <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 2px' }} />
          <button
            type="button"
            onClick={() => addPresetInventory('warung')}
            className="homies-pill-btn"
            style={{ fontSize: '0.68rem', padding: '3px 7px' }}
          >
            + Contoh F&B
          </button>
          <button
            type="button"
            onClick={() => addPresetInventory('retail')}
            className="homies-pill-btn"
            style={{ fontSize: '0.68rem', padding: '3px 7px' }}
          >
            + Contoh Retail
          </button>
        </div>
      </div>

      {/* 4. TABEL DAFTAR BAHAN & ALAT USAHA */}
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
              <th style={{ padding: '10px 12px', width: '130px' }}>Kategori</th>
              <th style={{ padding: '10px 12px', width: '65px' }}>Qty</th>
              <th style={{ padding: '10px 12px', width: '75px' }}>Satuan</th>
              <th style={{ padding: '10px 12px', width: '115px' }}>Harga Beli</th>
              <th style={{ padding: '10px 12px', width: '115px' }}>Harga Jual</th>
              <th style={{ padding: '10px 12px', width: '130px' }}>Status Margin</th>
              <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>Total Modal</th>
              <th style={{ padding: '10px 12px', width: '36px' }}></th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    Belum ada bahan atau alat yang dimasukkan
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Gunakan AI Generator di atas atau klik tombol Tambah Item di bawah.
                  </div>
                </td>
              </tr>
            ) : (
              inventoryItems.map((item, idx) => {
                const marginData = calculateMargin(item.unit_cost, item.selling_price, item.category);
                const isEquipment = item.category.toLowerCase().includes('peralatan') || item.category.toLowerCase().includes('mesin') || item.category.toLowerCase().includes('alat');

                return (
                  <tr key={idx} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {/* Nama */}
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="Nama bahan / alat..."
                        value={item.name}
                        onChange={(e) => updateInventoryItem(idx, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#FFFFFF',
                          fontSize: '0.80rem',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Kategori */}
                    <td style={{ padding: '6px 12px' }}>
                      <select
                        value={item.category}
                        onChange={(e) => updateInventoryItem(idx, 'category', e.target.value)}
                        className="homies-select"
                        style={{ width: '100%', padding: '6px 6px', fontSize: '0.75rem' }}
                      >
                        {['Bahan Baku', 'Peralatan & Mesin', 'Kemasan & Wadah', 'Perlengkapan Usaha', 'Sembako', 'Minuman', 'Makanan', 'Umum'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>

                    {/* Qty */}
                    <td style={{ padding: '6px 12px' }}>
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
                          padding: '6px 4px',
                          color: '#FFFFFF',
                          fontSize: '0.80rem',
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Satuan */}
                    <td style={{ padding: '6px 12px' }}>
                      <select
                        value={item.unit}
                        onChange={(e) => updateInventoryItem(idx, 'unit', e.target.value)}
                        className="homies-select"
                        style={{ width: '100%', padding: '6px 4px', fontSize: '0.75rem' }}
                      >
                        {['Pcs', 'Kg', 'Liter', 'Dus', 'Pack', 'Box', 'Unit', 'Set', 'Porsi', 'Karung', 'Lusin'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>

                    {/* Harga Beli */}
                    <td style={{ padding: '6px 12px' }}>
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
                          fontSize: '0.80rem',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Harga Jual */}
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min={0}
                        placeholder={isEquipment ? '0 (Alat)' : '0'}
                        value={item.selling_price || ''}
                        onChange={(e) => updateInventoryItem(idx, 'selling_price', Math.max(0, Number(e.target.value)))}
                        style={{
                          width: '100%',
                          background: marginData.status === 'loss' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          border: marginData.status === 'loss' ? '1px solid #F87171' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: marginData.status === 'loss' ? '#F87171' : '#FFFFFF',
                          fontSize: '0.80rem',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Status Margin */}
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{
                        padding: '3px 7px',
                        borderRadius: '4px',
                        background: marginData.bg,
                        color: marginData.color,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {marginData.status === 'equipment' && <Wrench size={10} />}
                        {marginData.status === 'loss' && <AlertTriangle size={10} />}
                        {marginData.status === 'tight' && <AlertCircle size={10} />}
                        {marginData.status === 'safe' && <CheckCircle2 size={10} />}
                        {marginData.status === 'high' && <TrendingUp size={10} />}
                        {marginData.label}
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: '0.80rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
                        {formatCurrency((item.quantity || 0) * (item.unit_cost || 0))}
                      </span>
                    </td>

                    {/* Hapus */}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeInventoryItem(idx)}
                        className="homies-icon-btn"
                        style={{ color: '#F87171', width: '24px', height: '24px' }}
                        title="Hapus"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. FOOTER SUMMARY (PRESISI & TANPA JARGON BERLEBIH) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <button
          type="button"
          onClick={addInventoryItem}
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            fontSize: '0.78rem',
            color: '#94a3b8'
          }}>
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

    </div>
  );
};
