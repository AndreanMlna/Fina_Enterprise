import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Calculator,
  RefreshCw,
  Layers,
  Info
} from 'lucide-react';
import type { POSProduct } from '../../types';
import type {
  RecipeItem,
  DynamicPricingAnalysis
} from '../../services/types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';

interface POSRecipePricingModalProps {
  isOpen: boolean;
  product: POSProduct | null;
  onClose: () => void;
  onPriceUpdated: (updatedProduct: POSProduct) => void;
}

export const POSRecipePricingModal: React.FC<POSRecipePricingModalProps> = ({
  isOpen,
  product,
  onClose,
  onPriceUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'recipe' | 'analysis'>('recipe');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [overheadCost, setOverheadCost] = useState<number>(0);
  const [wastagePercent, setWastagePercent] = useState<number>(0);
  const [targetMargin, setTargetMargin] = useState<number>(35);
  
  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(false);
  const [isSavingRecipe, setIsSavingRecipe] = useState<boolean>(false);
  const [isApplyingPrice, setIsApplyingPrice] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<DynamicPricingAnalysis | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Muat resep produk yang tersimpan
  const loadRecipeAndAnalysis = async () => {
    if (!product) return;
    setIsLoadingRecipe(true);
    setFeedback(null);
    try {
      const recipeRes = await api.getProductRecipe(product.id);
      if (recipeRes && Array.isArray(recipeRes.items) && recipeRes.items.length > 0) {
        setItems(recipeRes.items);
        setOverheadCost(recipeRes.overhead_cost_per_unit || 0);
        setWastagePercent(recipeRes.wastage_percent || 0);
      } else {
        // Default 1 baris bahan dasar jika belum ada resep
        setItems([
          {
            material_name: product.name,
            quantity_required: 1,
            unit: product.unit || 'Pcs',
            cost_per_unit: product.cogs || 0
          }
        ]);
        setOverheadCost(0);
        setWastagePercent(0);
      }

      // Ambil analisis harga AI
      const analysisRes = await api.getPricingAnalysis(product.id, targetMargin);
      setAnalysis(analysisRes);
    } catch (err: any) {
      console.error('[POSRecipePricingModal] Gagal memuat data:', err);
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Gagal mengambil formulasi bahan baku produk.'
      });
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      loadRecipeAndAnalysis();
    }
  }, [isOpen, product?.id]);

  // Kalkulasi live modal bahan saat mengedit tabel
  const rawMaterialTotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.quantity_required || 0) * Number(item.cost_per_unit || 0)), 0);
  }, [items]);

  const estimatedHpp = useMemo(() => {
    const wastageMult = wastagePercent < 90 ? 1 / (1 - wastagePercent / 100) : 1;
    return (rawMaterialTotal * wastageMult) + Number(overheadCost || 0);
  }, [rawMaterialTotal, wastagePercent, overheadCost]);

  if (!isOpen || !product) return null;

  // Handler Tambah Bahan
  const handleAddMaterial = () => {
    setItems(prev => [
      ...prev,
      {
        material_name: '',
        quantity_required: 1,
        unit: 'Gram',
        cost_per_unit: 0,
        notes: ''
      }
    ]);
  };

  // Handler Hapus Bahan
  const handleRemoveMaterial = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handler Update Row
  const handleUpdateItem = (index: number, field: keyof RecipeItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Simpan Resep BOM
  const handleSaveRecipe = async () => {
    const validItems = items.filter(i => i.material_name.trim().length > 0 && i.quantity_required > 0);
    if (validItems.length === 0) {
      setFeedback({ type: 'error', message: 'Masukkan minimal 1 bahan baku dengan takaran valid.' });
      return;
    }

    setIsSavingRecipe(true);
    setFeedback(null);
    try {
      const res = await api.saveProductRecipe(product.id, {
        overhead_cost_per_unit: Number(overheadCost) || 0,
        wastage_percent: Number(wastagePercent) || 0,
        target_margin_percent: targetMargin,
        items: validItems
      });

      if (res && res.ai_pricing_analysis) {
        setAnalysis(res.ai_pricing_analysis);
      }
      setFeedback({ type: 'success', message: 'Resep bahan baku berhasil disimpan & HPP diperbarui!' });
      
      // Update produk parent
      onPriceUpdated({
        ...product,
        cogs: res.new_cogs
      });
      setActiveTab('analysis');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Gagal menyimpan resep bahan baku.'
      });
    } finally {
      setIsSavingRecipe(false);
    }
  };

  // Terapkan Harga Rekomendasi AI
  const handleApplyPrice = async (newPrice: number) => {
    setIsApplyingPrice(true);
    setFeedback(null);
    try {
      await api.applyRecommendedPrice(product.id, newPrice);
      setFeedback({
        type: 'success',
        message: `Harga jual kasir berhasil diperbarui ke ${formatCurrency(newPrice)}!`
      });
      onPriceUpdated({
        ...product,
        price: newPrice,
        cogs: analysis ? analysis.total_unit_cost_hpp : product.cogs
      });
      // Refresh analisis
      const updatedAnalysis = await api.getPricingAnalysis(product.id, targetMargin);
      setAnalysis(updatedAnalysis);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Gagal menerapkan harga baru.'
      });
    } finally {
      setIsApplyingPrice(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div style={{
        background: '#0B132B',
        border: '1px solid rgba(0, 223, 143, 0.3)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '880px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 223, 143, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(0, 223, 143, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 223, 143, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
              border: '1px solid var(--mint-neon)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} color="var(--mint-neon)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                  AI Dynamic Pricing & Resep (BOM)
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(0, 223, 143, 0.15)',
                  color: 'var(--mint-neon)',
                  fontWeight: 600,
                  border: '1px solid rgba(0, 223, 143, 0.3)'
                }}>
                  Anti-Margin Leakage
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                {product.name} ({product.sku}) • Harga Kasir Saat Ini: <strong style={{ color: '#F8FAFC' }}>{formatCurrency(product.price)}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#94A3B8'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 20px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <button
            onClick={() => setActiveTab('recipe')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'recipe' ? 'rgba(0, 223, 143, 0.15)' : 'transparent',
              color: activeTab === 'recipe' ? 'var(--mint-neon)' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={14} />
            <span>1. Komposisi Bahan Baku (BOM)</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'analysis' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'analysis' ? '#A5B4FC' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calculator size={14} />
            <span>2. Analisis HPP & Rekomendasi AI</span>
            {analysis?.is_at_loss && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
            )}
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            margin: '12px 20px 0 20px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: feedback.type === 'success' ? '#6EE7B7' : '#FCA5A5'
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoadingRecipe ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Menganalisis komposisi bahan & HPP produk...</p>
            </div>
          ) : activeTab === 'recipe' ? (
            /* TAB 1: FORMULASI BAHAN BAKU (BOM) */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#F1F5F9', fontWeight: 600 }}>
                    Daftar Bahan Baku per 1 Pcs / Porsi
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748B' }}>
                    Sistem otomatis menghitung ulang HPP setiap kali harga bahan di-restock (Moving Weighted Average).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 223, 143, 0.12)',
                    border: '1px solid rgba(0, 223, 143, 0.3)',
                    color: 'var(--mint-neon)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  <span>Tambah Bahan</span>
                </button>
              </div>

              {/* Table of BOM */}
              <div style={{
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                background: 'rgba(15, 23, 42, 0.4)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94A3B8', fontWeight: 600 }}>Nama Bahan</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94A3B8', fontWeight: 600, width: '110px' }}>Takaran / Pcs</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94A3B8', fontWeight: 600, width: '90px' }}>Satuan</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94A3B8', fontWeight: 600, width: '130px' }}>Harga / Satuan</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94A3B8', fontWeight: 600, width: '130px' }}>Subtotal Modal</th>
                      <th style={{ padding: '8px 8px', textAlign: 'center', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const subtotal = (Number(item.quantity_required) || 0) * (Number(item.cost_per_unit) || 0);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '6px 12px' }}>
                            <input
                              type="text"
                              value={item.material_name}
                              onChange={(e) => handleUpdateItem(idx, 'material_name', e.target.value)}
                              placeholder="Misal: Biji Kopi, Tepung, Box Kemasan"
                              style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                color: '#FFFFFF',
                                fontSize: '0.8rem'
                              }}
                            />
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.quantity_required || ''}
                              onChange={(e) => handleUpdateItem(idx, 'quantity_required', parseFloat(e.target.value) || 0)}
                              style={{
                                width: '100%',
                                textAlign: 'right',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                color: '#FFFFFF',
                                fontSize: '0.8rem'
                              }}
                            />
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <select
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                              style={{
                                width: '100%',
                                background: '#1E293B',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                color: '#FFFFFF',
                                fontSize: '0.8rem'
                              }}
                            >
                              <option value="Gram">Gram</option>
                              <option value="Kg">Kg</option>
                              <option value="Ml">Ml</option>
                              <option value="Liter">Liter</option>
                              <option value="Pcs">Pcs</option>
                              <option value="Lembar">Lembar</option>
                              <option value="Porsi">Porsi</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <input
                              type="number"
                              min="0"
                              value={item.cost_per_unit || ''}
                              onChange={(e) => handleUpdateItem(idx, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                              placeholder="Rp 0"
                              style={{
                                width: '100%',
                                textAlign: 'right',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                color: '#FFFFFF',
                                fontSize: '0.8rem'
                              }}
                            />
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: '#E2E8F0' }}>
                            {formatCurrency(subtotal)}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterial(idx)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  padding: '4px'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Overhead & Wastage Settings */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                padding: '14px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Overhead & Kemasan Langsung / Pcs
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={overheadCost || ''}
                    onChange={(e) => setOverheadCost(parseFloat(e.target.value) || 0)}
                    placeholder="Contoh: 500 (Gas/Plastik)"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Faktor Susut Bahan (Yield Loss %)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={wastagePercent || ''}
                    onChange={(e) => setWastagePercent(parseFloat(e.target.value) || 0)}
                    placeholder="Contoh: 3% - 5%"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Target Margin Keuntungan (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={targetMargin || ''}
                    onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 35)}
                    placeholder="Default 35%"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
              </div>

              {/* Live Cost Summary Bar */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, rgba(0, 223, 143, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                border: '1px solid rgba(0, 223, 143, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>Estimasi HPP Riil per Pcs: </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--mint-neon)' }}>
                    {formatCurrency(estimatedHpp)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRecipe}
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
                    gap: '6px'
                  }}
                >
                  {isSavingRecipe ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Simpan & Analisis Harga AI</span>
                </button>
              </div>
            </>
          ) : (
            /* TAB 2: ANALISIS HPP & REKOMENDASI AI */
            analysis && (
              <>
                {/* Status Hero Card */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: analysis.is_at_loss 
                    ? (analysis.margin_status === 'CRITICAL_LOSS' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)')
                    : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${
                    analysis.is_at_loss 
                      ? (analysis.margin_status === 'CRITICAL_LOSS' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)')
                      : 'rgba(16, 185, 129, 0.4)'
                  }`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: analysis.is_at_loss ? '#EF4444' : '#10B981',
                        color: '#FFFFFF'
                      }}>
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
                    <div style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
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
                    <div style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.06)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
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
                        onClick={() => handleApplyPrice(analysis.pricing_tiers.safe_floor_minimum.price)}
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
                    <div style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(0, 223, 143, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                      border: '1.5px solid var(--mint-neon)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 0 15px rgba(0, 223, 143, 0.15)'
                    }}>
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
                        onClick={() => handleApplyPrice(analysis.pricing_tiers.optimal_recommended.price)}
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
                    <div style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
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
                        onClick={() => handleApplyPrice(analysis.pricing_tiers.premium_retail.price)}
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

                {/* AI Reasoning & Actionable Tips */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#818CF8" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#C7D2FE' }}>
                      Justifikasi Finansial & Solusi AI ({analysis.engine})
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#CBD5E1', lineHeight: '1.45' }}>
                    {analysis.ai_insights.ai_financial_rationale}
                  </p>

                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px dashed rgba(99, 102, 241, 0.3)',
                    fontSize: '0.78rem',
                    color: '#E0E7FF'
                  }}>
                    <strong>Analisis Komponen Biaya Terbesar:</strong> {analysis.ai_insights.cost_driver_analysis}
                  </div>

                  {Array.isArray(analysis.ai_insights.strategic_actions) && (
                    <div>
                      <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Langkah Taktis Perlindungan Kas UMKM:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                        {analysis.ai_insights.strategic_actions.map((act, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ fontSize: '0.74rem', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} />
                    <span><strong>Mitigasi Inflasi Restock:</strong> {analysis.ai_insights.inflation_resilience_tip}</span>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};
